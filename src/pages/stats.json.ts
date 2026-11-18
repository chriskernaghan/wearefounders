// Prerendered to /stats.json at build time. The Ghost homepage banner on
// wearefounders.uk reads this so its numbers follow the directory automatically.
import { getFounderIndex } from '../data/founder-index';

export async function GET() {
  const d = await getFounderIndex();
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
    url: 'https://directory.wearefounders.uk/founder-index/',
  };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
