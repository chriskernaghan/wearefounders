/**
 * Cloudflare Worker — wearefounders.uk reverse proxy
 *
 * Routes:
 *   /directory/*  → Astro directory (deployed at TOOLS_ORIGIN)
 *   /*            → Ghost (existing setup, untouched)
 *
 * Deploy via Cloudflare dashboard or wrangler. Bind to the
 * wearefounders.uk zone with a route pattern of:
 *   wearefounders.uk/directory*
 *
 * IMPORTANT: this Worker only needs to handle /directory/*. All other
 * routes should NOT match this Worker's pattern, so they go straight
 * to Ghost via your existing DNS/proxy setup.
 */

const TOOLS_ORIGIN = 'https://waf-tools-directory.pages.dev';
// ^^^ Replace with your actual Cloudflare Pages deployment URL after first deploy.

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Only handle /directory and below — defensive check in case the route
    // pattern is misconfigured.
    if (!url.pathname.startsWith('/directory')) {
      return fetch(request);
    }

    // Build the upstream URL on the Astro origin, preserving the path.
    const upstream = new URL(url.pathname + url.search, TOOLS_ORIGIN);

    // Forward the request. Strip the Host header so Cloudflare Pages
    // doesn't reject based on hostname mismatch.
    const upstreamRequest = new Request(upstream.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
    });
    upstreamRequest.headers.delete('host');

    const response = await fetch(upstreamRequest);

    // Pass response through. Astro serves static files with correct
    // Content-Type already, so no rewrites needed.
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  },
};
