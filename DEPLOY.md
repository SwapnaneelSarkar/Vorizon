# Deploying Vorizon — Vercel (client) + Firebase (API)

The client is a static Vite build on Vercel. The API runs as Firebase Cloud Functions
(Blaze plan required — already enabled): `api` wraps the whole Express app, and
`campaignWorker` is a scheduled function that drains the durable Firestore campaign
queue every minute. MongoDB lives on Atlas (free M0). Everything is already configured
in `firebase.json`, `.firebaserc`, `vercel.json`, and `functions/`.

## 0. One-time prerequisites

1. **MongoDB Atlas** (required — Firebase does not provide MongoDB):
   - https://cloud.mongodb.com → create a free **M0** cluster
   - Database Access → add a user; Network Access → allow `0.0.0.0/0`
     (Cloud Functions egress IPs vary)
   - Connect → Drivers → copy the connection string, add a db name, e.g.
     `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/vorizon`
   - Paste it as `MONGODB_URI=` in **`functions/.env`**
2. **Firebase CLI** logged into the Google account that owns `cosmectsecretbase`:
   `firebase login` (or `firebase login --reauth`).

`functions/.env` (gitignored) already contains generated production JWT secrets and
the Retell/Razorpay/Resend keys. Two placeholders to fill after the deploys below:
`CORS_ORIGIN` / `APP_BASE_URL` (your Vercel URL).

## 1. Deploy the API

```bash
firebase deploy --only functions
```

The predeploy hook builds `functions/index.js` (esbuild bundle of
`server/src/functionsEntry.ts`). When it finishes, note the **api** function URL,
e.g. `https://api-xxxxxxxx-uc.a.run.app`. Your API base is that URL + `/api`.

Smoke test: `curl https://api-…run.app/api/health`

## 2. Deploy the client

```bash
npx vercel --prod
```

(or connect the repo at vercel.com — `vercel.json` holds the build config). Set one
environment variable in the Vercel project:

```
VITE_API_BASE_URL=https://api-xxxxxxxx-uc.a.run.app/api
```

## 3. Point everything at the new URLs

1. In `functions/.env`, set `CORS_ORIGIN` and `APP_BASE_URL` to your Vercel domain
   (e.g. `https://vorizon.vercel.app`), then redeploy: `firebase deploy --only functions`
2. **Razorpay webhook**: Dashboard → Settings → Webhooks → add
   `https://api-…run.app/api/payments/webhook`, events `payment.captured` +
   `payment.failed`; paste the webhook secret into `functions/.env` as
   `RAZORPAY_WEBHOOK_SECRET` and redeploy.
3. **Retell webhook** (when going live with real calls): set the agent's
   `webhook_url` to `https://api-…run.app/api/voice/retell/webhook`, buy a phone
   number, set `RETELL_FROM_NUMBER` and `VOICE_PROVIDER=retell`, redeploy.

## ⚠ Don't run a local server against the production Firebase project

The campaign queue lives in Firestore, and **any** running instance with worker
enabled (e.g. `npm run dev` locally with `WORKER_IN_PROCESS=true`) will claim jobs
from it — including jobs enqueued by production, which it then can't find in its own
local database. When production is live, either stop local servers, set
`WORKER_IN_PROCESS=false` locally, or (best) use a separate Firebase project for
development.

## How the serverless worker behaves

Campaign launches enqueue a job in Firestore and return instantly. The
`campaignWorker` scheduled function fires every minute and processes all due jobs
(up to ~8 minutes of work per tick, lease-protected against double-processing).
Worst case, a launched campaign starts within ~60s of launch. The local/Render
deployment path (`src/index.ts`, resident polling worker) is unchanged and needs no
scheduled function.

## Costs on Blaze

Functions free tier covers ~2M invocations/month; the per-minute scheduler is
~43k/month. Firestore reads for the queue polling are 1 query/min. At test scale
this rounds to zero; Atlas M0 and Vercel hobby are free.
