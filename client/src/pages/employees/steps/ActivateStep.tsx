import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Rocket, AlertCircle, PhoneCall } from 'lucide-react';
import type { AIEmployeeDTO } from '@vorizon/shared';
import { employeeApi } from '../../../lib/api/endpoints';
import { apiErrorDetails, apiErrorMessage } from '../../../lib/api/client';
import { Button, Card } from '../../../components/ui';

export function ActivateStep({ employee, onSaved }: { employee: AIEmployeeDTO; onSaved: () => void }) {
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [simMsg, setSimMsg] = useState('');

  const activate = useMutation({
    mutationFn: () => employeeApi.activate(employee.id),
    onSuccess: () => {
      setMissing([]);
      setError('');
      onSaved();
    },
    onError: (e) => {
      const details = apiErrorDetails(e);
      if (details?.missing) setMissing(details.missing);
      else setError(apiErrorMessage(e));
    },
  });

  const simulate = useMutation({
    mutationFn: () => employeeApi.simulateInbound(employee.id, 125),
    onSuccess: () => setSimMsg('Simulated a 125s inbound call. Check Dashboard / Billing.'),
    onError: (e) => setError(apiErrorMessage(e)),
  });

  const isActive = employee.status === 'active';

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-slate-800">
        {employee.type === 'inbound' ? 'Activate AI Employee' : 'Activate & Launch'}
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        {isActive
          ? 'This AI employee is live.'
          : 'Once all steps are complete, activate to go live.'}
      </p>

      {missing.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-700">
            <AlertCircle className="h-4 w-4" /> Complete these first:
          </p>
          <ul className="list-inside list-disc text-sm text-amber-700">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      {isActive ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            ✓ {employee.name} is active
            {employee.businessPhoneNumber ? ` on ${employee.businessPhoneNumber}` : ''}.
          </div>
          {employee.type === 'inbound' && (
            <div>
              <Button variant="secondary" onClick={() => simulate.mutate()} disabled={simulate.isPending}>
                <PhoneCall className="h-4 w-4" />
                Simulate an inbound call
              </Button>
              {simMsg && <p className="mt-2 text-sm text-green-600">{simMsg}</p>}
            </div>
          )}
        </div>
      ) : (
        <Button onClick={() => activate.mutate()} disabled={activate.isPending}>
          <Rocket className="h-4 w-4" />
          {activate.isPending ? 'Activating…' : 'Activate AI Employee'}
        </Button>
      )}
    </Card>
  );
}
