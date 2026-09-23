# Atomic Shelf Website Relaunch — Master PRD

**Status:** Implementation underway — commercial baseline implemented; client-facing provenance cleanup in progress/verified on core sales pages; release gates remain
**Version:** 1.2
**Date:** 2026-09-23  
**Product:** Atomic Shelf marketing website  
**Primary goal:** Relaunch the site as a clear, memorable, conversion-focused system that explains Atomic Shelf, builds trust, makes pricing easy to understand, and gives authors a natural path to becoming customers.

---

## 1. Executive Summary

Atomic Shelf should be presented as a **long-term readership growth partner for independent authors**, not simply as a collection of marketing services.

The website must make one idea immediately understandable:

> **Build a readership that lasts.**

The site should explain that Atomic Shelf connects discovery, trust, conversion, and reader retention into one coordinated system.

The visitor should be able to move naturally through:

**Understand → Believe → Identify → Compare → Trust → Buy**

### Implementation status — 2026-09-22

The following baseline work is complete:

- `pricing-data.json` is the browser-facing pricing dataset used by the homepage preview and the full pricing page.
- The six plan records include commitment prices, services, deliverables, positioning, and performance ranges.
- The service map and public Services page now match the approved plan inclusions, service stages, and plan-specific content volumes.
- The How It Works page now aligns the five-stage system with those approved service stages and plan inclusions.
- A public Editorial page exists; Start Here is a guided five-path selector, and public navigation aliases cover Catalogue, ShelfMates, and StoryPals.
- The deployment workflow builds a public-only payload and excludes identified client-work and internal-tool directories.
- The tracked Brevo environment file has been removed from version control and environment files are ignored going forward.

Remaining release gates:

- Rotate the previously exposed Brevo credential.
- Inventory and explicitly remove any private files already present on the public host; deployment cleanup remains deliberately disabled.
- Complete the planned manual/legal review of the commitment terms.
- Complete proof-metric records, case studies, analytics, checkout, SEO/accessibility/performance, and cross-device QA.

The website should educate enough to make the purchase feel informed, but it should remain a sales system. Every major page must answer a practical buyer question and lead naturally to the next decision.

### Public provenance cleanup — 2026-09-23

Internal planning and evidence language must never leak into client-facing pages or browser-visible commercial copy.

**Public-copy rule:** client-facing pages must not expose internal provenance, audit, approval, planning, or implementation annotations. This includes terms such as **source of truth**, **single source**, **commercial-truth**, internal **[extrapolated]** evidence labels, **SOURCING NOTE**, **PRD Section**, **sign-off**, **approved by**, and similar working-language markers.

The browser-facing pricing dataset is `pricing-data.json`. It contains presentation-ready plan information; internal approval state, evidence notes, audit commentary, provenance records, and working annotations remain outside customer-facing content.

Implemented on 2026-09-23:
- `pricing.html` and `index.html` use `pricing-data.json`.
- `results.html` no longer describes pricing data using internal provenance language.
- Internal sourcing notes were removed from the public Services and How It Works pages.
- Core sales pages were scrubbed of the identified provenance terminology.

**Acceptance test:** a production/public-content search must return zero matches for the prohibited provenance terms in client-facing HTML, visible text, browser-loaded JSON, and runtime labels.

### Core positioning

> **We help independent authors find readers, turn attention into sales, and build an audience that can follow them from one book to the next.**

### Core mental model

**FIND → TRUST → CONVERT → RETAIN → REPEAT**

Alternative customer-facing phrasing:

> **Find the reader. Earn the click. Make the sale. Bring them back.**

---

# 2. Current-State Problems to Fix

The existing site already has a strong foundation and the central positioning is promising. The current homepage uses:

> “Build a readership that lasts.”

and presents video, ARC reviews, listing optimisation, reader lists, and audience retargeting as a connected system.

However, the website needs a full architecture/content pass before relaunch.

The current site also contains numerical and commercial information that is inconsistent across pages. For example, the homepage currently presents one set of plans while older pricing/how-it-works pages contain different prices and packages.

Therefore:

### Non-negotiable

Commercial facts must be maintained from a controlled internal data layer so public pages remain consistent. Internal provenance terminology must never appear in client-facing copy.

That controlled layer must cover:

- plans
- prices
- discounts
- plan features
- deliverables
- services
- proof metrics
- guarantees
- claims
- CTAs
- reader products

No page should independently invent or hard-code commercial facts.

---

# 3. Relaunch Objectives

## Primary objectives

1. Make Atomic Shelf immediately understandable.
2. Make the system feel coherent rather than like a bundle of services.
3. Make pricing easy to compare.
4. Make long-term commitment savings feel rational and valuable.
5. Establish trust through proof without relying on inflated claims.
6. Explain what happens during the first 90 days.
7. Explain what Atomic Shelf promises and what it does not promise.
8. Give visitors clear paths based on their situation.
9. Convert qualified authors into customers.
10. Create an architecture that can grow without requiring another wholesale rewrite.

## Secondary objectives

- Improve mobile conversion.
- Reduce navigation friction.
- Make the site memorable.
- Give case studies/results a consistent structure.
- Make Editorial useful for both SEO and qualification.
- Make ShelfMates and StoryPals feel like part of the broader reader ecosystem.
- Create a durable content/data architecture.

---

# 4. Brand Positioning

## Primary headline

# Build a readership that lasts.

This should remain the central brand promise unless later testing demonstrates a materially stronger alternative.

## Supporting statement

> We help independent authors find readers, turn attention into sales, and build an audience that can follow them from one book to the next.

## Supporting philosophy

Atomic Shelf is not selling isolated activities.

It is selling a connected growth system.

### The system

**Discover → Trust → Convert → Retain → Repeat**

### Short version

> Find the reader. Earn the click. Make the sale. Bring them back.

---

# 5. What Atomic Shelf Is

Atomic Shelf should consistently be described as:

> A books-only growth partner for independent authors.

The site should emphasize:

- books
- readers
- long-term author careers
- repeat readership
- coordinated marketing
- measurable work
- ongoing improvement

Avoid positioning Atomic Shelf primarily as:

- a generic marketing agency
- a generic social media agency
- an AI agency
- a BookTok-only agency
- an advertising agency
- a freelancer marketplace

BookTok/video can be a major discovery engine, but it is one part of the larger system.

---

# 6. Customer Promise

Atomic Shelf should make a distinction between:

### What we control

- agreed production
- agreed campaigns
- agreed reviews/recruitment work
- listing optimisation
- reporting
- communication
- testing
- iteration
- campaign management
- delivery of included services

### What we influence

- reach
- engagement
- clicks
- audience growth
- conversion
- sales
- reviews
- reader acquisition
- repeat readership

### What we cannot honestly guarantee

- an algorithmic viral event
- a specific number of sales regardless of market conditions
- a bestseller position
- a specific ranking
- a particular advertising platform's behaviour
- reader behaviour

This distinction should increase credibility rather than weaken the offer.

---

# 7. Guarantee / Growth Commitment

Do not make the guarantee sound like:

> “If results are bad, we simply refund you.”

That is not the intended commercial promise.

The intended promise is:

> **Atomic Shelf takes responsibility for the work it has committed to doing.**

Recommended copy:

> ## Our commitment
>
> We don't promise that every book will explode overnight. Publishing doesn't work that way — and neither does building a readership.
>
> What we do promise is that we'll do the work we've committed to, measure what happens, and stay accountable for the outcome.
>
> If we fall short of the work, delivery, or agreed commitments on our side, we'll make it right — at our cost.
>
> And when the numbers show that we need to change course, we don't simply point at the dashboard and walk away. We diagnose, adjust, and keep working toward the target.
>
> **Your commitment is to the partnership. Ours is to the work.**

### Commercial implementation ✅ Defined (2026-09-22)

**Implemented, pending manual/legal review:** Money-back applies only where delivery was demonstrably zero — zero/near-zero impressions despite content posted as agreed, zero/near-zero click-throughs despite measurable impressions, or zero measurable results across the agreed scope. Refund is scoped to the specific undelivered line items, not the full plan price. Outside that trigger, underperformance relative to the estimated ranges is treated as time-based: Atomic Shelf keeps working, diagnoses, and adjusts — it does not refund for results that are simply slower than the estimate. This is encoded in `pricing-data.json` → `guarantee`, and the public pricing page matches it.

The remedy is defined in the source data. Its commitment terms draft remains a manual/legal review gate before final approval.

Do not broaden or reword the published commitment without updating the source data and completing the manual/legal review.

---

# 8. Homepage Architecture

The homepage is the primary conversion surface.

Recommended order:

1. Hero
2. Proof strip
3. Problem
4. Five-stage system
5. Services
6. Who it is for
7. Results
8. 90-day journey
9. Reader ecosystem
10. Pricing preview
11. Commitment/guarantee
12. FAQ
13. Final CTA

---

# 9. Homepage — Section Specifications

## 9.1 Hero

### Required content

**Eyebrow:**

> For independent authors

**Headline:**

> Build a readership that lasts.

**Body:**

> We help independent authors find readers, turn attention into sales, and build an audience that can follow them from one book to the next.

### Primary CTA

> See the plans

### Secondary CTA

> See how it works

### Optional human CTA

> Talk to us

### Hero rule

Do not explain the entire methodology in the hero.

The hero sells the destination.

The following sections explain the system.

---

# 10. Proof Strip

Use no more than 3–4 major proof points above the fold.

Every metric must have:

- value
- definition
- time period
- source
- last verified date

Example structure:

| Metric | Definition |
|---|---|
| 3.2× | Average sales lift within 90 days |
| 12,000+ | Videos produced for client authors |
| 2,400 | Average downloads per newsletter feature |

Do not display a number simply because it looks impressive.

Every number must be defensible.

---

# 11. Problem Section

Purpose:

Make the visitor recognize their situation.

Suggested concept:

> ## A good book is only the beginning.
>
> Readers have to discover it.
>
> They have to trust it.
>
> They have to understand why it is for them.
>
> They have to make the purchase.
>
> And ideally, they have to remember the author when the next book arrives.

Then introduce Atomic Shelf:

> That's why we don't treat marketing as a collection of disconnected tasks.

---

# 12. Five-Stage System

This is the central conceptual framework.

## 01 — Discover

### Video finds the readers.

Short-form content puts the book in front of genre-relevant audiences.

## 02 — Trust

### Reviews make the click worthwhile.

ARC campaigns create social proof and reduce uncertainty.

## 03 — Convert

### The listing earns the sale.

Listing copy, keywords, A+ content, and storefront presentation help turn interested readers into buyers.

## 04 — Retain

### Reader lists make the relationship repeatable.

ShelfMates and StoryPals help build a direct reader relationship rather than relying entirely on rented platform audiences.

## 05 — Repeat

### The next book starts with readers you already earned.

The objective is not one isolated sale.

The objective is an increasingly valuable readership.

---

# 13. Services Section

The Services page should be the detailed explanation.

The homepage should only introduce the major categories.

Recommended categories:

- Short-form video
- ARC review campaigns
- Listing optimisation
- Preorder campaigns
- Free-promotion campaigns
- Reader-list building
- Amazon advertising
- Audience retargeting
- Reader ecosystem

Each service must answer:

1. What is it?
2. Why does it matter?
3. What does Atomic Shelf actually do?
4. Which plans include it?
5. What does success look like?
6. Who needs it?
7. What is the relevant next step?

---

# 14. Audience Self-Selection

Add a section that helps authors identify themselves.

### Heading

> Where are you right now?

Cards:

### I need more readers.

For authors who have a book but need discovery.

### I have readers, but sales are inconsistent.

For authors who need a stronger system around existing attention.

### I have a launch coming.

For authors who need coordinated pre-launch and launch support.

### I have a backlist.

For authors who want to build a repeatable readership across multiple books.

### I already run ads.

For authors who need stronger foundations and better conversion around paid traffic.

Each card should lead to relevant information rather than forcing every visitor through the same generic funnel.

---

# 15. Results Section

Results should not be presented as a wall of testimonials.

Use structured case studies.

### Each case study should contain

- book cover
- author
- genre
- starting situation
- services used
- time period
- measurable outputs
- measurable business indicators
- relevant context
- author quote where available

### Recommended hierarchy

**Output → Activity → Indicator → Business result**

Example:

- 40 videos produced
- 150K impressions
- 2,400 clicks
- measurable sales/KU/download movement

Do not imply that impressions equal sales.

---

# 16. 90-Day Journey

This section explains why long-term commitments exist.

## Days 1–30 — Build the foundation

- establish positioning
- prepare content
- improve assets
- begin discovery
- establish baseline metrics
- start gathering audience signals

## Days 31–60 — Build momentum

- increase consistency
- identify what content resonates
- strengthen social proof
- improve conversion points
- expand reader acquisition

## Days 61–90 — Measure the system

- compare against baseline
- identify strongest channels
- improve weak points
- strengthen repeatable acquisition
- determine next growth priorities

### Core message

> The first month starts the system.  
> The following months give it enough time to learn, compound, and improve.

This supports the long-term commitment discounts.

---

# 17. Pricing Architecture

Pricing should be one of the easiest pages to understand.

## Commitment selector

Display:

- Monthly
- 3 months — Save 10%
- 6 months — Save 20%
- 12 months — Save 25%

The exact current prices must come from the controlled pricing dataset.

### Explain the discount

> Longer commitments are prepaid savings. The reason we offer the discount is simple: the system has more time to compound, and predictable planning lets us give you better economics.

Do not bury this explanation.

---

# 18. Pricing Card Structure

Each plan should show:

1. Plan name
2. One-sentence positioning
3. Price
4. Equivalent monthly price when prepaid
5. Savings
6. Primary audience
7. Main outcome
8. Included services
9. Expected activity/output
10. Relevant indicators
11. Commitment
12. CTA

### Avoid

Huge lists of tiny features.

### Prefer

**Outcome → mechanism → included work**

---

# 19. Plan Positioning

Use the current approved pricing/tier structure as the source of truth.

Suggested positioning language:

### Spark

> Start getting discovered.

### Enhanced

> Add a durable creative asset to ongoing content.

### Foundation

> Build the infrastructure underneath the traffic.

### Starter

> Add paid amplification and additional creative assets.

### Momentum

> Turn attention into a coordinated growth engine.

### Growth

> Scale the full-funnel system for larger launches and backlists.

The current plan records, including exact positioning, live in `pricing-data.json`.

---

# 20. Pricing Page UX

The pricing page should support comparison without overwhelming the buyer.

Required:

- commitment selector
- clear price
- savings
- feature comparison
- recommended use case
- expected activity
- FAQ
- guarantee/commitment
- clear CTA

Optional:

- plan comparison toggle
- “Which plan is right for me?” flow
- monthly equivalent calculator

---

# 21. Start Here Flow

Maintain a persistent CTA:

> Start here

### Current implementation

`start-here.html` is a public five-path selector for discovery, launch, managed marketing, backlist, or uncertainty. It routes visitors to relevant plan/service pages or passes their stated goal into the contact form.

### Guided-routing choices

The visitor chooses:

### What are you trying to accomplish?

- I want more readers.
- I have a launch coming.
- I want someone to handle marketing.
- I need help with my backlist.
- I'm not sure.

The system then routes them toward:

- relevant explanation
- relevant services
- relevant plan
- contact/talk-to-us option

This should reduce the need for visitors to understand the entire site before taking action.

---

# 22. Navigation

Recommended primary navigation:

- How It Works
- Services
- Pricing
- Results
- Readers
- Editorial
- **Start Here**

Secondary/footer:

- Catalogue
- FAQ
- Contact
- ShelfMates
- StoryPals
- Terms
- Privacy

Do not overload the top navigation.

---

# 23. Page Jobs

Each page must have one primary job.

| Page | Primary job |
|---|---|
| Home | Make Atomic Shelf understandable |
| How It Works | Make the system believable |
| Services | Explain what Atomic Shelf does |
| Pricing | Make buying easy |
| Results | Prove the work |
| Catalogue | Show the books/work |
| Readers | Explain the reader ecosystem |
| Editorial | Educate and qualify |
| FAQ | Remove objections |
| Start Here | Route the visitor |
| Contact | Enable human conversation |

If a page does not have a clear job, reconsider whether it needs to exist.

---

# 24. Readers Ecosystem

ShelfMates and StoryPals should not feel like random side projects.

Position them as part of the long-term reader strategy.

### Core message

> We go beyond marketing books — we aim to build lasting reader relationships.

### ShelfMates

Reader ecosystem for adult fiction.

### StoryPals

Reader ecosystem for children's books and families.

The reader products should ultimately reinforce:

**Discovery → reader relationship → future releases**

---

# 25. Catalogue

The Catalogue should feel like a bookshelf rather than a conventional portfolio grid.

Each entry should include:

- cover
- title
- author
- genre
- short description
- relevant Atomic Shelf work
- measurable result where available
- case study link if available

Visual principle:

> **Show the books. Show the work. Show what happened.**

---

# 26. Editorial

Editorial should answer questions authors actually ask.

Initial topics:

- How many TikToks does a book need?
- Can BookTok actually sell books?
- What should happen during the first 30 days?
- Should you advertise a book with zero reviews?
- How early should you start a preorder campaign?
- What should an author do before running Amazon Ads?
- What happens if a book has no existing audience?
- Does a backlist change the strategy?
- What should authors measure besides views?
- When should an author expect to see meaningful data?

Editorial should educate while naturally qualifying potential customers.

---

# 27. FAQ

Required FAQ categories:

## Results

- When should I expect results?
- What happens during the first month?
- Do you guarantee sales?
- What metrics do you report?

## Plans

- What is included?
- Can I change plans?
- What happens after a commitment ends?
- Why are longer commitments discounted?

## Delivery

- What do I need to provide?
- Do I need to appear on camera?
- How often is content produced?
- Who manages the campaigns?

## Audience

- Can you work with a brand-new author?
- Can you work with a backlist?
- What genres do you support?

## Commitment

- What happens if Atomic Shelf does not deliver?
- What does the commitment/guarantee actually cover?
- What happens if the strategy needs to change?

The guarantee FAQ must match the actual contractual terms.

---

# 28. Conversion Architecture

Every page should have a clear next step.

## CTA vocabulary

### Exploration

> See how it works

### Commercial

> See the plans

### Purchase

> Start with [Plan]

### Human

> Talk to us

### Proof

> See the results

### Navigation

> Start here

Avoid having ten different CTA phrases that all mean the same thing.

---

# 29. Mobile-First Requirements

The site must be designed and tested at:

- 320px
- 375px
- 390px
- 430px

Required:

- no horizontal scrolling
- readable typography
- large tap targets
- short sections
- clear CTAs
- pricing cards that remain understandable
- comparison tables that work on small screens
- no oversized decorative hero consuming the entire screen
- fast loading
- accessible contrast

---

# 30. Visual Direction

Desired aesthetic: