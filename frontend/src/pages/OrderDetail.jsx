import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage, unwrap } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import OrderTracker from '../components/OrderTracker';
import { ButtonSpinner, ErrorMessage, Spinner, StatusBadge } from '../components/ui';
import { dateTime, money } from '../utils/format';

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
      outcome === 'success' ? toast.success('Payment successful. The kitchen has your order!') : toast.error('Payment failed. You can try again.');
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

  const canPay = !isAdmin && ['unpaid', 'failed'].includes(order.paymentStatus) && ['pending', 'confirmed'].includes(order.status);
  const canCancel = !isAdmin && ['pending', 'confirmed'].includes(order.status);
  const a = order.shippingAddress;

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
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
          <p className="text-sm text-slate-500">
            Placed {dateTime(order.createdAt)}{isAdmin && order.user ? ` · ${order.user.name} (${order.user.email})` : ''}
          </p>
          <p className="text-xs text-slate-400">
            Tracking code: <span className="font-mono">{order.orderNumber}</span> ·{' '}
            <Link to={`/track/${order.orderNumber}`} className="text-brand-600 hover:underline">public tracking page</Link>
          </p>
        </div>
        <div className="flex items-center gap-2"><StatusBadge status={order.status} /><StatusBadge status={order.paymentStatus} /></div>
      </div>

      <div className="card mt-6 p-6"><OrderTracker status={order.status} /></div>

      {canPay && <div className="mt-6"><PaymentPanel order={order} onDone={reload} /></div>}

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="card p-5 md:col-span-2">
          <h2 className="font-semibold">Your meal</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {order.items.map((i) => (
              <li key={i.product} className="flex justify-between gap-3 py-3 text-sm">
                <span>{i.quantity} × {i.name} <span className="text-slate-400">({money(i.price)})</span></span>
                <span className="font-medium">{money(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 space-y-1 border-t border-slate-200 pt-3 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Delivery</span><span>{money(order.deliveryFee)}</span></div>
            <div className="flex justify-between pt-1 text-lg font-bold"><span>Total</span><span>{money(order.totalAmount)}</span></div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card p-5 text-sm">
            <h2 className="font-semibold">Delivery</h2>
            <p className="mt-2 text-slate-600">{a.fullName}<br />{a.street}<br />{a.lga}, {a.state}<br />{a.phone}</p>
          </div>
          <div className="card p-5 text-sm">
            <h2 className="font-semibold">History</h2>
            <ul className="mt-2 space-y-1.5 text-slate-600">
              {[...order.statusHistory].reverse().map((h, i) => (
                <li key={i} className="flex justify-between gap-2"><span className="capitalize">{h.status.replace(/_/g, ' ')}</span><span className="text-slate-400">{dateTime(h.at)}</span></li>
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
