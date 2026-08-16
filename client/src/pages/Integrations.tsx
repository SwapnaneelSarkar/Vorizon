import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  CreditCard,
  Megaphone,
  MessageSquare,
  Phone,
  Plug,
  Users,
  X,
} from 'lucide-react';
import type { ConnectorInfo } from '@vorizon/shared';
import { integrationApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import { Badge, Button, Card, PageHeader, Spinner, toast } from '../components/ui';
import { cn } from '../lib/utils';

const categoryMeta: Record<
  ConnectorInfo['category'],
  { label: string; icon: typeof Megaphone; tint: string }
> = {
  ads: { label: 'Advertising', icon: Megaphone, tint: 'bg-blue-50 text-blue-600' },
  messaging: { label: 'Messaging', icon: MessageSquare, tint: 'bg-emerald-50 text-emerald-600' },
  crm: { label: 'CRM', icon: Users, tint: 'bg-violet-50 text-violet-600' },
  calendar: { label: 'Calendar', icon: Calendar, tint: 'bg-amber-50 text-amber-600' },
  payments: { label: 'Payments', icon: CreditCard, tint: 'bg-emerald-50 text-emerald-600' },
  telephony: { label: 'Telephony', icon: Phone, tint: 'bg-blue-50 text-blue-600' },
};

const CATEGORY_ORDER: ConnectorInfo['category'][] = [
  'ads',
  'messaging',
  'crm',
  'calendar',
  'telephony',
  'payments',
];

function ConnectorCard({ c, onChanged }: { c: ConnectorInfo; onChanged: () => void }) {
  const me = useAuthStore((s) => s.user);
  const canManage = me?.role === 'owner' || me?.role === 'admin';
  const meta = categoryMeta[c.category];
  const connected = c.connection?.status === 'connected';

  const connect = useMutation({
    mutationFn: () => integrationApi.connect(c.provider),
    onSuccess: ({ authUrl }) => {
      // Hand off to the provider's OAuth consent screen.
      window.location.href = authUrl;
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const disconnect = useMutation({
    mutationFn: () => integrationApi.disconnect(c.provider),
    onSuccess: () => {
      toast.success(`${c.name} disconnected`);
      onChanged();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', meta.tint)}>
          <meta.icon className="h-5 w-5" />
        </div>
        {connected ? (
          <Badge>active</Badge>
        ) : c.configured ? (
          <span className="text-xs font-medium text-slate-400">Available</span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-400">
            Coming soon
          </span>
        )}
      </div>
      <h3 className="font-semibold text-slate-900">{c.name}</h3>
      <p className="mb-4 mt-0.5 flex-1 text-sm text-slate-500">{c.description}</p>
      {connected ? (
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
            <BadgeCheck className="h-4 w-4" /> Connected
          </span>
          {canManage && (
            <Button variant="secondary" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
              Disconnect
            </Button>
          )}
        </div>
      ) : (
        <Button
          variant={c.configured ? 'primary' : 'secondary'}
          onClick={() => connect.mutate()}
          disabled={!canManage || !c.configured || connect.isPending}
          title={!c.configured ? 'Not enabled on this server yet' : undefined}
        >
          {connect.isPending ? 'Redirecting…' : `Connect ${c.name}`}
        </Button>
      )}
    </Card>
  );
}

/** Actionable copy for the OAuth-callback error codes our backend redirects with. */
function errorHelp(code: string): string {
  switch (code) {
    case 'access_denied':
      return 'Google blocked the sign-in because the app is still unverified. Add your email as a Test User in Google Cloud → APIs & Services → OAuth consent screen → Test users, then try again.';
    case 'invalid_state':
      return 'That connection link expired. Please click Connect again.';
    case 'connect_failed':
      return 'We couldn’t complete the connection. Please try again, or check the provider’s app credentials.';
    default:
      return `Connection failed: ${code.replace(/_/g, ' ')}.`;
  }
}

export function IntegrationsPage() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [oauthError, setOauthError] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['integrations'], queryFn: integrationApi.list });
  const refresh = () => qc.invalidateQueries({ queryKey: ['integrations'] });

  // Surface the OAuth-callback result carried back in the URL.
  useEffect(() => {
    const connected = params.get('connected');
    const error = params.get('error');
    if (connected) {
      toast.success(`${connected.replace(/_/g, ' ')} connected`);
      refresh();
    }
    // Errors persist in a dismissible banner (they're long and actionable) rather
    // than a transient toast.
    if (error) setOauthError(errorHelp(error));
    if (connected || error) setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || !data) return <Spinner />;

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: data.connectors.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect your ad platforms, CRMs and messaging to run the full lead-to-revenue loop"
      />

      {oauthError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="flex-1 text-sm text-amber-800">{oauthError}</p>
          <button
            onClick={() => setOauthError('')}
            className="shrink-0 text-amber-400 hover:text-amber-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Card className="mb-6 flex items-start gap-3 border-blue-100 bg-blue-50/50">
        <Plug className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
        <div className="text-sm">
          <p className="font-medium text-slate-800">Lead intake webhook</p>
          <p className="mt-0.5 text-slate-500">
            Point any platform’s lead webhook here to feed the AI qualification pipeline:
          </p>
          <code className="mt-1 block overflow-x-auto rounded-md bg-white px-2 py-1 font-mono text-xs text-slate-600">
            {data.leadIntakeUrl}
          </code>
        </div>
      </Card>

      {byCategory.map((group) => (
        <div key={group.cat} className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {categoryMeta[group.cat].label}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((c) => (
              <ConnectorCard key={c.provider} c={c} onChanged={refresh} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
