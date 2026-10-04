import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage, unwrap } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ButtonSpinner, ErrorMessage, Spinner, StatusBadge } from '../components/ui';
import { dateTime, money } from '../utils/format';

const STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

function Tracker({ order }) {
  if (order.status === 'cancelled') {
    return <div className="rounded-lg bg-slate-100 p-4 text-sm font-medium text-slate-700">This order was cancelled.</div>;
  }
  const current = STEPS.indexOf(order.status);
  const label = { pending: 'Placed', paid: 'Paid', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered' };
  return (
    <ol className="flex items-start">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col items-center text-center">
          <div className="flex w-full items-center">
            <div className={`h-1 flex-1 ${i === 0 ? 'opacity-0' : i <= current ? 'bg-brand-600' : 'bg-slate-200'}`} />
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i <= current ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {i < current || order.status === 'delivered' ? '✓' : i + 1}
            </div>
            <div className={`h-1 flex-1 ${i === STEPS.length - 1 ? 'opacity-0' : i < current ? 'bg-brand-600' : 'bg-slate-200'}`} />
          </div>
          <span className={`mt-2 text-xs font-medium ${i <= current ? 'text-slate-800' : 'text-slate-400'}`}>{label[s]}</span>
        </li>
      ))}
    </ol>
  );
}

// Simulated payment gateway: initiate -> confirm (success / failed)
function PaymentPanel({ order, onDone }) {
  const toast = useToast();
  const [method, setMethod] = useState('card');
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const initiate = async () => {
    setBusy(true);
    setError('');
    try {
      setPayment(await unwrap(api.post('/payments/initiate', { orderId: order._id, method })));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (outcome) => {
    setBusy(true);
    setError('');
    try {
      await unwrap(api.post('/payments/confirm', { reference: payment.reference, outcome }));
      outcome === 'success' ? toast.success('Payment successful. Thank you!') : toast.error('Payment failed. You can try again.');
      setPayment(null);
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card border-brand-100 bg-brand-50/50 p-5">
      <h2 className="font-semibold">Complete your payment</h2>
      {order.paymentStatus === 'failed' && <p className="mt-1 text-sm text-red-600">Your last payment attempt failed. Please try again.</p>}
      <div className="mt-3"><ErrorMessage message={error} /></div>

      {!payment ? (
        <div className="mt-3 space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {[['card', 'Card'], ['bank_transfer', 'Bank transfer'], ['pay_on_delivery', 'Pay on delivery']].map(([v, l]) => (
              <label key={v} className={`cursor-pointer rounded-lg border p-3 text-center text-sm font-medium ${method === v ? 'border-brand-600 bg-white ring-2 ring-brand-600/20' : 'border-slate-300 bg-white'}`}>
                <input type="radio" className="sr-only" name="method" checked={method === v} onChange={() => setMethod(v)} />
                {l}
              </label>
            ))}
          </div>
          <button className="btn-primary" onClick={initiate} disabled={busy}>
            {busy && <ButtonSpinner />} {busy ? 'Starting...' : `Continue · ${money(order.totalAmount)}`}
          </button>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment gateway (simulation)</p>
          <p className="mt-2 text-sm text-slate-600">Reference: <span className="font-mono font-semibold">{payment.reference}</span></p>
          <p className="text-sm text-slate-600">Amount: <span className="font-semibold">{money(payment.amount)}</span></p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => confirm('success')} disabled={busy}>
              {busy && <ButtonSpinner />} Pay {money(payment.amount)}
            </button>
            <button className="btn-secondary" onClick={() => confirm('failed')} disabled={busy}>Simulate failed payment</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const { data: order, loading, error, reload } = useFetch(() => unwrap(api.get(`/orders/${id}`)), [id]);
  const [cancelling, setCancelling] = useState(false);

  if (loading) return <Spinner label="Loading order..." />;
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorMessage message={error} onRetry={reload} />
        <Link to={isAdmin ? '/admin/orders' : '/orders'} className="btn-secondary mt-4">Back to orders</Link>
      </div>
    );

  const canPay = !isAdmin && order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded' && order.status === 'pending';
  const canCancel = !isAdmin && ['pending', 'paid'].includes(order.status);
  const a = order.shippingAddress;

  const cancel = async () => {
    if (!window.confirm('Cancel this order? Items go back into stock.')) return;
    setCancelling(true);
    try {
      await api.patch(`/orders/${order._id}/cancel`);
      toast.success('Order cancelled');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to={isAdmin ? '/admin/orders' : '/orders'} className="text-sm text-slate-500 hover:text-brand-600">← Back to orders</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">Placed {dateTime(order.createdAt)}{isAdmin && order.user ? ` · ${order.user.name} (${order.user.email})` : ''}</p>
        </div>
        <div className="flex items-center gap-2"><StatusBadge status={order.status} /><StatusBadge status={order.paymentStatus} /></div>
      </div>

      <div className="card mt-6 p-6"><Tracker order={order} /></div>

      {canPay && <div className="mt-6"><PaymentPanel order={order} onDone={reload} /></div>}

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="card p-5 md:col-span-2">
          <h2 className="font-semibold">Items</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {order.items.map((i) => (
              <li key={i.product} className="flex justify-between gap-3 py-3 text-sm">
                <span>{i.quantity} × {i.name} <span className="text-slate-400">({money(i.price)})</span></span>
                <span className="font-medium">{money(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{money(order.totalAmount)}</span></div>
        </div>
        <div className="space-y-6">
          <div className="card p-5 text-sm">
            <h2 className="font-semibold">Delivery</h2>
            <p className="mt-2 text-slate-600">{a.fullName}<br />{a.street}<br />{a.city}, {a.state}<br />{a.phone}</p>
          </div>
          <div className="card p-5 text-sm">
            <h2 className="font-semibold">History</h2>
            <ul className="mt-2 space-y-1.5 text-slate-600">
              {[...order.statusHistory].reverse().map((h, i) => (
                <li key={i} className="flex justify-between"><span className="capitalize">{h.status}</span><span className="text-slate-400">{dateTime(h.at)}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {canCancel && (
        <div className="mt-6"><button className="btn-danger" onClick={cancel} disabled={cancelling}>{cancelling && <ButtonSpinner />} Cancel order</button></div>
      )}
    </div>
  );
}