import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Megaphone,
  MessageCircle,
  MessageSquare,
  PhoneCall,
  Plug,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { CtaButton, MarketingLayout } from '../../components/MarketingLayout';
import { cn } from '../../lib/utils';

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

const connectors = [
  'Google Ads',
  'Meta Ads',
  'WhatsApp',
  'Instagram',
  'Zoho CRM',
  'Salesforce',
  'HubSpot',
  'Gmail',
  'Google Calendar',
];

const pipeline = ['Ad platform', 'Lead captured', 'AI qualifies', 'AI calls / WhatsApp', 'CRM updated', 'Conversion'];

/** Fades content up when it scrolls into view. */
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className,
      )}
    >
      {children}
    </div>
  );
}

function Waveform({ barClassName }: { barClassName?: string }) {
  const heights = ['h-2', 'h-3.5', 'h-5', 'h-3', 'h-2.5'];
  return (
    <div className="flex h-5 items-center gap-[3px]" aria-hidden>
      {heights.map((h, i) => (
        <span
          key={i}
          style={{ animationDelay: `${i * 130}ms` }}
          className={cn('w-[3px] animate-waveform rounded-full motion-reduce:animate-none', h, barClassName ?? 'bg-blue-400')}
        />
      ))}
    </div>
  );
}

/** Stylized product preview shown in the hero — mimics the real dashboard. */
function HeroPreview() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-br from-brand-blue/30 to-brand-purple/30 blur-2xl" />

      <div className="relative rounded-2xl border border-white/10 bg-slate-800/80 p-4 shadow-2xl backdrop-blur">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-2 text-xs font-medium text-slate-400">Vorizon</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
          </span>
        </div>

        {/* KPI row */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Calls today', value: '128', delta: '+12%' },
            { label: 'Leads', value: '342', delta: '+8%' },
            { label: 'Conversion', value: '7.5%', delta: '+1.4%' },
          ].map((k) => (
            <div key={k.label} className="rounded-lg bg-white/5 px-3 py-2">
              <p className="flex items-baseline gap-1.5 text-lg font-bold text-white">
                {k.value}
                <span className="text-[10px] font-semibold text-emerald-400">{k.delta}</span>
              </p>
              <p className="text-[10px] text-slate-400">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Live AI call */}
        <div className="mb-3 flex items-center justify-between rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-[11px] font-bold text-white">
              AP
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-800" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Aarav Patel</p>
              <p className="text-[11px] text-blue-300">Riya (AI) · inbound call · 02:41</p>
            </div>
          </div>
          <Waveform />
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

        {/* Leads being worked */}
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

      {/* Floating notifications */}
      <div className="absolute -right-5 -top-7 hidden animate-float sm:block motion-reduce:animate-none" aria-hidden>
        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-slate-800/90 px-3.5 py-2.5 shadow-2xl backdrop-blur">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
            <CalendarCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-white">Appointment booked</p>
            <p className="text-[10px] text-slate-400">Tomorrow · 3:00 PM</p>
          </div>
        </div>
      </div>
      <div
        className="absolute -bottom-6 -left-5 hidden animate-float sm:block motion-reduce:animate-none"
        style={{ animationDelay: '2.2s' }}
        aria-hidden
      >
        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-slate-800/90 px-3.5 py-2.5 shadow-2xl backdrop-blur">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
            <MessageCircle className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-white">WhatsApp · Priya replied</p>
            <p className="text-[10px] text-slate-400">“Yes, tomorrow works 👍”</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectorChip({ name }: { name: string }) {
  return (
    <span className="flex shrink-0 items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-brand-blue/15 to-brand-purple/15 text-[10px] font-bold text-brand-blue">
        {name[0]}
      </span>
      {name}
    </span>
  );
}

const bentoCard =
  'group h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-card-hover';

function BentoIcon({ icon: Icon }: { icon: typeof PhoneCall }) {
  return (
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 text-brand-blue transition-colors duration-300 group-hover:from-brand-blue group-hover:to-brand-purple group-hover:text-white">
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function LandingPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(148_163_184/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(148_163_184/0.07)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent_80%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-purple/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-brand-blue/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/60 to-transparent" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-2 lg:py-32">
          <div className="text-center lg:text-left">
            <span className="animate-hero-in inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-blue-300" /> AI sales agents for modern businesses
            </span>
            <h1
              className="animate-hero-in mt-6 text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl"
              style={{ animationDelay: '100ms' }}
            >
              Hire AI employees.{' '}
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Grow without limits.
              </span>
            </h1>
            <p
              className="animate-hero-in mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-300 lg:mx-0"
              style={{ animationDelay: '200ms' }}
            >
              Connect Google Ads and Meta Ads, capture every lead, and let AI qualify, call and
              follow up — then push it all to your CRM. Vorizon automates your entire sales loop.
            </p>
            <div
              className="animate-hero-in mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
              style={{ animationDelay: '300ms' }}
            >
              <CtaButton to="/register">
                Get started <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </CtaButton>
              <Link
                to="/pricing"
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>
            <div
              className="animate-hero-in mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400 lg:justify-start"
              style={{ animationDelay: '400ms' }}
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Standard Plan at $30/mo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Pay-as-you-go calling at $0.10/min
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Instant Google Ads sync
              </span>
            </div>
          </div>

          <div className="animate-hero-in" style={{ animationDelay: '250ms' }}>
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* Connectors marquee */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Connects with the tools you already use
          </p>
          <div
            className="group mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
            aria-label={`Integrations: ${connectors.join(', ')}`}
          >
            <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
              <div className="flex items-center gap-4 pr-4">
                {connectors.map((c) => (
                  <ConnectorChip key={c} name={c} />
                ))}
              </div>
              <div className="flex items-center gap-4 pr-4" aria-hidden>
                {connectors.map((c) => (
                  <ConnectorChip key={c} name={c} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How Vorizon works</h2>
          <p className="mt-3 text-lg text-slate-500">Three steps from ad spend to booked revenue.</p>
        </Reveal>
        <div className="relative mt-14">
          <div
            className="absolute inset-x-0 top-10 hidden border-t border-dashed border-slate-300 md:block [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]"
            aria-hidden
          />
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-6">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 130}>
                <div className="relative text-center md:px-4">
                  <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-card">
                    <s.icon className="h-8 w-8 text-brand-blue" />
                    <span className="absolute -right-2.5 -top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-xs font-bold text-white shadow-md">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{s.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features — bento grid */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything your sales team does — automated
            </h2>
            <p className="mt-3 text-lg text-slate-500">
              From the first ad click to a booked deal, Vorizon handles the busywork so you close more.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
            <Reveal className="lg:col-span-4">
              <div className={bentoCard}>
                <BentoIcon icon={PhoneCall} />
                <h3 className="font-semibold text-slate-900">AI voice employees</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  Inbound receptionists and outbound campaigns that talk to your customers 24/7 — trained on your
                  business, in your tone of voice.
                </p>
                <div className="mt-5 rounded-xl bg-slate-50 p-3.5" aria-hidden>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-xs font-bold text-white">
                      R
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700">Riya · AI receptionist</p>
                      <p className="truncate text-xs text-slate-500">
                        “I can book you in for Thursday at 2 PM — does that work?”
                      </p>
                    </div>
                    <span className="ml-auto shrink-0">
                      <Waveform barClassName="bg-brand-blue" />
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={100} className="lg:col-span-2">
              <div className={bentoCard}>
                <BentoIcon icon={Megaphone} />
                <h3 className="font-semibold text-slate-900">Connect your ad platforms</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  Link Google Ads and Meta Ads. Vorizon runs campaigns and pulls every lead straight in — no forms, no
                  spreadsheets.
                </p>
              </div>
            </Reveal>

            <Reveal className="lg:col-span-2">
              <div className={bentoCard}>
                <BentoIcon icon={Sparkles} />
                <h3 className="font-semibold text-slate-900">AI lead qualification</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  Every lead is scored and qualified automatically, then handed to a call or WhatsApp follow-up.
                </p>
                <div className="mt-5 rounded-xl bg-slate-50 p-3.5" aria-hidden>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Lead score</span>
                    <span className="font-bold text-brand-blue">87</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-brand-blue to-brand-purple" />
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={100} className="lg:col-span-4">
              <div className={bentoCard}>
                <BentoIcon icon={MessageSquare} />
                <h3 className="font-semibold text-slate-900">WhatsApp & messaging</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  Reach leads on WhatsApp and Instagram, and follow up over email — all from one place.
                </p>
                <div className="mt-5 max-w-md space-y-2" aria-hidden>
                  <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2 text-xs text-slate-600">
                    Hi Priya! Still interested in a free demo this week?
                  </div>
                  <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-700">
                    Yes — tomorrow afternoon works 👍
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal className="lg:col-span-3">
              <div className={bentoCard}>
                <BentoIcon icon={Users} />
                <h3 className="font-semibold text-slate-900">Sync to your CRM</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  Push qualified leads and deals to your CRM automatically — your pipeline stays current without data
                  entry.
                </p>
                <div className="mt-5 flex flex-wrap gap-2" aria-hidden>
                  {['Zoho', 'Salesforce', 'HubSpot'].map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={100} className="lg:col-span-3">
              <div className={bentoCard}>
                <BentoIcon icon={ShieldCheck} />
                <h3 className="font-semibold text-slate-900">Compliance built in</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  Consent tracking, Do-Not-Call enforcement and opt-outs on every dial — TCPA-ready from day one.
                </p>
                <div className="mt-5 flex flex-wrap gap-2" aria-hidden>
                  {['Consent tracking', 'DNC lists', 'Auto opt-out'].map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      <CheckCircle2 className="h-3 w-3" /> {c}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Closed loop + stats */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-14 sm:px-10 lg:px-14">
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:48px_48px]"
              aria-hidden
            />
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-purple/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-blue/20 blur-3xl" />

            <div className="relative">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  One automated loop, ad to revenue
                </h2>
                <p className="mt-3 text-lg text-slate-400">
                  Every lead flows through the same pipeline — no manual handoffs.
                </p>
              </div>

              {/* Pipeline — horizontal on wide screens */}
              <div className="mt-10 hidden items-center xl:flex">
                {pipeline.map((step, i) => (
                  <div key={step} className={cn('flex items-center', i < pipeline.length - 1 && 'flex-1')}>
                    <div className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-200">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      {step}
                    </div>
                    {i < pipeline.length - 1 && (
                      <div className="mx-1.5 h-px min-w-3 flex-1 bg-gradient-to-r from-brand-blue/50 to-brand-purple/50" />
                    )}
                  </div>
                ))}
              </div>
              {/* Pipeline — grid below xl */}
              <div className="mt-10 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:hidden">
                {pipeline.map((step, i) => (
                  <div
                    key={step}
                    className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-1 gap-8 border-t border-white/10 pt-10 text-center sm:grid-cols-3">
                {[
                  { stat: '$30/mo', label: 'Standard plan for Google Ads & CRM sync' },
                  { stat: '$0.10', label: 'per conversation minute — zero waste' },
                  { stat: '10+', label: 'ad, CRM & messaging integrations' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                      {s.stat}
                    </p>
                    <p className="mt-1.5 text-sm text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue via-indigo-600 to-brand-purple px-6 py-16 text-center sm:px-16 lg:py-20">
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.08)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]"
              aria-hidden
            />
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-white/15 blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to hire your first AI employee?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
                Set up in minutes. Connect your platforms, add funds, and let Vorizon run your sales.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center rounded-xl bg-white px-7 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/pricing"
                  className="rounded-xl border border-white/40 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  See pricing
                </Link>
              </div>
              <p className="mt-6 text-sm text-blue-200/90">$30/mo Standard Plan · $0.10/min voice calls · Cancel anytime</p>
            </div>
          </div>
        </Reveal>
      </section>
    </MarketingLayout>
  );
}
