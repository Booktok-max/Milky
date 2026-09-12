# Atomic Shelf — Site Repo

Versioned copy of the atomic-shelf.com Neocities site.

## Layout

- `site/` — everything Neocities serves. This is a 1:1 copy of the
  "Download entire site" ZIP from Neocities. Deploy this folder only.
- `backend/` — the Brevo email integration (Node/Express). This is
  **not** part of the static site and is never deployed to Neocities.
  It needs its own hosting (Render, Railway, a VPS, etc.) and its own
  `.env` file that is never committed.
- `.github/workflows/deploy.yml` — pushes `site/` to Neocities
  automatically whenever it changes on `main`.

## How the client dashboard works

`site/ProgressReport.html` is a single template used for every client.
A link like:

    https://atomic-shelf.com/ProgressReport.html?token=XXXXX

is opened, the page hashes the token client-side, and calls a Google
Apps Script endpoint (`APPS_SCRIPT_URL` near the top of the `<script>`
block) which reads/writes a Google Sheet acting as the database.
Adding a new client = a new row in that Sheet, not a new HTML file.

**Known issue to fix (flagged, not yet fixed):** if the scoped
`readPortal` request fails or the token isn't recognized, the page
falls back to fetching *all* clients' data and filtering in the
browser. Because the Apps Script URL is visible in page source, this
means an unscoped request could expose every client's data. This
should be fixed on the Apps Script side (reject any request that
doesn't carry a valid token — never return the full dataset to an
unauthenticated caller) before scaling up client volume.

## One-time setup (do this once)

1. In this folder, run:
   ```
   git init
   git add .
   git commit -m "Initial import of existing Neocities site"
   ```
2. Create a new **private** repo on GitHub (don't make it public —
   client dashboards and proposals live in `site/`).
3. Connect and push:
   ```
   git remote add origin https://github.com/YOUR-USERNAME/atomicshelf-site.git
   git branch -M main
   git push -u origin main
   ```
4. Get your Neocities API key: go to
   `https://neocities.org/settings/YOUR-SITENAME#api_key`.
5. In the GitHub repo: **Settings → Secrets and variables → Actions →
   New repository secret**. Name it `NEOCITIES_API_TOKEN`, paste the
   key.
6. Push again (or re-run the workflow from the Actions tab) — this
   confirms the deploy works end-to-end.

From now on: edit files in `site/`, commit, push to `main`, and the
live site updates automatically within a minute or two.

## Day-to-day workflow

```
git add site/whatever-you-changed.html
git commit -m "Describe what changed"
git push
```

Check the **Actions** tab on GitHub to watch the deploy and catch any
failures before they'd otherwise go unnoticed.

## Restoring a previous version

Every commit is a full snapshot. To see history for one file:

    git log --oneline -- site/index.html

To revert a file to an earlier commit:

    git checkout <commit-hash> -- site/index.html
    git commit -m "Revert index.html to earlier version"
    git push
