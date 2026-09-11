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

const { CF_ACCOUNT_ID, CF_API_TOKEN, D1_DATABASE_ID } = process.env;
const SITE = process.env.SITE_URL || 'https://directory.wearefounders.uk';
const FILE = new URL('../src/data/trending.json', import.meta.url);
const SPOTS = 3;

if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DATABASE_ID) {
  throw new Error('Missing CF_ACCOUNT_ID, CF_API_TOKEN or D1_DATABASE_ID.');
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
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(json.errors ?? json)}`);
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
