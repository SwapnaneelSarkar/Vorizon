import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReceiptText } from 'lucide-react';
import { billingApi, paymentApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import { Badge, Button, Card, Input, PageHeader, Spinner, toast } from '../components/ui';
import { formatUsd } from '../lib/utils';

/** Razorpay Checkout global, injected by their script. */
interface RazorpayCheckout {
  open(): void;
  on(event: 'payment.failed', cb: (resp: { error?: { description?: string } }) => void): void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

function loadCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function PayCard() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const canPay = me?.role === 'owner' || me?.role === 'admin';
  const [amount, setAmount] = useState('500');
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['payments'] });
  };

  const pay = async () => {
    setBusy(true);
    try {
      const amountInr = Number(amount);
      if (!Number.isInteger(amountInr) || amountInr < 1) {
        toast.error('Enter a whole rupee amount (min ₹1)');
        return;
      }
      if (!(await loadCheckoutScript()) || !window.Razorpay) {
        toast.error('Could not load Razorpay Checkout — check your connection');
        return;
      }
      const order = await paymentApi.createOrder(amountInr);
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Vorizon',
        description: 'Billing activation',
        handler: (resp: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Success is only trusted after server-side signature verification.
          paymentApi
            .verify({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            })
            .then(() => toast.success('Payment successful — billing is active'))
            .catch((e) => toast.error(apiErrorMessage(e)))
            .finally(refresh);
        },
        modal: {
          ondismiss: () => {
            void paymentApi.reportFailed(order.orderId, 'Checkout dismissed').finally(refresh);
          },
        },
        theme: { color: '#4f46e5' },
      });
      rzp.on('payment.failed', (resp) => {
        void paymentApi
          .reportFailed(order.orderId, resp.error?.description ?? 'Payment failed')
          .finally(refresh);
        toast.error(resp.error?.description ?? 'Payment failed');
      });
      rzp.open();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-900">Make a Payment</h2>
      <p className="mb-4 text-sm text-slate-500">
        Pay securely via Razorpay to activate billing for your organization.
      </p>
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
          <Input
            type="number"
            min={1}
            className="pl-7"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!canPay}
          />
        </div>
        <Button onClick={() => void pay()} disabled={!canPay || busy}>
          {busy ? 'Opening…' : 'Pay with Razorpay'}
        </Button>
      </div>
      {!canPay && <p className="text-xs text-slate-400">Only owners and admins can make payments.</p>}
    </Card>
  );
}

function PaymentHistory() {
  const { data, isLoading } = useQuery({ queryKey: ['payments'], queryFn: paymentApi.list });
  return (
    <Card>
      <h2 className="mb-4 font-semibold text-slate-900">Payment History</h2>
      {isLoading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <ReceiptText className="mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-400">No payments yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-3">Date</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="py-3 text-slate-700">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="font-semibold text-slate-900">₹{(p.amount / 100).toFixed(2)}</td>
                  <td>
                    <Badge>{p.status}</Badge>
                  </td>
                  <td className="font-mono text-xs text-slate-500">
                    {p.razorpayPaymentId ?? p.razorpayOrderId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function BillingPage() {
  const { data: usage, isLoading } = useQuery({ queryKey: ['usage'], queryFn: billingApi.usage });
  const { data: estimate } = useQuery({ queryKey: ['estimate'], queryFn: billingApi.estimate });

  if (isLoading || !usage) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Billing"
        description={`Usage-based billing at ${formatUsd(usage.rateUsd)} per conversation minute`}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total Minutes</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{usage.totalMinutes}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total Cost</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {formatUsd(usage.totalUsd)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Projected Monthly</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {formatUsd(estimate?.projectedMonthlyUsd ?? 0)}
          </p>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PayCard />
        <PaymentHistory />
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-slate-900">Usage by Day</h2>
        {usage.byDay.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No usage recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Calls</th>
                  <th className="pb-3">Minutes</th>
                  <th className="pb-3">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usage.byDay.map((d) => (
                  <tr key={d.date} className="transition-colors hover:bg-slate-50/70">
                    <td className="py-3 text-slate-700">{d.date}</td>
                    <td className="text-slate-700">{d.calls}</td>
                    <td className="text-slate-700">{d.minutes}</td>
                    <td className="font-medium text-slate-900">{formatUsd(d.usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
