import { Link } from 'react-router-dom';
import api, { unwrap } from '../api/client';
import useFetch from '../hooks/useFetch';
import ProductCard from '../components/ProductCard';
import { ErrorMessage, Spinner } from '../components/ui';
import { BRAND } from '../config';

const STEPS = [
  { n: '1', title: 'Browse', text: 'Search and filter products by category and price.' },
  { n: '2', title: 'Add to cart', text: 'Build your cart. Stock is checked as you go.' },
  { n: '3', title: 'Pay', text: 'Check out with your delivery details and pay.' },
  { n: '4', title: 'Track', text: 'Follow your order from payment to delivery.' },
];

export default function Home() {
  const featured = useFetch(() => unwrap(api.get('/products', { params: { limit: 4, sort: 'newest' } })));
  const categories = useFetch(() => unwrap(api.get('/categories')));

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-600 to-indigo-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">Shop what you need. Track it to your door.</h1>
          <p className="mt-4 max-w-xl text-lg text-indigo-100">
            {BRAND} is an online store where you can browse products, place an order in a few clicks and follow its progress at every step.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="btn bg-white text-brand-700 hover:bg-indigo-50">Start shopping</Link>
            <Link to="/register" className="btn border border-white/40 text-white hover:bg-white/10">Create an account</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">{s.n}</span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {categories.data?.length > 0 && (
        <section className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">Shop by category</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.data.map((c) => (
              <Link key={c._id} to={`/shop?category=${c._id}`} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:border-brand-500 hover:text-brand-600">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">New arrivals</h2>
          <Link to="/shop" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>
        </div>
        <div className="mt-6">
          {featured.loading ? (
            <Spinner label="Loading products..." />
          ) : featured.error ? (
            <ErrorMessage message={featured.error} onRetry={featured.reload} />
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {featured.data.items.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
