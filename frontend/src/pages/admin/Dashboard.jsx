import api, { unwrap } from '../../api/client';
import useFetch from '../../hooks/useFetch';
import { ErrorMessage, Spinner, StatusBadge } from '../../components/ui';
import { money } from '../../utils/format';

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch(() => unwrap(api.get('/orders/admin/stats')));
  if (loading) return <Spinner label="Loading stats..." />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  const cards = [
    ['Revenue (paid)', money(data.revenue)],
    ['Orders', data.orders],
    ['Customers', data.customers],
    ['Products', data.products],
  ];
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([l, v]) => (
          <div key={l} className="card p-5">
            <p className="text-sm text-slate-500">{l}</p>
            <p className="mt-1 text-2xl font-extrabold">{v}</p>
          </div>
        ))}
      </div>
      <div className="card mt-6 p-5">
        <h2 className="font-semibold">Orders by status</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {Object.keys(data.ordersByStatus).length === 0 && <p className="text-sm text-slate-500">No orders yet.</p>}
          {Object.entries(data.ordersByStatus).map(([s, c]) => (
            <div key={s} className="flex items-center gap-2"><StatusBadge status={s} /><span className="font-semibold">{c}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
