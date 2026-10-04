import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage, unwrap } from '../../api/client';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorMessage, Pagination, Spinner, StatusBadge } from '../../components/ui';
import { date, money } from '../../utils/format';

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
// mirrors the backend transition rules
const NEXT = { pending: ['cancelled'], paid: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };

export default function AdminOrders() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState('');
  const { data, loading, error, reload } = useFetch(
    () => unwrap(api.get('/orders/admin/all', { params: { status: status || undefined, search: debounced.trim() || undefined, page, limit: 10 } })),
    [status, debounced, page]
  );

  const change = async (order, next) => {
    if (!next) return;
    if (next === 'cancelled' && !window.confirm('Cancel this order? Items go back into stock.')) return;
    setBusy(order._id);
    try {
      await api.patch(`/orders/${order._id}/status`, { status: next });
      toast.success(`Order marked ${next}`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search order number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="mt-4">
        {loading ? <Spinner label="Loading orders..." /> : error ? <ErrorMessage message={error} onRetry={reload} /> : data.items.length === 0 ? (
          <EmptyState title="No orders found" />
        ) : (
          <>
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Date</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Payment</th><th className="p-3">Update</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((o) => (
                    <tr key={o._id}>
                      <td className="p-3"><Link to={`/orders/${o._id}`} className="font-semibold text-brand-600 hover:underline">{o.orderNumber}</Link></td>
                      <td className="p-3">{o.user?.name}<br /><span className="text-xs text-slate-400">{o.user?.email}</span></td>
                      <td className="p-3">{date(o.createdAt)}</td>
                      <td className="p-3 font-medium">{money(o.totalAmount)}</td>
                      <td className="p-3"><StatusBadge status={o.status} /></td>
                      <td className="p-3"><StatusBadge status={o.paymentStatus} /></td>
                      <td className="p-3">
                        {NEXT[o.status].length === 0 ? <span className="text-xs text-slate-400">Final</span> : (
                          <select className="input w-auto py-1" value="" disabled={busy === o._id} onChange={(e) => change(o, e.target.value)}>
                            <option value="">Move to...</option>
                            {NEXT[o.status].map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
