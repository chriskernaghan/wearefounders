// Single place where the Founder Index numbers are computed.
// Used by the /founder-index/ page and by /stats.json (which feeds the banner
// on wearefounders.uk), so the two can never disagree.
import { getCollection } from 'astro:content';
import { CATEGORIES, STAGES } from './taxonomy';
import { REVIEWED, DECLINED, DECLINE_RATE, DECLINE_RATIO, STATS_UPDATED } from './review-stats';

export async function getFounderIndex() {
  // Only live listings count. Unpublished drafts are excluded.
  const tools = await getCollection('tools', ({ data }) => data.published);
  const total = tools.length;
  const pct = (n: number) => Math.round((n / total) * 100);

  const categories = CATEGORIES.map((c) => ({
    slug: c.slug,
    label: c.label,
    count: tools.filter((t) => t.data.categories.includes(c.slug as any)).length,
  })).sort((a, b) => b.count - a.count);

  const stages = STAGES.map((s) => ({
    slug: s.slug,
    label: s.label,
    count: tools.filter((t) => t.data.stages.includes(s.slug as any)).length,
  }));

  const model = (m: string) => tools.filter((t) => t.data.pricing_model === m).length;
  const pricing = [
    { label: 'Freemium', count: model('freemium') },
    { label: 'Free', count: model('free') },
    { label: 'Subscription', count: model('subscription') },
    { label: 'One-time', count: model('one-time') },
    { label: 'Other', count: model('usage-based') + model('custom') },
  ].filter((p) => p.count > 0);
  const freeToStart = model('free') + model('freemium');

  return {
    total,
    pct,
    categories,
    stages,
    pricing,
    freeToStart,
    freeToStartPct: pct(freeToStart),
    reviewed: REVIEWED,
    declined: DECLINED,
    declineRate: DECLINE_RATE,
    declineRatio: DECLINE_RATIO,
    reviewUpdated: STATS_UPDATED,
  };
}
