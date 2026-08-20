import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageSquareText, PhoneOutgoing, X } from 'lucide-react';
import type { CallDTO } from '@vorizon/shared';
import { campaignApi, callApi } from '../../lib/api/endpoints';
import { Badge, Card, EmptyState, PageHeader, Spinner } from '../../components/ui';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function TranscriptModal({ call, onClose }: { call: CallDTO; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-fade-up"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-800">
              {call.contactName ?? call.to ?? call.from}
            </h3>
            <p className="text-xs text-slate-400">
              {new Date(call.startedAt).toLocaleString()} · {formatDuration(call.durationSec)} ·{' '}
              {call.direction}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {call.transcript.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No transcript was recorded for this call.
            </p>
          ) : (
            call.transcript.map((turn, i) => (
              <div
                key={i}
                className={`flex ${turn.role === 'ai' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    turn.role === 'ai'
                      ? 'rounded-tl-sm bg-slate-100 text-slate-700'
                      : 'rounded-tr-sm bg-brand-blue text-white'
                  }`}
                >
                  <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide opacity-60">
                    {turn.role === 'ai' ? 'AI' : 'Customer'}
                  </p>
                  {turn.text}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeCall, setActiveCall] = useState<CallDTO | null>(null);

  const campaignQuery = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignApi.get(id!),
    enabled: Boolean(id),
  });

  const callsQuery = useQuery({
    queryKey: ['campaign-calls', id],
    queryFn: () => callApi.listForCampaign(id!),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      campaignQuery.data?.status === 'running' ? 2000 : query.state.data ? false : 2000,
  });

  const campaign = campaignQuery.data;

  return (
    <div>
      <Link
        to="/campaigns"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to campaigns
      </Link>

      <PageHeader
        title={campaign?.name ?? 'Campaign'}
        description={
          campaign
            ? `${campaign.stats.attempted} of ${campaign.stats.total} contacts dialed · ${campaign.stats.connected} connected`
            : undefined
        }
        action={campaign && <Badge>{campaign.status}</Badge>}
      />

      {campaignQuery.isLoading || callsQuery.isLoading ? (
        <Spinner />
      ) : !callsQuery.data || callsQuery.data.length === 0 ? (
        <EmptyState
          icon={<PhoneOutgoing className="h-6 w-6" />}
          title="No calls yet"
          hint={
            campaign?.status === 'draft'
              ? 'Launch this campaign to start dialing contacts. Calls and transcripts will show up here as they happen.'
              : 'Calls will appear here as soon as this campaign starts dialing.'
          }
        />
      ) : (
        <Card className="overflow-hidden !p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Outcome</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {callsQuery.data.map((call) => (
                <tr key={call.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {call.contactName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{call.to}</td>
                  <td className="px-4 py-3">
                    <Badge>{call.outcome}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDuration(call.durationSec)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(call.startedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveCall(call)}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-brand-blue transition hover:bg-blue-50"
                    >
                      <MessageSquareText className="h-3.5 w-3.5" /> View transcript
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeCall && <TranscriptModal call={activeCall} onClose={() => setActiveCall(null)} />}
    </div>
  );
}
