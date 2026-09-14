// Rewrites src/data/trending.json from the share_visits table in D1.
// Run every Monday by .github/workflows/trending.yml, or by hand from the
// Actions tab with "Run workflow".
//
// The rule matches the /trending/ page: the three listings with the most
// share-link visits last week (Monday to Sunday, UTC) take the spots. Ties go
// to the listing that had visits on more days, then alphabetically.
//
// Counts are deliberately never written to the file or printed to the log,
// because both are public in this repo. Check them in the D1 console instead.

import { readFile, writeFile } from 'node:fs/promises';

// Trimmed because a stray space or newline pasted into a GitHub secret ends up
// inside the request URL, and Cloudflare answers with a routing error (7003)
// that says nothing about which value is wrong.
const CF_ACCOUNT_ID = (process.env.CF_ACCOUNT_ID ?? '').trim();
const CF_API_TOKEN = (process.env.CF_API_TOKEN ?? '').trim();
const D1_DATABASE_ID = (process.env.D1_DATABASE_ID ?? '').trim();
const SITE = process.env.SITE_URL || 'https://directory.wearefounders.uk';
const FILE = new URL('../src/data/trending.json', import.meta.url);
const SPOTS = 3;

if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DATABASE_ID) {
  throw new Error('Missing CF_ACCOUNT_ID, CF_API_TOKEN or D1_DATABASE_ID.');
}

// Shape checks, so a swapped or mistyped pair fails with a useful message
// instead of a Cloudflare routing error. Never print the values: this log is
// public. An account ID is 32 hex characters; a database ID is a UUID.
const ACCOUNT_SHAPE = /^[0-9a-f]{32}$/i;
const DATABASE_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!ACCOUNT_SHAPE.test(CF_ACCOUNT_ID)) {
  throw new Error(
    DATABASE_SHAPE.test(CF_ACCOUNT_ID)
      ? 'CF_ACCOUNT_ID holds a database ID. The two secrets look swapped.'
      : `CF_ACCOUNT_ID is not a 32-character account ID (got ${CF_ACCOUNT_ID.length} characters). Copy it from the Workers & Pages page in the Cloudflare dashboard.`
  );
}
if (!DATABASE_SHAPE.test(D1_DATABASE_ID)) {
  throw new Error(
    ACCOUNT_SHAPE.test(D1_DATABASE_ID)
      ? 'D1_DATABASE_ID holds an account ID. The two secrets look swapped.'
      : `D1_DATABASE_ID is not a database UUID (got ${D1_DATABASE_ID.length} characters). Copy it from the waf-directory database's Overview tab.`
  );
}

// Last complete Monday-to-Sunday week before today, in UTC.
function lastWeek(now = new Date()) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysSinceMonday = (today.getUTCDay() + 6) % 7;
  const thisMonday = new Date(today.getTime() - daysSinceMonday * 86400000);
  const monday = new Date(thisMonday.getTime() - 7 * 86400000);
  const sunday = new Date(thisMonday.getTime() - 86400000);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { from: iso(monday), to: iso(sunday) };
}

async function queryD1(sql, params) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
    }
  );
  // Not always JSON: a malformed URL can come back as an HTML error page.
  const body = await res.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`D1 returned a non-JSON response (HTTP ${res.status}): ${body.slice(0, 200)}`);
  }
  if (!res.ok || !json.success) {
    // 7003 means Cloudflare couldn't route the URL: the account or database ID
    // is wrong. 10000 means the token was rejected or lacks D1 Read.
    const code = json?.errors?.[0]?.code;
    const hint =
      code === 7003
        ? ' Check CF_ACCOUNT_ID and D1_DATABASE_ID: one of them points at something that does not exist, or they belong to different accounts.'
        : code === 10000
          ? ' Check CF_D1_READ_TOKEN: it was rejected, or it lacks the Account > D1 > Read permission.'
          : '';
    throw new Error(`D1 query failed (HTTP ${res.status}): ${JSON.stringify(json.errors ?? json)}.${hint}`);
  }
  return json.result[0].results;
}

const { from, to } = lastWeek();

const rows = await queryD1(
  `SELECT slug, COUNT(*) AS visits, COUNT(DISTINCT day) AS active_days
     FROM share_visits
    WHERE day BETWEEN ? AND ?
    GROUP BY slug
    ORDER BY visits DESC, active_days DESC, slug ASC`,
  [from, to]
);

// Only live listings, so a delisted or renamed tool can't break the build.
const liveRes = await fetch(`${SITE}/tool-slugs.json`);
if (!liveRes.ok) throw new Error(`Could not load ${SITE}/tool-slugs.json (${liveRes.status}).`);
const live = new Set(await liveRes.json());

const slugs = rows.map((r) => r.slug).filter((slug) => live.has(slug)).slice(0, SPOTS);

const current = JSON.parse(await readFile(FILE, 'utf8'));

// Last week's board becomes this week's baseline, which is what TrendingBar
// compares against to show the up/down/new markers. Guarded against a re-run
// in the same week: if week_of hasn't moved on, the existing previous is kept
// rather than being overwritten with a copy of the current board, which would
// wipe the movement out.
const previous = current.week_of === from
  ? (Array.isArray(current.previous) ? current.previous : [])
  : (Array.isArray(current.slugs) ? current.slugs : []);

const next = {
  _readme:
    'Written automatically every Monday by .github/workflows/trending.yml from share-link visits logged in D1 ' +
    '(see functions/api/sv.js). Fewer than three slugs means fewer than three listings got share visits that week; ' +
    'an empty list hides the bar. "previous" is last week\'s order, used only for the up/down/new markers. ' +
    'Editing by hand still works, but the next Monday run will overwrite it.',
  week_of: from,
  slugs,
  previous,
};

await writeFile(FILE, JSON.stringify(next, null, 2) + '\n');

const changed = JSON.stringify(current.slugs) !== JSON.stringify(slugs) || current.week_of !== from;
console.log(`Week of ${from} to ${to}: ${slugs.length} trending (${slugs.join(', ') || 'none'})${changed ? '' : ', no change'}.`);
