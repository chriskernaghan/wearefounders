// Single source of truth for taxonomy labels.
// Slugs MUST match the enums in content.config.ts.

export const CATEGORIES = [
  { slug: 'ai-agents',         label: 'AI Agents',          desc: 'Autonomous agents that take actions on your behalf.' },
  { slug: 'automation',        label: 'Automation',         desc: 'Workflow automation, RPA, and integration platforms.' },
  { slug: 'developer-tools',   label: 'Developer Tools',    desc: 'IDEs, copilots, deployment, and dev infrastructure.' },
  { slug: 'finance-ops',       label: 'Finance & Ops',      desc: 'Banking, accounting, payments, and back-office tools.' },
  { slug: 'growth-marketing',  label: 'Growth & Marketing', desc: 'SEO, content, ads, social, and acquisition platforms.' },
  { slug: 'sales-crm',         label: 'Sales & CRM',        desc: 'Pipeline, outreach, and customer relationship tools.' },
  { slug: 'customer-support',  label: 'Customer Support',   desc: 'Helpdesk, live chat, and support automation.' },
  { slug: 'analytics',         label: 'Analytics',          desc: 'Product analytics, BI, and data warehousing.' },
  { slug: 'productivity',      label: 'Productivity',       desc: 'Notes, docs, project management, and personal ops.' },
  { slug: 'design',            label: 'Design',             desc: 'Design tools, prototyping, and asset platforms.' },
  { slug: 'hiring-hr',         label: 'Hiring & HR',        desc: 'Recruiting, onboarding, and people ops.' },
  { slug: 'legal-compliance',  label: 'Legal & Compliance', desc: 'Contracts, equity, and regulatory tooling.' },
] as const;

export const STAGES = [
  { slug: 'pre-launch',  label: 'Pre-launch',  desc: 'Idea to first build. Validating before shipping.' },
  { slug: 'mvp',         label: 'MVP',         desc: 'Building toward first paying users.' },
  { slug: 'scaling',     label: 'Scaling',     desc: 'Post-PMF. Growing revenue and team.' },
  { slug: 'established', label: 'Established', desc: 'Mature operations. Optimising and expanding.' },
] as const;

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
);
export const STAGE_MAP = Object.fromEntries(
  STAGES.map((s) => [s.slug, s])
);

export type CategorySlug = typeof CATEGORIES[number]['slug'];
export type StageSlug = typeof STAGES[number]['slug'];
