import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tools = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tools' }),
  schema: z.object({
    // Identity
    name: z.string(),
    tagline: z.string().max(120),
    logo: z.string().optional(),
    screenshot: z.string().optional(),

    // Taxonomy — tool can sit in multiple categories and serve multiple stages
    categories: z.array(
      z.enum([
        'ai-agents',
        'automation',
        'developer-tools',
        'finance-ops',
        'growth-marketing',
        'sales-crm',
        'customer-support',
        'analytics',
        'productivity',
        'design',
        'hiring-hr',
        'legal-compliance',
      ])
    ).min(1),
    stages: z.array(
      z.enum(['pre-launch', 'mvp', 'scaling', 'established'])
    ).min(1),

    // Pricing snapshot (kept deliberately vague per WAF style — use "from")
    pricing_from: z.number().nullable(),
    pricing_currency: z.enum(['USD', 'GBP', 'EUR']).default('USD'),
    pricing_model: z.enum([
      'subscription',
      'usage-based',
      'one-time',
      'freemium',
      'free',
      'custom',
    ]),
    free_tier: z.boolean().default(false),
    free_trial_days: z.number().nullable().default(null),

    // Commercial
    affiliate_url: z.string().url().nullable().default(null),
    affiliate_program: z.enum(['PartnerStack', 'Impact', 'Direct', 'None']).default('None'),
    website: z.string().url(),

    // Editorial
    review_url: z.string().nullable().default(null),
    our_take: z.string().max(200),
    pros: z.array(z.string()).min(1).max(5),
    cons: z.array(z.string()).min(1).max(5),
    verdict_score: z.number().min(1).max(10).optional(),

    // Meta
    founded: z.number().optional(),
    hq: z.string().optional(),
    last_updated: z.date(),
    featured: z.boolean().default(false),
    comparable: z.boolean().default(true),
  }),
});

export const collections = { tools };
