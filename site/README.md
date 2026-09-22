# Atomic Shelf — Commercial Truth Layer

This folder is the **single source of truth** for all commercial and factual content on atomic-shelf.com.

No page, component, or script should hardcode any value that exists in these files.

---

## What lives here

| File | Contains |
|---|---|
| `commercial-truth.json` | Plans, pricing, services, proof metrics, guarantee, reader products, site settings |

---

## How to use this file

Every field marked `"TODO"` must be filled in and approved before the site goes live.

When a developer needs a price, a plan name, a service description, or a proof metric, they read it from this file — not from a hardcoded string in the HTML or a component.

---

## The editing rules

### 1 — One person approves commercial changes

Any change to a price, discount, deliverable, or guarantee must be approved by Nick before it is committed.

### 2 — Never change a price in the site code

If a price changes, change it here. The site reads from here. If you find a hardcoded price anywhere in the site code, that is a bug — remove it and replace it with a reference to this file.

### 3 — Every proof metric must be defensible

Before setting `"approved": true` on any proof metric, confirm:
- The value is accurate
- The definition is clear (what exactly is being measured)
- The time period is stated
- The source is documented
- The value has been verified recently

A number that cannot be defended should not appear on the site.

### 4 — The guarantee remedy must be defined before launch

The `guarantee.remedy` field is defined. The related commitment terms still need a manual/legal review before their final approval; retain that status in the commercial truth file until the review is complete.

### 5 — Plan names are canonical

The plan names (`Spark`, `Enhanced`, `Foundation`, `Starter`, `Momentum`, `Growth`) are canonical. If the commercial plans change names, update the JSON first and propagate through the site.

---

## Approval status

### Pricing and plans

- [x] All six plan prices and commitment totals
- [x] Services, deliverables, and 90-day performance ranges
- [x] Pricing-page claim based on 24 months of internal operating evidence

These values were approved by the site owner on 2026-09-22. The recorded
approval scope and evidence note live in `commercial-truth.json` under
`_meta.pricing_claim_approval`.

### Services (for every service)
- [ ] `what_we_do`
- [ ] `deliverable`
- [ ] `plans_included` — confirm which plans include this service
- [ ] `success_looks_like`

### Proof metrics (for every metric)
- [ ] `value` + `display_value`
- [ ] `definition`
- [ ] `period`
- [ ] `source`
- [ ] `last_verified`
- [ ] `approved: true`

### Guarantee
- [ ] `remedy` — exact commercial remedy, reviewed before publishing
- [ ] `terms_url` — URL to formal terms
- [ ] `approved: true`

### Reader products
- [ ] `url` for ShelfMates and StoryPals

### Site settings
- [ ] `support_email`

---

## Discount logic

The discount percentages are defined in this file. The front-end calculates savings from them — discounts are not hardcoded in components. The current discount structure:

| Commitment | Discount |
|---|---|
| Monthly | 0% |
| 3 months | 10% |
| 6 months | 20% |
| 12 months | 25% |

If these percentages change, update them here.

---

## What is blocked until this file is complete

- Pricing page build
- Homepage pricing preview section
- Checkout pages
- Plan comparison tables
- Proof strip (homepage metrics)
- Guarantee section
- Any component that displays a price, deliverable, or metric

Do not begin building those components with placeholder or approximated values. Complete this file first.

---

## Version history

| Version | Date | Changed by | Notes |
|---|---|---|---|
| 1.0.0 | 2026-09-22 | — | Initial structure |
| 1.1.0 | 2026-09-22 | Site owner | Approved six-plan pricing and published pricing-page claims; wired the homepage and pricing page to `commercial-truth.json`. |
