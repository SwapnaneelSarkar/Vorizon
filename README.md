# Vorizon — AI Employee Platform

Build, train, test & deploy AI employees that handle phone calls — **Inbound** (answer your business
line) and **Outbound** (dial your contact list). Guided setup wizard, usage-based billing at
**$0.10 / conversation minute**. MERN + TypeScript monorepo.

> Phase 1: the full product with the live voice-calling engine abstracted behind a `VoiceEngine`
> interface and **mocked**. Real telephony (Vapi/Retell) is a Phase-2 adapter that plugs into the same
> interface with no changes outside `server/src/voice/`. The interview/testing chat uses **real Claude**
> when `ANTHROPIC_API_KEY` is set (offline echo-mode otherwise).

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

## Phase 2 (not built)
Real voice via `VapiVoiceEngine` (`VOICE_PROVIDER=vapi`), Stripe charging, embedding-based RAG over
knowledge chunks, CRM contact import, Google OAuth.
