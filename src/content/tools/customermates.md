---
name: Customermates
tagline: Open-source CRM where your AI agent gets its own login
categories:
  - sales-crm
  - ai-agents
stages:
  - mvp
  - scaling
pricing_from: 0
pricing_currency: EUR
pricing_model: freemium
free_tier: true
free_trial_days: 7
affiliate_url: null
affiliate_program: None
website: https://customermates.com
review_url: null
our_take: An open-source CRM where your own AI agent gets a user account and a role of its own. Self-host the core for free, or take the EU cloud from €12 a seat for the inbox and built-in assistant.
pros:
  - AGPL-3.0 core you can self-host for free with Docker Compose
  - Your own Claude or ChatGPT agent gets a user account and a role
  - MCP server exposing 59 tools, plus REST, webhooks, and an n8n node
  - Configurable lists, fields, and relationships instead of fixed CRM objects
  - EU-hosted cloud, which matters if your data has to stay in Europe
cons:
  - Self-hosting covers the core CRM only; the assistant and inbox are cloud-only
  - No quotes, invoicing, SMS, telephony, or built-in email sequences
  - Only Starter pricing is published, with Pro and Business figures missing
  - Early stage, with no customer references on the site yet
last_updated: 2026-11-07
listed_on: 2026-11-07
---

Customermates is a CRM built on the assumption that an AI agent is a colleague rather than a feature. Instead of bolting an assistant onto the sidebar, it gives any agent its own user account and role, so Claude, ChatGPT, Cursor, or anything else speaking MCP logs in, works within permissions you set, and leaves an audit trail like any other user. The MCP server exposes 59 tools, which is a serious surface rather than a token integration.

Records are configurable rather than fixed. You define lists, fields, and relationships to match how you actually sell, which avoids the familiar problem of bending your pipeline to fit someone else's idea of a deal object. There's a REST API, webhooks, and a community n8n node for anything that needs wiring up elsewhere.

The licensing split is worth understanding before you commit. The core CRM is AGPL-3.0 and free to self-host with Docker Compose and PostgreSQL, but the built-in assistant, the unified inbox, and the automation routines are managed-cloud features that don't come with the self-hosted build. Cloud starts at €12 per user a month at Starter, with Pro adding the inbox across email, LinkedIn, WhatsApp, Instagram, and Telegram, and Business adding more connected accounts and shared inboxes. Prices above Starter aren't published.

It's honest about the gaps. There's no quoting, invoicing, telephony, SMS, or email sequencing, so if your sales motion depends on those you'll be running something alongside it. The main repository sits at 221 stars, which is real traction for a project this young, and the cloud is EU-hosted for anyone with data residency to think about.
