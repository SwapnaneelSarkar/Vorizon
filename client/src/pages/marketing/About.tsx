import { Rocket, Target, Zap } from 'lucide-react';
import { CtaButton, MarketingLayout } from '../../components/MarketingLayout';

const values = [
  {
    icon: Target,
    title: 'Outcomes, not busywork',
    text: 'We measure success by the deals you close, not the features we ship. Every part of Vorizon exists to move a lead closer to revenue.',
  },
  {
    icon: Zap,
    title: 'Automation with a human safety net',
    text: 'AI handles the volume; escalation, consent and compliance keep a human in control where it matters.',
  },
  {
    icon: Rocket,
    title: 'Built to grow with you',
    text: 'From your first campaign to thousands of calls a day, the same platform scales — connect more tools as you go.',
  },
];

export function AboutPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">About Vorizon</h1>
        <div className="mt-6 space-y-4 text-lg leading-relaxed text-slate-600">
          <p>
            Vorizon is an AI employee platform that helps businesses turn advertising into revenue —
            automatically. We connect your ad platforms, capture every lead, qualify it with AI, and
            follow up over voice and messaging, then sync the results to your CRM.
          </p>
          <p>
            Most teams lose leads in the gap between an ad click and a real conversation. Vorizon
            closes that gap: the moment a lead arrives, an AI employee is ready to call, message and
            book — around the clock, in a way that stays compliant and measurable.
          </p>
          <p>
            Our goal is simple — give every business an always-on sales team that costs a fraction of
            a traditional one and never sleeps.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 text-brand-blue">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{v.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl bg-slate-900 px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-white">Let’s build your AI sales team</h2>
          <p className="mx-auto mt-2 max-w-md text-slate-300">
            Start free and see your first AI employee take calls in minutes.
          </p>
          <div className="mt-6">
            <CtaButton to="/register">Join us</CtaButton>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
