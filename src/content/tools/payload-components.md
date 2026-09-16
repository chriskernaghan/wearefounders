---
name: Payload Components
tagline: Typed Payload CMS blocks, installed and wired
website: https://www.payload-components.xyz
categories:
  - developer-tools
stages:
  - mvp
pricing_model: free
pricing_from: 0
free_tier: true
our_take: One command copies a Payload block in and does the four edits that usually follow, collection config, render mapping, generated types and import map. Lands as a git diff you review like any PR.
pros:
  - Does the wiring a plain copy-paste leaves as your TODO list
  - MIT throughout, 82 components, no paid tier or gated blocks
  - Dry-run shows every file, patch and command before anything is written
cons:
  - Payload v3 with Next.js 15 or 16 only, shaped like the official starter
  - Not a hosted page builder or no-code editor
date_added: 2026-07-16
last_updated: 2026-07-16
---

Copying a Payload block into a project is the easy part. Making it live means registering it in the Pages collection, mapping it in RenderBlocks, regenerating Payload's types and updating the admin import map, four edits that get forgotten, half-done, or repeated across every repo. Payload Components does all five artifacts in one pass, so `npx payload-components add hero-basic` lands source files plus two scoped patches and two regenerated outputs as a single reviewable git diff.

The catalogue runs to 82 components across heroes, features, pricing, comparators, testimonials, stats, FAQs, footers and more, each rendered live on the site rather than shown as a screenshot, so you can see what you're installing before you run anything. Every component page documents its fields, files and patches up front, and a dry-run flag prints exactly what would change without touching the repo. Installs record their own state, so running the same command twice converges rather than duplicating, and partial installs stay visible instead of silently breaking.

The whole thing is MIT, the registry, the CLI, the components and the site are one repository, with no license key, no gated tier and no paid roadmap. What you install is plain source you own and can edit, not a locked runtime dependency, which is the argument for reviewing the installer before trusting it. Scope is deliberately narrow: Payload v3 with Next.js 15 or 16, structured like the official website starter, and the CLI checks your project against a published support matrix before it writes anything.
