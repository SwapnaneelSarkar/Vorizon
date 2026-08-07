import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi, paymentApi } from '../lib/api/endpoints';
import { apiErrorMessage } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import { Button, Card, Input, Spinner } from '../components/ui';
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
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['payments'] });
  };

  const pay = async () => {
    setStatus(null);
    setBusy(true);
    try {
      const amountInr = Number(amount);
      if (!Number.isInteger(amountInr) || amountInr < 1) {
        setStatus({ kind: 'err', text: 'Enter a whole rupee amount (min ₹1)' });
        return;
      }
      if (!(await loadCheckoutScript()) || !window.Razorpay) {
        setStatus({ kind: 'err', text: 'Could not load Razorpay Checkout — check your connection' });
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
            .then(() => setStatus({ kind: 'ok', text: 'Payment successful — billing is active.' }))
            .catch((e) => setStatus({ kind: 'err', text: apiErrorMessage(e) }))
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
        setStatus({ kind: 'err', text: resp.error?.description ?? 'Payment failed' });
      });
      rzp.open();
    } catch (e) {
      setStatus({ kind: 'err', text: apiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-800">Make a Payment</h2>
      <p className="mb-3 text-sm text-slate-500">
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
      {status && (
        <p className={`text-sm ${status.kind === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
          {status.text}
        </p>
      )}
      {!canPay && <p className="text-xs text-slate-400">Only owners and admins can make payments.</p>}
    </Card>
  );
}

function PaymentHistory() {
  const { data, isLoading } = useQuery({ queryKey: ['payments'], queryFn: paymentApi.list });
  return (
    <Card>
      <h2 className="mb-4 font-semibold text-slate-800">Payment History</h2>
      {isLoading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">No payments yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2">Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-2">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="font-medium text-slate-700">
                    ₹{(p.amount / 100).toFixed(2)}
                  </td>
                  <td>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : p.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="text-slate-500">{p.razorpayPaymentId ?? p.razorpayOrderId}</td>
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
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Billing</h1>
      <p className="mb-6 text-sm text-slate-500">
        Usage-based billing at {formatUsd(usage.rateUsd)} per conversation minute
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total Minutes</p>
          <p className="text-3xl font-bold text-slate-800">{usage.totalMinutes}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total Cost</p>
          <p className="text-3xl font-bold text-slate-800">{formatUsd(usage.totalUsd)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Projected Monthly</p>
          <p className="text-3xl font-bold text-slate-800">
            {formatUsd(estimate?.projectedMonthlyUsd ?? 0)}
          </p>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PayCard />
        <PaymentHistory />
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-slate-800">Usage by Day</h2>
        {usage.byDay.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No usage recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr>
                  <th className="py-2">Date</th>
                  <th>Calls</th>
                  <th>Minutes</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {usage.byDay.map((d) => (
                  <tr key={d.date} className="border-t border-slate-100">
                    <td className="py-2">{d.date}</td>
                    <td>{d.calls}</td>
                    <td>{d.minutes}</td>
                    <td>{formatUsd(d.usd)}</td>
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
