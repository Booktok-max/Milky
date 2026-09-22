# Atomic Shelf Website Relaunch — Master PRD

**Status:** Ready for implementation  
**Version:** 1.0  
**Date:** 2026-09-22  
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

The website should educate enough to make the purchase feel informed, but it should remain a sales system. Every major page must answer a practical buyer question and lead naturally to the next decision.

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

There must be **one source of truth** for:

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

**Resolved:** Money-back applies only where delivery was demonstrably zero — zero/near-zero impressions despite content posted as agreed, zero/near-zero click-throughs despite measurable impressions, or zero measurable results across the agreed scope. Refund is scoped to the specific undelivered line items, not the full plan price. Outside that trigger, underperformance relative to the estimated ranges is treated as time-based: Atomic Shelf keeps working, diagnoses, and adjusts — it does not refund for results that are simply slower than the estimate. This is encoded in `commercial-truth.json` → `guarantee`, and it supersedes both the live site's "little to no measurable movement... we'll review the account" copy and the Milky repo's flat "refund you if we dropped the ball" copy — both should be rewritten to match this definition before launch.

The exact remedy must be defined before launch.

Possible remedies include:

- corrective work
- replacement deliverables
- additional service time
- campaign correction
- service extension
- other clearly defined remedies

Do not publish vague legal promises without defining the actual commercial terms.

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

## Days 1–30 — Build the machine

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

The exact current prices must come from the single pricing data source.

### Explain the discount

> Longer commitments are prepaid savings — not a cancellation trap. The reason we offer the discount is simple: the system has more time to compound, and predictable planning lets us give you better economics.

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

### Shelf

> Build a consistent reader-facing presence.

### Foundation

> Build the infrastructure underneath the traffic.

### Momentum

> Turn attention into a coordinated growth engine.

These descriptions should be revised if the final commercial plans use different names.

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

Create a persistent CTA:

> Start here

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

> We don't just market books. We build reader relationships.

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

**Editorial + cinematic + technological**

Use:

- strong typography
- book covers
- dark editorial backgrounds where appropriate
- restrained accent colour
- large numerical proof
- subtle motion
- cinematic imagery
- generous whitespace
- premium publishing feel

Avoid:

- generic SaaS gradients
- generic AI imagery
- excessive neon
- stock-photo corporate teams
- meaningless dashboards
- excessive animations
- visual clutter

The site should feel like:

> **A premium publishing growth company.**

Not:

> **A generic digital marketing agency.**

---

# 31. Content Rules

## Rule 1 — One claim, one source

Every important numerical claim must have:

- source
- definition
- period
- verification date

## Rule 2 — No stale pricing

Pricing must come from the central plan data.

## Rule 3 — No unsupported guarantees

Every guarantee must correspond to actual operational and commercial commitments.

## Rule 4 — Do not confuse activity with outcome

Views, posts, clicks, and impressions are not automatically sales.

## Rule 5 — Explain benefits before mechanics

Visitors need to understand why something matters before being given technical details.

## Rule 6 — Protect proprietary methodology

Explain enough to make the system credible.

Do not publish every internal workflow, targeting rule, sourcing process, or operational trick.

---

# 32. Single Source of Truth

Create a structured data layer for the website.

Suggested objects:

```text
plans
services
proof_metrics
guarantee
reader_products
case_studies
faqs
editorial
navigation
site_settings
```

## Example plan object

```json
{
  "id": "spark",
  "name": "Spark",
  "monthly_price": 0,
  "commitments": {
    "monthly": {},
    "3_month": {
      "discount_percent": 10
    },
    "6_month": {
      "discount_percent": 20
    },
    "12_month": {
      "discount_percent": 25
    }
  },
  "audience": "",
  "positioning": "",
  "outcome": "",
  "services": [],
  "deliverables": [],
  "metrics": [],
  "cta": ""
}
```

The exact prices and deliverables must be inserted from the approved commercial sheet.

---

# 33. Proof-Metric Data Model

Every proof metric should contain:

```json
{
  "value": "3.2×",
  "label": "average sales lift within 90 days",
  "definition": "",
  "period": "",
  "source": "",
  "last_verified": "",
  "approved": true
}
```

This prevents unsupported or outdated claims from silently spreading across pages.

---

# 34. Guarantee Data Model

The guarantee/commitment should be centrally defined.

```json
{
  "name": "Atomic Shelf Commitment",
  "covers": [
    "agreed deliverables",
    "agreed production",
    "agreed campaigns",
    "reporting",
    "communication"
  ],
  "does_not_guarantee": [
    "viral performance",
    "specific sales volume",
    "specific rankings",
    "algorithmic outcomes"
  ],
  "remedy": "",
  "terms_url": ""
}
```

The `remedy` must be completed before publishing.

---

# 35. Content Governance

Before publishing any page, verify:

### Commercial

- [ ] Price is current.
- [ ] Discount is current.
- [ ] Plan features are current.
- [ ] Deliverables are current.

### Claims

- [ ] Number has a source.
- [ ] Number has a definition.
- [ ] Time period is clear.
- [ ] Claim is still valid.

### Guarantee

- [ ] Promise matches operations.
- [ ] Remedy is defined.
- [ ] Terms are available.

### Conversion

- [ ] Primary CTA exists.
- [ ] CTA destination works.
- [ ] Visitor knows what happens next.

---

# 36. Technical Architecture

The front-end should be built so that content changes do not require structural redesign.

Recommended separation:

### Content

Plans, services, results, FAQs, editorial, reader products.

### Presentation

Typography, spacing, cards, sections, navigation, animations.

### Business logic

Pricing calculations, commitment discounts, CTA routing.

### Analytics

Events and conversion tracking.

This separation is essential to the **no-more-rewrite** principle.

---

# 37. Analytics

Track at minimum:

### Navigation

- homepage viewed
- pricing viewed
- services viewed
- how-it-works viewed
- results viewed

### Conversion

- start-here clicked
- pricing CTA clicked
- plan CTA clicked
- contact CTA clicked
- checkout started
- checkout completed

### Engagement

- pricing selector changed
- FAQ opened
- case study opened
- service opened
- reader product clicked

The purpose is to identify where users stop progressing through the decision path.

---

# 38. SEO

Each important page should have:

- unique title
- unique meta description
- one clear H1
- semantic headings
- descriptive URLs
- internal links
- structured data where appropriate
- image alt text
- canonical URL
- Open Graph metadata

Core topic cluster:

- book marketing
- book marketing for indie authors
- BookTok marketing
- book promotion
- ARC reviews
- Amazon book marketing
- author marketing
- book advertising
- reader list building

SEO should support the brand rather than make the site read like a keyword list.

---

# 39. Accessibility

Required:

- keyboard navigation
- visible focus states
- semantic HTML
- appropriate heading hierarchy
- alt text
- accessible buttons
- sufficient colour contrast
- reduced-motion support
- form labels
- error states
- accessible pricing selector

---

# 40. Performance

Target:

- fast first load
- compressed images
- responsive images
- lazy loading below the fold
- minimal third-party scripts
- minimal blocking JavaScript
- efficient fonts
- no unnecessary video backgrounds

Do not sacrifice page speed for visual effects.

---

# 41. Relaunch Phases

## Phase 1 — Content & Architecture

### Deliverables

- [ ] Final positioning
- [ ] Final navigation
- [ ] Final page list
- [ ] Final plan data
- [ ] Final service list
- [ ] Final guarantee
- [ ] Proof-metric audit
- [ ] Case-study structure
- [ ] CTA vocabulary
- [ ] Content governance rules

### Exit criterion

There is one approved source of truth for the site's commercial and factual content.

---

# Phase 2 — Design System

### Deliverables

- [ ] typography
- [ ] colour system
- [ ] buttons
- [ ] cards
- [ ] pricing cards
- [ ] proof components
- [ ] FAQ components
- [ ] case-study components
- [ ] navigation
- [ ] mobile layouts
- [ ] spacing system
- [ ] motion rules

### Exit criterion

New pages can be assembled from the same visual system.

---

# Phase 3 — Homepage

Build:

- [ ] Hero
- [ ] Proof
- [ ] Problem
- [ ] Five-stage system
- [ ] Services preview
- [ ] Audience selector
- [ ] Results preview
- [ ] 90-day journey
- [ ] Reader ecosystem
- [ ] Pricing preview
- [ ] Commitment
- [ ] FAQ
- [ ] Final CTA

### Exit criterion

A new visitor can understand Atomic Shelf within approximately 60 seconds.

---

# Phase 4 — Commercial Pages

Build/rebuild:

- [ ] Pricing
- [ ] Services
- [ ] How It Works
- [ ] Start Here
- [ ] Contact
- [ ] FAQ

### Exit criterion

A visitor can move from understanding to purchasing without encountering contradictory information.

---

# Phase 5 — Proof & Ecosystem

Build:

- [ ] Results
- [ ] Catalogue
- [ ] Readers
- [ ] ShelfMates
- [ ] StoryPals
- [ ] Editorial

### Exit criterion

The site demonstrates both current capability and long-term reader ecosystem.

---

# Phase 6 — Conversion Engineering

Implement:

- [ ] CTA tracking
- [ ] pricing interaction tracking
- [ ] contact conversion tracking
- [ ] checkout tracking
- [ ] Start Here routing
- [ ] analytics
- [ ] event taxonomy
- [ ] SEO metadata

### Exit criterion

Major conversion actions are measurable.

---

# Phase 7 — QA & Relaunch

## Content QA

- [ ] No contradictory prices.
- [ ] No stale plan names.
- [ ] No unsupported metrics.
- [ ] No conflicting guarantees.
- [ ] No dead links.
- [ ] No placeholder text.

## UX QA

- [ ] Desktop tested.
- [ ] Mobile tested.
- [ ] Navigation tested.
- [ ] Pricing tested.
- [ ] Forms tested.
- [ ] CTAs tested.

## Technical QA

- [ ] Performance checked.
- [ ] Accessibility checked.
- [ ] SEO checked.
- [ ] Analytics checked.
- [ ] 404 page checked.
- [ ] Sitemap checked.
- [ ] robots.txt checked.
- [ ] canonical URLs checked.

---

# 42. Acceptance Test

Before launch, a person who has never seen Atomic Shelf should be able to answer these questions within approximately one minute:

1. What is Atomic Shelf?
2. Who is it for?
3. What does it actually do?
4. Why are the services connected?
5. How much does it cost?
6. Why would I commit for several months?
7. What happens if Atomic Shelf does not deliver?
8. What should I do next?

If any answer requires hunting through the site, the architecture is not finished.

---

# 43. The No-More-Rewrite Rule

After launch, new information should fit into the existing architecture.

### New service

Add it to:

- service database
- relevant system stage
- relevant plan data
- services page
- relevant homepage summary

Do not redesign the homepage.

### New reader product

Add it to:

- Readers
- reader product data
- relevant system stage

Do not restructure the entire site.

### New case study

Add it to:

- Results
- Catalogue if appropriate

Do not create a new page architecture.

### New article

Add it to:

- Editorial

### New plan

Add it to:

- pricing data
- comparison components
- relevant routing

The architecture should absorb growth.

---

# 44. Messaging Hierarchy

The entire website should follow this order:

## Level 1 — Destination

> Build a readership that lasts.

## Level 2 — Promise

> Find readers, turn attention into sales, and build an audience that follows you to the next book.

## Level 3 — System

> Discover → Trust → Convert → Retain → Repeat

## Level 4 — Services

> Video, reviews, listing optimisation, reader lists, advertising, etc.

## Level 5 — Proof

> What happened for real authors?

## Level 6 — Commercial

> Which plan fits?

## Level 7 — Commitment

> What does Atomic Shelf promise?

This hierarchy should remain stable even as individual services change.

---

# 45. Signature Phrases

Potential recurring brand language:

> **Build a readership that lasts.**

> **Find the reader. Earn the click. Make the sale. Bring them back.**

> **One system. Every stage supports the next.**

> **Your book doesn't need more noise. It needs more of the right readers.**

> **We don't just market books. We build reader relationships.**

> **Your commitment is to the partnership. Ours is to the work.**

Use these selectively. They should become recognizable brand language rather than appearing everywhere.

---

# 46. What Not To Do

Do not:

- rebuild the navigation every few months
- create a new homepage whenever a service changes
- use different prices on different pages
- make every service sound like the entire business
- make views synonymous with sales
- hide pricing unnecessarily
- bury the guarantee
- promise arbitrary sales numbers
- over-explain proprietary methodology
- create excessive CTA variations
- overload the hero
- use generic AI/agency visuals
- build features that do not support the buying journey
- add new pages simply because there is new information

---

# 47. Definition of Done

The Atomic Shelf relaunch is complete when:

- [ ] Positioning is approved.
- [ ] Homepage architecture is implemented.
- [ ] Navigation is stable.
- [ ] Pricing has one source of truth.
- [ ] All plan prices match everywhere.
- [ ] Long-term savings are clear.
- [ ] Guarantee language is approved and commercially defined.
- [ ] Five-stage system is implemented.
- [ ] Services are mapped to the system.
- [ ] Results have a consistent structure.
- [ ] Reader ecosystem is integrated.
- [ ] Start Here flow works.
- [ ] CTA vocabulary is standardized.
- [ ] Analytics tracks major conversion actions.
- [ ] SEO foundations are complete.
- [ ] Accessibility has been checked.
- [ ] Mobile layouts have been tested.
- [ ] Performance has been checked.
- [ ] No stale copy remains.
- [ ] No contradictory commercial information remains.
- [ ] A stranger can pass the 60-second acceptance test.

---

# 48. Immediate Implementation Order

Do not begin by polishing individual visual sections.

Start in this order:

### Step 1 — Freeze the commercial truth ✅ Done (2026-09-22)

Create the definitive table containing:

- plan
- monthly price
- 3-month price
- 6-month price
- 12-month price
- savings
- services
- deliverables
- intended audience
- expected outputs
- CTA

**Status:** Complete. `commercial-truth.json` now holds all six live plans (Spark, Enhanced, Foundation, Starter, Momentum, Growth) pulled from atomic-shelf.com, with discounted long-term commitment prices rounded down to the nearest $10 per the approved rounding rule. The 10%/20%/25% commitment schedule now applies to all six plans (Enhanced and Starter included), though the live site currently has no UI exposing this for those two — flagged for Step 6/7 (design/build). `audience`, `positioning`, `outcome`, and `deliverables` are filled with extrapolated ranges (Amazon KDP category-rank and review-count benchmarks scaled to each plan) since no approved commercial sheet was available — every one of these is marked `[extrapolated]` in the JSON and needs a sign-off pass, not a straight publish. Two remaining flags:
- The Milky repo's `pricing.html` (4 plans) vs. the live site (6 plans) plan-count mismatch is resolved by treating the live site as truth.
- Proof metrics (3.2×, 12,000+, 2,400) are captured but unverified — `approved: false` until Step 3.
- Guarantee copy conflict is now resolved — see Section 7 update below.

**This unlocks Step 2 — Freeze the service map**, which is next.

### Step 2 — Freeze the service map ✅ Done (2026-09-22)

Map every service to:

- system stage
- plan
- purpose
- deliverable
- measurable indicator

**Status:** Complete. `service-map.json` maps all 12 services across the six plans to the Discover → Trust → Convert → Retain → Repeat system. `purpose` and `measurable_indicator` are `[extrapolated]` from the metrics already in `commercial-truth.json` and the homepage's stated system logic — same sign-off caveat as Step 1's audience/positioning fields. One thing worth deciding before Step 3: **Spark, Enhanced, and Starter only populate the Discover stage** — they have no Trust/Convert/Retain/Repeat services at all, so on the site they should read as entry/content-only tiers rather than "the system," or the plan lineup needs services added to those tiers.

**This unlocks Step 3 — Freeze the proof**, which is next.

### Step 3 — Freeze the proof 🟡 Audit compiled, verification pending (2026-09-22)

Audit every number currently appearing on the website.

Mark each:

- verified
- needs verification
- remove
- replace

**Status:** Audit compiled in `proof-audit.json`, but not "done" the way Steps 1-2 are — verification requires actual client data I don't have access to, so every figure is classified `needs_verification` rather than `verified`. Two things need your decision before this can close out:
1. **Priority conflict:** the live site's pricing disclaimer ("illustrative campaign benchmarks, not guarantees") and the Milky repo's disclaimer ("90-day averages based on 200+ clients over 24 months") make fundamentally different evidentiary claims. Which one is true decides how every per-plan range should be labeled.
2. **Suspicious figure:** the homepage's "2,400 average downloads per newsletter feature" is exactly the Momentum range's upper bound / Growth range's lower bound — looks copy-pasted from a plan boundary rather than a real average. Flagged as `replace`.

**This is the blocker before Step 4 can fully close** (the guarantee's `does_not_guarantee` language depends on which claims survive this audit) — but Step 4's core commercial terms are already defined from your last message, so I've gone ahead and marked that below too.

### Step 4 — Finalize the guarantee ✅ Substantially done (2026-09-22)

Agree internally on exactly:

- what is promised
- what is not promised
- what happens when Atomic Shelf fails to deliver
- how corrective work is provided
- what the customer must do
- what the formal terms say

**Status:** Done. `atomic-shelf-commitment-terms.md` is the formal terms draft — covers what's promised, the refund trigger conditions, refund scope, what's not guaranteed, the underperformance/time-based process, and the customer's obligation (notify within 21 days of the end of the applicable campaign cycle to claim a refund). `commercial-truth.json` → `guarantee` now links to it via `terms_url` and carries the 21-day requirement in `customer_must`. Flagged as needing a legal review pass before publishing — this is commercial logic in plain language, not lawyer-checked copy. One open question left in the terms file itself: whether Surge/Orbit custom engagements use this same policy or their own.

**Also resolved:** the pricing-disclaimer conflict from Step 3 — keeping the Milky repo's "90-day averages based on 200+ clients over 24 months" framing over the live site's weaker "illustrative benchmarks" version. `commercial-truth.json` → `results_disclaimer` and `proof-audit.json` are both updated. The underlying 200+/24-month figure itself still needs verification against real records before publishing — choosing the stronger claim doesn't make it true yet.

**Next up is Step 5 — Build the data model**, which assembles `commercial-truth.json`, `service-map.json`, `proof-audit.json`, and `atomic-shelf-commitment-terms.md` plus FAQs, results, and reader products into one structured layer.

### Step 5 — Build the data model ✅ Done (2026-09-22)

Put plans, services, proof, FAQs, results, and reader products into structured data.

**Status:** `site-data-model.json` assembles everything — it references `commercial-truth.json`, `service-map.json`, `proof-audit.json`, and `atomic-shelf-commitment-terms.md` for the frozen objects (plans, services, proof_metrics, guarantee) rather than duplicating them, per Section 2's single-source-of-truth rule, and adds the remaining PRD Section 32 objects: `reader_products` (ShelfMates/StoryPals), `case_studies` (schema only — no real entries), `faqs` (drafted against frozen data, several marked `gap` where no policy exists yet), `editorial` (topic backlog, no articles), `navigation` (structural, from Section 22), and `site_settings` (CTA vocabulary, brand basics).

**Real gaps surfaced, not just extrapolation flags** — these need actual decisions/content, not more inference:
- Zero case studies exist. This blocks Step 9 (Results/Catalogue pages) until real client data is sourced.
- Plan-change policy, what-happens-after-commitment-ends, on-camera requirement, what the author must provide, campaign-management team structure, and supported-genre list are all undefined — FAQ entries for these are marked `gap` rather than guessed at.

**This unlocks Step 6 — Build the design system**, which is next (only after the content model is stable, which it now is modulo the gaps above).

### Step 6 — Build the design system

Only after the content model is stable.

### Step 7 — Build the homepage

Use the approved architecture in this document.

### Step 8 — Build the commercial pages

Pricing → Services → How It Works → Start Here → FAQ → Contact.

### Step 9 — Build proof/ecosystem pages

Results → Catalogue → Readers → ShelfMates → StoryPals → Editorial.

### Step 10 — QA and launch

Run the acceptance checklist before publishing.

---

# 49. Final Product Principle

Atomic Shelf should not feel like a website that happens to sell marketing services.

It should feel like a **system for building an author's readership**.

The visitor should leave understanding:

> **There is a reader I have not reached yet.**

> **There is a system for reaching that reader.**

> **Atomic Shelf can operate that system with me.**

> **The longer we work together, the more the system can compound.**

That is the central idea the entire website should reinforce.

---

# 50. UI & Graphic Design System

This section defines the visual design language for the Atomic Shelf website. It is the specification that governs Phase 2 (Design System) and informs every page built in Phases 3–5.

The design must be resolved before build begins. Developers should be able to derive every visual decision from this section and the token reference in 50.10 without needing to improvise.

---

## 50.1 Design Philosophy

The visual language must communicate three things simultaneously:

**Authority.** Atomic Shelf knows the publishing world deeply and operates at a professional level.

**Precision.** The work is measurable, deliberate, and accountable. The site should feel like it was made by people who think in systems.

**Human.** Books are made by people, for people. The site should feel warm within the editorial frame — not cold, not corporate, not clinical.

The aesthetic brief from Section 30 — **editorial + cinematic + technological** — translates into design decisions as follows:

| Quality | What it means in practice |
|---|---|
| Editorial | Strong serif typography, generous whitespace, measured restraint. The site should feel like it could live in the same visual world as a literary journal or a premium publisher's catalogue. |
| Cinematic | Dark surfaces, deep contrast, book covers as primary visual objects. The composition of every section should feel considered — not templated. |
| Technological | Clean sans-serif for body and UI, precision in spacing and grid, tabular figures for data. Nothing decorative that doesn't serve a purpose. |

**What the site should feel like:** A premium publishing growth company that treats authors as serious creative professionals.

**What the site must not feel like:** A SaaS dashboard. A generic digital marketing agency. A BookTok-only social media shop.

---

## 50.2 Colour System

### Philosophy

The site operates in a **dark editorial base** for atmospheric, high-conviction sections (hero, system stages, guarantee), and shifts to a **warm light surface** for content-heavy sections that require extended reading (pricing, services, FAQs). The contrast between these modes creates visual rhythm and helps readers understand where they are in the page.

The accent colour is restrained and used with intention — it is not a decoration; it is a signal.

---

### Primary palette

**Dark Background** — used in: hero, five-stage system, guarantee, select alternating sections
```
#0F0E0C  — base dark (warm near-black, not pure black)
#1A1916  — lifted surface within dark sections (cards, proof panels)
#262420  — border / separator on dark
```

**Light Background** — used in: pricing, FAQ, services detail, contact
```
#F8F6F2  — base light (warm off-white, not pure white)
#EEEAE3  — mid-surface within light sections (cards, sidebars)
#E0DBD3  — border / separator on light
```

**Accent — Primary**
A warm amber-gold. Premium, publishing-adjacent, warm but not garish.
```
#C8922A  — accent base (primary CTAs, proof highlights, active states, system stage accents)
#DFA83E  — accent hover / lifted state
#A67820  — accent pressed / darker state
```
Use the accent sparingly. It should feel significant every time it appears.

**Accent — Secondary (supporting UI only)**
A muted slate, used only if the primary accent is insufficient for a specific UI need.
```
#5E7A8A  — secondary accent (used only for tag borders, secondary indicators, not for CTAs)
```

**Text — Dark mode surfaces**
```
#F2EFE9  — primary text (headlines, body on dark)
#9A9490  — secondary text (supporting copy, labels, captions on dark)
#605C58  — placeholder / disabled text on dark
```

**Text — Light mode surfaces**
```
#1C1A18  — primary text on light
#6B6560  — secondary text on light
#B0AAA4  — placeholder / disabled on light
```

**System colours (functional use only)**
```
#3A7D52  — success (confirmation states only)
#C0442A  — error (form errors only)
```
Do not use system colours for decoration.

---

### Colour principles

- The hero is always dark.
- Pricing and FAQs are always light.
- Do not alternate light/dark arbitrarily — each section's mode must have a purposeful reason.
- All text must meet WCAG AA contrast ratios on their respective backgrounds (Section 39 requirement).
- The accent colour must meet AA contrast against both the dark and light backgrounds it appears on; verify at implementation.
- Do not introduce additional colours outside this palette without a documented reason.

---

## 50.3 Typography

### Typeface selection

Two typefaces only. No exceptions unless documented in writing.

**Display / Serif — for: headlines, section headings, pull quotes, plan names**

A typeface with strong editorial presence. High contrast between thick and thin strokes. Should feel at home on the cover of a literary publication.

Primary candidates (evaluate for licensing and web performance):
- DM Serif Display — accessible, clean, strong editorial feel
- Playfair Display — high contrast, clearly literary
- Libre Baskerville (bold weights) — open source, dependable editorial

Selection criteria: Load time under 40kb for the subset needed. Strong weight range. Good rendering at large display sizes. Do not select based on novelty.

**Body / Sans-serif — for: body text, UI labels, navigation, pricing detail, buttons, captions**

A modern geometric or humanist sans. Clean, highly legible at all sizes, comfortable at 16px body.

Primary candidates:
- Inter — well-tested, excellent legibility, available free
- DM Sans — pairs naturally with DM Serif Display
- Satoshi — slightly more distinctive; test for availability and licensing

Both typefaces should feel like a considered pairing, not a contrast exercise.

---

### Type scale

| Token | Desktop | Mobile | Usage |
|---|---|---|---|
| Display XL | 72–88px | 40–48px | Hero headline only |
| Display L | 52–64px | 32–40px | Major section headlines (H2) |
| Display M | 36–44px | 26–32px | Subsection headlines (H3) |
| Heading | 22–28px | 20–24px | Card titles, named blocks (H4) |
| Body L | 18–20px | 17–18px | Hero body, key intro paragraphs |
| Body | 16–17px | 16px | Standard body text |
| Body S | 14–15px | 14px | Supporting copy, card descriptions |
| Label | 11–13px | 11–12px | Eyebrows, tags, navigation items, captions |
| Mono | 14–16px | 14px | Proof numbers, prices, data values |

**Line height:**
- Display sizes: 1.05–1.15
- Headings: 1.2–1.3
- Body: 1.6–1.7
- Label: 1.4

**Max line length:**
- Body text: 60–68 characters
- Display text: 30–44 characters (break across lines with intention)

---

### Typographic principles

**Headlines are set at weight, not overstyled.** Strong serif at normal tracking reads more premium than excessive letter-spacing. Avoid artificially wide or tight tracking on display text.

**Eyebrows / Labels** (e.g. "For independent authors", "01 — Discover", "Growth plan") are set in the sans-serif at Label size, all-caps or small-caps, with 0.08–0.12em letter spacing. They precede headlines and orient the reader.

**Pull quotes** (guarantee section, problem section) use the display serif at a reduced weight — italic if the typeface supports it. They should be visually distinct from body copy without being oversized.

**Proof metrics / Prices** use the tabular-figures variant of the sans-serif at Display L or Display XL. The number is the visual hero of those panels. Keep surrounding text minimal.

**Do not mix more than these two typefaces.** The visual richness should come from scale, weight, and colour — not typeface variety.

---

## 50.4 Spacing & Grid

### Grid

**Desktop (1280px max content width)**
- 12-column grid
- 80px outer margin
- 24px column gutter

**Tablet (768–1024px)**
- 8-column grid
- 40px outer margin
- 20px column gutter

**Mobile (320–767px)**
- 4-column grid
- 16–20px outer margin (16px minimum at 320px)
- 16px column gutter

### Section spacing

| Token | Desktop | Tablet | Mobile | Usage |
|---|---|---|---|---|
| section-xl | 160px | 120px | 80px | Between major page sections |
| section-l | 120px | 80px | 60px | Between named subsections |
| section-m | 80px | 60px | 40px | Between content blocks |
| component | 40px | 32px | 24px | Between cards, list items |
| inner | 24–32px | 20–24px | 16–20px | Inside cards, panels |

### Spatial principles

- Every section boundary is defined by space, not a visible horizontal rule.
- Cards have consistent internal padding: 28–32px on desktop, 20–24px on mobile.
- Do not add content to fill whitespace. Whitespace is an active design element.
- Text blocks within sections should not span full grid width — use 8 of 12 columns for body text on desktop, centred.

---

## 50.5 Component Specifications

### Navigation

**Desktop**
- Position: fixed to top. Transparent over the hero; gains a dark background with backdrop blur after scroll (~80px).
- Height: 64–72px.
- Logo: left-aligned. Keep it compact — the brand name/logotype, not a complex mark.
- Primary nav links: center or right-aligned, Body or Label weight, spaced clearly.
- "Start Here" is always a distinct button — use the primary accent or an outlined button.
- Maximum 6 primary nav items. Do not add dropdowns unless unavoidable.

**Mobile**
- Hamburger icon, right-aligned.
- Tap target: 48px minimum.
- Drawer slides in from right or expands full-screen.
- All primary navigation links visible without scrolling inside the drawer.
- "Start Here" button is visually prominent at the top or bottom of the drawer.
- Active page indicator: accent underline or accent-coloured label.

---

### Hero

- Height: 90–100vh on desktop. The headline and CTAs should be above the fold.
- Background: dark (#0F0E0C). No video. No animated background.
- Eyebrow label sits above the headline: "For independent authors" in Label, sans-serif, all-caps, accent-coloured or muted white.
- Headline ("Build a readership that lasts.") in Display XL, serif. Left-aligned on desktop, left-aligned on mobile. Do not centre the hero text.
- Body copy below: Body L, sans-serif, maximum 55 characters per line.
- CTAs in a horizontal row on desktop, stacked on mobile: primary button (accent), secondary button (outlined), optional ghost link ("Talk to us").
- Right side of the hero (desktop, wide viewports): a composed arrangement of real book covers — 3–5 covers at varying scales and slight angles, no heavy effects. This makes books the visual centrepiece immediately.
- Hero fades or transitions into the proof strip below; a hard line between them is acceptable if dark-to-dark.

**What the hero does not do:**
- Explain the methodology
- List services
- Include a form
- Use stock photography of people
- Use abstract decorative shapes as the primary visual

---

### Proof Strip

- Immediately below the hero.
- Dark background (continuous with hero, or with a very subtle 1px separator).
- 3–4 metrics displayed in a horizontal row (desktop), 2-column grid (mobile).
- Each metric: large number in tabular mono at Display M, definition text below in Body S sans-serif.
- Thin vertical separator (1px, low opacity) between metrics on desktop.
- No icons. No decorative elements. The numbers are the visual.
- The full definition, period, and source for each metric live in the data model (Section 33); the website shows only the number and its label.

---

### Five-Stage System

The most conceptually important visual on the site. It must communicate a connected sequence, not a list.

**Desktop layout:**
- Five panels arranged horizontally across the full width.
- Each panel: stage number (Label, eyebrow style), stage name (Heading, serif), one-line definition (Body S, sans).
- A thin connecting line or a directional arrow between stages communicates sequence.
- On hover, the active stage lifts slightly and the stage name gains accent colour.

**Mobile layout:**
- Vertical stack with clear sequence indicators (01, 02, 03…).
- A thin vertical line connecting them visually suggests progression.
- Full-width panels with consistent padding.

**Design constraints:**
- No icons within the stage cards.
- Stage numbers carry the visual identity — they should be legible and typographically confident.
- The connecting element between stages must not compete with the content.

---

### Service Cards

- Grid: 2 columns on desktop, 1 column on mobile.
- Each card: surface background (slightly lifted from page), consistent 28px padding.
- Content: service name (Heading, serif), one-line description (Body S), system stage tag (Label, accent-outlined), plan availability (small neutral tag).
- On hover: card lifts 2–3px (box-shadow transition, 150ms ease-out). No colour change. No scale.
- The list of services in each card should remain short — it is an introduction, not a specification.

---

### Pricing Cards

**Commitment selector (above cards)**
- Tab-style selector or segmented toggle: Monthly / 3 months / 6 months / 12 months.
- Active selection uses the accent colour as the active indicator.
- Switching updates prices with a fast cross-fade (150ms) — the number changes, not the card.

**Each pricing card**
- Plan name in Heading (serif).
- One-line positioning below in Body S, sans, muted.
- Price: large, tabular mono at Display M. The number is the focal point.
- If not monthly: savings badge directly below the price — small, accent-coloured label ("Save 20%").
- Divider line.
- Primary outcome (1 line, Body, sans).
- Key included services (3–5 lines, Body S, sans, checkmarks in accent).
- CTA button: full width of card, primary style.
- Recommended plan (if designated): accent-coloured border or a slightly elevated z-position. Do not distort the card size — visual elevation only.

**Comparison state:**
- The full feature comparison below the cards (or expanded within them on the Pricing page) uses a clean table: plan columns, feature rows, checkmarks (accent) and dashes (muted). No colour-fill table cells.

---

### Audience Selector ("Where are you right now?")

- Horizontal scrolling row on mobile, 3-column grid on desktop.
- Each card: a short question as the headline (Heading or Body L), one-sentence context (Body S), subtle right-facing chevron.
- Cards are interactive navigation elements — they should feel tappable, not decorative.
- Hover/tap: lift effect (2px), border accent highlight.
- Do not use icons to illustrate each card — the text carries the meaning.

---

### Case Study Cards

- 2-column grid on desktop (book cover left, content right), single column on mobile.
- Book cover: full colour, no filter, displayed at a natural scale (roughly 100–120px wide on cards).
- Content side: author name + book title (Body, semi-bold), genre tag (Label, subtle), primary metric (Display M, tabular mono, accent-coloured), 2-sentence description of work done (Body S), author quote in italic serif (Body S) if available.
- "Read the full results" link or expand below.
- On the Results page: cards can expand in-place to reveal the full case study structure (Section 15), or lead to a dedicated URL.

---

### CTA Buttons

Three styles, used consistently across the site.

**Primary (filled — accent)**
- Background: accent primary (#C8922A).
- Text: dark (#1C1A18) — confirm contrast ratio.
- Height: 48px minimum.
- Horizontal padding: 24–28px.
- Border radius: 4px. Not pill-shaped.
- Hover: accent hover (#DFA83E). Transition: 120ms ease.
- Focus: 2px accent-coloured outline, 2px offset.
- Never use more than one primary CTA in a single component.

**Secondary (outlined)**
- Background: transparent.
- Border: 1.5px, accent primary.
- Text: accent primary (dark surface) or dark text (light surface).
- Same height and radius as primary.
- Hover: background fills lightly (accent at 10% opacity).

**Ghost / Text link**
- No background, no border.
- Text: primary text colour with a subtle underline on hover.
- Used for tertiary actions: "Learn more", "See all results", "Talk to us" when not a primary action.

**Button copy rules:**
- CTA vocabulary is defined in Section 28. Do not invent new button phrases.
- Button text is sentence case, not title case ("See the plans", not "See The Plans").
- No icons inside buttons unless strictly necessary (and then: text-icon gap of 8px, icon at 16px).

---

### FAQ Accordion

- Clean list, no card borders — separators between items only (1px, low opacity).
- Question: Body (semi-bold), full width, with expand indicator (plus/minus or chevron) right-aligned.
- Expand indicator: accent-coloured when open.
- Answer: Body, revealed with a height transition (250ms ease-in-out). Slight bottom padding before the next separator.
- Open state: question text gains accent colour or stays primary — be consistent.
- Do not animate the indicator beyond rotation or swap (no bouncing, no scaling).

---

### Guarantee / Commitment Block

This section requires visual credibility, not promotional energy.

- Section background: dark (it is a serious, considered statement).
- No badge, no shield icon, no star graphic.
- Opening with the copy from Section 7 — set the body text at Body L.
- The closing line ("Your commitment is to the partnership. Ours is to the work.") is a pull quote: Display M or Display L, serif, centred or left-aligned with generous vertical space above and below it.
- A thin horizontal rule (1px, muted) can separate this pull quote from the body.
- No animations in this section. It should feel still and deliberate.

---

### 90-Day Journey

Three phases presented as a sequential timeline.

**Desktop:** horizontal timeline or three-column layout with numbered nodes connecting the phases.

**Mobile:** vertical stack, numbered headings make the sequence clear.

- Phase number / label: Label, eyebrow style (DAYS 1–30).
- Phase name: Heading, serif.
- Bullet content: Body S, sans.
- Connecting element: a thin line or arrow between phases, not animated.
- Section background can be dark or light — choose based on surrounding sections' rhythm.

---

## 50.6 Imagery & Visual Assets

### Book covers

Book covers are the site's primary visual asset. They carry more authority than any bespoke graphic.

- Display covers large, in full colour, at their native aspect ratio.
- Do not apply filters, tint overlays, or desaturation.
- In dark sections: a subtle drop shadow (0 4px 24px rgba(0,0,0,0.5)) helps covers sit against the background.
- Do not crop covers into circles, hexagons, or abstract shapes.
- On the Catalogue page, covers should be the dominant visual element — the page should feel like a premium bookshelf.
- Covers should always be real client work, not placeholder imagery.

### Editorial photography

Used sparingly, only in sections where a human or atmospheric element adds meaning.

- Dark, warm, cinematic — a reader by lamplight, hands turning a page, a quiet desk.
- Consistent colour grade across all photographs: warm shadows, muted highlights, slightly desaturated.
- No bright lifestyle photography. No stock images of smiling teams or laptops at coffee shops.
- Photography should feel like it belongs to a literary journal, not a corporate brochure.
- All photography must be licensed, original, or provided by the client. No stock watermarked images.

### Diagrams and explanatory graphics

- Use only where a diagram communicates something that prose cannot.
- The five-stage system diagram should be typographic in nature — stage numbers and names, connected by a line — not illustrated.
- Avoid decorative graphic shapes (blobs, gradients, geometric textures) used purely as design elements.
- If a flow or process requires a graphic, it should be clean, minimal, and use only palette colours.

### Video

- Short-form video previews (BookTok content) should appear in a neutral phone frame or a simple rounded-rectangle frame.
- No autoplay of any video, anywhere.
- Thumbnails should be real client content — not stock b-roll.
- Muted captions must be available for any video with spoken content.

---

## 50.7 Iconography

The site uses minimal iconography. Words and numbers carry meaning better than icons in this context.

**Where icons are used:**
- FAQ expand/collapse indicators (simple plus/minus or chevron)
- Form field indicators (error, success states)
- Navigation mobile menu (hamburger / close)
- Optional: social links in footer

**If service or stage icons are used:**
- Consistent stroke weight: 1.5px at 20–24px display size
- Simple, unambiguous geometry — no illustrative icons
- Single colour only (primary text or accent)
- They support the label text; they do not replace it

**What not to use:**
- Generic marketing icons: megaphone, bullseye, lightbulb, magnifying glass, rocket
- Decorative icon sets that carry a different aesthetic tone (too playful, too corporate, too "tech startup")
- Icons as primary visual elements in section headers

Consider using typographic numerals (01, 02, 03) in place of icons wherever sequencing is implied. They integrate naturally with the typeface and avoid the aesthetic inconsistency of icon sets.

---

## 50.8 Motion & Animation

### Principles

Motion should reinforce meaning, not entertain. Every animation must have a clear trigger, a clear purpose, and a clearly better outcome than no animation at all.

Animations should be invisible when the user is focused on content. If someone notices the animation more than the content it reveals, the animation is too prominent.

All animations must respect `prefers-reduced-motion`. When reduced motion is preferred by the user's OS, every transition should become an instant state change — no fades, no movement.

---

### Permitted: On scroll (intersection observer)

**Fade-in on entry:**
- Elements below the fold fade in as they enter the viewport.
- Transform: translateY(12px) → translateY(0) + opacity 0 → 1
- Duration: 350–450ms, ease-out
- Stagger on groups (cards, list items): 60–80ms between items

**Proof number count-up:**
- Proof metrics count from a round lower number to their final value on first viewport entry.
- Duration: 800ms, ease-out
- Only count up once per page load

**Section backgrounds:** do not animate. They are instant.

---

### Permitted: On interaction

**Button hover:**
- Duration: 100–130ms, ease
- Change: background colour shift only (accent → accent hover). No movement.

**Card hover:**
- Transform: translateY(-2px)
- Box-shadow: lift effect
- Duration: 150ms, ease-out
- No scale. No colour change on card background.

**Accordion open/close:**
- Height transition: 240ms, ease-in-out
- Indicator rotation (chevron): 200ms, ease
- No fade — the content simply expands into view

**Navigation background (on scroll):**
- Opacity transition: 200ms as the background fades in after scroll threshold
- No movement of the nav itself

**Pricing commitment selector:**
- Price number cross-fades on toggle: 150ms
- No card movement or reflow animation

---

### Prohibited

The following are explicitly not used:

- Parallax scrolling on background images or book covers
- Infinite looping background animations (floating shapes, pulsing gradients)
- Scroll-triggered text scramble or typewriter reveal effects
- Hero video backgrounds
- Hover effects that cause layout shift (do not expand the card on hover)
- Page transition animations (instant transitions only, unless a SPA with a simple 150ms fade)
- Loading spinners visible for standard page loads

---

## 50.9 Dark and Light Section Usage

A clear rule for when to use each mode:

| Section | Background mode | Reason |
|---|---|---|
| Hero | Dark | Cinematic, high-impact opening |
| Proof strip | Dark (continuous with hero) | Immediate, no interruption to the proof |
| Problem | Dark or light (transitional) | Creates contrast before the system section |
| Five-stage system | Dark | Atmospheric, gives stages visual weight |
| Services | Light | Extended reading; multiple pieces of content |
| Audience selector | Light | Functional, decision-oriented |
| Results | Light | Case study content needs strong readability |
| 90-day journey | Dark or light (alternate for rhythm) | Flexible; use to break up extended light sections |
| Reader ecosystem | Dark | Positions ShelfMates/StoryPals as premium |
| Pricing | Light | Trust; users scrutinise pricing, needs full clarity |
| Guarantee | Dark | Sober, serious, deliberate |
| FAQ | Light | Extended reading |
| Final CTA | Dark | High conviction close |
| Footer | Dark | Consistent with editorial tone |

When two dark sections are adjacent, use a subtle separator (thin line, 10% opacity) or a slight surface shift to distinguish them without a jarring mode switch.

---

## 50.10 Design Token Reference

The following tokens must be defined in the design system (CSS custom properties or equivalent) before any front-end build begins. Hardcoded values in component code are not permitted.

```
/* Colour */
--color-bg-dark
--color-bg-light
--color-surface-dark
--color-surface-light
--color-surface-mid
--color-accent-primary
--color-accent-primary-hover
--color-accent-primary-pressed
--color-accent-secondary
--color-text-primary-dark
--color-text-secondary-dark
--color-text-primary-light
--color-text-secondary-light
--color-border-dark
--color-border-light
--color-success
--color-error

/* Typography */
--font-family-display
--font-family-body
--font-family-mono
--font-size-display-xl
--font-size-display-l
--font-size-display-m
--font-size-heading
--font-size-body-l
--font-size-body
--font-size-body-s
--font-size-label
--font-size-mono
--font-weight-display
--font-weight-heading
--font-weight-body-regular
--font-weight-body-medium
--line-height-display
--line-height-body
--letter-spacing-label

/* Spacing */
--space-section-xl
--space-section-l
--space-section-m
--space-component
--space-inner
--space-xs
--space-s
--space-m
--space-l
--space-xl

/* Grid */
--grid-max-width
--grid-columns-desktop
--grid-columns-tablet
--grid-columns-mobile
--grid-gutter-desktop
--grid-gutter-tablet
--grid-gutter-mobile
--grid-margin-desktop
--grid-margin-tablet
--grid-margin-mobile

/* Border */
--border-radius-button
--border-radius-card
--border-radius-badge
--border-width-default
--border-width-accent

/* Motion */
--motion-duration-fast        /* 120ms */
--motion-duration-standard    /* 240ms */
--motion-duration-slow        /* 450ms */
--motion-easing-standard      /* ease */
--motion-easing-decelerate    /* ease-out */
--motion-easing-accelerate    /* ease-in */

/* Z-index */
--z-navigation
--z-modal
--z-overlay
--z-dropdown
```

All tokens are resolved into CSS custom properties on `:root`. Dark-mode overrides are applied via a `[data-theme="dark"]` attribute on `<html>` (or the relevant section container), not via a separate stylesheet.

---

## 50.11 Design System Checklist (Phase 2 Exit Criterion)

Before any page build begins, the following must be complete and approved:

### Foundations
- [ ] Colour tokens defined and documented
- [ ] Both typefaces selected, licensed, and tested for web performance
- [ ] Type scale implemented and tested at all breakpoints
- [ ] Spacing scale implemented
- [ ] Grid system implemented and tested at 320px, 375px, 768px, 1280px
- [ ] Motion tokens defined; reduced-motion behaviour confirmed

### Components
- [ ] Navigation (desktop + mobile + scroll behaviour)
- [ ] Buttons (primary, secondary, ghost) — all states
- [ ] Hero section
- [ ] Proof strip
- [ ] Stage card
- [ ] Service card
- [ ] Pricing card + commitment selector
- [ ] Audience selector card
- [ ] Case study card
- [ ] CTA section (standalone)
- [ ] FAQ accordion
- [ ] Guarantee/commitment block
- [ ] 90-day journey timeline
- [ ] Footer

### Visual review
- [ ] Dark and light sections tested side-by-side for contrast and rhythm
- [ ] Book cover presentation tested (with real covers, not placeholders)
- [ ] All components reviewed at mobile (375px) before desktop review
- [ ] Contrast ratios verified for all text/background combinations (WCAG AA)
- [ ] Reduced-motion mode tested in all animated components

### Handoff
- [ ] All tokens exported to development environment
- [ ] Component states documented (default, hover, focus, active, disabled)
- [ ] Typography specimens provided
- [ ] Spacing and grid documented
- [ ] Motion specifications documented with duration and easing values

