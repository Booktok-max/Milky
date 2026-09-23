# Atomic Shelf Website Relaunch — Master PRD

**Status:** Implementation underway — commercial baseline, pricing/content pass, provenance cleanup, reader discovery foundation, and communications architecture defined; payment, contact, newsletter, outreach integrations and release gates remain
**Version:** 1.5
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

### Implementation status — 2026-09-23

The following work is now reflected in the repository and should be treated as the current implementation baseline:

- `pricing-data.json` is the browser-facing pricing dataset used by the homepage preview and full pricing page.
- The public pricing model currently contains six standard plans: Spark, Enhanced, Foundation, Starter, Momentum, and Growth, plus custom Surge/Orbit engagements.
- Pricing records now carry monthly pricing, commitment totals/discounts, plan positioning, audience, services, deliverables, CTAs, and plan-specific performance ranges.
- Momentum commitment structures and forecast ranges have been expanded by term, and pricing copy has been aligned with those records.
- The public Pricing page has been refined around commitment selection, plan comparison, expected activity/results, commitment language, FAQ, and CTA flow.
- Homepage, Pricing, Results, Services, How It Works, FAQ, and Checkout copy has been iterated to align terminology and avoid vague/internal wording.
- Results copy now distinguishes activity, audience response, and business indicators rather than treating views or impressions as sales.
- The free-book/promotion flow now invites authors to provide their promotion dates where applicable.
- The public site continues to use a responsive pricing grid and mobile-first layout; final visual QA remains a release gate.
- The deployment workflow builds a public-only payload and excludes identified client-work and internal-tool directories.
- The tracked Brevo environment file has been removed from version control and environment files are ignored going forward.

Remaining release gates:

- Rotate the previously exposed Brevo credential.
- Inventory and explicitly remove any private files already present on the public host; deployment cleanup remains deliberately disabled.
- Complete the planned manual/legal review of the commitment terms.
- Complete proof-metric records, case studies, analytics, checkout, SEO/accessibility/performance, and cross-device QA.
- Complete the daily reader newsletter workstream described below, including delivery-provider integration and operational controls.

The website should educate enough to make the purchase feel informed, but it should remain a sales system. Every major page must answer a practical buyer question and lead naturally to the next decision.

### Daily reader newsletter workstream — 2026-09-23

The Readers page should become the source for a daily email shelf containing the books currently surfaced in reader discovery. The newsletter should make the daily selection useful rather than sending a generic promotion.

**Implemented foundation:**

- The Readers page has a validated email subscription form.
- `/api/newsletter/subscribe` accepts and stores a normalized subscriber address outside the public asset boundary.
- `/api/newsletter/daily` generates a dated shelf from covered Open Library titles and returns each book's title, author, cover, and catalogue link.
- The daily shelf has a generated subject line and a server-side daily cache to avoid rebuilding the same shelf on every request.
- `/api/newsletter/preview` provides a protected editorial preview with responsive HTML and plain-text versions before delivery is enabled.

**Pending work:**

- Replace the temporary local subscriber store with a production email provider and rotate any previously exposed provider credentials.
- Add consent language, unsubscribe handling, suppression/bounce handling, and a clear privacy/data-retention policy.
- Make the newsletter selection use the same daily seed and discovery rules as the Readers page, including genre context and the Other languages shelf where appropriate.
- Build a responsive HTML email template with accessible text alternatives, tracked book links, source attribution, and a plain-text version.
- Add a scheduled daily send job with idempotency, retry limits, rate limits, and delivery monitoring.
- Add tests for duplicate subscriptions, invalid addresses, provider failures, empty shelves, coverless records, and repeated requests on the same day.
- Define newsletter analytics separately from site analytics: sends, deliveries, opens, clicks, unsubscribes, bounces, and book-level click-through.
- Document the final provider setup, sender identity, time zone, data retention, and legal approval before enabling automatic sends.

### TikTok BookTok discovery workstream — 2026-09-23

The Readers page now includes a **Trending on TikTok** lane backed by a server-side TikTok Research API integration.

**Implemented foundation:**

- `/api/readers/tiktok` obtains and caches a TikTok client access token without exposing credentials to the browser.
- The endpoint queries public videos matching BookTok-related hashtags over the previous 30 days, optionally restricted by `TIKTOK_REGION_CODE`.
- Results are cached in memory for 15 minutes, paginated across at most two API pages, normalized, deduplicated by TikTok video ID, and ranked using recency plus views, likes, comments, and shares.
- Readers displays source attribution, engagement metrics, a last-updated timestamp, and direct TikTok links.
- Missing credentials or an empty result set produces a clear fallback state and does not interrupt Open Library discovery.

**Required environment variables:**

- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- Optional: `TIKTOK_REGION_CODE` as a comma-separated list such as `US,GB`

TikTok Research API approval is required before live results can appear. The UI must describe these as public Research API matches for the selected query and date window, not as a universal or editorially verified “best of BookTok” ranking. Client credentials must remain server-side.

### Reader catalogue resilience workstream — 2026-09-23

Readers currently depends on Open Library for live catalogue discovery, search, language shelves, public lists, and representative covers. Open Library is a valuable public-good source, but its documentation asks client applications to identify themselves, cache responses, keep request volume low, and avoid treating the service as high-traffic commercial infrastructure. A provider outage or rate limit must not leave the forward-facing Readers page empty.

**Current integration status:**

- Open Library is the only live catalogue provider currently integrated.
- Readers uses the server-side `/api/readers/open-library` proxy for search and list requests, with an allowlist, request timeout, identifying User-Agent, and cache headers.
- The page retains a small static fallback shelf for the main book grid when live catalogue requests fail.
- Google Books is not currently enabled. Existing Google Books destinations are ordinary external search links, not API results.
- The New York Times Books API is not currently enabled. No NYT key or client exists in the repository.
- TikTok Research API is a separate discovery signal and is not a replacement for catalogue metadata.

**Provider roles:**

| Provider | Intended role | Status |
|---|---|---|
| Open Library | Primary public catalogue, public lists, lending/free-reading context, covers | Integrated; subject to rate limits and outages |
| Google Books API | Secondary search, ISBN/title lookup, covers, descriptions, publisher and edition metadata | Recommended next integration |
| New York Times Books API | Optional bestseller rankings, list metadata, and bestseller-specific lane | Recommended separate lane, not a general catalogue replacement |
| Library of Congress or similar authority source | Optional metadata enrichment and authority cross-checking | Lower-priority investigation |

**Recommended implementation order:**

1. Add a server-side Google Books client using `GOOGLE_BOOKS_API_KEY`; never expose the key in browser JavaScript or public JSON.
2. Normalize Google Books volumes into the Readers book shape and use Google Books when Open Library fails or returns too few covered records.
3. Track `source` on every normalized book and show clear attribution such as `Open Library` or `Google Books`.
4. Cache provider responses by query, filter, and page, with bounded timeouts, retry limits, and provider-specific rate limits.
5. Add a provider health/fallback test matrix covering successful responses, timeouts, rate limits, malformed records, missing covers, empty results, and complete provider outages.
6. Add an optional server-side NYT Books client using `NYT_BOOKS_API_KEY`, with a separately labeled **NYT Best Sellers** lane and the list/date metadata required to explain what the ranking represents.
7. Keep Open Library as the public-good source for list and free-reading context where available; do not imply that Google Books or NYT provides the same lending or access rights.
8. Document provider attribution, cache duration, API terms, credential ownership, rate limits, and data-retention expectations before enabling production traffic.

**Required future environment variables:**

- `GOOGLE_BOOKS_API_KEY`
- Optional later: `NYT_BOOKS_API_KEY`

**Acceptance criteria:**

- A temporary Open Library outage does not produce an empty main Readers shelf when Google Books is configured.
- Search, genre, publication, language, and list requests either return normalized results or a useful, bounded fallback state.
- Every result identifies its catalogue source where provider data is mixed.
- No provider credential is shipped to the browser.
- The page does not claim that a provider's results are globally complete, live-ranked, or editorially endorsed unless the provider data and wording support that claim.

### Shelfmates' Love save handoff — 2026-09-23

Each Readers book card should offer a warm, visually distinctive **💗 Save to Shelfmates’ Love →** action. The current website implementation provides a stable handoff to `https://storypal.atomic-shelf.com/` so a reader can sign up or sign in, with the selected book's title, author, publication year where available, Open Library catalogue URL, source identifier, and the requested `save_to_shelfmates_love` action.

The Storypal follow-on integration must:

- Send a reader from the handoff into account creation or sign-in before saving.
- Preserve the selected book while the account flow completes.
- Search Storypal's directory for an existing matching work before creating a duplicate.
- Save the matched or newly created work to the reader's **Shelfmates’ Love** shelf.
- Return the reader to the saved work or shelf with a clear success state; show an actionable error if the save cannot be completed.
- Treat title and author as search hints, not a unique identity. Prefer Open Library work/edition identifiers and future first-party identifiers when available.
- Record the originating surface as Readers for product analytics without exposing private account data to the public site.

**Handoff contract:** `action=save_to_shelfmates_love`, `source=atomic_shelf_readers`, `book_title`, `author`, optional `publication_year`, and optional `open_library_url`. Storypal owns account creation, authentication, directory matching, shelf persistence, consent, and duplicate handling. The public Readers page must not create or transmit account credentials.

**Acceptance criteria:**

- Every catalogue and fallback book card exposes the save action.
- The handoff opens Storypal in a new tab and retains the selected book context.
- Storypal can route a new reader through account creation and an existing reader through sign-in without losing the book.
- A matching directory record is reused where possible; duplicate records are not created from repeated handoffs.
- A successful save is visible in Shelfmates’ Love, and failures are explicit and recoverable.
### Reader discovery and navigation updates — 2026-09-23

The Readers experience has received additional implementation changes that must now be treated as part of the current product specification.

**Implemented:**
- Added a dedicated **New releases → timeless classics** navigation item that switches the reader view into publication sorting.
- Publication-year handling now rejects implausible future dates, supports preorder labelling for the following year, and preserves historical labels such as “Before YYYY”.
- Reader search, publication shelves, language shelves, and general discovery now use timeout-protected Open Library requests and tolerate partial lane failures instead of failing the entire page.
- Open Library language queries were corrected to use the catalogue's fre and ger language codes.
- Reader-curated Open Library lists now have stronger URL handling and can display associated book covers where available.
- Added **Trending on TikTok** as a dedicated discovery lane using the server-side Research API integration described above.
- Reader-facing copy was clarified so the page distinguishes discovery features from endorsements and makes the reader journey clearer.
- Editorial copy was revised to clearly distinguish editorial guidance from manuscript editing, review coverage, and listing optimisation.
- Pricing/result CTA language was refined across the relevant sales surfaces, including the transition into the commitment/guarantee explanation.
- Public plan language now reflects the six-plan structure without the former separate Essentials presentation.

**Required reader acceptance criteria:**
- Publication navigation must work without leaving the Readers page.
- Invalid/implausible future publication dates must not appear as ordinary publication years.
- A failed discovery lane must not blank unrelated working lanes.
- TikTok content must retain source attribution, date-window context, and non-endorsement language.
- Reader list covers must remain optional and must never block the list itself from rendering.
- Search and discovery requests must have bounded timeouts.

### Pricing UX additions — 2026-09-23

The current commercial implementation establishes the six standard plans as Spark, Enhanced, Foundation, Starter, Momentum, and Growth, with Surge and Orbit remaining custom engagements.

The pricing UX requirement is now:
- Present the six standard plans in a **2-column × 3-row layout** on the primary desktop pricing surface so each card has adequate text space.
- Keep mobile responsive behavior, but do not revert the primary desktop presentation to a dense three-column card grid.
- Pricing cards must remain driven by pricing-data.json.
- Where a plan or book-cover visual is enlarged, use a compact **hover magnifier/zoom interaction** that behaves like a retail book-cover inspection tool; it should not replace the normal image with an oversized standalone image.
- The magnifier is a release requirement if the relevant image is currently difficult to read.

These are UX requirements and do not change the underlying commercial dataset.
### Work completed since the previous PRD revision — 2026-09-23

The following changes were made after the previous PRD revision and are now part of the implementation history:

1. **Pricing model and presentation**
   - Refined the six-plan commercial structure and current plan records.
   - Expanded Momentum term-specific commitments and forecast ranges.
   - Kept the six standard plans in the browser-facing pricing dataset, with Surge and Orbit represented as custom engagements.
   - Refined pricing-page language, comparison content, commitment explanations, result expectations, and calls to action.
   - The approved desktop pricing direction is now a 2-column × 3-row layout for the six standard plans, with mobile remaining responsive. The underlying pricing data is unchanged.

2. **Public-copy consistency**
   - Refined campaign/reporting language on public pages.
   - Refined FAQ wording and the commitment pull quote.
   - Clarified that results vary by book, audience, offer, timing, and campaign conditions rather than presenting activity metrics as guaranteed sales.
   - Clarified results across books and the relationship between outputs, audience response, and business indicators.

3. **Public/private boundary**
   - Public assets and internal records are separated in the deployment structure.
   - The Neocities workflow continues to deploy only the public `site/` payload while excluding identified internal/client-work directories.
   - Internal planning/provenance annotations remain documentation-only and must not enter browser-visible customer content.

4. **Release implication**
   - The PRD should now be used as the implementation checklist against the current repository, not as a description of an earlier proposed site.
   - Future changes to pricing, commitments, guarantees, or public claims must update both the controlled pricing data and the relevant public copy, followed by a consistency check.

---

### Public provenance cleanup — 2026-09-23

Internal planning and evidence language must never leak into client-facing pages or browser-visible commercial copy.

**Public-copy rule:** client-facing pages must not expose internal provenance, audit, approval, planning, or implementation annotations. This includes terms such as **source of truth**, **single source**, **commercial-truth**, internal **[extrapolated]** evidence labels, **SOURCING NOTE**, **PRD Section**, **sign-off**, **approved by**, and similar working-language markers.

The browser-facing pricing dataset is `pricing-data.json`. It contains presentation-ready plan information; internal approval state, evidence notes, audit commentary, provenance records, and working annotations remain outside customer-facing content.

Implemented on 2026-09-23:
- `pricing.html` and `index.html` use `pricing-data.json`.
- `results.html` no longer describes pricing data using internal provenance language.
- Internal sourcing notes were removed from the public Services and How It Works pages.
- pricing-data.json is the public runtime payload for approved pricing and plan presentation; internal commercial records remain private.

**Acceptance test:** a production/public-content search must return zero matches for the prohibited provenance terms above in client-facing HTML and runtime data.
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
> If the results show that something needs to change, we explain what we are seeing, adjust the plan, and stay involved until the work is back on track.
>
> **We commit to doing the work, learning from the results, and improving it as we go.**

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

Use the current controlled pricing dataset for exact plan and tier details.

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

## 31. Current Implementation Ledger — 2026-09-23

This section records what is implemented now versus what remains before the relaunch can be treated as release-ready.

### Implemented

- [x] Six standard pricing plans are represented in `pricing-data.json`.
- [x] Commitment pricing and discount structures are encoded in the pricing dataset.
- [x] Plan-specific services, deliverables, positioning, audiences, CTAs, and performance ranges are encoded in the pricing dataset.
- [x] Pricing page commitment selector and plan-card rendering are connected to the pricing dataset.
- [x] Homepage pricing preview is connected to the pricing dataset.
- [x] Public Services and How It Works content has been aligned with the current plan/service structure.
- [x] Results-page language has been revised to distinguish activity, response, and business indicators.
- [x] FAQ and Checkout copy have been refined to match the current commercial language.
- [x] Public provenance/source-language cleanup has been applied to the core sales pages.
- [x] Deployment workflow excludes identified internal/client-work directories from the Neocities payload.
- [x] Brevo environment-file exposure was addressed in version control and future environment files are ignored.

### Not yet release-complete

- [ ] Rotate the previously exposed Brevo credential.
- [ ] Inventory and explicitly remove private files that may already exist on the public Neocities host; deployment cleanup remains disabled.
- [ ] Complete manual/legal review of commitment and guarantee terms.
- [ ] Validate every public pricing claim and forecast against a maintained evidence record.
- [ ] Complete structured case studies and proof-metric records.
- [ ] Complete analytics/event tracking and checkout/payment verification.
- [ ] Complete SEO, accessibility, performance, and cross-device QA.
- [ ] Perform a production crawl/search for prohibited internal provenance terminology across all public HTML, browser-loaded JSON, and runtime-generated labels.
- [ ] Reconcile any remaining public pages that have not yet been included in the core sales-page cleanup.
- [ ] Complete Readers regression QA for publication sorting, date filtering, language shelves, curated-list covers, partial API failures, and TikTok fallback/attribution.
- [ ] Verify Editorial, Results, Pricing, and CTA copy remains consistent with the current commercial model after the latest copy refresh.
- [ ] Implement and verify the approved 2-column × 3-row desktop pricing layout for the six standard plans.
- [ ] Implement and verify the required hover magnifier/zoom interaction for the affected book-cover/image surface.
- [ ] Confirm the six-plan public presentation contains no separate legacy Essentials card.

### Change-control rule

When a commercial fact changes, update the controlled pricing dataset first, then update dependent presentation/copy, then run a public consistency and provenance scan. Do not manually maintain conflicting prices, commitments, deliverables, or result ranges in individual pages.

---


---

# 32. Communications, Outreach & Mail Architecture — 2026-09-23

Atomic Shelf shall deliberately separate **mailbox infrastructure**, **customer communications**, and **outbound author outreach**.

No single email provider should be treated as the universal communications system.

## 32.1 Provider responsibilities

| Function | System | Responsibility |
|---|---|---|
| Business mailbox | Existing Private Email | Human inbox for `nick@atomic-shelf.com` and ordinary business correspondence |
| Payments | PesaPal | Checkout, payment initiation, payment status, callbacks/IPN |
| Website contact | Brevo | "Talk to us" submissions, acknowledgements, internal notifications |
| Newsletter | Brevo | Reader newsletter subscriptions and daily newsletter delivery |
| Customer transactional email | Brevo | Payment/customer lifecycle notifications |
| Author prospecting | GMass | Personalized outbound campaigns, mail merge, follow-ups and outreach reporting |
| Outreach lists | Milky + optional Google Sheets | Prospect preparation and campaign operations |
| Application records | Milky backend/database | Canonical contacts, leads, customers, payments, campaigns and communication events |

### Mailbox decision

The existing `nick@atomic-shelf.com` mailbox remains on **Private Email**.

**Spacemail is not part of the Atomic Shelf architecture and must not be introduced as a dependency.**

Mailbox hosting must remain independent from application communications. A future mailbox migration, if ever required, must not require a rewrite of Milky's Brevo, GMass or PesaPal integrations.

## 32.2 Brevo — website and customer communications

Brevo is the application-facing email layer for communications initiated by the Atomic Shelf website or customer lifecycle.

Required functionality:

### Contact form

`POST /api/contact`

Flow:

`Website → Milky API → persist inquiry → Brevo notification/acknowledgement`

Requirements:

- validate name, email and message;
- persist the inquiry before or independently of provider delivery where practical;
- notify the Atomic Shelf team;
- acknowledge the sender;
- prevent obvious duplicate submissions;
- never expose Brevo credentials in browser code.

### Newsletter

`POST /api/newsletter/subscribe`

Flow:

`Readers page → Milky API → normalize/validate → persist/update → Brevo`

Requirements:

- consent capture;
- duplicate-safe subscription;
- unsubscribe support;
- suppression handling;
- bounce handling;
- privacy/data-retention policy;
- provider failure handling;
- no permanent dependence on the current temporary JSON subscriber store.

### Daily reader newsletter

The daily reader newsletter must use the same discovery logic and daily shelf as the Readers page where appropriate.

Required pipeline:

`Reader discovery → daily shelf → responsive email → Brevo send → delivery/events → Milky analytics`

Required data:

- title;
- author;
- cover where available;
- genre/context where available;
- catalogue/book link;
- date;
- source attribution;
- tracked click URL.

Required operational controls:

- daily idempotency;
- retry limits;
- rate limits;
- delivery monitoring;
- unsubscribe/suppression;
- empty-shelf handling;
- provider failure handling;
- plain-text alternative.

## 32.3 GMass — author outreach layer

GMass is a separate outbound prospecting system.

It is not the replacement for the Atomic Shelf business mailbox and is not the default provider for the public website.

Required functionality:

### Campaign preparation

Milky should prepare campaign-ready prospects containing, where applicable:

- first name;
- author name;
- email;
- book title;
- genre;
- campaign;
- personalization fields;
- source;
- internal prospect ID.

### Personalized outreach

GMass should support approved outreach campaigns using personalized fields and controlled message templates.

Campaigns must be associated with a Milky campaign ID.

### Follow-ups

The architecture should support:

- initial outreach;
- scheduled follow-up;
- campaign-specific follow-up;
- reply detection;
- suppression after unsubscribe/rejection;
- campaign completion.

### Reporting

Capture available GMass events such as:

- sent;
- delivered;
- opened;
- clicked;
- replied;
- bounced;
- unsubscribed;
- failed.

These events should be associated with the relevant Milky prospect and campaign.

### Webhooks

Where enabled, GMass webhooks should feed relevant campaign events back into Milky.

Flow:

`GMass → webhook → Milky → contact/campaign/event record`

Webhook handling must be:

- authenticated where supported;
- idempotent;
- retry-safe;
- tolerant of unknown event types;
- isolated from the public website.

### Google Sheets

Google Sheets may be used as an operational source/list for GMass campaigns.

It is **not** the canonical Atomic Shelf database.

Milky should remain capable of generating or exporting campaign-ready lists without making Sheets a permanent system dependency.

## 32.4 Unified contact model

Milky shall maintain its own contact/prospect identity.

Minimum fields:

- `id`
- `firstName`
- `lastName`
- `email`
- `phone` where supplied
- `contactType`
  - `prospect`
  - `lead`
  - `customer`
  - `subscriber`
- `source`
- `status`
- `brevoContactId` where applicable
- `gmassContactReference` where applicable
- `suppressed`
- `createdAt`
- `updatedAt`

Provider identifiers are integration references, not the primary application identity.

## 32.5 Unified campaign model

Minimum fields:

- `id`
- `name`
- `type`
  - `outreach`
  - `newsletter`
  - `transactional`
- `provider`
  - `gmass`
  - `brevo`
- `providerCampaignId`
- `status`
- `createdAt`
- `scheduledAt`
- `completedAt`

## 32.6 Communication event model

Milky should maintain relevant provider events.

Minimum fields:

- `id`
- `contactId`
- `campaignId`
- `provider`
- `providerEventId` where available
- `eventType`
- `eventTimestamp`
- `metadata`
- `createdAt`

Supported event types include, where supplied:

- `sent`
- `delivered`
- `opened`
- `clicked`
- `replied`
- `bounced`
- `unsubscribed`
- `failed`

## 32.7 Suppression and consent

Milky must maintain an application-level suppression state.

A suppressed contact must not be reintroduced into future automated outreach or newsletter campaigns.

Newsletter consent and outreach eligibility must remain distinct concepts.

Public newsletter subscribers must not automatically become GMass outreach prospects.

## 32.8 Provider independence

The application must not hard-code business logic around a particular email provider.

Provider integrations should sit behind server-side service functions/interfaces such as:

- `sendCustomerEmail()`
- `subscribeNewsletter()`
- `sendInternalNotification()`
- `createOutreachCampaign()`
- `processCommunicationEvent()`

This allows a provider to be replaced without rewriting page-level business logic.

---

# 33. Payments & Checkout — Implementation Specification

PesaPal is the payment processor for paid plans.

## 33.1 Current public plan model

The public commercial model contains:

1. Spark
2. Enhanced
3. Foundation
4. Starter
5. Momentum
6. Growth

Surge and Orbit remain custom engagements.

The backend payment configuration must match the current six-plan model. The previous four-plan payment mapping is obsolete and must not remain as the production pricing authority.

## 33.2 Payment flow

`Pricing → Checkout → /api/create-payment → PesaPal → callback/IPN → Milky transaction → customer notification`

The browser may select a plan, but the server must determine the authoritative amount.

Never trust a browser-supplied price.

## 33.3 Checkout requirements

Checkout must:

- load current plan presentation data;
- validate selected plan;
- validate customer name;
- validate email;
- identify commitment/term where applicable;
- request payment creation from the server;
- redirect to PesaPal;
- preserve a merchant reference;
- provide a recoverable pending-payment state;
- provide clear success, failure and cancellation states.

## 33.4 Transaction record

Minimum transaction fields:

- `id`
- `merchantReference`
- `pesapalOrderTrackingId`
- `plan`
- `commitment`
- `customerName`
- `customerEmail`
- `amount`
- `currency`
- `status`
- `createdAt`
- `updatedAt`

Recommended statuses:

- `pending`
- `completed`
- `failed`
- `cancelled`
- `unable_to_confirm`

## 33.5 PesaPal endpoints

The existing implementation foundation includes:

- `POST /api/register-ipn`
- `POST /api/create-payment`
- `GET /api/status?orderTrackingId=...`
- `GET /api/callback`
- `GET /api/cancelled`
- `POST /api/ipn`
- `GET /health`

The final implementation must ensure the IPN/callback updates the transaction state idempotently.

Payment confirmation must be based on PesaPal payment status, not on the browser redirect alone.

## 33.6 Payment/customer communication separation

A payment being completed is a **business event**.

Sending an email is a **communication event**.

The system must record the payment even if Brevo is temporarily unavailable.

Likewise, an email failure must never change a completed payment back to pending.

---

# 34. "Talk to us" Architecture

All public "Talk to us" CTAs should converge on one contact workflow.

Required flow:

`CTA → contact form → /api/contact → validation → persist → Brevo notification/acknowledgement`

Supported entry contexts should include:

- general enquiry;
- custom plan;
- Surge;
- Orbit;
- unsure which plan;
- launch question;
- backlist question;
- service question.

The contact submission should retain the originating context where available.

The user should not be forced to understand the pricing structure before being able to speak to Atomic Shelf.

---

# 35. Integration Security

All provider secrets are server-side only.

Required environment variables include, as applicable:

- `PESAPAL_CONSUMER_KEY`
- `PESAPAL_CONSUMER_SECRET`
- `PESAPAL_NOTIFICATION_ID`
- `BREVO_API_KEY`
- `GMASS_API_KEY`

Requirements:

- no credentials in browser JavaScript;
- no credentials in `pricing-data.json`;
- no credentials committed to Git;
- no credentials in public API responses;
- deployment secrets stored in the hosting environment;
- credentials must be rotatable;
- provider failure messages must not expose secrets or sensitive configuration.

The previously exposed Brevo credential must be rotated before production communications are enabled.

---

# 36. Updated Build Phases

## Phase 1 — Commercial and public-surface alignment

- [x] Six-plan public model established.
- [x] Pricing data connected to public pricing surfaces.
- [x] Public provenance cleanup applied to core sales surfaces.
- [ ] Verify every public page against current pricing data.
- [ ] Complete 2-column × 3-row desktop pricing layout.
- [ ] Complete hover magnifier/zoom interaction.
- [ ] Remove/verify absence of legacy Essentials presentation.

## Phase 2 — PesaPal production checkout

- [ ] Reconcile backend plan mapping with all six current plans.
- [ ] Implement authoritative server-side pricing validation.
- [ ] Implement transaction persistence.
- [ ] Make callback/IPN processing idempotent.
- [ ] Implement payment success/pending/failure/cancellation states.
- [ ] Connect successful payment events to customer notification.
- [ ] Test the full flow in PesaPal sandbox.
- [ ] Complete production credential/configuration review.

## Phase 3 — Website communications

- [ ] Implement `/api/contact`.
- [ ] Connect "Talk to us" CTAs.
- [ ] Persist contact enquiries.
- [ ] Connect Brevo notification/acknowledgement.
- [ ] Implement `/api/newsletter/subscribe`.
- [ ] Move newsletter subscribers from temporary local storage to Brevo.
- [ ] Add consent, unsubscribe and suppression handling.
- [ ] Rotate previously exposed Brevo credentials.
- [ ] Verify sender/domain configuration.

## Phase 4 — Daily reader newsletter

- [ ] Finalize daily shelf generation.
- [ ] Finalize responsive HTML and plain-text templates.
- [ ] Add tracked book links.
- [ ] Add daily idempotency.
- [ ] Add scheduled send.
- [ ] Add delivery/bounce/unsubscribe monitoring.
- [ ] Add newsletter analytics.
- [ ] Complete legal/privacy review.
- [ ] Run controlled test sends before automatic delivery.

## Phase 5 — GMass outreach

- [ ] Configure GMass credentials securely.
- [ ] Define Milky prospect/campaign/event records.
- [ ] Build campaign preparation/export workflow.
- [ ] Add personalization fields.
- [ ] Implement campaign creation/scheduling integration where approved.
- [ ] Configure follow-up workflow.
- [ ] Configure relevant GMass webhooks.
- [ ] Store campaign events in Milky.
- [ ] Implement application-level suppression.
- [ ] Add outreach reporting.

## Phase 6 — Unified reporting and operations

- [ ] Create a unified communication-event view.
- [ ] Connect payment events to customer lifecycle.
- [ ] Connect contact enquiries to lead records.
- [ ] Connect GMass outreach events to prospects.
- [ ] Distinguish newsletter metrics from outreach metrics.
- [ ] Add provider health/error monitoring.
- [ ] Add retry and idempotency controls.
- [ ] Document operational ownership and failure recovery.

## Phase 7 — Release QA

- [ ] Full public-content provenance scan.
- [ ] Pricing consistency scan.
- [ ] Payment sandbox test.
- [ ] Contact-form test.
- [ ] Newsletter subscription test.
- [ ] Newsletter provider failure test.
- [ ] GMass campaign/test-recipient workflow test.
- [ ] Webhook/idempotency test.
- [ ] Mobile QA at 320/375/390/430px.
- [ ] Accessibility QA.
- [ ] SEO/performance QA.
- [ ] Production crawl.
- [ ] Final legal/privacy review.
- [ ] Final production deployment check.

---

# 37. Updated Definition of Done

Milky is release-ready only when:

1. The six public plans and their current prices/terms are consistent across every public surface.
2. No legacy Essentials presentation remains.
3. Desktop pricing uses the approved 2-column × 3-row layout.
4. The required image hover magnifier works on the affected surface.
5. PesaPal can create, confirm and persist a payment safely.
6. Payment state is independent of email-delivery state.
7. "Talk to us" works from every relevant CTA.
8. Website contact submissions are persisted and routed through Brevo.
9. Newsletter subscriptions are consent-aware and routed through Brevo.
10. The daily reader newsletter can be generated, previewed, tested and safely scheduled.
11. GMass can be used as the dedicated author-outreach layer without becoming the website's primary customer-email dependency.
12. Outreach events can be associated with Milky contacts and campaigns.
13. Suppression/unsubscribe states are respected across relevant automated communications.
14. Private Email remains the human mailbox layer for `nick@atomic-shelf.com`.
15. Spacemail is not included as a dependency or integration.
16. Provider credentials are server-side and rotated where previously exposed.
17. Public pages contain no internal provenance/source-of-truth language.
18. The complete site passes mobile, accessibility, SEO, performance and production QA.

---

# 38. Change-Control Rules for Integrations

When changing a provider:

1. Preserve the Milky contact/customer/campaign/event models.
2. Replace only the provider adapter/integration layer where possible.
3. Do not move application identity into the provider.
4. Do not make provider-specific IDs the primary business identifiers.
5. Re-test webhooks and idempotency.
6. Re-test suppression and consent.
7. Re-test failure/retry behavior.
8. Update this PRD and environment-variable documentation.

When changing a commercial plan:

1. Update the controlled pricing dataset.
2. Update server-side payment validation.
3. Update dependent checkout presentation.
4. Update relevant public copy.
5. Run the pricing consistency scan.
6. Run payment sandbox tests.
7. Update this PRD's implementation ledger.
