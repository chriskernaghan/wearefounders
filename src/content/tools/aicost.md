---
name: AICost
tagline: Compare LLM API pricing across 30+ providers, free and no signup
categories:
  - developer-tools
stages:
  - mvp
  - scaling
pricing_from: 0
pricing_currency: USD
pricing_model: free
free_tier: true
affiliate_url: null
affiliate_program: None
website: https://aicost.tools
review_url: null
our_take: Nine free calculators for working out what an LLM API actually costs, with every price read from the vendor's own page and stamped with the date it was checked. No signup, nothing paid.
pros:
  - Nine calculators covering tokens, agents, fine-tuning, embeddings, TTS and video
  - Every price read from the vendor's own pricing page and dated
  - Price history kept, with corrections published in a public log
  - No signup and nothing behind a paywall
cons:
  - Model and provider counts differ across the site, which undercuts the accuracy pitch
  - Funded by affiliate links and sponsored slots on the providers it compares
  - Works from list prices, so it won't reflect your actual billing or negotiated rates
  - Doesn't execute API requests or manage provider accounts
last_updated: 2026-11-12
listed_on: 2026-11-12
---

AICost answers the question everyone building on LLM APIs asks badly: what is this going to cost me a month. Rather than one calculator, there are nine, covering straight API spend with reasoning tokens and cache hit rates, token counting, subscription versus pay-as-you-go break-even, multi-step agent tasks, fine-tuning against prompting a base model, embeddings including re-indexing, plus text-to-speech, image and video generation. All of them open and work without an account.

The methodology is the part worth paying attention to. Prices are read from each vendor's own pricing page rather than scraped from aggregators, and stamped with the date they were checked. Price history is kept, and corrections get published in a public log, which is a level of accountability most comparison sites skip entirely.

Worth knowing that the site earns through affiliate links and sponsored placements on the same providers it compares. That's disclosed openly rather than hidden, which is the right way to handle it, though it's the context to hold in mind when reading any recommendation rather than a raw price.

A couple of practical limits. It works from published list prices, so it won't know about your enterprise discount or show what you actually got billed, and it doesn't touch your provider accounts or run any requests. For scoping a build before you commit, or for sanity-checking whether an agent loop is about to get expensive, it does the job and costs nothing.
