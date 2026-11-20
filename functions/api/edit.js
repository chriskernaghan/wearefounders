// Receives the Tally "Update your listing" webhook and hands it to GitHub.
//
// Flow: Tally -> this function -> repository_dispatch -> .github/workflows/
// listing-edit.yml -> scripts/apply-listing-edit.mjs -> pull request.
//
// This function only authenticates the request and relays it. Every piece of
// validation that decides what ends up in a listing lives in
// scripts/apply-listing-edit.mjs, so there is one place to change the rules.
//
// Needs these set on the Pages project (Settings > Variables and Secrets), and
// does nothing useful until all of them exist:
//   TALLY_SIGNING_SECRET     the signing secret from the Tally webhook settings
//   TALLY_EDIT_FORM_ID       the form ID from the Tally form URL (tally.so/r/<id>)
//   GITHUB_DISPATCH_TOKEN    fine-grained token for this one repository with
//                            "Contents: Read and write" (needed by the
//                            repository_dispatch endpoint)
//   GITHUB_REPO              optional, defaults to chriskernaghan/wearefounders
//
// Status codes matter because Tally retries on anything that isn't a 2xx:
//   401 bad signature (no point retrying), 200 for submissions we choose to
//   ignore, 502 when GitHub didn't accept the dispatch (so Tally tries again).

const SLUG = /^[a-z0-9-]{1,100}$/;
let publishedSlugs = null;

const ok = (body = 'ok') => new Response(body, { status: 200 });

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Tally signs the payload with HMAC-SHA256 and sends it base64 encoded in the
// Tally-Signature header. Their docs hash JSON.stringify of the parsed body, so
// both the raw text and the re-serialised JSON are tried.
async function signatureMatches(secret, header, rawBody) {
  let sig;
  try {
    sig = b64ToBytes(header);
  } catch {
    return false;
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const candidates = [rawBody];
  try {
    candidates.push(JSON.stringify(JSON.parse(rawBody)));
  } catch {
    /* not JSON, the parse below will reject it */
  }
  for (const text of candidates) {
    if (await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(text))) return true;
  }
  return false;
}

// Turns Tally's fields array into { label: value }. Dropdown and multiple
// choice answers arrive as option IDs, so they are mapped back to the option
// text. Hidden fields are kept apart because the visible labels and the hidden
// field names overlap on purpose (both describe the same listing field).
function readFields(fields) {
  const visible = {};
  const hidden = {};
  for (const f of fields || []) {
    if (!f || typeof f.label !== 'string') continue;
    let value = f.value;
    if (Array.isArray(value) && Array.isArray(f.options)) {
      const text = value.map((id) => f.options.find((o) => o.id === id)?.text).filter(Boolean);
      value = text[0] ?? '';
    }
    if (value === null || value === undefined) value = '';
    if (typeof value === 'number') value = String(value);
    if (typeof value !== 'string') continue;
    (f.type === 'HIDDEN_FIELDS' ? hidden : visible)[f.label] = value.trim();
  }
  return { visible, hidden };
}

export async function onRequestPost({ request, env }) {
  if (!env.TALLY_SIGNING_SECRET || !env.GITHUB_DISPATCH_TOKEN || !env.TALLY_EDIT_FORM_ID) {
    console.error('listing edit: missing environment variables');
    return new Response('not configured', { status: 500 });
  }

  const raw = await request.text();
  if (raw.length > 100_000) return new Response('too large', { status: 413 });

  const header = request.headers.get('Tally-Signature') || '';
  if (!header || !(await signatureMatches(env.TALLY_SIGNING_SECRET, header, raw))) {
    return new Response('bad signature', { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return ok('ignored');
  }
  if (payload?.eventType !== 'FORM_RESPONSE') return ok('ignored');
  if (payload?.data?.formId !== env.TALLY_EDIT_FORM_ID) return ok('ignored');

  const { visible, hidden } = readFields(payload.data.fields);

  const slug = hidden.slug || '';
  if (!SLUG.test(slug)) return ok('ignored');

  // Only act on slugs that are live listings. The list is built by
  // src/pages/tool-slugs.json.ts and cached for the life of the isolate.
  if (!publishedSlugs) {
    const res = await env.ASSETS.fetch(new URL('/tool-slugs.json', request.url));
    if (!res.ok) return new Response('slug list unavailable', { status: 502 });
    publishedSlugs = new Set(await res.json());
  }
  if (!publishedSlugs.has(slug)) return ok('ignored');

  // The email and the free-text note stay in Tally. Neither is sent to GitHub
  // because the repository is public.
  const changes = {
    tagline: visible['Tagline'],
    website: visible['Website'],
    twitter_handle: visible['X handle'],
    linkedin_url: visible['LinkedIn URL'],
    hq: visible['Headquarters'],
    founded: visible['Year founded'],
    pricing_from: visible['Starting price'],
    pricing_currency: visible['Currency'],
    pricing_model: visible['Pricing model'],
    free_tier: visible['Free tier'],
    free_trial_days: visible['Free trial days'],
  };

  const repo = env.GITHUB_REPO || 'chriskernaghan/wearefounders';
  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_DISPATCH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'waf-directory-listing-edit',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      event_type: 'listing-edit',
      client_payload: {
        slug,
        changes,
        submission_id: String(payload.data.submissionId || payload.data.responseId || ''),
        form_id: payload.data.formId,
        has_note: Boolean(visible['Anything else we should change?']),
      },
    }),
  });

  if (res.status !== 204) {
    console.error('listing edit: GitHub dispatch failed', res.status, await res.text());
    return new Response('dispatch failed', { status: 502 });
  }
  return ok();
}
