import { useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { MarketingLayout } from '../../components/MarketingLayout';
import { Button, Field, Input, Textarea } from '../../components/ui';

const SUPPORT_EMAIL = 'crowdbuzz.company@gmail.com';

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
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Get in touch</h1>
            <p className="mt-4 text-lg text-slate-500">
              Questions about Vorizon, a demo, or help getting set up? We’d love to hear from you.
            </p>
            <div className="mt-8 space-y-4">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Email us</p>
                  <p className="text-sm text-slate-500">{SUPPORT_EMAIL}</p>
                </div>
              </a>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Support</p>
                  <p className="text-sm text-slate-500">We typically reply within one business day.</p>
                </div>
              </div>
            </div>
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
      </section>
    </MarketingLayout>
  );
}
