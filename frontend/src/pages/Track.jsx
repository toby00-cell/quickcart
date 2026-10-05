import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage, unwrap } from '../api/client';
import OrderTracker from '../components/OrderTracker';
import { ButtonSpinner, ErrorMessage, StatusBadge } from '../components/ui';
import { dateTime, money } from '../utils/format';

export default function Track() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(code || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!code) {
      setOrder(null);
      setError('');
      return;
    }
    setInput(code);
    setLoading(true);
    setError('');
    unwrap(api.get(`/orders/track/${encodeURIComponent(code)}`))
      .then(setOrder)
      .catch((err) => {
        setOrder(null);
        setError(getErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [code]);

  const submit = (e) => {
    e.preventDefault();
    const c = input.trim();
    if (c.length < 5) return setError('Enter the tracking code from your order, e.g. ND-1A2B3C4D5E.');
    navigate(`/track/${encodeURIComponent(c)}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Track your order</h1>
      <p className="mt-1 text-slate-500">Enter the tracking code from your order confirmation. No login needed.</p>

      <form onSubmit={submit} className="mt-6 flex gap-2">
        <input className="input" placeholder="ND-XXXXXXXXXX" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn-primary" disabled={loading}>{loading && <ButtonSpinner />} Track</button>
      </form>

      <div className="mt-6 space-y-4">
        <ErrorMessage message={error} />
        {order && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">{order.orderNumber}</h2>
              <StatusBadge status={order.status} />
            </div>
            <div className="card p-6"><OrderTracker status={order.status} /></div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="card p-5 md:col-span-2">
                <h3 className="font-semibold">Your meal</h3>
                <ul className="mt-2 divide-y divide-slate-100 text-sm">
                  {order.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between py-2"><span>{i.quantity} × {i.name}</span></li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
                  <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Delivery</span><span>{money(order.deliveryFee)}</span></div>
                  <div className="flex justify-between text-base font-bold"><span>Total</span><span>{money(order.totalAmount)}</span></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="card p-5 text-sm">
                  <h3 className="font-semibold">Delivering to</h3>
                  <p className="mt-2 text-slate-600">{order.destination}</p>
                </div>
                <div className="card p-5 text-sm">
                  <h3 className="font-semibold">Updates</h3>
                  <ul className="mt-2 space-y-1.5 text-slate-600">
                    {[...order.statusHistory].reverse().map((h, i) => (
                      <li key={i} className="flex justify-between gap-2"><span className="capitalize">{h.status.replace(/_/g, ' ')}</span><span className="text-slate-400">{dateTime(h.at)}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
