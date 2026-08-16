import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';
import { cn } from '../lib/utils';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

/** Public marketing shell: header nav + footer, used by all landing pages. */
export function MarketingLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoIcon} alt="Vorizon" className="h-9 w-auto" />
            <span className="text-lg font-bold text-slate-900">Vorizon</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'text-sm font-medium transition',
                    isActive ? 'text-brand-blue' : 'text-slate-600 hover:text-slate-900',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-gradient-to-r from-brand-blue to-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
            >
              Join us
            </Link>
          </div>

          <button
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-slate-200 px-6 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="mt-2 flex gap-2">
                <Link to="/login" className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700">
                  Sign in
                </Link>
                <Link to="/register" className="flex-1 rounded-lg bg-gradient-to-r from-brand-blue to-brand-purple px-4 py-2 text-center text-sm font-semibold text-white">
                  Join us
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoIcon} alt="Vorizon" className="h-7 w-auto" />
            <span className="font-bold text-slate-900">Vorizon</span>
            <span className="text-sm text-slate-400">· Hire AI employees. Grow without limits.</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <Link to="/pricing" className="hover:text-slate-700">Pricing</Link>
            <Link to="/about" className="hover:text-slate-700">About</Link>
            <Link to="/contact" className="hover:text-slate-700">Contact</Link>
            <Link to="/privacy" className="hover:text-slate-700">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-700">Terms</Link>
          </div>
        </div>
        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Vorizon · AI Employee Platform
        </div>
      </footer>
    </div>
  );
}

/** Primary CTA button used across marketing pages. */
export function CtaButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-blue to-brand-purple px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
    >
      {children}
    </Link>
  );
}
