# Vorizon — AI Employee Platform — Detailed Phase 1 Engineering Plan

> Companion to `PLAN.md`. This is the execution-ready, low-level version: concrete dependencies,
> env vars, schema field types, endpoint contracts, wizard flows, state-machine rules, and a
> task-by-task build order. Written to be handed to an implementer (human or AI) and executed
> top-to-bottom.

---

## 0. Product Summary

Vorizon is a multi-tenant SaaS where a business signs up and builds **AI Employees** that handle
phone calls:

- **Inbound AI Employee** — answers the business's incoming line (receptionist / support / sales /
  scheduler). Setup wizard = 7 steps ending in *Activate*.
- **Outbound AI Employee** — dials a contact list for sales, follow-ups, reminders, surveys,
  collections. Setup wizard = 8 steps ending in *Launch Campaign* (adds contact-list + campaign).

Both wizards share the same early steps. Pricing is usage-based: **$0.10 per conversation minute**.
Before going live, every employee must pass an **Interview / Testing** mode (unlimited re-tests).

**Phase 1 boundary:** build the entire product foundation with the live telephony/voice loop
**abstracted behind a `VoiceEngine` interface and mocked**. Real voice (Vapi/Retell) is a Phase 2
adapter that plugs into the same interface with zero changes outside `server/src/voice/`.

---

## 1. Tech Stack & Key Dependencies

**Language:** TypeScript everywhere. **Node:** ≥ 20 LTS. **Package manager:** npm workspaces.

### Root
- `typescript`, `prettier`, `eslint`, `@typescript-eslint/*`, `concurrently`, `husky` + `lint-staged` (optional).

### `server/`
- Runtime: `express`, `mongoose`, `zod`, `jsonwebtoken`, `bcryptjs`, `cors`, `helmet`,
  `express-rate-limit`, `cookie-parser`, `multer` (uploads), `pino` + `pino-http` (logging), `dotenv`.
- File parsing: `pdf-parse` (PDF), `mammoth` (DOCX), `csv-parse` (CSV), `xlsx` (Excel), built-in for TXT.
- Phone validation: `libphonenumber-js` (E.164 normalization + validation).
- LLM (interview brain): `@anthropic-ai/sdk` (Claude).
- Jobs/scheduling (mock campaign runner): `node-cron` or a simple in-process interval queue for Phase 1.
- Dev/test: `tsx` (dev runner), `vitest`, `supertest`, `mongodb-memory-server`.

### `client/`
- `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `typescript`.
- Styling: `tailwindcss`, `postcss`, `autoprefixer`, `clsx`, `tailwind-merge`; icons via `lucide-react`.
- State/data: `zustand` (auth + wizard draft), `@tanstack/react-query` (server cache), `axios` or typed fetch.
- Forms/validation: `react-hook-form` + `zod` + `@hookform/resolvers` (schemas reused from `@vorizon/shared`).
- Charts (analytics): `recharts`.

### `shared/` (`@vorizon/shared`)
- `zod` only. Exports request/response DTO types + validation schemas consumed by both client & server.

### Infra (local dev)
- `docker-compose.yml` running `mongo:7`. Local file uploads to `server/uploads/` (S3-swappable later).

---

## 2. Repository Layout (full)

```
vorizon/
├─ package.json                 # workspaces: ["shared","server","client"]
├─ tsconfig.base.json
├─ docker-compose.yml           # mongo:7 + optional mongo-express
├─ .env.example
├─ .gitignore
├─ README.md
├─ PLAN.md
├─ PLAN_DETAILED.md
├─ shared/
│  ├─ package.json  (name: @vorizon/shared)
│  ├─ tsconfig.json
│  └─ src/
│     ├─ index.ts
│     ├─ enums.ts               # EmployeeType, EmployeeStatus, CallOutcome, Role, KnowledgeKind…
│     ├─ types/                 # DTOs (AIEmployeeDTO, ContactDTO, CampaignDTO, CallDTO…)
│     └─ schemas/               # zod schemas (authSchemas, employeeSchemas, contactSchemas…)
├─ server/
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ vitest.config.ts
│  └─ src/
│     ├─ index.ts               # bootstrap: connect db, start http
│     ├─ app.ts                 # express app factory (used by tests too)
│     ├─ config/
│     │  ├─ env.ts              # zod-validated process.env
│     │  └─ db.ts               # mongoose connect/disconnect
│     ├─ middleware/
│     │  ├─ auth.ts             # verify JWT → req.user {userId, orgId, role}
│     │  ├─ rbac.ts             # requireRole('owner'|'admin')
│     │  ├─ validate.ts         # (schema) => middleware, parses body/query/params
│     │  ├─ error.ts            # central error handler → {error, code}
│     │  └─ upload.ts           # multer config (memory/disk, limits, mime allowlist)
│     ├─ models/                # Organization, User, AIEmployee, KnowledgeItem,
│     │                         #   Responsibility, Contact, Campaign, Call, UsageRecord
│     ├─ modules/
│     │  ├─ auth/               # {controller,service,routes}.ts
│     │  ├─ organizations/
│     │  ├─ aiEmployees/        # incl. lifecycle.ts (state machine)
│     │  ├─ knowledge/          # incl. parsers/ (pdf,docx,csv,xlsx,txt), chunk.ts
│     │  ├─ responsibilities/   # preset catalog + custom
│     │  ├─ contacts/           # upload parse + libphonenumber validation
│     │  ├─ campaigns/          # builder + launch guard + mock runner
│     │  ├─ interview/          # promptCompiler.ts + chat turn via VoiceEngine/Claude
│     │  └─ billing/            # usage aggregation + estimate
│     ├─ voice/
│     │  ├─ VoiceEngine.ts      # interface + shared types (CallEvent)
│     │  ├─ MockVoiceEngine.ts  # Phase 1 impl
│     │  ├─ index.ts            # factory: picks impl from env VOICE_PROVIDER
│     │  └─ (VapiVoiceEngine.ts # Phase 2, not built now)
│     ├─ utils/                 # asyncHandler, apiError, pagination, ids
│     └─ tests/                 # vitest + supertest + mongodb-memory-server
└─ client/
   ├─ package.json
   ├─ tsconfig.json
   ├─ vite.config.ts
   ├─ tailwind.config.ts
   ├─ index.html
   └─ src/
      ├─ main.tsx
      ├─ App.tsx                # router + providers (QueryClient, auth)
      ├─ lib/
      │  ├─ api/                # axios instance + typed endpoint fns (uses @vorizon/shared)
      │  └─ utils.ts            # cn(), formatters
      ├─ store/                 # authStore, wizardStore (zustand)
      ├─ routes/                # ProtectedRoute, route table
      ├─ components/ui/         # Button, Input, Select, Card, Stepper, Modal, Table, Badge…
      ├─ features/
      │  ├─ auth/               # Login, Register pages
      │  └─ wizard/             # WizardShell + steps/ (shared step components)
      └─ pages/
         ├─ Dashboard.tsx
         ├─ employees/          # list, detail, create (wizard entry)
         ├─ contacts/
         ├─ campaigns/
         ├─ analytics/
         └─ billing/
```

---

## 3. Environment Variables (`.env.example`)

```
# server
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/vorizon
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=15

# voice engine
VOICE_PROVIDER=mock            # mock | vapi (phase 2)

# interview LLM
ANTHROPIC_API_KEY=sk-ant-...
INTERVIEW_MODEL=claude-sonnet-5

# billing
RATE_USD_PER_MINUTE=0.10

# client (Vite)
VITE_API_BASE_URL=http://localhost:4000/api
```

---

## 4. Data Models (Mongoose — field-level)

All documents are **org-scoped**; every non-auth query filters by `organizationId` (enforced in service layer).
Add `timestamps: true` to every schema. Index hot paths (noted).

### Organization
| field | type | notes |
|---|---|---|
| name | string | required |
| plan | enum(`free`,`usage`) | default `usage` |
| billingStatus | enum(`inactive`,`active`,`past_due`) | default `inactive` |
| paymentMethod | subdoc `{ brand, last4, addedAt }` | Phase 1 placeholder (no real charge) |
| createdBy | ObjectId→User | |

### User  *(index: {email unique}, {organizationId})*
| field | type | notes |
|---|---|---|
| name | string | required |
| email | string | required, unique, lowercased |
| passwordHash | string | bcrypt |
| organizationId | ObjectId→Organization | required |
| role | enum(`owner`,`admin`,`member`) | default `member`; first user = `owner` |
| refreshTokenHash | string? | rotated on refresh |

### AIEmployee  *(index: {organizationId, type}, {status})*
| field | type | notes |
|---|---|---|
| organizationId | ObjectId | required |
| type | enum(`inbound`,`outbound`) | required, immutable after create |
| name | string | required |
| department | string | e.g. Sales, Support |
| language | string | e.g. `en-US` |
| voice | string | voice id/name |
| workingHours | subdoc `{ tz, days[], start, end }` | |
| status | enum (see §5) | default `draft` |
| businessPhoneNumber | string(E.164)? | inbound only |
| escalationNumber | string(E.164)? | inbound only |
| tone | string? | interview-editable |
| behavior | string? | interview-editable |
| rules | string[]? | interview-editable |
| assistantExternalId | string? | set by VoiceEngine.syncAssistant |
| activatedAt | Date? | |

### KnowledgeItem  *(index: {aiEmployeeId})*
| field | type | notes |
|---|---|---|
| organizationId | ObjectId | |
| aiEmployeeId | ObjectId | |
| kind | enum(`description`,`product`,`service`,`pricing`,`faq`,`policy`,`file`,`url`,`note`) | |
| title | string | |
| content | string? | for text kinds |
| sourceFile | subdoc `{ path, mime, originalName, sizeBytes }`? | for file kind |
| parsedText | string? | extracted text |
| chunks | `[{ text, embedding?: number[] }]` | embedding reserved for Phase 2 RAG |

### Responsibility  *(index: {aiEmployeeId})*
| field | type | notes |
|---|---|---|
| aiEmployeeId | ObjectId | |
| label | string | e.g. "Book appointments" |
| kind | enum(`preset`,`custom`) | |
| enabled | boolean | default true |

### Contact  *(index: {organizationId}, {campaignId})*
| field | type | notes |
|---|---|---|
| organizationId | ObjectId | |
| name | string | |
| phone | string(E.164) | normalized via libphonenumber |
| email | string? | |
| company | string? | |
| tags | string[] | |
| notes | string? | |
| campaignId | ObjectId? | assigned when added to a campaign |
| validationStatus | enum(`valid`,`invalid`,`pending`) | set on import |

### Campaign  *(index: {organizationId}, {status})*
| field | type | notes |
|---|---|---|
| organizationId | ObjectId | |
| aiEmployeeId | ObjectId→(outbound employee) | |
| name | string | |
| callingSchedule | subdoc `{ tz, days[], start, end }` | |
| retryAttempts | number | default 0 |
| retryInterval | number(minutes) | |
| dailyCallLimit | number | |
| status | enum(`draft`,`running`,`paused`,`completed`) | default `draft` |
| stats | subdoc `{ total, attempted, connected, failed }` | denormalized counters |

### Call  *(index: {organizationId, createdAt}, {campaignId})*
| field | type | notes |
|---|---|---|
| organizationId | ObjectId | |
| aiEmployeeId | ObjectId | |
| direction | enum(`inbound`,`outbound`) | |
| from | string | |
| to | string | |
| contactId | ObjectId? | outbound |
| campaignId | ObjectId? | outbound |
| startedAt | Date | |
| endedAt | Date? | |
| durationSec | number | |
| outcome | enum(`completed`,`transferred`,`no_answer`,`failed`) | |
| escalated | boolean | inbound handoff to human |
| transcript | `[{ role: 'ai'|'customer', text, at }]` | |
| provider | enum(`mock`,`vapi`) | |

### UsageRecord  *(index: {organizationId, billedAt})*
| field | type | notes |
|---|---|---|
| organizationId | ObjectId | |
| callId | ObjectId→Call | unique (idempotent metering) |
| minutes | number | `ceil(durationSec/60)` |
| rateUsd | number | from `RATE_USD_PER_MINUTE` (0.10) |
| amountUsd | number | `minutes * rateUsd` |
| billedAt | Date | |

---

## 5. AI Employee Lifecycle State Machine

Central to correctness. Implemented in `server/src/modules/aiEmployees/lifecycle.ts` as an
explicit `transitions` map + guard functions. Wizard step endpoints request transitions; illegal
transitions return `409 CONFLICT`.

**States:** `draft → knowledge_added → responsibilities_set → billing_added → tested → active`
Inbound inserts `phone_configured` before `billing_added`.
Outbound inserts `contacts_uploaded → campaign_created` between `tested` and `active`.

**Guards (must all pass to reach `active`):**
- Common: ≥1 KnowledgeItem, ≥1 enabled Responsibility, payment method present, `tested === true`
  (owner completed ≥1 interview session and clicked "Mark as tested").
- Inbound extra: `businessPhoneNumber` + `escalationNumber` set (valid E.164).
- Outbound extra: campaign exists with ≥1 `valid` contact; launch transitions campaign → `running`.

`activate` / `launch` endpoints call `assertCanActivate(employee)` which throws a structured
`ApiError(409, 'PRECONDITION_FAILED', missing[])` listing exactly what's missing (drives UI hints).

---

## 6. Backend API Contracts

Base path `/api`. All responses `{ data }` or `{ error: { code, message, details? } }`.
All non-auth routes require `Authorization: Bearer <access>` and are org-scoped.

### Auth (`/api/auth`)
- `POST /register` `{ orgName, name, email, password }` → creates Organization + owner User → `{ user, tokens }`.
- `POST /login` `{ email, password }` → `{ user, tokens }`.
- `POST /refresh` `{ refreshToken }` → rotates → `{ tokens }`.
- `POST /logout` → clears refresh hash → `204`.
- `GET /me` → `{ user, organization }`.

### AI Employees (`/api/ai-employees`)
- `POST /` `{ type, name, department, language, voice, workingHours }` → creates `draft`.
- `GET /` `?type=&status=&page=` → paginated list.
- `GET /:id` → employee + counts (knowledge, responsibilities).
- `PATCH /:id` → update editable config (also used by interview live-edit).
- `DELETE /:id`.
- `PATCH /:id/phone` `{ businessPhoneNumber, escalationNumber }` → validates E.164 → advances lifecycle.
- `PATCH /:id/billing` → marks billing step done (payment method placeholder at org level).
- `POST /:id/mark-tested` → sets `tested=true` after interview.
- `POST /:id/activate` → runs guards → `active` (inbound) or requires campaign (outbound).

### Knowledge (`/api/ai-employees/:id/knowledge`)
- `POST /` multipart or JSON: text kinds `{ kind, title, content }`; file kinds → multer → parse pipeline
  (`pdf-parse`/`mammoth`/`csv-parse`/`xlsx`) → `parsedText` → chunk → store.
- `GET /` → list. `DELETE /:knowledgeId`.

### Responsibilities (`/api/ai-employees/:id/responsibilities`)
- `GET /presets` → catalog (from doc: Answer questions, Book appointments, Generate leads, Qualify
  customers, Collect info, Explain products, Transfer calls, Schedule callbacks, Answer FAQs, Record
  complaints, "Never discount without approval", Escalate angry customers, End calls professionally).
- `PUT /` `{ items: [{label, kind, enabled}] }` → replace set → advances lifecycle.

### Contacts (`/api/contacts`)
- `POST /upload` multipart (CSV/XLSX) → parse → normalize+validate phones (libphonenumber) →
  returns `{ imported, invalid: [{ row, reason }] }`; stores contacts with `validationStatus`.
- `POST /` manual `{ name, phone, email?, company?, tags?, notes? }`.
- `GET /` `?campaignId=&validationStatus=&page=`.

### Campaigns (`/api/campaigns`)
- `POST /` `{ name, aiEmployeeId, contactFilter, callingSchedule, retryAttempts, retryInterval, dailyCallLimit }`.
- `GET /`, `GET /:id` (with stats).
- `PATCH /:id` (edit while `draft`/`paused`), `POST /:id/pause`, `POST /:id/resume`.
- `POST /:id/launch` → guard (tested employee + ≥1 valid contact) → `running` → starts **mock runner**.

### Interview (`/api/ai-employees/:id/interview`)
- `POST /message` `{ sessionId?, message }` → `promptCompiler` builds system prompt from employee
  config + enabled responsibilities + knowledge chunks → `VoiceEngine`/Claude → `{ sessionId, reply }`.
  Config edits between turns are reflected immediately (prompt recompiled each turn).

### Billing (`/api/billing`)
- `GET /usage` `?from=&to=` → `{ totalMinutes, totalUsd, byEmployee[], byDay[] }` (aggregation pipeline).
- `GET /estimate` → projected monthly cost from recent usage.

### Voice webhooks (`/api/voice/webhook`) — Phase 2 real; Phase 1 mock emits internally
- Normalizes provider events → upserts `Call`, and on call-end writes idempotent `UsageRecord`.

---

## 7. Voice Engine (isolation boundary)

```ts
// server/src/voice/VoiceEngine.ts
export interface CallEvent {
  externalCallId: string;
  status: 'started' | 'in_progress' | 'ended';
  durationSec?: number;
  outcome?: 'completed' | 'transferred' | 'no_answer' | 'failed';
  transcript?: { role: 'ai' | 'customer'; text: string; at: string }[];
  escalated?: boolean;
}

export interface VoiceEngine {
  syncAssistant(employee, knowledge, responsibilities): Promise<{ assistantId: string }>;
  provisionInboundNumber(employee): Promise<{ phoneNumber: string }>;
  startOutboundCall(employee, contact, campaign): Promise<{ externalCallId: string }>;
  interviewTurn(employee, systemPrompt, history, message): Promise<{ reply: string }>;
  handleWebhook(payload: unknown): Promise<CallEvent>;
}
```

- **MockVoiceEngine (Phase 1):**
  - `interviewTurn` → **real Claude call** (`@anthropic-ai/sdk`) so testing genuinely works.
  - `startOutboundCall` → schedules a fake call that, after a random short delay, emits a synthetic
    `CallEvent` (random duration 30–240s, weighted outcome) → central handler writes `Call` + `UsageRecord`.
  - `provisionInboundNumber` → returns a fake `+1XXX` number; a dev-only `POST /api/dev/simulate-inbound`
    lets you trigger a mock inbound call for demos.
  - `syncAssistant` → no-op returning a generated id.
- **Central event handler** (`voice/handleCallEvent.ts`) is provider-agnostic: it's what both Mock and
  Vapi feed into, so metering/transcript/stat logic lives in one place.
- **Phase 2 swap:** implement `VapiVoiceEngine`, set `VOICE_PROVIDER=vapi`. No changes outside `voice/`.

---

## 8. Interview Prompt Compiler

`server/src/modules/interview/promptCompiler.ts`:
- Inputs: employee (name/department/language/tone/behavior/rules), enabled responsibilities, top-K
  knowledge chunks (Phase 1 = all chunks concatenated with a size cap; Phase 2 = embedding retrieval).
- Output: a system prompt instructing the model to role-play the AI employee, obey responsibilities as
  rules (e.g. "Never provide discounts without approval", "Escalate angry customers", "End every call
  professionally"), use company knowledge as the primary source, and stay in the configured language/tone.
- Recompiled every turn → live config edits during interview take effect immediately (matches the doc's
  "continuously modify… repeat unlimited times").

---

## 9. Frontend Details

- **Routing:** `/login`, `/register`, `/` (dashboard), `/employees`, `/employees/new` (type chooser →
  wizard), `/employees/:id`, `/contacts`, `/campaigns`, `/campaigns/new`, `/analytics`, `/billing`.
  `ProtectedRoute` gates everything behind auth; unauth → `/login`.
- **Wizard engine (`features/wizard`):** a `WizardShell` driven by an ordered **step registry** keyed by
  employee type. Each step = `{ id, title, Component, validate, canAdvance }`. Progress via `Stepper`.
  Draft auto-saved to backend on each step (employee is created at step 1, then PATCHed).
  - Inbound registry: Create → Knowledge → Responsibilities → BusinessPhone → EscalationNumber →
    Billing → Interview → Activate.
  - Outbound registry: Create → Knowledge → Responsibilities → Billing → Interview → ContactList →
    Campaign → Launch.
  - **Steps reuse the same components** (Create, Knowledge, Responsibilities, Billing, Interview shared).
- **Interview screen:** chat panel (text now, mic-ready UI stub) + right-side live editor for knowledge/
  responsibilities/tone/rules; "Re-test" and "Mark as tested" actions. "Mark as tested" enables Activate.
- **Contacts:** drag-drop CSV/XLSX upload → preview table with per-row validation badges → confirm import.
- **Campaign builder:** pick outbound employee + contact filter + schedule/retry/limit → Launch.
- **Dashboard/Analytics:** KPI cards (Total Calls, Total Minutes, Leads, Appointments), outcome pie,
  calls-per-day line (`recharts`), employee status table — all fed by real endpoints (mock-call data).
- **Billing:** usage table + running total; payment-method form is a non-charging placeholder.
- **Design:** Tailwind, on-brand with the requirement doc's blue (`#3B82F6`-ish) / purple (`#7C3AED`-ish)
  palette; light theme first. Reusable `components/ui` primitives.

---

## 10. Billing Metering Rule

On every call-end event (mock or real), `handleCallEvent` computes `minutes = Math.ceil(durationSec/60)`
and upserts a `UsageRecord` keyed by `callId` (unique index → idempotent even if webhook retries).
`amountUsd = minutes * RATE_USD_PER_MINUTE`. Analytics/billing aggregate via Mongo pipeline.

---

## 11. Build Order (task checklist)

**M1 — Foundation**
- [ ] Root workspaces, `tsconfig.base`, eslint/prettier, `.gitignore`, `docker-compose.yml` (mongo), `.env.example`.
- [ ] `shared` package scaffold (enums, first DTOs/schemas), build wiring.
- [ ] `server` skeleton: `app.ts`, `config/env.ts` (zod), `config/db.ts`, `GET /api/health`, error middleware, logging.
- [ ] `client` skeleton: Vite + Tailwind + router + QueryClient + base UI primitives.
- [ ] `npm run dev` boots both concurrently.

**M2 — Auth + tenancy**
- [ ] User/Organization models; auth service (bcrypt, JWT access/refresh, rotation).
- [ ] `register/login/refresh/logout/me`; `auth` + `rbac` middleware.
- [ ] Client: Register/Login pages, `authStore`, axios interceptor (attach token, refresh on 401), ProtectedRoute.

**M3 — AI Employee core**
- [ ] AIEmployee model + `lifecycle.ts` (transitions + guards).
- [ ] CRUD + wizard-step endpoints; unit tests for illegal transitions.
- [ ] Client: employee list, type chooser, WizardShell + Create step + Stepper.

**M4 — Knowledge + Responsibilities**
- [ ] KnowledgeItem model; upload (multer) + parsers (pdf/docx/csv/xlsx/txt) + chunker.
- [ ] Responsibility model + preset catalog + PUT replace.
- [ ] Client: Knowledge step (text + file upload + list), Responsibilities step (presets + custom toggle).

**M5 — Interview / Testing**
- [ ] `promptCompiler`; `MockVoiceEngine.interviewTurn` → Claude; interview endpoints (session mgmt).
- [ ] `POST /:id/mark-tested`.
- [ ] Client: Interview chat + live config editor + Mark-as-tested.

**M6 — Inbound completion**
- [ ] Phone/escalation endpoints (E.164 validation), billing placeholder, `activate` guard.
- [ ] `MockVoiceEngine.provisionInboundNumber` + dev simulate-inbound; `handleCallEvent` → Call + UsageRecord.
- [ ] Client: BusinessPhone, EscalationNumber, Billing, Activate steps + success state.

**M7 — Outbound**
- [ ] Contact model + upload/validate (libphonenumber) + manual entry; Campaign model + builder + launch guard.
- [ ] Mock campaign runner (respects dailyCallLimit/schedule; emits mock calls → metering).
- [ ] Client: Contacts page + upload preview; Campaign builder + Launch; ContactList/Campaign wizard steps.

**M8 — Dashboard / Analytics / Billing**
- [ ] Aggregation endpoints (`/billing/usage`, dashboard KPIs); client KPI cards + charts + tables.

**M9 — Hardening**
- [ ] Vitest + Supertest: auth, lifecycle guards, contact-upload validation, billing math (`ceil(sec/60)*0.10`), idempotent metering.
- [ ] README (setup/run), seed script (demo org + sample employees/contacts).

---

## 12. Verification / Acceptance

- **Boot:** `docker compose up -d` → `npm run dev` → `GET /api/health` 200; client loads at `:5173`.
- **E2E happy path:**
  1. Register business → empty dashboard.
  2. **Inbound:** finish all 7 steps. Confirm `activate` **fails with 409 + missing[]** before interview
     is done; after "Mark as tested" it succeeds. Trigger dev simulate-inbound → a `Call` + a
     `UsageRecord` (minutes × $0.10) appear in analytics/billing.
  3. **Outbound:** build employee, upload CSV incl. one bad number → confirm it's flagged `invalid`;
     create + launch campaign → mock runner produces calls respecting `dailyCallLimit`; metering recorded.
  4. **Interview:** send messages; edit a responsibility/knowledge item mid-session; confirm the next
     reply reflects the change (prompt recompiled).
- **Automated:** the M9 test suite is green.
- **Phase-2 readiness:** swapping `VOICE_PROVIDER=mock→vapi` requires code changes **only under
  `server/src/voice/`** — verified by grepping imports of `VoiceEngine` outside that folder.

---

## 13. Explicitly Deferred to Phase 2+

- Real telephony/voice loop (Vapi/Retell/Bland or Twilio + OpenAI Realtime) via `VapiVoiceEngine`.
- Real payment charging (Stripe) — Phase 1 stores a placeholder method only.
- Embedding-based RAG retrieval over knowledge chunks (schema field already reserved).
- CRM import for contacts; Google OAuth; multi-language voice tuning; advanced analytics/reporting.
- GDPR tooling (data export/delete) — noted as "planned" in the requirement doc.

---

## 14. Open Questions (safe defaults chosen; confirm at kickoff)

1. Scope = "full app, calls mocked"? (default: **yes**)
2. Phase-2 voice provider — Vapi / Retell / Bland / Twilio+OpenAI Realtime? (default: **Vapi adapter**)
3. Stack = TypeScript monorepo? (default: **yes**)
4. Interview LLM = Claude (Sonnet 5 default, Opus for hard tests)? (default: **Claude Sonnet 5**)
5. Design — start fresh on the requirement doc's blue/purple palette, or match an existing brand system?
   (default: **fresh, on-brand**)
