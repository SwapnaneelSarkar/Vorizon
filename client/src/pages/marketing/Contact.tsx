import { useState } from 'react';
import {
  CalendarClock,
  HeadphonesIcon,
  Layers,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Sparkles,
} from 'lucide-react';
import { MarketingLayout } from '../../components/MarketingLayout';
import { Button, Field, Input, Textarea } from '../../components/ui';

const SUPPORT_EMAIL = 'crowdbuzz.company@gmail.com';
const SUPPORT_PHONE_DISPLAY = '+91 99498 34578';
const SUPPORT_PHONE_TEL = '+919949834578';
const SUPPORT_PHONE_WHATSAPP = '919949834578';

const contactCards = [
  {
    icon: Mail,
    tone: 'text-brand-blue bg-brand-blue/10',
    title: 'Email us',
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
  },
  {
    icon: Phone,
    tone: 'text-brand-purple bg-brand-purple/10',
    title: 'Call us',
    value: SUPPORT_PHONE_DISPLAY,
    href: `tel:${SUPPORT_PHONE_TEL}`,
  },
  {
    icon: MessageCircle,
    tone: 'text-emerald-600 bg-emerald-50',
    title: 'WhatsApp',
    value: SUPPORT_PHONE_DISPLAY,
    href: `https://wa.me/${SUPPORT_PHONE_WHATSAPP}`,
  },
];

const nextSteps = [
  {
    icon: MessageSquare,
    title: 'You reach out',
    text: 'Send a message, email, or call — whatever’s easiest. Tell us a bit about your business and what you’re trying to automate.',
  },
  {
    icon: CalendarClock,
    title: 'We get back to you fast',
    text: 'A real person replies within one business day, usually much sooner, to understand your setup and answer questions.',
  },
  {
    icon: Layers,
    title: 'We map out your AI employee',
    text: 'We’ll walk you through connecting your ad platforms and CRM, and help configure your first AI voice agent.',
  },
];

const reasons = [
  'Product demo & walkthrough',
  'Help connecting Google Ads, Meta Ads or your CRM',
  'Billing, wallet & pricing questions',
  'Enterprise & high-volume calling needs',
];

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  // No public write endpoint — compose an email the visitor sends from their client.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Vorizon enquiry from ${form.name || 'website'}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(148_163_184/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(148_163_184/0.07)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent_80%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-brand-purple/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-brand-blue/20 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" /> We usually reply within a day
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Get in touch
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Questions about Vorizon, a live demo, or help getting your first AI employee set up? Call,
            message, or email us — a real person will get back to you.
          </p>
        </div>
      </section>

      {/* Contact methods */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {contactCards.map((c) => (
            <a
              key={c.title}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
              className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{c.value}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Form + why reach out */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">What can we help with?</h2>
              <p className="mt-3 text-slate-600">
                Whether you’re evaluating Vorizon, mid-setup, or already running campaigns, our team can
                help with:
              </p>
              <ul className="mt-6 space-y-3">
                {reasons.map((r) => (
                  <li key={r} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                      <HeadphonesIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm text-slate-700">{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
              <h2 className="mb-4 font-semibold text-slate-900">Send us a message</h2>
              <form onSubmit={submit}>
                <Field label="Your name">
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Message">
                  <Textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  />
                </Field>
                <Button type="submit" className="w-full">
                  Send message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* What happens next */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">What happens after you reach out</h2>
          <p className="mt-3 text-slate-500">From your first message to a working AI employee.</p>
        </div>
        <div className="relative mt-14">
          <div
            className="absolute inset-x-0 top-10 hidden border-t border-dashed border-slate-300 md:block [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]"
            aria-hidden
          />
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-6">
            {nextSteps.map((s, i) => (
              <div key={s.title} className="relative text-center md:px-4">
                <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-card">
                  <s.icon className="h-8 w-8 text-brand-blue" />
                  <span className="absolute -right-2.5 -top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-xs font-bold text-white shadow-md">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prefer to talk banner */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue via-indigo-600 to-brand-purple px-6 py-14 text-center sm:px-16">
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.08)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]"
            aria-hidden
          />
          <div className="relative">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Prefer to talk it through?</h2>
            <p className="mx-auto mt-2 max-w-md text-blue-100">
              Call or WhatsApp us directly — we’re happy to walk you through the platform live.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`tel:${SUPPORT_PHONE_TEL}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Phone className="h-4 w-4" /> {SUPPORT_PHONE_DISPLAY}
              </a>
              <a
                href={`https://wa.me/${SUPPORT_PHONE_WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
