# Atomic Shelf — Pesapal payment backend

A small Express server that keeps your Pesapal `consumer_key` / `consumer_secret`
off the website and handles the payment flow: create an order, redirect the
customer to Pesapal, confirm the result.

## Deploy to Railway

1. Push this folder to a GitHub repo (or a subfolder of your existing repo).
2. In Railway: **New Project → Deploy from GitHub repo** → pick it.
   - If it's a subfolder of a bigger repo, set the **Root Directory** to this
     folder in Railway's service settings.
3. Railway auto-detects Node from `package.json` and runs `npm start`.
4. Under the service's **Variables** tab, add everything from `.env.example`
   *except* `PESAPAL_NOTIFICATION_ID` and `APP_BASE_URL` for now.
5. Once it deploys, Railway gives you a public URL
   (Settings → Networking → **Generate Domain** if it's not already there),
   e.g. `https://atomic-shelf-payments.up.railway.app`.
6. Add that as `APP_BASE_URL` in Variables (no trailing slash), and redeploy.

## One-time Pesapal setup: register your IPN URL

Pesapal needs to know where to send payment notifications. Do this once:

1. Visit, in your browser:
   `https://YOUR-RAILWAY-URL/api/register-ipn?key=YOUR_SETUP_KEY`
   (`YOUR_SETUP_KEY` is whatever you set `SETUP_KEY` to in Variables.)
2. You'll get back JSON containing `"ipn_id": "...."`. Copy that value.
3. Paste it into the `PESAPAL_NOTIFICATION_ID` variable in Railway.
4. Redeploy. The server won't accept payments until this is set —
   `/api/create-payment` will return a clear error telling you so if it's missing.

You only need to do this once per environment (once for sandbox, once for
production, if you use both).

## Testing against the sandbox first

Set `PESAPAL_ENV=sandbox` and use the sandbox `consumer_key`/`consumer_secret`
from Pesapal's demo credentials page. Switch to `production` plus your live
credentials once a full test purchase works end-to-end. You'll need to
re-run the IPN registration step for production too, since sandbox and
production are separate systems with separate notification IDs.

## Endpoints

- `POST /api/create-payment` — body: `{ plan, email, phone, first_name, last_name }`
  where `plan` is one of `spark`, `foundation`, `momentum`, `growth`.
  Returns `{ redirect_url }` — send the browser there.
- `GET /api/callback` — where Pesapal sends the customer after they pay.
- `GET /api/cancelled` — where Pesapal sends the customer if they cancel.
- `GET /api/ipn` — server-to-server notification from Pesapal. Check the
  `TODO` in `server.js` if you want this to email you or update a database.
- `GET /api/status?orderTrackingId=...` — look up a transaction's status manually.
- `GET /health` — uptime check.

## Currency note

Pesapal is Kenya-based; not every merchant account is approved for every
currency. The pricing page currently charges in USD (`PESAPAL_CURRENCY`).
Confirm with Pesapal support that your account can settle in USD — if not,
switch this to `KES` and adjust the amounts on the pricing page to match.

## Local development

```
npm install
cp .env.example .env   # fill in real values
npm start
```
