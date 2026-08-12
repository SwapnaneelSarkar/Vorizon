import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../assets/logo-icon.png';

/** Standalone public layout for legal pages (no app shell, reachable without login). */
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoIcon} alt="Vorizon" className="h-8 w-auto" />
            <span className="text-lg font-bold text-slate-900">Vorizon</span>
          </Link>
          <Link to="/login" className="text-sm font-medium text-brand-blue hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {updated}</p>
        <div className="mt-8 space-y-6">{children}</div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} Vorizon · AI Employee Platform</span>
          <span className="flex gap-4">
            <Link to="/privacy" className="hover:text-slate-700">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-slate-700">
              Terms
            </Link>
            <a href="mailto:crowdbuzz.company@gmail.com" className="hover:text-slate-700">
              Contact
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

/** Section heading + body block used inside legal pages. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-5 list-disc space-y-1.5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
