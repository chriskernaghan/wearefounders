# WAF Tools Directory

Astro-built editorial directory for We Are Founders, deployed at `wearefounders.uk/directory/` via Cloudflare Worker proxy.

## Architecture

```
Browser
  ↓
wearefounders.uk (Cloudflare DNS)
  ↓
  ├── /directory/*  → Cloudflare Worker → Astro on Cloudflare Pages
  └── /*            → Ghost CMS (existing, untouched)
```

The Astro site is a fully static build. Every tool entry, category page, and stage page is pre-rendered HTML at build time. Filtering is the only client-side JS, and it works on already-rendered cards via data-attributes.

## Local development

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Local dev server runs at `http://localhost:4321/directory/`.

## Adding a tool

Create a new Markdown file in `src/content/tools/[slug].md`. Use an existing entry as a template (`lindy.md`, `cursor.md`, `airwallex.md`).

The frontmatter is validated against the schema in `src/content.config.ts`. Build will fail if required fields are missing or wrong type, which is intentional — it catches data quality issues before deploy.

The Markdown body becomes the editorial write-up rendered on the tool detail page. Aim for 300-500 words. Standard WAF style applies: American English, no em dashes, no rhetorical echo structures, short paragraphs, direct second person.

After adding a file, the tool appears automatically in:

- The directory home (`/directory/`)
- Each category page it's tagged for (`/directory/category/[cat]/`)
- Each stage page it's tagged for (`/directory/stage/[stage]/`)
- Its own detail page (`/directory/[slug]/`)

Note: the URL path is `/directory/`, but the Markdown source files live in `src/content/tools/` — the folder name is internal and doesn't affect URLs.

## Editing taxonomy

Categories and stages are defined in `src/data/taxonomy.ts`. To add a new category:

1. Add the slug to the `CATEGORIES` array in `taxonomy.ts`
2. Add the same slug to the enum in `src/content.config.ts` under `categories`
3. Rebuild

The schema enum keeps things type-safe — you can't accidentally tag a tool with a category that doesn't exist.

## Deployment

### Step 1 — Deploy Astro to Cloudflare Pages

1. Push this repo to GitHub
2. In Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Deploy. You'll get a URL like `waf-tools-directory.pages.dev`

### Step 2 — Set up the Worker proxy

1. Open `cloudflare-worker.js` and replace `TOOLS_ORIGIN` with your actual Pages URL
2. In Cloudflare dashboard → Workers & Pages → Create → Worker → Paste the contents of `cloudflare-worker.js`
3. Deploy the worker
4. Add a route: `wearefounders.uk/directory*` → this worker
5. Confirm `wearefounders.uk` (without `/directory`) still routes to Ghost

### Step 3 — Verify

- `wearefounders.uk/directory/` should serve the directory home
- `wearefounders.uk/directory/lindy/` should serve the Lindy detail page
- `wearefounders.uk/` and any existing Ghost URL should be unchanged

### Step 4 — Handle the old subdomain

Update DNS for `tools.wearefounders.uk`:

- Best option: set up a Cloudflare Page Rule or Bulk Redirect to 301 the entire subdomain to `wearefounders.uk/directory/`. This preserves any backlinks the old calculator picked up.
- Alternative: just delete the CNAME so the subdomain stops resolving.

Do NOT just delete the Lovable project until you've confirmed the new directory is live and indexed.

## Content workflow

The intended workflow once live:

1. Pick a tool to add (priority: anything you have an affiliate for)
2. Create the Markdown file
3. Commit to GitHub
4. Cloudflare Pages auto-builds and deploys (usually <60 seconds)
5. New tool is live at `wearefounders.uk/directory/[slug]/`

For tool entries that should also have a full review on the main Ghost site, set `review_url` in the frontmatter. The directory entry will link to the full review, and you should add a "View in directory" link to the Ghost review pointing back. This is the bidirectional internal linking that makes the directory pay for itself in SEO terms.

## Style notes

- Editorial verdict (`our_take`) shows on cards and the detail page hero. Keep under 200 chars, single sentence, opinion-forward.
- Pricing always uses "from" language (`pricing_from: 49` displays as "From $49"). Future-proofs against pricing changes.
- `pros` and `cons` should be 3-5 items each, each item under ~12 words.
- `verdict_score` is optional. If set, surfaces in structured data for rich results.

## What's not built yet

- **Comparison pages** (`/directory/compare/[a]-vs-[b]/`) — folder is reserved but generation logic isn't written. Add when you've got 10+ tools and clear comparison demand.
- **Search bar** — the filter handles browse cases, but a full-text search across all tools could be added later (Pagefind is the lightweight option for Astro).
- **OG image generation** — `og-default.png` needs to exist in `public/`. Per-tool OG images can be auto-generated later.
- **Sitemap** — add `@astrojs/sitemap` integration before launch for proper indexing.

Force push.
