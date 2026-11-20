// Applies a founder's listing edit to the matching file in src/content/tools/.
//
// Runs inside .github/workflows/listing-edit.yml after functions/api/edit.js
// has verified the Tally webhook and sent a repository_dispatch. The payload
// is untrusted: anyone can submit the form, so every value is validated here
// and only the whitelisted fields below can ever be written. Editorial fields
// (our_take, pros, cons, categories, stages, affiliate links, featured,
// published, verdict_score, review_url, last_updated and the article body)
// are not in the whitelist and cannot be touched through this route.
//
// last_updated is left alone on purpose. It is shown on the page as "Last
// verified", and a founder editing their own entry is not you verifying it.
//
// Blank answers clear optional fields (X handle, LinkedIn, HQ, founded, trial
// days, starting price). Blank required fields (tagline, website) are ignored.
// Only values that differ from what is already in the file are written.
//
// Outputs (to $GITHUB_OUTPUT, or stdout when run by hand):
//   changed   true when the file was modified
//   flagged   true when a human should look closely (link or domain change)
//   branch    listing-edit/<slug>
//   title     pull request title
//   body_file path of the pull request description

import { readFileSync, writeFileSync, readdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const TOOLS_DIR = process.env.TOOLS_DIR || 'src/content/tools';
const BODY_FILE = process.env.PR_BODY_FILE || join(process.env.RUNNER_TEMP || '/tmp', 'listing-edit-body.md');

const out = (key, value) => {
  const line = `${key}=${value}\n`;
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, line);
  else process.stdout.write(`[output] ${line}`);
};

const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const payload = event.client_payload ?? {};
const input = payload.changes && typeof payload.changes === 'object' ? payload.changes : {};

// ---------------------------------------------------------------- locate file

const slug = typeof payload.slug === 'string' ? payload.slug : '';
if (!/^[a-z0-9-]{1,100}$/.test(slug)) fail('Invalid slug.');

// Astro lowercases the filename to make the slug (Chatshell.md is "chatshell"),
// so the match has to be case-insensitive.
const file = readdirSync(TOOLS_DIR).find((f) => f.endsWith('.md') && f.slice(0, -3).toLowerCase() === slug);
if (!file) fail(`No listing file for slug "${slug}".`);
const path = join(TOOLS_DIR, file);

const text = readFileSync(path, 'utf8');
const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
if (!match) fail('No frontmatter found.');
const eol = text.includes('\r\n') ? '\r\n' : '\n';
const lines = match[1].split(/\r?\n/);
const rest = text.slice(match[0].length);

// ------------------------------------------------------------- frontmatter io

const keyIndex = (key) => lines.findIndex((l) => l.startsWith(`${key}:`));

// Reads a single-line scalar. Anything that spills onto following lines (block
// scalars, wrapped plain scalars) is refused rather than guessed at.
function readScalar(key) {
  const i = keyIndex(key);
  if (i === -1) return { exists: false, value: undefined };
  const rawValue = lines[i].slice(key.length + 1).trim();
  if (/^[>|]/.test(rawValue) || (lines[i + 1] !== undefined && /^\s+\S/.test(lines[i + 1]) && !rawValue.startsWith('['))) {
    fail(`"${key}" in ${file} spans several lines; edit this one by hand.`);
  }
  if (rawValue === '' || rawValue === 'null' || rawValue === '~') return { exists: true, value: null };
  if (rawValue.startsWith('"')) return { exists: true, value: JSON.parse(rawValue) };
  if (rawValue.startsWith("'")) return { exists: true, value: rawValue.slice(1, -1).replace(/''/g, "'") };
  if (rawValue === 'true') return { exists: true, value: true };
  if (rawValue === 'false') return { exists: true, value: false };
  if (/^-?\d+(\.\d+)?$/.test(rawValue)) return { exists: true, value: Number(rawValue) };
  return { exists: true, value: rawValue };
}

const fmt = (v) => (typeof v === 'string' ? JSON.stringify(v) : String(v));

// value === undefined removes the line, null writes "null".
function writeScalar(key, value, place) {
  const i = keyIndex(key);
  if (value === undefined) {
    if (i !== -1) lines.splice(i, 1);
    return;
  }
  const line = `${key}: ${fmt(value)}`;
  if (i !== -1) {
    lines[i] = line;
    return;
  }
  for (const anchor of place.after ?? []) {
    const a = keyIndex(anchor);
    if (a !== -1) {
      lines.splice(a + 1, 0, line);
      return;
    }
  }
  const before = keyIndex(place.before ?? 'last_updated');
  if (before !== -1) lines.splice(before, 0, line);
  else lines.push(line);
}

// ----------------------------------------------------------------- validators

const THIS_YEAR = new Date().getUTCFullYear();
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const hasLink = (s) => /https?:\/\/|www\./i.test(s);
const hasDash = (s) => /[–—]/.test(s);

function parseHttps(s) {
  let candidate = s.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) candidate = `https://${candidate}`;
  let u;
  try {
    u = new URL(candidate);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password || !u.hostname.includes('.')) return null;
  return u;
}

const result = {
  ok: (value) => ({ value }),
  err: (error) => ({ error }),
};

// Each validator gets the cleaned input string and returns { value } or
// { error }. value === undefined means "remove the line", null means "null".
const FIELDS = [
  {
    key: 'tagline',
    label: 'Tagline',
    required: true,
    check(s) {
      s = clean(s);
      if (s.length > 120) return result.err(`Too long (${s.length} characters, limit 120).`);
      if (hasLink(s)) return result.err('Links are not allowed in the tagline.');
      return result.ok(s);
    },
  },
  {
    key: 'website',
    label: 'Website',
    required: true,
    check(s) {
      const u = parseHttps(s);
      if (!u) return result.err('Not a valid https:// address.');
      const bare = u.pathname === '/' && !u.search && !u.hash;
      const value = bare ? u.origin : u.href;
      return value.length > 200 ? result.err('Address is too long.') : result.ok(value);
    },
  },
  {
    key: 'twitter_handle',
    label: 'X handle',
    place: { after: ['website'] },
    check(s) {
      s = s.trim();
      if (!s) return result.ok(null);
      const fromUrl = s.match(/^(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})\/?(?:[?#].*)?$/i);
      const handle = (fromUrl ? fromUrl[1] : s).replace(/^@/, '');
      return /^[A-Za-z0-9_]{1,15}$/.test(handle) ? result.ok(handle) : result.err('Not a valid X handle.');
    },
  },
  {
    key: 'linkedin_url',
    label: 'LinkedIn URL',
    place: { after: ['twitter_handle', 'website'] },
    check(s) {
      s = s.trim();
      if (!s) return result.ok(null);
      const u = parseHttps(s);
      if (!u || !/^(www\.)?linkedin\.com$/i.test(u.hostname) || !/^\/(company|in|showcase)\/[^/]+/i.test(u.pathname)) {
        return result.err('Needs to be a linkedin.com/company/... or /in/... address.');
      }
      return result.ok(`https://www.linkedin.com${u.pathname.replace(/\/$/, '')}`);
    },
  },
  {
    key: 'founded',
    label: 'Year founded',
    place: { before: 'last_updated' },
    check(s) {
      s = s.trim();
      if (!s) return result.ok(undefined);
      if (!/^\d{4}$/.test(s) || Number(s) < 1900 || Number(s) > THIS_YEAR) return result.err('Not a valid year.');
      return result.ok(Number(s));
    },
  },
  {
    key: 'hq',
    label: 'Headquarters',
    place: { after: ['founded'], before: 'last_updated' },
    check(s) {
      s = clean(s);
      if (!s) return result.ok(undefined);
      if (s.length > 60) return result.err('Too long (limit 60 characters).');
      if (hasLink(s)) return result.err('Links are not allowed here.');
      return result.ok(s);
    },
  },
  {
    key: 'pricing_from',
    label: 'Starting price',
    check(s) {
      s = s.replace(/[,\s$£€]/g, '');
      if (!s) return result.ok(null);
      if (!/^\d+(\.\d{1,2})?$/.test(s) || Number(s) > 1_000_000) return result.err('Not a valid price.');
      return result.ok(Number(s));
    },
  },
  {
    key: 'pricing_currency',
    label: 'Currency',
    default: 'USD',
    place: { after: ['pricing_from'] },
    check(s) {
      s = s.trim().toUpperCase();
      return ['USD', 'GBP', 'EUR', 'CHF'].includes(s) ? result.ok(s) : result.err('Not one of USD, GBP, EUR, CHF.');
    },
  },
  {
    key: 'pricing_model',
    label: 'Pricing model',
    required: true,
    check(s) {
      s = s.trim().toLowerCase();
      return ['subscription', 'usage-based', 'one-time', 'freemium', 'free', 'custom'].includes(s)
        ? result.ok(s)
        : result.err('Not a recognised pricing model.');
    },
  },
  {
    key: 'free_tier',
    label: 'Free tier',
    default: false,
    place: { after: ['pricing_model'] },
    check(s) {
      s = s.trim().toLowerCase();
      if (['yes', 'true'].includes(s)) return result.ok(true);
      if (['no', 'false'].includes(s)) return result.ok(false);
      return result.err('Expected Yes or No.');
    },
  },
  {
    key: 'free_trial_days',
    label: 'Free trial days',
    default: null,
    place: { after: ['free_tier'] },
    check(s) {
      s = s.trim();
      if (!s) return result.ok(null);
      if (!/^\d{1,3}$/.test(s) || Number(s) > 365) return result.err('Not a valid number of days.');
      return result.ok(Number(s));
    },
  },
];

// --------------------------------------------------------------------- apply

const changes = [];
const rejected = [];
const notes = [];
const flags = [];
const next = {}; // key -> value after this edit, used for the consistency checks

for (const f of FIELDS) {
  if (!(f.key in input)) continue;
  const raw = typeof input[f.key] === 'string' ? input[f.key] : '';
  if (raw.length > 500) {
    rejected.push([f.label, 'Too long.']);
    continue;
  }

  const current = readScalar(f.key);
  const before = current.exists ? current.value : f.default;
  if (f.required && !raw.trim()) continue;

  const compare = (v) => (v === undefined || v === null ? '' : String(v));

  // Unchanged answers are the normal case, because the form arrives prefilled.
  if (raw.trim() === compare(before) || raw === compare(before)) {
    next[f.key] = before;
    continue;
  }
  const checked = f.check(raw);
  if (checked.error) {
    rejected.push([f.label, checked.error]);
    next[f.key] = before;
    continue;
  }
  const after = checked.value;
  next[f.key] = after;
  if (compare(after) === compare(before)) continue;

  writeScalar(f.key, after, f.place ?? {});
  changes.push([f.label, before, after]);

  if (f.key === 'website') {
    const host = (v) => {
      try {
        return new URL(v).hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    };
    if (host(before) !== host(after)) flags.push(`The website moved to a different domain (${host(before) || 'none'} to ${host(after)}). Check it is the same product.`);
    const affiliate = readScalar('affiliate_url');
    if (affiliate.value) flags.push('This listing has an affiliate link. Check it still points to the right place after this change.');
  }
  if (typeof after === 'string' && hasDash(after)) notes.push(`${f.label} contains an en or em dash, which the style guide avoids.`);
}

if (next.pricing_model === 'free' && next.pricing_from !== 0 && next.pricing_from !== null && next.pricing_from !== undefined) {
  notes.push('The pricing model is "free" but the starting price is not 0.');
}

// ------------------------------------------------------------------- outputs

const show = (v) => (v === undefined || v === null || v === '' ? '(empty)' : String(v).replace(/\|/g, '\\|'));
const submission = /^[A-Za-z0-9_-]{1,64}$/.test(String(payload.submission_id ?? '')) ? payload.submission_id : '';
const formId = /^[A-Za-z0-9_-]{1,32}$/.test(String(payload.form_id ?? '')) ? payload.form_id : '';
let name = slug;
try {
  const n = readScalar('name').value;
  if (typeof n === 'string' && n.trim()) name = clean(n).slice(0, 80);
} catch {
  /* keep the slug */
}

if (changes.length === 0) {
  console.log(`No changes to apply for ${slug}.`);
  for (const [label, why] of rejected) console.log(`Rejected ${label}: ${why}`);
  out('changed', 'false');
  process.exit(0);
}

writeFileSync(path, `---${eol}${lines.join(eol)}${eol}---${eol}${rest}`);

const body = [];
body.push(`A founder submitted changes to **${name}** through the update form.`);
body.push('');
body.push('| Field | Before | After |');
body.push('| --- | --- | --- |');
for (const [label, b, a] of changes) body.push(`| ${label} | ${show(b)} | ${show(a)} |`);
if (rejected.length) {
  body.push('');
  body.push('**Not applied**');
  for (const [label, why] of rejected) body.push(`- ${label}: ${why}`);
}
if (flags.length || notes.length) {
  body.push('');
  body.push('**Worth a look**');
  for (const x of [...flags, ...notes]) body.push(`- ${x}`);
}
body.push('');
body.push(`The "Last verified" date has not been changed. Bump \`last_updated\` before merging if you have checked the new details yourself.`);
if (payload.has_note) {
  body.push('');
  body.push('The founder also left a note. It is in Tally, not here, because this repository is public.');
}
if (submission && formId) {
  body.push('');
  body.push(`Tally submission \`${submission}\`: https://tally.so/forms/${formId}/submissions`);
  body.push('The submitter email is in Tally too. Compare it with the address they originally listed with if the change looks odd.');
}
writeFileSync(BODY_FILE, `${body.join('\n')}\n`);

out('changed', 'true');
out('flagged', flags.length ? 'true' : 'false');
out('branch', `listing-edit/${slug}`);
out('title', `Listing edit: ${name}`);
out('body_file', BODY_FILE);

console.log(`Applied ${changes.length} change(s) to ${file}.`);

function fail(message) {
  console.error(message);
  process.exit(1);
}
