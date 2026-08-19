import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, HelpCircle, PhoneCall, Sparkles, Zap } from 'lucide-react';
import { CtaButton, MarketingLayout } from '../../components/MarketingLayout';

interface PlanFeature {
  text: string;
}

const planFeatures: PlanFeature[] = [
  { text: 'Inbound & outbound AI voice calling — $0.08/min from your prepaid wallet' },
  { text: 'Every integration free — Google Ads, Meta Ads, WhatsApp & CRM sync' },
  { text: 'Unlimited AI employees & custom voices' },
  { text: 'Live call transcripts, recordings & summaries' },
  { text: 'Automated AI lead qualification pipeline' },
  { text: 'Offline conversion tracking fed back to Google Ads' },
  { text: 'Real-time sentiment & dynamic objection handling' },
  { text: 'Human escalation & live transfer to phone numbers' },
  { text: 'TCPA compliance (recording disclosure, consent, DNC list)' },
  { text: 'No monthly commitment — pay only for what you talk' },
];

const includedGroups = [
  {
    category: 'Platform & integrations — free',
    features: [
      'Google Ads lead capture & campaign sync',
      'Meta Ads (Facebook & Instagram) & WhatsApp connectors',
      'CRM sync (Zoho, Salesforce, HubSpot)',
      'Offline conversion feedback to Google Ads',
      'Webhooks & custom integrations',
    ],
  },
  {
    category: 'AI voice & calling — $0.08/min',
    features: [
      'Inbound AI reception & answering',
      'Outbound AI calling campaigns',
      'Unlimited AI employees & knowledge bases',
      'Live transcripts & call recordings',
      'Live human transfer & escalation',
    ],
  },
  {
    category: 'Compliance & support',
    features: [
      'TCPA consent gate & DNC list enforcement',
      'Custom call recording disclosures',
      'Prepaid wallet — top up anytime',
      'Standard email support',
    ],
  },
];

const faqs = [
  {
    q: 'How is pricing structured?',
    a: 'One simple plan. Every integration — Google Ads, Meta Ads, WhatsApp, Zoho, Salesforce, HubSpot and more — is free to connect. You only pay for AI conversation minutes, billed at $0.08/minute from a prepaid wallet. No monthly platform fee, no tiers.',
  },
  {
    q: 'Do I need to pay anything to connect my ad platforms or CRM?',
    a: 'No. Connecting Google Ads, Meta Ads, WhatsApp, or any CRM is completely free — you’re only ever billed for AI conversation minutes.',
  },
  {
    q: 'How does Google Ads integration work?',
    a: 'Connecting Google Ads is free and takes a few clicks. When a user submits an ad lead or form, your AI employee reaches out within seconds to qualify the lead, books a demo directly onto your calendar, and pushes the qualified conversion status back to Google Ads to improve your ad performance and ROI.',
  },
  {
    q: 'How do call minutes work?',
    a: 'All voice conversations are metered at $0.08 per conversation minute and debited directly from your prepaid wallet balance. You never pay for unspent minutes or dropped calls.',
  },
  {
    q: 'How does the prepaid wallet work?',
    a: 'You add funds to your wallet (for example, adding $10 gives you roughly 125 conversation minutes). When your balance runs low, we send an automated notification. If it runs out, calling pauses until topped up. There are no surprise overages.',
  },
  {
    q: 'Are there any setup fees or hidden contracts?',
    a: 'None. There are no setup fees, activation charges, or long-term contracts. Add funds whenever you like and stop anytime directly from your Billing settings.',
  },
];

export function PricingPage() {
  const [estimatedMinutes, setEstimatedMinutes] = useState(300);
  const voiceCost = Math.round(estimatedMinutes * 0.08);

  return (
    <MarketingLayout>
      <div className="bg-slate-50/60 pb-24 pt-16">
        {/* Header */}
        <section className="mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-brand-blue shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Transparent, predictable pricing for modern teams</span>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            One plan. Every integration free.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Connecting Google Ads, Meta Ads, WhatsApp and your CRM never costs a thing. Pay only for
            the AI conversation minutes you actually use.
          </p>
        </section>

        {/* Pricing Card */}
        <section className="mx-auto mt-14 max-w-xl px-6">
          <div className="flex flex-col justify-between rounded-3xl border-2 border-brand-purple bg-white p-8 shadow-xl sm:p-10">
            <div>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-purple">
                  <PhoneCall className="h-3.5 w-3.5" />
                  Pay As You Go
                </div>
                <span className="text-xs font-medium text-slate-500">No monthly contract</span>
              </div>

              <div className="mt-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">$0.08</span>
                  <span className="text-xl font-semibold text-slate-500">/ min</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Per conversation minute · Prepaid wallet · Zero waste
                </p>
              </div>

              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-800">
                  Every integration is free to connect — Google Ads, Meta Ads, WhatsApp, Zoho,
                  Salesforce, HubSpot and more.
                </p>
              </div>

              <div className="mt-6 space-y-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  What’s included:
                </p>
                <ul className="space-y-3">
                  {planFeatures.map((f) => (
                    <li key={f.text} className="flex items-start gap-3 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <CtaButton to="/register">
                <span className="flex w-full items-center justify-center font-bold">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </CtaButton>
              <p className="mt-2.5 text-center text-xs text-slate-400">
                Example: add $10 → roughly 125 conversation minutes
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Cost Calculator */}
        <section className="mx-auto mt-20 max-w-4xl px-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 text-white shadow-xl sm:p-12">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400">
                  <Zap className="h-3.5 w-3.5" /> Interactive Estimator
                </span>
                <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  Estimate your monthly cost
                </h2>
              </div>
              <p className="text-sm text-slate-400">100% transparent · No surprises</p>
            </div>

            <div className="mt-8 rounded-2xl bg-white/5 p-6 backdrop-blur border border-white/10">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <label htmlFor="minutes-slider" className="text-sm font-semibold text-slate-200">
                  Estimated AI conversation minutes per month:
                </label>
                <div className="inline-flex items-center gap-1 rounded-lg bg-blue-500/20 px-3 py-1 text-lg font-bold text-blue-300">
                  <span>{estimatedMinutes}</span>
                  <span className="text-xs font-normal text-slate-400">mins/mo</span>
                </div>
              </div>

              <input
                id="minutes-slider"
                type="range"
                min="50"
                max="3000"
                step="50"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
              />

              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>50 mins</span>
                <span>1,000 mins</span>
                <span>2,000 mins</span>
                <span>3,000+ mins</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  AI Voice Minutes ({estimatedMinutes}m @ $0.08)
                </p>
                <p className="mt-2 text-3xl font-extrabold text-blue-400">${voiceCost}</p>
                <p className="mt-1 text-xs text-slate-400">Usage-based prepaid wallet · integrations free</p>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Compared to a human SDR
                </p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-300">$3,000+/mo saved</p>
                <p className="mt-1 text-xs text-emerald-400/80">No salary, benefits, or ramp-up time</p>
              </div>
            </div>
          </div>
        </section>

        {/* What's included breakdown */}
        <section className="mx-auto mt-24 max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Everything that’s included</h2>
            <p className="mt-2 text-base text-slate-500">
              One plan, fully featured — integrations are free, calling is metered.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {includedGroups.map((group) => (
              <div key={group.category} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-purple">
                  {group.category}
                </p>
                <ul className="mt-4 space-y-3">
                  {group.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="mx-auto mt-24 max-w-3xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Frequently Asked Questions</h2>
            <p className="mt-2 text-base text-slate-500">
              Everything you need to know about Vorizon pricing and billing
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-brand-blue" />
                  <div>
                    <h3 className="font-semibold text-slate-900">{f.q}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Need help footer */}
          <div className="mt-12 rounded-2xl border border-blue-100 bg-blue-50/50 p-6 text-center">
            <p className="font-semibold text-slate-900">Have custom requirements or higher call volume?</p>
            <p className="mt-1 text-sm text-slate-600">
              We offer volume discounts and custom dedicated telephony setups for high-throughput enterprises.
            </p>
            <div className="mt-4">
              <Link to="/contact" className="text-sm font-semibold text-brand-blue hover:underline">
                Contact our sales team &rarr;
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
