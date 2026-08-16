import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Megaphone,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { CtaButton, MarketingLayout } from '../../components/MarketingLayout';

const features = [
  {
    icon: PhoneCall,
    title: 'AI voice employees',
    text: 'Inbound receptionists and outbound campaigns that talk to your customers 24/7 — trained on your business.',
  },
  {
    icon: Megaphone,
    title: 'Connect your ad platforms',
    text: 'Link Google Ads and Meta Ads. Vorizon runs and optimizes campaigns and pulls leads straight in.',
  },
  {
    icon: Sparkles,
    title: 'AI lead qualification',
    text: 'Every lead is scored and qualified automatically, then handed to a call or WhatsApp follow-up.',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp & messaging',
    text: 'Reach leads on WhatsApp and Instagram, and follow up over email — all from one place.',
  },
  {
    icon: Users,
    title: 'Sync to your CRM',
    text: 'Push qualified leads and deals to Zoho, Salesforce or HubSpot automatically.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance built in',
    text: 'Consent tracking, Do-Not-Call enforcement and opt-outs on every dial — TCPA-ready.',
  },
];

const loop = [
  'Ad platform',
  'Lead captured',
  'AI qualifies',
  'AI calls / WhatsApp',
  'CRM updated',
  'Conversion',
];

const connectors = ['Google Ads', 'Meta Ads', 'WhatsApp', 'Instagram', 'Zoho', 'Salesforce', 'Gmail', 'Calendar'];

export function LandingPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brand-purple/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-brand-blue/25 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
            <Sparkles className="h-3.5 w-3.5" /> AI sales agents for modern businesses
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Hire AI employees. Grow without limits.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            Connect Google Ads and Meta Ads, capture every lead, and let AI qualify, call and follow
            up — then push it all to your CRM. Vorizon automates your entire sales loop.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <CtaButton to="/register">
              Get started <ArrowRight className="ml-2 h-4 w-4" />
            </CtaButton>
            <Link
              to="/pricing"
              className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">Prepaid · pay only for what you use · no monthly fees</p>
        </div>
      </section>

      {/* Closed loop */}
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-slate-400">
            One automated loop, from ad to revenue
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {loop.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  {step}
                </div>
                {i < loop.length - 1 && <ArrowRight className="h-4 w-4 text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Everything your sales team does — automated</h2>
          <p className="mt-3 text-slate-500">
            From the first ad click to a booked deal, Vorizon handles the busywork so you close more.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 text-brand-blue">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Connectors */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Connect the tools you already use
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {connectors.map((c) => (
              <span
                key={c}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / trust */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
          {[
            { icon: PhoneCall, stat: '24/7', label: 'AI calling, inbound & outbound' },
            { icon: BarChart3, stat: '$0.10', label: 'per conversation minute — that’s it' },
            { icon: Users, stat: '8+', label: 'ad, CRM & messaging integrations' },
          ].map((s) => (
            <div key={s.label}>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <s.icon className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{s.stat}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">Ready to hire your first AI employee?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Set up in minutes. Connect your platforms, add funds, and let Vorizon run your sales.
          </p>
          <div className="mt-8">
            <CtaButton to="/register">
              Join us <ArrowRight className="ml-2 h-4 w-4" />
            </CtaButton>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
