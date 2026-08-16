import { Check } from 'lucide-react';
import { CtaButton, MarketingLayout } from '../../components/MarketingLayout';

const included = [
  'Unlimited AI employees (inbound & outbound)',
  'Connect Google Ads, Meta Ads, WhatsApp & more',
  'AI lead capture and qualification',
  'CRM sync (Zoho, Salesforce, HubSpot)',
  'Compliance tools (consent, DNC, opt-out)',
  'Live analytics and call transcripts',
];

const faqs = [
  {
    q: 'How does billing work?',
    a: 'Vorizon is prepaid. You add funds to your wallet and calls are billed at $0.10 per conversation minute. When your balance runs low we email you; if it runs out, calling pauses until you top up.',
  },
  {
    q: 'Are there monthly fees?',
    a: 'No. There are no subscriptions or platform fees — you only pay for the conversation minutes you use.',
  },
  {
    q: 'Do connectors cost extra?',
    a: 'No. Connecting your ad platforms, CRM and messaging tools is included. You only pay your own ad spend on those platforms directly.',
  },
  {
    q: 'What do I need to start?',
    a: 'Create an account, connect a platform or upload contacts, add funds, and launch. Setup takes a few minutes.',
  },
];

export function PricingPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Simple, usage-based pricing</h1>
          <p className="mt-4 text-lg text-slate-500">
            Pay only for the conversations your AI actually has. No subscriptions, no surprises.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-lg">
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-card-hover">
            <div className="bg-gradient-to-br from-brand-blue to-brand-purple px-8 py-10 text-center text-white">
              <p className="text-sm font-medium uppercase tracking-wider text-white/80">Pay as you go</p>
              <p className="mt-3 text-5xl font-bold">
                $0.10<span className="text-lg font-medium text-white/80"> / min</span>
              </p>
              <p className="mt-2 text-sm text-white/80">per conversation minute · prepaid wallet</p>
            </div>
            <div className="bg-white px-8 py-8">
              <ul className="space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 text-center">
                <CtaButton to="/register">Get started</CtaButton>
                <p className="mt-3 text-xs text-slate-400">
                  Example: add $10 → roughly 100 conversation minutes.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">Frequently asked questions</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="font-semibold text-slate-900">{f.q}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
