import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { RESPONSIBILITY_PRESETS } from '@vorizon/shared';
import { responsibilityApi } from '../../../lib/api/endpoints';
import { apiErrorMessage } from '../../../lib/api/client';
import { Button, Card, Input, Spinner } from '../../../components/ui';

export function ResponsibilitiesStep({
  employeeId,
  onSaved,
}: {
  employeeId: string;
  onSaved: () => void;
}) {
  const { data: existing, isLoading } = useQuery({
    queryKey: ['responsibilities', employeeId],
    queryFn: () => responsibilityApi.list(employeeId),
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing && existing.length) {
      setSelected(new Set(existing.filter((r) => r.kind === 'preset').map((r) => r.label)));
      setCustom(existing.filter((r) => r.kind === 'custom').map((r) => r.label));
    } else {
      // Sensible defaults on first visit.
      setSelected(new Set([RESPONSIBILITY_PRESETS[0], RESPONSIBILITY_PRESETS[1]]));
    }
  }, [existing]);

  const toggle = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const save = useMutation({
    mutationFn: () => {
      const items = [
        ...[...selected].map((label) => ({ label, kind: 'preset' as const, enabled: true })),
        ...custom.map((label) => ({ label, kind: 'custom' as const, enabled: true })),
      ];
      return responsibilityApi.set(employeeId, { items });
    },
    onSuccess: () => {
      setMsg('Responsibilities saved.');
      setError('');
      onSaved();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  if (isLoading) return <Spinner />;

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-slate-800">Define Responsibilities</h2>
      <p className="mb-4 text-sm text-slate-500">Select what this AI employee should do.</p>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {RESPONSIBILITY_PRESETS.map((label) => (
          <label
            key={label}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={selected.has(label)}
              onChange={() => toggle(label)}
              className="accent-brand-blue"
            />
            {label}
          </label>
        ))}
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-slate-600">Custom responsibilities</p>
        <div className="mb-2 flex flex-wrap gap-2">
          {custom.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full bg-brand-purple/10 px-3 py-1 text-xs text-brand-purple"
            >
              {c}
              <button onClick={() => setCustom((prev) => prev.filter((x) => x !== c))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="e.g. Offer a 10% loyalty discount"
          />
          <Button
            variant="secondary"
            onClick={() => {
              if (customInput.trim()) {
                setCustom((prev) => [...prev, customInput.trim()]);
                setCustomInput('');
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      {msg && <p className="mb-3 text-sm text-green-600">{msg}</p>}
      <Button
        onClick={() => save.mutate()}
        disabled={selected.size + custom.length === 0 || save.isPending}
      >
        {save.isPending ? 'Saving…' : 'Save responsibilities'}
      </Button>
    </Card>
  );
}
