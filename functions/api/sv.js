// Records a visit to a listing that arrived through that listing's founder
// share link. Called by src/components/ShareVisit.astro via sendBeacon.
//
// Named /api/sv on purpose: paths containing words like "track", "analytics"
// or "collect" get caught by ad-blocker filter lists.
//
// Privacy: nothing is stored on the visitor's device. The visitor value is a
// truncated hash of IP + user agent + the date + a secret salt, so the same
// person counts once per listing per day and can't be linked across days.
//
// Needs two things set on the Pages project, and does nothing until both exist:
//   DB          D1 binding to the waf-directory database
//   VISIT_SALT  encrypted environment variable, any long random string

const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|monitor/i;
let publishedSlugs = null;

export async function onRequestPost({ request, env }) {
  const done = new Response(null, { status: 204 });

  try {
    if (!env.DB || !env.VISIT_SALT) return done;

    const fetchSite = request.headers.get('Sec-Fetch-Site');
    if (fetchSite && fetchSite !== 'same-origin') return done;

    const ua = request.headers.get('User-Agent') || '';
    if (!ua || BOTS.test(ua)) return done;

    const body = await request.json().catch(() => null);
    const slug = typeof body?.slug === 'string' ? body.slug : '';
    if (!/^[a-z0-9-]{1,100}$/.test(slug)) return done;

    // Only count slugs that are live listings. The list is built by
    // src/pages/tool-slugs.json.ts and cached for the life of the isolate.
    if (!publishedSlugs) {
      const res = await env.ASSETS.fetch(new URL('/tool-slugs.json', request.url));
      if (!res.ok) return done;
      publishedSlugs = new Set(await res.json());
    }
    if (!publishedSlugs.has(slug)) return done;

    const day = new Date().toISOString().slice(0, 10);
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`${env.VISIT_SALT}|${day}|${ip}|${ua}`)
    );
    const visitor = [...new Uint8Array(digest)]
      .slice(0, 8)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    await env.DB.prepare(
      'INSERT OR IGNORE INTO share_visits (day, slug, visitor, country) VALUES (?, ?, ?, ?)'
    )
      .bind(day, slug, visitor, request.cf?.country || '')
      .run();
  } catch (err) {
    // Logging must never affect the page, so failures are swallowed here.
    console.error('share visit not recorded', err);
  }

  return done;
}