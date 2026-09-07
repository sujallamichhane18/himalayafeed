import { corsHeaders, json } from './_common'

// Echoes the caller's own public IP as Cloudflare sees it. Used by the home
// hero to prefill the search bar on first visit ("hunt yourself" entry
// point) — it prefills only, never scans. Returns nothing but the caller's
// own address, so no auth and no caching.

export const onRequestOptions = async (context: any) => {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) })
}

export const onRequestGet = (context: any) => {
  const ip = context.request.headers.get('CF-Connecting-IP') || ''
  return json({ ip }, 200, context.request)
}
