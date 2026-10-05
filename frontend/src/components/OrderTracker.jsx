const STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
const LABELS = { pending: 'Placed', confirmed: 'Confirmed', preparing: 'Preparing', out_for_delivery: 'On the way', delivered: 'Delivered' };

export default function OrderTracker({ status }) {
  if (status === 'cancelled') {
    return <div className="rounded-lg bg-slate-100 p-4 text-sm font-medium text-slate-700">This order was cancelled.</div>;
  }
  const current = STEPS.indexOf(status);
  return (
    <ol className="flex items-start">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col items-center text-center">
          <div className="flex w-full items-center">
            <div className={`h-1 flex-1 ${i === 0 ? 'opacity-0' : i <= current ? 'bg-brand-600' : 'bg-slate-200'}`} />
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i <= current ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {i < current || status === 'delivered' ? '✓' : i + 1}
            </div>
            <div className={`h-1 flex-1 ${i === STEPS.length - 1 ? 'opacity-0' : i < current ? 'bg-brand-600' : 'bg-slate-200'}`} />
          </div>
          <span className={`mt-2 text-xs font-medium ${i <= current ? 'text-slate-800' : 'text-slate-400'}`}>{LABELS[s]}</span>
        </li>
      ))}
    </ol>
  );
}
