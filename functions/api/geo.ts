/**
 * IP geolocation, proxied and normalised through our own origin.
 *
 * The browser used to call get.geojs.io directly, which meant a third-party
 * host in `connect-src`, one uncached round trip per scan, and whatever fields
 * that one provider happened to know (GeoJS returns no city for a large share
 * of IPs, which is where the "City N/A" rows came from).
 *
 * Server-side we can ask a provider with better city coverage first and fall
 * back to GeoJS when it declines, then hand the client one flat shape either
 * way. A day of edge cache means a popular IP costs one upstream call, not one
 * per visitor.
 *
 * GET /api/geo?ip=<ipv4|ipv6>  ->  { ip, country, country_code, city, region,
 *                                    isp, asn, source }
 * 404 means "no provider could place this address", which the UI renders as an
 * answer rather than an error.
 */

// Shape check only: the upstream hosts are hard-coded, so this exists to keep
// the caller inside the path segment it owns (no scheme, no slashes, no query).
const IP = /^(?:(?:\d{1,3}\.){3}\d{1,3}|[0-9a-f:]{2,45})$/

type Geo = {
  ip: string
  country: string | null
  country_code: string | null
  city: string | null
  region: string | null
  isp: string | null
  asn: string | null
  source: string
}

const CF = { cacheTtl: 86400, cacheEverything: true }
const UA = { 'User-Agent': 'Threatbase/1.0 (+https://threatbase.qzz.io)', Accept: 'application/json' }

/** ipwho.is: free, no key, and it knows the city for most routable addresses. */
async function ipwhois(ip: string): Promise<Geo | null> {
  const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { headers: UA, cf: CF } as RequestInit)
  if (!r.ok) return null
  const d: any = await r.json()
  if (!d?.success) return null
  return {
    ip: d.ip || ip,
    country: d.country || null,
    country_code: d.country_code || null,
    city: d.city || null,
    region: d.region || null,
    isp: d.connection?.isp || d.connection?.org || null,
    asn: d.connection?.asn ? `AS${d.connection.asn}` : null,
    source: 'ipwho.is',
  }
}

/** GeoJS: thinner on cities, but unmetered, so it is the safety net. */
async function geojs(ip: string): Promise<Geo | null> {
  const r = await fetch(`https://get.geojs.io/v1/ip/geo/${encodeURIComponent(ip)}.json`, { headers: UA, cf: CF } as RequestInit)
  if (!r.ok) return null
  const d: any = await r.json()
  if (!d?.ip) return null
  return {
    ip: d.ip,
    country: d.country || null,
    country_code: d.country_code || null,
    city: d.city || null,
    region: d.region || null,
    isp: d.organization_name || d.organization || null,
    asn: d.asn ? `AS${d.asn}` : null,
    source: 'geojs.io',
  }
}

export const onRequestGet = async (context: any) => {
  const ip = (new URL(context.request.url).searchParams.get('ip') || '').trim().toLowerCase()

  if (!IP.test(ip)) {
    return new Response(JSON.stringify({ error: 'invalid ip' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let geo: Geo | null = null
  try {
    geo = await ipwhois(ip)
  } catch { /* fall through to the net below */ }

  if (!geo) {
    try {
      geo = await geojs(ip)
    } catch {
      return new Response(JSON.stringify({ error: 'upstream unreachable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })
    }
  }

  return new Response(JSON.stringify(geo ?? { error: 'not found', ip }), {
    status: geo ? 200 : 404,
    headers: {
      'Content-Type': 'application/json',
      // Registration and routing move on the order of days; a miss is not
      // cached at all, so a transient provider failure does not stick.
      'Cache-Control': geo ? 'public, max-age=86400' : 'no-store',
    },
  })
}
