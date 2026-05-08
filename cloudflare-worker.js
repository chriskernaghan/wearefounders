/**
 * Cloudflare Worker — wearefounders.uk reverse proxy
 *
 * Routes handled:
 *   /tools/*       → Astro directory (deployed at TOOLS_ORIGIN)
 *   /directory/*   → 301 redirect to /tools/* (legacy URLs)
 *
 * Bind to the wearefounders.uk zone with two route patterns:
 *   wearefounders.uk/tools*
 *   wearefounders.uk/directory*
 *
 * Everything else on wearefounders.uk goes straight to Ghost via your
 * existing DNS/proxy setup. This Worker should NOT match any other paths.
 */

const TOOLS_ORIGIN = 'https://wearefounders.pages.dev';
// ^^^ Replace if your Pages project URL is different.

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 1. Legacy redirect: /directory/* -> /tools/*
    // Preserves any backlinks pointing at the old path.
    if (url.pathname === '/directory' || url.pathname.startsWith('/directory/')) {
      const newPath = url.pathname.replace(/^\/directory/, '/tools');
      const target = new URL(newPath + url.search, url.origin);
      return Response.redirect(target.toString(), 301);
    }

    // 2. Tools proxy: /tools/* -> Astro origin
    if (url.pathname === '/tools' || url.pathname.startsWith('/tools/')) {
      // Build the upstream URL on the Astro origin, preserving the path.
      const upstream = new URL(url.pathname + url.search, TOOLS_ORIGIN);

      // Forward the request. Strip the Host header so Cloudflare Pages
      // does not reject based on hostname mismatch.
      const upstreamRequest = new Request(upstream.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual',
      });

      const response = await fetch(upstreamRequest);

      // Pass the response through. Cloudflare handles caching automatically
      // based on the upstream Cache-Control headers Astro sets.
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    // 3. Defensive fallback. Should not normally hit this if route patterns
    // are configured correctly, but pass through to origin if they do.
    return fetch(request);
  },
};
