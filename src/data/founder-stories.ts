// Founder Q&As published on wearefounders.uk, coded from what each founder told us.
// Feeds the "From our founders" card on the wearefounders.uk homepage via /stats.json.
//
// stage: where the business was when we spoke, in the founder's own words.
//   'earning'      the founder said customers are paying (any amount)
//   'not-earning'  launched, but the founder said there's no revenue yet
//   'pre-launch'   not launched, or only being tested with the founder's own projects
//   'not-said'     the Q&A doesn't say either way. Never guess.
// country: only where the founder said where they're based. Leave it out otherwise.
//
// Add a row for every new founder Q&A.

export type FounderStage = 'earning' | 'not-earning' | 'pre-launch' | 'not-said';

export interface FounderStory {
  name: string;
  slug: string;
  stage: FounderStage;
  country?: string;
}

export const FOUNDER_STORIES: FounderStory[] = [
  { name: 'ProspHER', slug: 'serena-fordham-on-building-prospher-the-ai-coaching-app-for-ambitious-women', stage: 'not-said', country: 'United Kingdom' },
  { name: 'Spacestation Labs', slug: 'how-to-market-your-saas-on-reddit-q-a-with-spacestation-labs-paul-xue', stage: 'earning', country: 'Canada' },
  { name: 'DDScore', slug: 'ddscore-founder-q-a-how-ai-due-diligence-helps-you-prepare-to-raise', stage: 'not-said', country: 'Finland' },
  { name: 'Build n Booked', slug: 'build-n-booked-how-chukwuezugo-aronu-runs-pay-per-lead-cold-email-for-b2b', stage: 'earning' },
  { name: 'Brand MRI', slug: 'brand-mri-how-a-designer-built-an-ai-visibility-scanner-with-claude', stage: 'not-earning', country: 'Croatia' },
  { name: 'NOXI', slug: 'noxi-founder-q-a-how-a-solo-builder-took-arabic-from-2-to-4-in-10-decks', stage: 'not-said', country: 'United Arab Emirates' },
  { name: 'ForgeMesh', slug: 'a-tiktok-comment-turned-into-a-paywall-for-ai-crawlers-the-forgemesh-story', stage: 'earning' },
  { name: 'Clarity School', slug: 'building-clarity-school-moritz-zinecker-on-ai-learning-and-planning', stage: 'not-said', country: 'Germany' },
  { name: 'Draftwell Pro', slug: 'draftwell-pro-founder-q-a-ten-years-building-a-writing-app-without-ai-or-subscriptions', stage: 'earning' },
  { name: 'Olnest', slug: 'olnest-helping-founders-find-their-footing-before-they-raise', stage: 'earning' },
  { name: 'IMAGN8', slug: 'imagn8-founder-q-a-why-hand-picked-founders-beat-a-wide-net', stage: 'pre-launch' },
  { name: 'JetSynapse', slug: 'jetsynapse-finding-focus-in-customer-follow-up', stage: 'pre-launch' },
  { name: 'Champ', slug: 'the-two-seconds-before-you-open-an-app-a-q-a-with-champ-founder-ahil-sinnaiah', stage: 'not-said', country: 'Singapore' },
  { name: 'Customermates', slug: 'customermates-founder-q-a-building-an-open-source-agent-operating-system', stage: 'not-said', country: 'Germany' },
  { name: 'Dailies', slug: 'dailies-founder-q-a-how-a-former-photoleap-product-leader-built-a-quotes-app-with-his-son', stage: 'earning' },
  { name: 'Neuronic', slug: 'neuronic-building-near-infrared-helmets-while-still-holding-down-day-jobs', stage: 'earning' },
  { name: 'Yearcap', slug: 'yearcap-founder-q-a-how-a-solo-builder-is-bringing-year-in-review-stories-to-small-apps', stage: 'not-earning', country: 'Iceland' },
];

export const STAGE_LABELS: Record<FounderStage, string> = {
  'earning': 'Making money',
  'not-earning': 'No revenue yet',
  'pre-launch': 'Pre-launch or testing',
  'not-said': "Didn't say",
};

export function getFounderSummary() {
  const total = FOUNDER_STORIES.length;
  const order: FounderStage[] = ['earning', 'not-earning', 'pre-launch', 'not-said'];
  const stages = order
    .map((s) => ({ label: STAGE_LABELS[s], count: FOUNDER_STORIES.filter((f) => f.stage === s).length }))
    .filter((s) => s.count > 0);
  const located = FOUNDER_STORIES.filter((f) => f.country);
  const countries = [...new Set(located.map((f) => f.country as string))];
  return { total, stages, located: located.length, countries };
}
