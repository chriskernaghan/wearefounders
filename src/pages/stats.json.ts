// Prerendered to /stats.json at build time. The Ghost homepage banner on
// wearefounders.uk reads this so its numbers follow the directory automatically.
import { getFounderIndex } from '../data/founder-index';
import { getFounderSummary } from '../data/founder-stories';
import { CATEGORY_SIGNALS, SIGNALS_SOURCE, SIGNALS_UPDATED } from '../data/category-signals';

export async function GET() {
  const d = await getFounderIndex();
  const founders = getFounderSummary();

  // Where the gaps are: search demand against how many tools we list, fewest tools per search first
  const gaps = CATEGORY_SIGNALS
    .map((s) => {
      const cat = d.categories.find((c) => c.slug === s.category);
      return {
        label: cat ? cat.label : s.category,
        term: s.term,
        searches: s.volume,
        cpc: s.cpc,
        tools: cat ? cat.count : 0,
        url: `https://directory.wearefounders.uk/category/${s.category}/`,
      };
    })
    .sort((a, b) => b.searches / Math.max(b.tools, 1) - a.searches / Math.max(a.tools, 1))
    .slice(0, 4);

  const body = {
    updated: new Date().toISOString().slice(0, 10),
    reviewUpdated: d.reviewUpdated,
    tools: d.total,
    reviewed: d.reviewed,
    declined: d.declined,
    declineRate: d.declineRate,
    freeToStart: d.freeToStart,
    freeToStartPct: d.freeToStartPct,
    categories: d.categories.slice(0, 4).map(({ label, count }) => ({ label, count })),
    pricing: d.pricing,
    founders,
    gaps,
    gapsSource: `${SIGNALS_SOURCE}, ${SIGNALS_UPDATED}`,
    url: 'https://directory.wearefounders.uk/founder-index/',
  };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
