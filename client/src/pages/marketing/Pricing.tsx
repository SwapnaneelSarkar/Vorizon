import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Check,
  HelpCircle,
  Layers,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { CtaButton, MarketingLayout } from '../../components/MarketingLayout';
import { cn } from '../../lib/utils';

interface PlanFeature {
  text: string;
  highlight?: boolean;
}

const payAsYouGoFeatures: PlanFeature[] = [
  { text: 'Inbound & outbound AI voice calling' },
  { text: '$0.10 per conversation minute (billed from prepaid wallet)' },
  { text: 'Unlimited AI employees & custom voices' },
  { text: 'Live call transcripts, recordings & summaries' },
  { text: 'Real-time sentiment & dynamic objection handling' },
  { text: 'Human escalation & live transfer to phone numbers' },
  { text: 'TCPA compliance (recording disclosure, consent, DNC list)' },
  { text: 'No monthly commitment — pay only for what you talk' },
];

const standardPlanFeatures: PlanFeature[] = [
  { text: 'Everything in Pay As You Go, plus:', highlight: true },
  { text: 'Connect Google Ads with instant lead capture & sync', highlight: true },
  { text: 'Connect Meta Ads (Facebook & Instagram) & WhatsApp', highlight: true },
  { text: 'Offline conversion tracking fed back to Google Ads', highlight: true },
  { text: 'Full bidirectional CRM sync (Zoho, Salesforce, HubSpot)', highlight: true },
  { text: 'Multi-channel outbound campaigns & list automation' },
  { text: 'Automated AI lead qualification pipeline' },
  { text: 'Webhooks & custom marketing workflow integrations' },
  { text: 'Voice calling available at standard $0.10/min usage rate' },
  { text: 'Priority support & campaign setup assistance' },
];

const comparisonRows = [
  {
    category: 'Platform & Integrations',
    features: [
      { name: 'Google Ads lead capture & campaign sync', payg: false, standard: true },
      { name: 'Meta Ads & WhatsApp connectors', payg: false, standard: true },
      { name: 'CRM Sync (Zoho, Salesforce, HubSpot)', payg: false, standard: true },
      { name: 'Offline conversion feedback to Google Ads', payg: false, standard: true },
      { name: 'Webhooks & custom integrations', payg: false, standard: true },
    ],
  },
  {
    category: 'AI Voice & Calling',
    features: [
      { name: 'Inbound AI reception & answering', payg: true, standard: true },
      { name: 'Outbound AI calling campaigns', payg: true, standard: true },
      { name: 'Per-minute call rate', payg: '$0.10 / min', standard: '$0.10 / min' },
      { name: 'Unlimited AI employees & knowledge bases', payg: true, standard: true },
      { name: 'Live transcripts & call recordings', payg: true, standard: true },
      { name: 'Live human transfer & escalation', payg: true, standard: true },
    ],
  },
  {
    category: 'Compliance & Support',
    features: [
      { name: 'TCPA consent gate & DNC list enforcement', payg: true, standard: true },
      { name: 'Custom call recording disclosures', payg: true, standard: true },
      { name: 'Prepaid wallet (top up anytime)', payg: true, standard: true },
      { name: 'Support tier', payg: 'Standard email', standard: 'Priority & Onboarding' },
    ],
  },
];

const faqs = [
  {
    q: 'How are the two plans structured?',
    a: 'We offer two transparent pricing options: (1) The Standard Plan ($30 USD/month) is our standard subscription for connecting Google Ads, Meta Ads, CRM integrations, and running full lead capture automations. (2) The Pay As You Go plan ($0.10/minute) is usage-based calling billed from your prepaid wallet for teams needing AI phone agents with no monthly platform fee.',
  },
  {
    q: 'How does Google Ads integration work with the Standard Plan?',
    a: 'With the $30/month Standard Plan, Vorizon connects directly to your Google Ads account. When a user submits an ad lead or form, your AI employee reaches out within seconds to qualify the lead, books a demo directly onto your calendar, and pushes the qualified conversion status back to Google Ads to improve your ad performance and ROI.',
  },
  {
    q: 'How do call minutes work under the Standard Plan?',
    a: 'Under the Standard Plan ($30/mo), all voice conversations are metered at the standard $0.10 per conversation minute rate and debited directly from your prepaid wallet balance. You never pay for unspent minutes or dropped calls.',
  },
  {
    q: 'Can I start with Pay As You Go and upgrade later?',
    a: 'Absolutely! You can begin with Pay As You Go to test AI phone agents on your direct numbers or contact lists, and subscribe to the Standard Plan ($30/mo) whenever you are ready to link Google Ads, Meta, and CRM pipelines.',
  },
  {
    q: 'How does the prepaid wallet work?',
    a: 'You add funds to your wallet (for example, adding $10 gives you roughly 100 conversation minutes). When your balance runs low, we send an automated notification. If it runs out, calling pauses until topped up. There are no surprise overages.',
  },
  {
    q: 'Are there any setup fees or hidden contracts?',
    a: 'None. There are no setup fees, activation charges, or long-term contracts. You can change your plan or cancel at any time directly from your Billing settings.',
  },
];

export function PricingPage() {
  const [estimatedMinutes, setEstimatedMinutes] = useState(300);

  const voiceCost = Math.round(estimatedMinutes * 0.1);
  const standardTotal = 30 + voiceCost;

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
            Choose the plan that fits your growth
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            From Google Ads integration and marketing automation to pure pay-as-you-go AI voice
            calling — pay only for what powers your revenue.
          </p>
        </section>

        {/* Pricing Cards Grid */}
        <section className="mx-auto mt-14 max-w-6xl px-6">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
            {/* Plan 1: Pay As You Go */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-card transition-all duration-200 hover:shadow-card-hover sm:p-10">
              <div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <PhoneCall className="h-3.5 w-3.5 text-slate-600" />
                    Pay As You Go
                  </div>
                  <span className="text-xs font-medium text-slate-500">No monthly contract</span>
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-extrabold tracking-tight text-slate-900">$0.10</span>
                    <span className="text-xl font-semibold text-slate-500">/ min</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Per conversation minute · Prepaid wallet · Zero waste
                  </p>
                </div>

                <p className="mt-5 border-t border-slate-100 pt-5 text-sm text-slate-600">
                  Ideal for businesses needing pure AI phone agents for inbound reception and outbound
                  calling with no monthly commitment.
                </p>

                <div className="mt-6 space-y-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    What’s included:
                  </p>
                  <ul className="space-y-3">
                    {payAsYouGoFeatures.map((f) => (
                      <li key={f.text} className="flex items-start gap-3 text-sm text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <Link
                  to="/register"
                  className="flex w-full items-center justify-center rounded-xl border-2 border-slate-900 bg-white py-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-900 hover:text-white"
                >
                  Start Pay As You Go
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <p className="mt-2.5 text-center text-xs text-slate-400">
                  Example: add $10 → roughly 100 conversation minutes
                </p>
              </div>
            </div>

            {/* Plan 2: Standard Plan ($30/mo) - Featured */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-brand-purple bg-white p-8 shadow-xl transition-all duration-200 hover:shadow-2xl sm:p-10">
              {/* Popular Badge */}
              <div className="absolute right-6 top-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-blue to-brand-purple px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                  <Sparkles className="h-3 w-3" /> Most Popular
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-purple">
                    <Layers className="h-3.5 w-3.5" />
                    Standard Platform
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-extrabold tracking-tight text-slate-900">$30</span>
                    <span className="text-xl font-semibold text-slate-500">/ month</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-brand-purple">
                    Standard price for connecting Google Ads & full product access
                  </p>
                </div>

                <p className="mt-5 border-t border-slate-100 pt-5 text-sm text-slate-600">
                  The standard complete package for marketing teams. Connect Google Ads, Meta Ads,
                  CRMs, automate lead qualification, and close more deals.
                </p>

                <div className="mt-6 space-y-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Everything in Standard:
                  </p>
                  <ul className="space-y-3">
                    {standardPlanFeatures.map((f) => (
                      <li
                        key={f.text}
                        className={cn(
                          'flex items-start gap-3 text-sm',
                          f.highlight ? 'font-medium text-slate-900' : 'text-slate-700',
                        )}
                      >
                        <Check
                          className={cn(
                            'mt-0.5 h-4 w-4 shrink-0',
                            f.highlight ? 'text-brand-purple' : 'text-emerald-500',
                          )}
                        />
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <CtaButton to="/register">
                  <span className="flex w-full items-center justify-center font-bold">
                    Get started with Standard ($30/mo)
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </CtaButton>
                <p className="mt-2.5 text-center text-xs text-slate-400">
                  Includes Google Ads connector · Voice calls billed at $0.10/min
                </p>
              </div>
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
                  Estimate your monthly investment
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

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Standard Platform
                </p>
                <p className="mt-2 text-3xl font-extrabold text-white">$30</p>
                <p className="mt-1 text-xs text-slate-400">Google Ads & full product sync</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  AI Voice Minutes ({estimatedMinutes}m @ $0.10)
                </p>
                <p className="mt-2 text-3xl font-extrabold text-blue-400">${voiceCost}</p>
                <p className="mt-1 text-xs text-slate-400">Usage-based prepaid wallet</p>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Total Monthly Cost
                </p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-300">${standardTotal}</p>
                <p className="mt-1 text-xs text-emerald-400/80">Replaces $3,000+ in human SDR costs</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison Matrix */}
        <section className="mx-auto mt-24 max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Compare Plan Features</h2>
            <p className="mt-2 text-base text-slate-500">
              Detailed breakdown of features across both plans
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-6 py-4 font-bold text-slate-900">Features</th>
                    <th className="px-6 py-4 font-bold text-slate-900">
                      Pay As You Go <span className="block text-xs font-normal text-slate-500">$0.10/min</span>
                    </th>
                    <th className="bg-purple-50/50 px-6 py-4 font-bold text-brand-purple">
                      Standard Plan <span className="block text-xs font-normal text-brand-purple/80">$30/mo</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonRows.map((cat) => (
                    <Fragment key={cat.category}>
                      <tr className="bg-slate-100/60 font-semibold text-slate-800">
                        <td colSpan={3} className="px-6 py-2.5 text-xs uppercase tracking-wider text-slate-600">
                          {cat.category}
                        </td>
                      </tr>
                      {cat.features.map((row) => (
                        <tr key={row.name} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3.5 font-medium text-slate-700">{row.name}</td>
                          <td className="px-6 py-3.5 text-slate-600">
                            {typeof row.payg === 'boolean' ? (
                              row.payg ? (
                                <Check className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <span className="text-slate-300">—</span>
                              )
                            ) : (
                              <span className="font-semibold text-slate-800">{row.payg}</span>
                            )}
                          </td>
                          <td className="bg-purple-50/30 px-6 py-3.5 text-slate-800">
                            {typeof row.standard === 'boolean' ? (
                              row.standard ? (
                                <Check className="h-5 w-5 text-brand-purple" />
                              ) : (
                                <span className="text-slate-300">—</span>
                              )
                            ) : (
                              <span className="font-bold text-brand-purple">{row.standard}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="mx-auto mt-24 max-w-3xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Frequently Asked Questions</h2>
            <p className="mt-2 text-base text-slate-500">
              Everything you need to know about Vorizon plans and billing
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
