/**
 * RDAP registration lookup, proxied through our own origin.
 *
 * The browser cannot do this itself: our CSP `connect-src` is a fixed
 * allowlist, and rdap.org answers with a 302 to whichever registry owns the
 * object (rdap.apnic.net, rdap.arin.net, a registrar's host for domains, …).
 * CSP applies to redirect targets too, and that set is unbounded for domains,
 * so no allowlist can cover it. Server-side there is no CSP and no CORS, and
 * the edge cache means repeat scans of the same indicator cost nothing.
 *
 * GET /api/rdap?q=<ip|domain>[&kind=domain]
 * Passes the upstream status through unchanged: 404 means "not in the
 * registry", which the UI renders as an answer rather than an error.
 */

// Only the shapes RDAP takes: IPv4/IPv6/domain, plus an optional CIDR suffix.
// No slashes (beyond the prefix length), no percent, no scheme: the upstream
// host is hard-coded, so this keeps the caller to the path segment it owns.
const QUERY = /^[a-z0-9.:-]{3,253}(\/\d{1,3})?$/

export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url)
  const kind = url.searchParams.get('kind') === 'domain' ? 'domain' : 'ip'
  const q = (url.searchParams.get('q') || '').trim().toLowerCase()

  if (!QUERY.test(q)) {
    return new Response(JSON.stringify({ error: 'invalid query' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const upstream = await fetch(`https://rdap.org/${kind}/${encodeURIComponent(q)}`, {
      // rdap.org 403s any request without a User-Agent, and the Workers
      // runtime sends none by default. Identify ourselves instead.
      headers: {
        Accept: 'application/rdap+json, application/json',
        'User-Agent': 'Threatbase/1.0 (+https://threatbase.qzz.io)',
      },
      redirect: 'follow',
      // Registration data changes on the order of days; a day of edge cache is
      // conservative and keeps a popular IP from hammering the RIR.
      cf: { cacheTtl: 86400, cacheEverything: true },
    })

    // Anything that is not the JSON we asked for (an HTML error page from a
    // registry, say) is a failure, not a record.
    const body = upstream.ok ? await upstream.text() : ''
    return new Response(upstream.ok ? body : JSON.stringify({ error: 'upstream', status: upstream.status }), {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': upstream.ok ? 'public, max-age=86400' : 'no-store',
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'upstream unreachable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  }
}
