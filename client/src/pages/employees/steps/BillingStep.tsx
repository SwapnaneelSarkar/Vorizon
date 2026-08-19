import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AIEmployeeDTO } from '@vorizon/shared';
import { employeeApi } from '../../../lib/api/endpoints';
import { apiErrorMessage } from '../../../lib/api/client';
import { Button, Card, Field, Input, Select } from '../../../components/ui';

export function BillingStep({ employee, onSaved }: { employee: AIEmployeeDTO; onSaved: () => void }) {
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [brand, setBrand] = useState('visa');
  const [last4, setLast4] = useState('4242');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: () => employeeApi.setBilling(employee.id, cardType, brand, last4),
    onSuccess: () => {
      setMsg('Payment method saved.');
      setError('');
      onSaved();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-slate-800">Billing Information</h2>
      <p className="mb-4 text-sm text-slate-500">
        Usage-based billing at <strong>$0.08 per conversation minute</strong>. No charge in this
        demo — a payment method is stored as a placeholder.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Card type">
          <Select value={cardType} onChange={(e) => setCardType(e.target.value as 'credit' | 'debit')}>
            <option value="credit">Credit Card</option>
            <option value="debit">Debit Card</option>
          </Select>
        </Field>
        <Field label="Card brand">
          <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="amex">Amex</option>
          </Select>
        </Field>
        <Field label="Last 4 digits">
          <Input value={last4} maxLength={4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} />
        </Field>
      </div>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      {msg && <p className="mb-3 text-sm text-green-600">{msg}</p>}
      <Button onClick={() => save.mutate()} disabled={last4.length !== 4 || save.isPending}>
        {save.isPending ? 'Saving…' : 'Save payment method'}
      </Button>
    </Card>
  );
}
