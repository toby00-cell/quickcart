import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { unwrap } from '../api/client';
import useFetch from '../hooks/useFetch';
import { EmptyState, ErrorMessage, Pagination, Spinner, StatusBadge } from '../components/ui';
import { date, money } from '../utils/format';

const STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

export default function Orders() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(
    () => unwrap(api.get('/orders', { params: { status: status || undefined, page, limit: 8 } })),
    [status, page]
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">My orders</h1>
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <Spinner label="Loading your orders..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={reload} />
        ) : data.items.length === 0 ? (
          <EmptyState title="No orders yet" text="Orders you place will appear here." actionLabel="View the menu" to="/shop" />
        ) : (
          <>
            <div className="space-y-3">
              {data.items.map((o) => (
                <Link key={o._id} to={`/orders/${o._id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:shadow-md">
                  <div>
                    <p className="font-semibold">{o.orderNumber}</p>
                    <p className="text-sm text-slate-500">{date(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} item(s)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <span className="font-bold">{money(o.totalAmount)}</span>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination pagination={data.pagination} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
