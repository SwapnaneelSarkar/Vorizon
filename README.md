# Vorizon — AI Employee Platform

Build, train, test & deploy AI employees that handle phone calls — **Inbound** (answer your business
line) and **Outbound** (dial your contact list). Guided setup wizard, usage-based billing at
**$0.10 / conversation minute**. MERN + TypeScript monorepo.

> The voice-calling engine is abstracted behind a `VoiceEngine` interface: **mock** (simulated
> telephony, default) or **Retell AI** (`VOICE_PROVIDER=retell`) for real outbound calls. The
> interview/testing chat uses **real Claude** when `ANTHROPIC_API_KEY` is set (offline echo-mode
> otherwise). Integrations — telephony compliance (TCPA consent, DNC, opt-out, recording
> disclosure), Resend transactional email, Razorpay payments, Retell voice — are documented in
> [INTEGRATIONS.md](./INTEGRATIONS.md).

## Stack
- **client** — React + Vite + TypeScript + Tailwind + React Query + Zustand + Recharts
- **server** — Node + Express + Mongoose + Zod + JWT auth
- **shared** — `@vorizon/shared`: types + Zod schemas used by both

## Prerequisites
- Node ≥ 20
- MongoDB — either Docker (`docker compose up -d`) or use the no-Docker memory mode below

## Setup
```bash
npm install
cp .env.example .env          # fill ANTHROPIC_API_KEY for real interview responses (optional)
```

## Run (with Docker Mongo)
```bash
docker compose up -d          # starts mongo:7 on :27017
npm run seed                  # optional: demo org (demo@vorizon.ai / password123)
npm run dev                   # server :4000 + client :5173
```

## Run (no Docker — in-memory Mongo)
```bash
# terminal 1
npm run build:shared && npm run dev:memory --workspace @vorizon/server   # API on :4000, ephemeral DB
# terminal 2
npm run dev:client
```

Open http://localhost:5173 and register a business.

## Scripts (root)
| script | purpose |
|---|---|
| `npm run dev` | build shared, then run server + client concurrently |
| `npm run build` | build shared, server, client |
| `npm run typecheck` | typecheck all workspaces |
| `npm run test` | server test suite (Vitest + Supertest + in-memory Mongo) |
| `npm run seed` | seed a demo org/employees/contacts |

## Architecture
```
client ──REST──▶ server
                  ├─ auth (JWT + org-scoped RBAC)
                  ├─ aiEmployees (+ lifecycle state machine)
                  ├─ knowledge (upload → parse pdf/docx/csv/xlsx/txt → chunk)
                  ├─ responsibilities (presets + custom)
                  ├─ interview (promptCompiler → VoiceEngine → Claude)
                  ├─ contacts (CSV/XLSX import + E.164 validation)
                  ├─ campaigns (mock outbound runner)
                  ├─ billing / analytics (usage aggregation)
                  └─ voice/  VoiceEngine interface → MockVoiceEngine (Phase 1)
                 MongoDB (Mongoose)
```

### AI Employee lifecycle
`draft → knowledge_added → responsibilities_set → [phone_configured] → billing_added → tested → active`
Outbound replaces phone config with `contacts_uploaded → campaign_created` before `active`.
Activation is guarded — the API returns `409 PRECONDITION_FAILED` with the exact list of missing steps.

### Billing meter
Every call-end event (mock or real) flows through `voice/handleCallEvent.ts`, which writes a `Call` and
an idempotent `UsageRecord` (`minutes = ceil(durationSec/60)`, `amount = minutes × $0.10`).

## Verified end-to-end
`npm run test` covers: auth, the inbound activation guard, call metering math, and contact-upload
validation. A full HTTP smoke run also exercises inbound activation + call simulation, outbound
campaign launch, and dashboard aggregation.

## Production hardening (built, no third-party services required)
- **Config safety:** server refuses to boot in production with weak/default JWT secrets
- **API:** global + per-auth rate limiting, gzip compression, `helmet`, `/api/ready` readiness probe, graceful shutdown
- **AuthZ:** org-scoped RBAC (owner/admin/member), team management (`/organizations/users`), change-password, password policy
- **Audit log:** sensitive actions (activate, launch, user changes) recorded to `AuditLog`
- **Scalable campaigns:** launch is non-blocking — execution runs on a swappable queue (`campaignQueue`)
- **Firebase (optional, set `FIREBASE_PROJECT_ID` / `FIREBASE_SERVICE_ACCOUNT`):** Firestore-backed
  rate limiting (shared across instances), a **durable Firestore campaign queue** with workers, and
  raw upload storage in Firestore. Not configured → in-memory/in-process fallbacks.
- **Client:** route-level code-splitting + error boundary
- **Ops:** `Dockerfile` (server) + `client/Dockerfile` (nginx) + GitHub Actions CI (typecheck → test → build)

### Firebase + workers
```bash
# Set FIREBASE_PROJECT_ID + FIREBASE_SERVICE_ACCOUNT (inline JSON or key-file path) in .env, then:
npm run dev                     # API runs the campaign worker in-process (WORKER_IN_PROCESS=true)

# For horizontal scale: set WORKER_IN_PROCESS=false on the API and run dedicated workers:
npm run worker --workspace @vorizon/server        # (built)  node dist/worker.js
npm run worker:dev --workspace @vorizon/server    # (dev)    tsx watch src/worker.ts
```
Note: the campaign worker polls Firestore every 5s and claims jobs with a lease (visibility
timeout), so jobs survive restarts and multiple workers never double-process a campaign.

## Docker
```bash
docker build -t vorizon-server .
docker build -f client/Dockerfile -t vorizon-client .
```

## Integrations (see [INTEGRATIONS.md](./INTEGRATIONS.md))
- **Telephony compliance** — org-level AI-calling consent (timestamp + IP), Do-Not-Call list,
  per-contact opt-out (manual + in-call), configurable recording disclosure; enforced at campaign
  launch and re-checked before every dial.
- **Resend email** — welcome, OTP, password-reset (forgot/reset endpoints), and notification
  emails; safe no-op when unconfigured.
- **Razorpay payments** — order API, server-side signature verification, signed webhook,
  success/failure flows, payment history; secrets never reach the client.
- **Retell AI voice** — real outbound campaign calls with signed webhooks feeding the shared
  metering pipeline (`VOICE_PROVIDER=retell`).

## Phase 3 (intentionally deferred)
Embedding-based RAG, CRM import, Google OAuth, and inbound Retell call routing.
