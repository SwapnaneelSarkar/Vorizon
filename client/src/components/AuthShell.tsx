import { BarChart3, PhoneCall, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../assets/logo-icon.png';
import logoFull from '../assets/logo-full.png';

const features = [
  {
    icon: PhoneCall,
    title: 'AI that works the phones',
    text: 'Inbound reception and outbound campaigns, handled around the clock.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance built in',
    text: 'Consent tracking, Do-Not-Call enforcement and opt-outs on every dial.',
  },
  {
    icon: BarChart3,
    title: 'Google Ads & Transparent Billing',
    text: 'Standard $30/mo platform for Google Ads sync, with voice calls at $0.10/min.',
  },
];

/** Split-screen frame for login/register: brand story left, form right. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-purple/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-blue/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <img src={logoIcon} alt="Vorizon" className="h-12 w-auto" />
          <span className="text-xl font-bold text-white">Vorizon</span>
        </div>

        <div className="relative">
          <h1 className="mb-3 max-w-md text-3xl font-bold leading-tight text-white">
            Hire your first AI employee today.
          </h1>
          <p className="mb-10 max-w-md text-slate-400">
            Build, train and deploy AI voice agents that answer your business line and run outbound
            campaigns — fully compliant, fully measured.
          </p>
          <div className="space-y-6">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-slate-400">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Vorizon · AI Employee Platform
        </p>
      </div>

      <div className="flex w-full items-center justify-center bg-slate-50 p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <img
            src={logoFull}
            alt="Vorizon — Hire AI employees. Grow without limits."
            className="mx-auto mb-8 w-full max-w-xs"
          />
          {children}
          <p className="mt-6 text-center text-xs text-slate-400">
            By continuing you agree to our{' '}
            <Link to="/terms" className="text-slate-500 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-slate-500 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
