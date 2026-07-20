# Vorizon — AI Employee Platform — Phase 1 Build Plan

## Context
We are building **Vorizon**, a SaaS platform that lets any business create, train, test, and deploy
AI "employees" that handle real phone calls — **Inbound** (AI answers your business line, acts as
receptionist / support / sales / scheduler) and **Outbound** (AI dials your contact list for sales,
follow-ups, reminders, surveys, collections). Both follow a guided setup wizard; Outbound additionally
requires a contact list + campaign before it goes live. Pricing is usage-based at **$0.10 per
conversation minute**.

This plan covers the **initial buildable slice**: the full product foundation — auth, tenancy, both
setup wizards, company-knowledge ingestion, contacts, campaigns, interview/testing mode, billing meter,
and dashboard — with the **live voice-calling engine abstracted behind an interface and mocked**, so we
have a demoable end-to-end product without being blocked on telephony provider setup. Real voice is a
thin, well-isolated Phase 2 swap.

Source of truth: `AI Employee Modules Guide.pdf` (module/step spec) and the Vorizon requirement-document
image (feature/pricing/compliance overview).

## Decisions & Assumptions (override any of these before we start)
The user was away when I asked; these are my recommended defaults as a senior MERN engineer:
1. **Scope** = Full app, live calls stubbed behind a `VoiceEngine` interface (fastest path to a working demo; de-risks the hardest part).
2. **Voice engine** = provider-agnostic `VoiceEngine` interface now, with a **managed voice-AI adapter (Vapi/Retell/Bland)** as the intended Phase-2 concrete implementation (handles telephony + STT + LLM + TTS as one API). A `MockVoiceEngine` powers Phase 1.
3. **Stack** = **TypeScript monorepo**: `/client` (React + Vite + Tailwind), `/server` (Node + Express + Mongoose), `/shared` (types + Zod schemas). Mongo via Docker for local dev.
4. Multi-tenant SaaS: an **Organization** (the business) owns Users, AI Employees, knowledge, contacts, campaigns, and billing.
5. Auth = email/password + JWT (access + refresh), org-scoped RBAC (owner/admin/member). Google OAuth deferred.

## Architecture Overview
```
client (React/Vite/TS/Tailwind)  ── REST/JSON ──▶  server (Express/TS)
                                                     ├── auth & RBAC
                                                     ├── AI Employee service (config + state machine)
                                                     ├── Knowledge service (upload → parse → chunk → store)
                                                     ├── Contacts & Campaign service
                                                     ├── Interview/Testing service (chat + mock voice)
                                                     ├── Billing/Usage meter
                                                     └── VoiceEngine (interface)
                                                            ├── MockVoiceEngine   (Phase 1)
                                                            └── VapiVoiceEngine    (Phase 2)
                                            MongoDB (Mongoose)  ·  file storage (local/S3-ready)
```
The **AI Employee lifecycle** is modeled as an explicit state machine, matching the doc's wizard:
`draft → knowledge_added → responsibilities_set → phone_configured (inbound) → billing_added → tested → active`.
Outbound reuses the same states but skips phone/escalation config and requires
`contacts_uploaded → campaign_created` before `active`.

## Monorepo Structure
```
vorizon/
  package.json (workspaces: client, server, shared)
  docker-compose.yml           # mongodb
  .env.example
  shared/                      # @vorizon/shared — types + zod schemas shared by client & server
    src/{types,schemas}/…
  server/
    src/
      config/                  # env, db connection
      middleware/              # auth, error handler, request validation (zod), rbac
      models/                  # Mongoose schemas (see Data Models)
      modules/
        auth/                  # controller + service + routes
        organizations/
        aiEmployees/           # CRUD + wizard step endpoints + lifecycle transitions
        knowledge/             # upload, parse, list, delete
        responsibilities/
        contacts/              # CSV/XLSX upload + validation + manual entry
        campaigns/
        interview/             # test-conversation endpoints
        billing/               # usage records + estimate
      voice/                   # VoiceEngine interface + MockVoiceEngine (+ Vapi adapter later)
      utils/
      app.ts / server.ts
    tests/
  client/
    src/
      lib/api/                 # typed fetch client (uses @vorizon/shared types)
      routes/                  # router
      pages/{auth,dashboard,employees,campaigns,contacts,analytics}
      features/wizard/         # step components + wizard state (Inbound & Outbound share steps)
      components/ui/           # Tailwind primitives
      store/                   # auth + wizard state (Zustand)
    index.html / main.tsx
```

## Data Models (Mongoose, all org-scoped)
- **Organization** — name, plan, billing status, createdBy.
- **User** — name, email, passwordHash, organizationId, role (`owner|admin|member`), refreshTokenHash.
- **AIEmployee** — organizationId, name, department/role, language, voice, workingHours,
  `type: 'inbound'|'outbound'`, `status` (lifecycle state above), businessPhoneNumber (inbound),
  escalationNumber (inbound), rules/behavior/tone, timestamps.
- **KnowledgeItem** — aiEmployeeId (or org-shared), kind (`description|product|service|pricing|faq|policy|file|url|note`),
  title, content (text), sourceFile (path/mime), parsedText, chunks[] (text + optional embedding — embedding field reserved for Phase 2 RAG).
- **Responsibility** — aiEmployeeId, label, type (`preset|custom`), enabled.
- **Contact** — organizationId, name, phone (E.164, validated), email?, company?, tags[], notes, campaignId?, validationStatus.
- **Campaign** — organizationId, aiEmployeeId, name, contactListRef, callingSchedule, retryAttempts,
  retryInterval, dailyCallLimit, workingHours, status (`draft|running|paused|completed`).
- **Call** — organizationId, aiEmployeeId, direction, from/to, contactId?/campaignId?, startedAt, endedAt,
  durationSec, outcome (`completed|transferred|no_answer|failed`), transcript, escalated (bool), provider ('mock'|'vapi').
- **UsageRecord** — organizationId, callId, minutes (ceil of duration), rateUsd (0.10), amountUsd, billedAt.

## Backend API Surface (representative)
- `auth`: `POST /register` (creates org + owner), `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`.
- `aiEmployees`: `GET/POST/PATCH/DELETE /ai-employees`, plus wizard-step endpoints that also drive the
  lifecycle: `PATCH /:id/knowledge-status`, `PATCH /:id/responsibilities`, `PATCH /:id/phone`,
  `PATCH /:id/billing`, `POST /:id/activate` (guards: cannot activate until `tested` + prerequisites met).
- `knowledge`: `POST /ai-employees/:id/knowledge` (multipart), parse pipeline, `GET`, `DELETE`.
- `contacts`: `POST /contacts/upload` (CSV/XLSX), `POST /contacts` (manual), `GET`, phone-validation endpoint.
- `campaigns`: `GET/POST/PATCH`, `POST /:id/launch` (validates tested employee + validated contacts).
- `interview`: `POST /ai-employees/:id/interview/message` → runs a test conversation turn against the
  employee's compiled system prompt (uses the KB); returns AI reply. Editable config hot-reloads between turns.
- `billing`: `GET /billing/usage`, `GET /billing/estimate`.
- All routes: zod-validated (schemas from `@vorizon/shared`), JWT-guarded, org-scoped, RBAC-checked.

## Voice Engine Abstraction (the key isolation boundary)
```ts
interface VoiceEngine {
  provisionInboundNumber(employee): Promise<{ phoneNumber }>
  syncAssistant(employee, knowledge, responsibilities): Promise<{ assistantId }>
  startOutboundCall(employee, contact, campaign): Promise<{ callId }>
  handleWebhook(payload): Promise<CallEvent>   // transcripts, status, duration
}
```
- **Phase 1 `MockVoiceEngine`**: simulates call events, generates fake transcripts/durations, and — for the
  **Interview/Testing** mode — routes to a real text (and optionally browser-mic) chat against Claude
  using the employee's compiled prompt, so testing is genuinely functional even before telephony exists.
- **Phase 2 `VapiVoiceEngine`**: maps our employee config → provider assistant, provisions numbers, and
  normalizes webhooks into our `Call`/`UsageRecord` records. No changes needed outside `server/src/voice/`.

## Frontend (React) — Wizards + Dashboard
- **Shared wizard engine** in `features/wizard`: step registry, progress bar, per-step validation, save-as-draft.
  - **Inbound steps (7):** Create Employee → Company Knowledge → Responsibilities → Business Phone Number
    → Human Escalation Number → Billing → Interview & Testing → Activate.
  - **Outbound steps (8):** Create Employee → Company Knowledge → Responsibilities → Billing →
    Interview & Testing → Upload Contact List → Create Campaign → Launch. (Reuses the same step components;
    just a different ordered registry, per the doc.)
- **Interview/Testing screen:** chat UI (mic-ready) to "talk to the AI like a real customer," with a live
  side-panel to edit knowledge/responsibilities/rules/tone and re-test unlimited times before activation.
- **Dashboard & Analytics:** employee list + status, calls, total minutes, leads, appointments, call
  outcomes, performance — wired to real data (populated by mock calls in Phase 1).
- **Contacts & Campaigns:** upload/preview/validate contacts; campaign builder with schedule/retry/limits.
- State: Zustand for auth + wizard draft; typed API client using `@vorizon/shared`.

## Billing Meter
On every `Call` end event (mock or real), compute `minutes = ceil(durationSec/60)`, write a `UsageRecord`
at $0.10/min, and surface running totals in the billing/analytics views. Payment-method capture is a
non-charging placeholder in Phase 1 (Stripe integration deferred, matching the doc's "future integrations").

## Milestones (suggested build order)
1. **Foundation** — monorepo, TS config, Docker Mongo, env, shared package, DB connection, health check.
2. **Auth + tenancy** — register(org+owner)/login/refresh/me, RBAC middleware, protected route shell in client.
3. **AI Employee core** — model + lifecycle state machine + CRUD + wizard-step endpoints; client wizard shell.
4. **Knowledge + Responsibilities** — upload/parse (PDF/DOCX/TXT/CSV) + list/delete; responsibilities presets+custom.
5. **Interview/Testing** — compile employee → system prompt, chat turn endpoint via MockVoiceEngine → Claude; test UI.
6. **Inbound completion** — phone/escalation config, billing placeholder, activation guard, mock inbound call events.
7. **Outbound** — contacts upload+validation, campaign builder, launch guard, mock outbound calls generating Calls/UsageRecords.
8. **Dashboard/Analytics + Billing views** — aggregate real data from the above.
9. **Polish + tests** — integration tests on lifecycle guards, upload validation, billing math.

## Verification
- **Local run:** `docker compose up -d` (mongo) → `npm run dev` (concurrently boots server + client) → `.env` from `.env.example`.
- **End-to-end happy path (manual + scripted):**
  1. Register a business → land on empty dashboard.
  2. Inbound: complete all 7 wizard steps; confirm you **cannot** activate before completing the interview step (lifecycle guard). Activate. Trigger a mock inbound call; confirm a `Call` + `UsageRecord` (correct minutes × $0.10) appear in analytics/billing.
  3. Outbound: build employee, upload a CSV of contacts (include an invalid number → confirm it's flagged), create + launch a campaign; confirm mock outbound calls generate Calls/UsageRecords respecting daily limit.
  4. Interview mode: send messages, edit knowledge/responsibilities mid-session, confirm the AI's next reply reflects the edit.
- **Automated:** Jest/Vitest + Supertest for auth, lifecycle transition guards, contact-upload validation, and billing computation (`ceil(sec/60)*0.10`). Target these as the critical-path tests.
- **Voice swap check (Phase 2 readiness):** confirm that replacing `MockVoiceEngine` with `VapiVoiceEngine` requires edits only under `server/src/voice/` and env config.

## Open Questions (confirm at kickoff; safe defaults chosen above)
1. Scope confirmation — proceed with "full app, calls mocked"? (default: yes)
2. Voice provider for Phase 2 — Vapi vs Retell vs Bland vs Twilio+OpenAI Realtime? (default: Vapi adapter)
3. Stack — TypeScript monorepo OK? (default: yes)
4. LLM for interview/testing brain — Claude (Opus/Sonnet)? (default: Claude)
5. Any existing brand/design system to match, or start fresh with Tailwind + the Vorizon blue/purple palette from the requirement doc? (default: fresh, on-brand)
