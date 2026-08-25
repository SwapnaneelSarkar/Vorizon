# Vorizon — AI Sales Agent Platform

Vorizon is an **AI sales agent for businesses**: it calls your leads, answers your business line,
follows up on WhatsApp, books meetings, and pushes everything to your CRM — automatically, 24/7.

Businesses build "AI employees" (an **inbound** receptionist or an **outbound** caller) through a
guided wizard, connect their ad platforms / CRM / messaging, and let Vorizon run the loop from
first ad click to booked deal. Calling is prepaid and usage-based at **$0.08 / conversation minute**.

TypeScript monorepo (React + Express + MongoDB), deployed on **Vercel** (web) + **Firebase Cloud
Functions** (API).

---

## What it does

- **AI voice employees** — inbound receptionists and outbound calling campaigns. The conversational
  engine sits behind a provider-agnostic `VoiceEngine` interface: `mock` (simulated, default),
  `retell` (Retell AI — per-employee agents synced from each employee's configured brain), or
  `exotel` (Exotel telephony).
- **Lead → call loop** — leads arrive from ad platforms, a tokenized webhook, or manual entry; the
  AI scores/qualifies them and dials qualified leads through the campaign pipeline (which enforces
  balance, consent and DNC), then marks them contacted when a call connects.
- **Campaign engine** — per-contact dial state (no double-dialing on retry/resume),
  timezone-aware calling-hours enforcement, per-run daily caps that continue across runs, spaced
  retries, live progress, and per-call transcripts.
- **Integrations** — a connector catalog (Google Ads, Zoho CRM, WhatsApp, Instagram, Gmail,
  Calendar, HubSpot, Salesforce, …) with OAuth + automatic token refresh. Captured leads sync to
  **Zoho CRM** as Lead records. WhatsApp Cloud API inbound webhook (Meta-verified, signed).
- **Prepaid billing** — a USD wallet topped up via **Razorpay**; calls are metered per connected
  minute and debited idempotently. No-answer / failed / zero-duration calls are never billed.
- **Compliance built in** — org-level AI-calling consent (timestamp + IP), a Do-Not-Call list,
  per-contact opt-out, and a configurable recording disclosure — enforced at launch and re-checked
  before every dial.
- **Auth** — email/password + **Google sign-in** (Firebase Auth), org-scoped RBAC, multi-device
  sessions with per-session refresh-token rotation, and OTP password reset with brute-force lockout.
- **Dashboards** — real usage analytics, campaign detail with transcript viewer, wallet & payment
  history, leads pipeline, and a marketing site (landing, pricing, about, contact, terms, privacy).

---

## Tech stack

| Workspace | Stack |
|---|---|
| `client` | React + Vite + TypeScript + Tailwind + React Query + Zustand + Recharts + React Router |
| `server` | Node + Express + Mongoose (MongoDB) + Zod + JWT auth |
| `shared` | `@vorizon/shared` — TypeScript types + Zod schemas shared by client and server |
| `functions` | esbuild bundle of the Express app for Firebase Cloud Functions (do not edit `index.js` by hand) |

External services (all optional; graceful fallbacks when unset): Retell / Exotel (voice),
Anthropic or OpenAI (the AI brain), Razorpay (payments), Gmail SMTP / Resend (email),
Firebase (Auth + Firestore-backed campaign queue), MongoDB Atlas.

---

## Quick start

**Prerequisites:** Node ≥ 20, and MongoDB (Docker, Atlas, or the in-memory mode below).

```bash
npm install
cp .env.example .env    # fill in what you need (all optional for local dev)
```

### Run with Docker Mongo
```bash
docker compose up -d    # mongo:7 on :27017
npm run seed            # optional demo org → demo@vorizon.ai / password123
npm run dev             # server :4000 + client :5173
```

### Run with no Docker (ephemeral in-memory Mongo)
```bash
# terminal 1 — API on :4000 against an in-memory MongoDB
FIREBASE_PROJECT_ID="" npm run build:shared && npm run dev:memory --workspace @vorizon/server
# terminal 2 — client on :5173
npm run dev:client
```

Open http://localhost:5173 and register a business.

> With no `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`, the AI-interview chat and lead scoring return a
> deterministic offline stub so the app still runs. With `VOICE_PROVIDER=mock` (default), calls are
> simulated end-to-end through the real metering pipeline — no telephony account needed to develop.

---

## Scripts (root)

| script | purpose |
|---|---|
| `npm run dev` | build `shared`, then run server + client concurrently |
| `npm run build` | build shared, server, and client |
| `npm run build:functions` | bundle the Express app into `functions/index.js` for Firebase |
| `npm run typecheck` | typecheck every workspace |
| `npm run test` | server test suite (Vitest + Supertest + in-memory Mongo) |
| `npm run seed` | seed a demo org / employees / contacts |
| `npm run lint` / `npm run format` | ESLint / Prettier |

---

## Configuration

All configuration is via environment variables (validated by Zod in `server/src/config/env.ts`; the
server refuses to boot in production with weak/default JWT secrets). See **[.env.example](./.env.example)**
for the full list. The most relevant:

| Area | Vars |
|---|---|
| Core | `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `APP_BASE_URL`, `API_BASE_URL` |
| AI brain | `ANTHROPIC_API_KEY` + `INTERVIEW_MODEL`, or `OPENAI_API_KEY` + `OPENAI_MODEL` |
| Voice | `VOICE_PROVIDER` (`mock`\|`retell`\|`exotel`), `RETELL_*`, `EXOTEL_*` |
| Billing | `RATE_USD_PER_MINUTE` (default `0.08`), `RAZORPAY_*`, `USD_INR_RATE` |
| Email | `GMAIL_USER` + `GMAIL_APP_PASSWORD` (preferred), or `RESEND_API_KEY`; `EMAIL_FROM` |
| Auth / infra | `FIREBASE_PROJECT_ID` / `FIREBASE_SERVICE_ACCOUNT` (Auth + Firestore queue) |
| Integrations | `GOOGLE_CLIENT_ID/SECRET`, `META_APP_ID/SECRET`, `ZOHO_CLIENT_ID/SECRET`, `WHATSAPP_*` |

Provider-by-provider setup (redirect URIs, webhooks, going live) is in
**[INTEGRATIONS.md](./INTEGRATIONS.md)** and **[DEPLOY.md](./DEPLOY.md)**.

---

## Architecture

```
client (Vercel) ──REST──▶ server (Firebase Cloud Functions: `api`)
                            ├─ auth ............ JWT + org-scoped RBAC, Google sign-in, multi-session
                            ├─ aiEmployees ..... lifecycle state machine + provider provisioning
                            ├─ knowledge ....... upload → parse pdf/docx/csv/xlsx/txt → chunk
                            ├─ responsibilities  presets + custom
                            ├─ interview ....... promptCompiler → VoiceEngine → Claude/OpenAI
                            ├─ contacts ........ CSV/XLSX import + E.164 validation
                            ├─ campaigns ....... runner + progress + transcripts
                            ├─ leads ........... intake → AI qualify → dial → CRM sync
                            ├─ integrations .... OAuth connectors + token refresh, WhatsApp, Zoho CRM
                            ├─ compliance ...... consent, DNC, opt-out, recording disclosure
                            ├─ billing/payments  prepaid wallet + Razorpay + usage metering
                            ├─ analytics ....... usage aggregation
                            └─ voice/ .......... VoiceEngine → Mock | Retell | Exotel + webhooks
                          MongoDB (Mongoose) + Firebase (Auth, Firestore campaign queue)

campaignWorker (Firebase scheduled function) ── drains the durable Firestore campaign queue
```

### AI employee lifecycle
`draft → knowledge added → responsibilities set → [phone configured] → billing added → tested → active`.
Outbound employees swap phone config for a campaign + contacts. Activation is guarded — the API
returns `409 PRECONDITION_FAILED` with the exact list of missing steps, and (on a real provider)
syncs the employee to its own voice agent.

### Billing meter
Every connected call-end event (mock or real) flows through `voice/handleCallEvent.ts`, which writes
a `Call`, an idempotent `UsageRecord` (`minutes = ceil(durationSec/60)`, `amount = minutes × rate`),
and debits the prepaid wallet once. A unique index on `externalCallId` makes redelivered/concurrent
provider webhooks safe; no-answer / failed / zero-duration calls are recorded but not billed.

---

## Testing

```bash
npm run test    # Vitest + Supertest against an ephemeral mongodb-memory-server
```

101 tests cover auth & sessions, billing idempotency, the campaign engine (calling hours, daily
continuation, retries, per-contact state), the lead→call loop, inbound call attribution, the Retell
agent sync, Zoho CRM sync + OAuth refresh, compliance gates, webhooks, and the activation guard.

---

## Deployment

**Production:** client on **Vercel** (`vorizon.vercel.app`), API on **Firebase Cloud Functions v2**
(Node 22) — two functions: `api` (the Express app) and `campaignWorker` (scheduled queue drainer).

```bash
# Web (from repo root, linked to the Vercel project)
npx vercel@latest --prod --yes

# API + scheduled worker
npm run build:functions
firebase deploy --only functions --project <your-project>
```

A long-running / container path also exists (`server/src/index.ts`, `Dockerfile`,
`client/Dockerfile` for nginx) for Render/Docker-style hosting. Full steps, redirect URIs, and the
Firebase-URL routing quirk are documented in **[DEPLOY.md](./DEPLOY.md)**.

---

## Project layout

```
vorizon/
├─ client/      React web app + marketing site
├─ server/      Express API, models, modules, voice engines, tests
├─ shared/      shared Zod schemas + TypeScript types (@vorizon/shared)
├─ functions/   Firebase Cloud Functions bundle target
├─ DEPLOY.md    deployment + provider console setup
├─ INTEGRATIONS.md  connector / compliance / payments / voice details
└─ README.md
```

---

## Status

Actively developed. Voice calling runs in `mock` mode by default; switching to a real provider
(Retell or Exotel) requires that provider's account + credentials. Razorpay runs in test mode until
live keys are supplied. See DEPLOY.md / INTEGRATIONS.md for the go-live checklist.
