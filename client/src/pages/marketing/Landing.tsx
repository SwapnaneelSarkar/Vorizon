import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Megaphone,
  MessageSquare,
  PhoneCall,
  Plug,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
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
    text: 'Link Google Ads and Meta Ads. Vorizon runs campaigns and pulls every lead straight in.',
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

const steps = [
  {
    icon: Plug,
    title: 'Connect',
    text: 'Link your ad platforms, CRM and messaging in a few clicks — or upload your contacts.',
  },
  {
    icon: Zap,
    title: 'Automate',
    text: 'AI captures leads, qualifies them, and calls or messages every prospect on your behalf.',
  },
  {
    icon: BarChart3,
    title: 'Convert',
    text: 'Booked appointments and deals sync to your CRM, with conversions fed back to your ads.',
  },
];

const connectors = ['Google Ads', 'Meta Ads', 'WhatsApp', 'Instagram', 'Zoho', 'Salesforce', 'Gmail', 'Calendar'];

/** Stylized product preview shown in the hero — mimics the real dashboard. */
function HeroPreview() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand-blue/30 to-brand-purple/30 blur-2xl" />
      <div className="relative rounded-2xl border border-white/10 bg-slate-800/80 p-4 shadow-2xl backdrop-blur">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-2 text-xs font-medium text-slate-400">Vorizon · Live</span>
        </div>

        {/* KPI row */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Calls today', value: '128' },
            { label: 'Leads', value: '342' },
            { label: 'Conversion', value: '7.5%' },
          ].map((k) => (
            <div key={k.label} className="rounded-lg bg-white/5 px-3 py-2">
              <p className="text-lg font-bold text-white">{k.value}</p>
              <p className="text-[10px] text-slate-400">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Live campaign */}
        <div className="mb-3 rounded-lg bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-white">Q3 Outreach</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-medium text-blue-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" /> running
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-brand-blue to-brand-purple" />
          </div>
        </div>

        {/* Lead being qualified */}
        <div className="space-y-2">
          {[
            { name: 'Priya Sharma', tag: 'AI qualified · Score 87', pill: 'Calling…', tone: 'blue' },
            { name: 'Arjun Mehta', tag: 'Booked appointment', pill: 'Converted', tone: 'emerald' },
          ].map((l) => (
            <div key={l.name} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-white">{l.name}</p>
                <p className="text-[11px] text-slate-400">{l.tag}</p>
              </div>
              <span
                className={
                  l.tone === 'emerald'
                    ? 'rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300'
                    : 'rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-medium text-blue-300'
                }
              >
                {l.pill}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand-purple/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-40 h-[28rem] w-[28rem] rounded-full bg-brand-blue/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div className="animate-fade-up text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              <Sparkles className="h-3.5 w-3.5" /> AI sales agents for modern businesses
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Hire AI employees.{' '}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Grow without limits.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300 lg:mx-0">
              Connect Google Ads and Meta Ads, capture every lead, and let AI qualify, call and
              follow up — then push it all to your CRM. Vorizon automates your entire sales loop.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400 lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> No monthly fees
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Pay only for what you use
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Set up in minutes
              </span>
            </div>
          </div>

          <div className="animate-fade-up">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* Connectors marquee */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Connects with the tools you already use
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {connectors.map((c) => (
              <span key={c} className="text-sm font-semibold text-slate-400">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">How Vorizon works</h2>
          <p className="mt-3 text-slate-500">Three steps from ad spend to booked revenue.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-slate-200/80 bg-white p-7 shadow-card">
              <span className="absolute right-6 top-6 text-4xl font-bold text-slate-100">{i + 1}</span>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-md">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Everything your sales team does — automated
            </h2>
            <p className="mt-3 text-slate-500">
              From the first ad click to a booked deal, Vorizon handles the busywork so you close more.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 text-brand-blue">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closed loop */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">One automated loop, ad to revenue</h2>
          <p className="mt-3 text-slate-500">Every lead flows through the same pipeline — no manual handoffs.</p>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {['Ad platform', 'Lead captured', 'AI qualifies', 'AI calls / WhatsApp', 'CRM updated', 'Conversion'].map(
            (step, i, arr) => (
              <div key={step} className="flex items-center gap-3">
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  {step}
                </div>
                {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-slate-300" />}
              </div>
            ),
          )}
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-14 text-center sm:grid-cols-3">
          {[
            { icon: PhoneCall, stat: '24/7', label: 'AI calling, inbound & outbound' },
            { icon: BarChart3, stat: '$0.10', label: 'per conversation minute — that’s it' },
            { icon: Plug, stat: '10+', label: 'ad, CRM & messaging integrations' },
          ].map((s) => (
            <div key={s.label}>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-blue shadow-card">
                <s.icon className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{s.stat}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full bg-brand-purple/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-32 h-80 w-80 rounded-full bg-brand-blue/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to hire your first AI employee?
          </h2>
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
