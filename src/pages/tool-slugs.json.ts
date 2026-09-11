// Published listing slugs, prerendered to /tool-slugs.json at build time.
// Used by functions/api/sv.js to reject visits for slugs that aren't live, and
// by scripts/update-trending.mjs so trending.json can never name a listing
// that would fail the TrendingBar build check.
import { getCollection } from 'astro:content';

export async function GET() {
  const tools = await getCollection('tools', ({ data }) => data.published);
  const slugs = tools.map((tool) => tool.id.replace(/\.md$/, '')).sort();
  return new Response(JSON.stringify(slugs), {
    headers: { 'Content-Type': 'application/json' },
  });
}