# Integrations

How Vorizon's external integrations work, what to configure, and how to set each one up.
All secrets live in environment variables (`server/.env`, gitignored) — never in code, never
sent to the browser. Every integration degrades gracefully when unconfigured so local
development works with zero external accounts.

| Integration | Env vars | When unset |
|---|---|---|
| Telephony compliance | — (per-org settings in DB) | Always on |
| Resend (email) | `RESEND_API_KEY`, `EMAIL_FROM`, `APP_BASE_URL` | Emails skipped (logged) |
| Razorpay (payments) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Payment APIs return 503 |
| Retell AI (voice) | `RETELL_API_KEY`, `RETELL_AGENT_ID`, `RETELL_FROM_NUMBER`, `VOICE_PROVIDER=retell`, `RETELL_VERIFY_WEBHOOK` | Mock voice engine simulates calls |

---

## 1. Telephony compliance (TCPA & friends)

Server: `server/src/modules/compliance/` · Client: Settings → Telephony Compliance

Designed as a modular gate in front of the calling pipeline; each piece is configurable
per organization and every action is written to the audit log.

**User consent** — AI calling is disabled until an owner/admin checks the consent box
(`POST /api/compliance/consent`, an explicit `accepted: true` is required by the schema).
The org stores **status, timestamp, accepting user, and IP address**. Campaign launch
returns `409 PRECONDITION_FAILED` until consent exists, and the campaign runner re-verifies
it at run time (defense in depth).

**Do Not Call (DNC)** — `DncEntry` collection, unique per (org, E.164 phone). Managed from
the Settings UI or via `GET/POST /api/compliance/dnc`, `DELETE /api/compliance/dnc/:id`.
The campaign runner re-checks every number against the DNC list **immediately before each
dial**, so numbers added mid-campaign are honored. Skipped dials are logged and audited.

**Opt-out** — `POST /api/compliance/opt-out { phone }` adds the number to the DNC list
(reason `opt_out`) and flags every matching contact (`optedOut`), which excludes them from
all future campaign queries. Available per-contact in the Contacts UI (phone-off icon), and
automatically from calls: if the Retell agent's post-call analysis sets
`opt_out_requested: true`, the webhook opts the number out (see §4).

**Call recording disclosure** — configurable per org (enable/disable + message) for
jurisdictions that require it. When enabled, the runner passes the text to the voice engine;
the Retell agent receives it as the `{{recording_disclosure}}` dynamic variable to announce
at call start.

---

## 2. Resend (transactional email)

Server: `server/src/modules/email/` (`email.service.ts` + `templates.ts`)

```env
RESEND_API_KEY=re_xxxxxxxx            # resend.com → API Keys
EMAIL_FROM=CrowdBuzz <onboarding@resend.dev>
EMAIL_REPLY_TO=crowdbuzz.company@gmail.com   # replies land here (any address)
APP_BASE_URL=http://localhost:5173    # used for links inside emails
```

Reusable functions, all built on one `sendEmail()` core that **never throws** (an email
failure must never break registration, payment, or a campaign — failures are logged):

- `sendWelcomeEmail(to, name)` — sent on registration
- `sendOtpEmail(to, code, purpose)` — generic 6-digit code
- `sendPasswordResetEmail(to, code)` — used by `POST /api/auth/forgot-password` /
  `POST /api/auth/reset-password` (OTP is stored hashed, expires in 15 min, single-use,
  and resets never reveal whether an email exists)
- `sendNotificationEmail(to, heading, message, cta?)` — e.g. campaign-completion summary
  to the org owner, payment receipts

**Sender note:** Resend only sends from **verified** senders. `crowdbuzz.company@gmail.com`
is the account email, but Gmail addresses cannot be verified as senders (you can't add DNS
records for gmail.com). The working pattern: `EMAIL_FROM=CrowdBuzz <onboarding@resend.dev>`
(verified sender, your brand as display name) + `EMAIL_REPLY_TO=crowdbuzz.company@gmail.com`
so replies reach your inbox. On the free tier without a verified domain, Resend delivers
only to the account's own email (crowdbuzz.company@gmail.com) — fine for testing. To email
arbitrary recipients, verify a domain in Resend → Domains, then set
`EMAIL_FROM=CrowdBuzz <no-reply@yourdomain.com>`.

---

## 3. Razorpay (payments)

Server: `server/src/modules/payments/` · Client: Billing page

```env
RAZORPAY_KEY_ID=rzp_live_...     # Dashboard → Account & Settings → API Keys
RAZORPAY_KEY_SECRET=...          # server-side only, never sent to the client
RAZORPAY_WEBHOOK_SECRET=...      # Dashboard → Settings → Webhooks
```

Flow (amounts in paise, INR):

1. **Order** — `POST /api/payments/order { amountInr }` (owner/admin) creates a Razorpay
   order via the SDK and persists a `Payment` (`created`). The response contains only the
   order id + public `keyId` — the secret stays server-side.
2. **Checkout** — the Billing page loads `checkout.razorpay.com/v1/checkout.js` and opens
   the payment modal.
3. **Success flow** — Checkout returns `(order_id, payment_id, signature)`; the client posts
   them to `POST /api/payments/verify`. The server recomputes
   `HMAC-SHA256(order_id|payment_id, key_secret)` (timing-safe compare) and only then marks
   the payment `paid`, sets the org's `billingStatus=active`, writes an audit entry, and
   emails a receipt. Cross-org verification is rejected.
4. **Failure flow** — Checkout failures/dismissals hit `POST /api/payments/failed` and are
   recorded with the reason. A captured payment is never downgraded by a late failure event.
5. **Webhook** — `POST /api/payments/webhook` (no JWT; authenticity = HMAC of the **raw
   body** with the webhook secret). Handles `payment.captured` / `payment.failed`
   idempotently, so payments confirm even if the user closes the tab before step 3.

Setup: create a webhook in the Razorpay dashboard pointing to
`https://<your-api>/api/payments/webhook` with events `payment.captured` + `payment.failed`,
and put its secret in `RAZORPAY_WEBHOOK_SECRET`.

> ⚠️ The keys currently configured are **live-mode** (`rzp_live_…`): real cards and real
> money. Use `rzp_test_…` keys while developing.

---

## 4. Retell AI (outbound voice)

Server: `server/src/voice/retellClient.ts`, `RetellVoiceEngine.ts`, `retellWebhook.ts`

```env
VOICE_PROVIDER=retell            # switch from mock
RETELL_API_KEY=key_...           # Retell dashboard → API Keys
RETELL_AGENT_ID=agent_...        # create an agent in the dashboard
RETELL_FROM_NUMBER=+1...         # number bought/imported in Retell (outbound caller ID)
RETELL_VERIFY_WEBHOOK=true       # keep on; rejects unsigned webhooks
```

- `RetellClient` is a thin authenticated wrapper over the Retell REST API (Bearer auth,
  15s timeout, every failure logged with status + response body and surfaced as
  `RetellApiError`).
- `RetellVoiceEngine` implements the existing `VoiceEngine` boundary, so nothing outside
  `server/src/voice/` knows which provider is active. Outbound dials go through
  `POST /v2/create-phone-call` with org/campaign/contact ids in `metadata` and
  `{{contact_name}}` / `{{recording_disclosure}}` as dynamic variables for the agent prompt.
- **Webhook** — point the agent's webhook at `https://<your-api>/api/voice/retell/webhook`.
  Signatures (`x-retell-signature`, HMAC-SHA256 of the raw body keyed by the API key) are
  verified before processing. `call_ended` maps the call into the shared metering pipeline
  (Call record, per-minute usage, campaign stats) idempotently — duplicate deliveries are
  ignored. `call_analyzed` powers the automatic opt-out (add a boolean post-call analysis
  field named `opt_out_requested` to your agent).
- With a real engine the campaign runner initiates dials and returns; outcomes arrive via
  the webhook. Mock-mode retry simulation doesn't apply to real calls — relaunch a campaign
  to re-attempt unreached contacts.

Setup order: create the agent (give it a prompt that greets with
`{{recording_disclosure}}` when non-empty) → buy/import a phone number → set the env vars →
`VOICE_PROVIDER=retell` → configure the agent webhook URL.

---

## 5. Exotel (outbound voice — alternative to Retell)

Server: `server/src/voice/exotelClient.ts`, `ExotelVoiceEngine.ts`, `exotelWebhook.ts`

```env
VOICE_PROVIDER=exotel
EXOTEL_API_KEY=...           # API Credentials page
EXOTEL_API_TOKEN=...
EXOTEL_SID=crowdbuzz1        # Account SID
EXOTEL_SUBDOMAIN=api.exotel.com   # or api.in.exotel.com (India cluster)
EXOTEL_CALLER_ID=+91...      # an ExoPhone you own (E.164)
EXOTEL_FLOW_URL=http://my.exotel.com/<sid>/exoml/start_voice/<APP_ID>
EXOTEL_WEBHOOK_TOKEN=...     # shared secret appended to the callback URL
```

How it works: `ExotelVoiceEngine.startOutboundCall` calls Exotel's Connect API
(`/v1/Accounts/<sid>/Calls/connect.json`) to dial the customer and connect them
to a **Call Flow** that runs the Exotel **Voicebot** applet. Call outcomes hit
`/api/voice/exotel/webhook` (authenticated by `?token=` — Exotel does not sign
webhooks) and feed the same metering + compliance pipeline as every other
provider, idempotent on redelivery.

**Key limitation — the AI lives in Exotel, not Vorizon.** Exotel's Voicebot has
no REST API, so its voice/prompt/knowledge are configured in the Exotel
dashboard; the Vorizon wizard's Knowledge/Responsibilities do **not** sync into
it. Vorizon triggers and tracks calls; Exotel owns the conversation.

**Provisioning checklist (all on the Exotel side — required before any real call):**
1. Buy/activate an **ExoPhone** number → set `EXOTEL_CALLER_ID`.
2. Get a paid **Voicebot** plan with minutes (trial shows 0/0 min).
3. Build the bot in Exotel **Voicebot → Build Bot** (voice + knowledge).
4. Create a **Call Flow** (App Bazaar) with the Voicebot applet → set its URL as `EXOTEL_FLOW_URL`.
5. Flip `VOICE_PROVIDER=exotel` and redeploy.

Verified so far: credentials + Connect API auth/shape are accepted live (the API
returns `400 "Could not find the CallerId"`, not `401`) — confirming the only
gap is the provisioning above.

---

## Security notes

- All keys live in `server/.env` (gitignored; `firebase-service-account.json` likewise).
- Webhooks are authenticated by HMAC signatures over the raw request body
  (`express.json`'s `verify` hook captures it) with timing-safe comparison.
- Payment state changes only happen server-side after signature verification; the client
  never sees `RAZORPAY_KEY_SECRET`, `RESEND_API_KEY`, or `RETELL_API_KEY`.
- Every request body is Zod-validated (`@vorizon/shared` schemas); consent, DNC changes,
  opt-outs, and payment transitions are audit-logged.
- Tests force Firebase/email off and use dummy secrets, so `npm test` never touches live
  services.
