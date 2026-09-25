Milky STATUS
Generated 2026-09-25. Branch: main (diverged: 1 local vs 99 origin; merge in progress,
conflicts already resolved, merge commit not finished).

PURPOSE
Internal name for Atomic Shelf's commercial website and supporting Node API:
marketing pages, pricing/checkout, readers discovery, contact/newsletter,
PesaPal payments. Public site is atomic-shelf.com. StoryPals/ShelfMates here
are marketing products, not the StoryPal app repo.

STACK
Static HTML/CSS/JS on Neocities (GitHub Action on site/**).
Node 18+ Express API (site/server.js): axios, cors, dotenv. PesaPal + Brevo.
Railway host used in the live pages: milky-production-c748.up.railway.app.
No React app. pricing-data.json is the commercial source of truth.

FOLDER STRUCTURE
.github/workflows/deploy.yml   Neocities deploy
site/                          public pages + server.js + pricing-data.json
site/server.js                 payments, readers APIs, Brevo, static serve
site/readers.html, checkout.html  hardcode Railway fallback URL
site/storypals.html            marketing page (links to readers/contact)
backend/Brevo Integration/    older/copy payment+email server
site/ActiveClients, dashboards, Content-Proposal, Editorials, reports,
  Taskmaster, Productions, leads  internal tools (excluded from Neocities)

LAST 20 COMMITS
e1849bf 2026-09-24 check push
9997556 2026-09-23 Merge PR #22 pricing page
65ad225 2026-09-23 Clarify expected results page
05e045e 2026-09-23 Align commitment pull quote
46a7028 2026-09-23 Describe results across books
a9c9c71 2026-09-23 Merge PR #21 pricing page
3ea2cb3 2026-09-23 Invite authors to share free-book dates
08f7fc0 2026-09-23 Scale Momentum commitments and forecasts
fb0e5f4 2026-09-23 Merge PR #20 pricing page
9b8a31e 2026-09-23 Separate public assets from internal records
291ebd1 2026-09-23 Clarify pricing data architecture in PRD
e28b0de 2026-09-23 Update website PRD + provenance cleanup
dd1388b 2026-09-23 Remove provenance notes from how-it-works
583069c 2026-09-23 Remove provenance notes from services
7f493f1 2026-09-23 Remove provenance language from results
a23544d 2026-09-23 Remove provenance language from pricing
d4a220a 2026-09-23 Remove provenance language from homepage
771e2bd 2026-09-23 Merge PR #19 pricing page
82f3904 2026-09-23 Merge main into pricing-page branch
863df42 2026-09-23 docs: point site docs at public pricing data file

OPEN TODOS IN CODE
site/server.js — payment confirmation / failure / admin emails still
  console.log placeholders (Brevo is used for other mail paths).
site/readers.html — replace Open Library lanes with first-party catalog/feeds.
backend/Brevo Integration/server.js — TODO to persist paid orders / notify.
site/README.md — commercial fields marked TODO must be filled before go-live.
pricing-data.json — several proof metrics still "approved": false.
Editor HTML (cafe, nikita, aedit, etc.) — comments about unimplemented UI
  behind a local feature flag; not public-site routing.

INCOMPLETE / GAPS
site-data-model.json known_gaps_before_launch:
- empty case studies (deferred)
- editorial backlog, no articles
- ShelfMates/StoryPals named but deliverable specifics missing

PRD still open: mobile/a11y/SEO/legal QA, GMass/outreach event model,
reader newsletter scheduling, full DoD (section 37).

Readers "Save to Shelfmates" hardcodes https://storypal.atomic-shelf.com/
with query params. StoryPal app does not consume that contract.

No nginx, Cloudflare Worker, LaunchDarkly, or percent-rollout in this repo.
Traffic is: Neocities (site) + hardcoded Railway API + hardcoded StoryPal URL.
Unfinished merge on main should be committed or aborted before more site work.
