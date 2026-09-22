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

The `guarantee.remedy` field is currently `TODO`. This must be agreed internally and reviewed before the guarantee copy goes live. Do not publish the guarantee section with a blank or vague remedy.

### 5 — Plan names are canonical

The plan names (`Spark`, `Shelf`, `Foundation`, `Momentum`) are the canonical names used everywhere. If the commercial plans change names, update here first and propagate through the site.

---

## Fields that must be completed before launch

### Pricing (for every plan)
- [ ] `pricing.monthly.price`
- [ ] `pricing.3_month.price` + `equivalent_monthly`
- [ ] `pricing.6_month.price` + `equivalent_monthly`
- [ ] `pricing.12_month.price` + `equivalent_monthly`

### Plans (for every plan)
- [ ] `services` — list of service IDs included in each plan
- [ ] `deliverables` — exact deliverables per month
- [ ] `expected_outputs` — realistic 90-day expectations
- [ ] `indicators` — what gets measured and reported

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
| 1.0.0 | 2026-09-22 | — | Initial structure — all commercial values pending |
