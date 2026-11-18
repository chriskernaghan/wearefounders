// Search demand per directory category, used for the "Where the gaps are" card on the
// wearefounders.uk homepage via /stats.json. Tool counts are worked out live from listings.
//
// volume: US monthly searches (12-month average) for one representative term.
// cpc: estimated US cost per click in USD.
// Source: Google Ads data via DataForSEO, pulled through OpenSEO. Refresh quarterly and
// update SIGNALS_UPDATED. Leave out any term whose figures look wrong.

export const SIGNALS_UPDATED = 'November 2026';
export const SIGNALS_SOURCE = 'US monthly search estimates from Google Ads data via DataForSEO';

export interface CategorySignal {
  category: string; // directory category slug
  term: string;
  volume: number;
  cpc: number;
}

export const CATEGORY_SIGNALS: CategorySignal[] = [
  { category: 'sales-crm', term: 'crm software', volume: 201000, cpc: 37.13 },
  { category: 'hiring-hr', term: 'payroll software', volume: 27100, cpc: 146.25 },
  { category: 'customer-support', term: 'helpdesk software', volume: 5400, cpc: 107.68 },
  { category: 'legal-compliance', term: 'contract management software', volume: 3600, cpc: 284.13 },
  { category: 'growth-marketing', term: 'social media scheduling tool', volume: 2400, cpc: 26.39 },
];
