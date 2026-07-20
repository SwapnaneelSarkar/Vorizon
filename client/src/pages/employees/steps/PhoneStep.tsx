import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AIEmployeeDTO } from '@vorizon/shared';
import { employeeApi } from '../../../lib/api/endpoints';
import { apiErrorMessage } from '../../../lib/api/client';
import { Button, Card, Field, Input } from '../../../components/ui';

export function PhoneStep({ employee, onSaved }: { employee: AIEmployeeDTO; onSaved: () => void }) {
  const [business, setBusiness] = useState(employee.businessPhoneNumber ?? '');
  const [escalation, setEscalation] = useState(employee.escalationNumber ?? '');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: () => employeeApi.setPhone(employee.id, business, escalation),
    onSuccess: () => {
      setMsg('Phone numbers saved.');
      setError('');
      onSaved();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-slate-800">Phone Numbers</h2>
      <p className="mb-4 text-sm text-slate-500">
        Customers call your business number; if the AI can't handle a call, it transfers to your
        human escalation number.
      </p>
      <Field label="Business Phone Number (incoming)">
        <Input value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="+1 415 555 0100" />
      </Field>
      <Field label="Human Escalation Number">
        <Input
          value={escalation}
          onChange={(e) => setEscalation(e.target.value)}
          placeholder="+1 415 555 0111"
        />
      </Field>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      {msg && <p className="mb-3 text-sm text-green-600">{msg}</p>}
      <Button onClick={() => save.mutate()} disabled={!business || !escalation || save.isPending}>
        {save.isPending ? 'Saving…' : 'Save numbers'}
      </Button>
    </Card>
  );
}
