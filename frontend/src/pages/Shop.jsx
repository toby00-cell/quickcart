import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { unwrap } from '../api/client';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import ProductCard from '../components/ProductCard';
import { EmptyState, ErrorMessage, Pagination, Spinner } from '../components/ui';

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const urlSearch = params.get('search') || '';

  const [search, setSearch] = useState(urlSearch);
  const debounced = useDebounce(search);

  const update = (changes, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (debounced !== urlSearch) update({ search: debounced.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const categories = useFetch(() => unwrap(api.get('/categories')));
  const products = useFetch(
    () =>
      unwrap(
        api.get('/products', {
          params: { search: urlSearch || undefined, category: category || undefined, sort, page, limit: 12, minPrice: minPrice || undefined, maxPrice: maxPrice || undefined },
        })
      ),
    [urlSearch, category, sort, page, minPrice, maxPrice]
  );

  const clear = () => {
    setSearch('');
    setParams({}, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Menu</h1>

      <div className="card mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input className="input lg:col-span-2" placeholder="Search dishes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={category} onChange={(e) => update({ category: e.target.value })}>
          <option value="">All regions</option>
          {categories.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="input" value={sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name A-Z</option>
        </select>
        <div className="flex gap-2">
          <input className="input" type="number" min="0" placeholder="Min ₦" value={minPrice} onChange={(e) => update({ minPrice: e.target.value })} />
          <input className="input" type="number" min="0" placeholder="Max ₦" value={maxPrice} onChange={(e) => update({ maxPrice: e.target.value })} />
        </div>
      </div>

      <div className="mt-6">
        {products.loading ? (
          <Spinner label="Loading products..." />
        ) : products.error ? (
          <ErrorMessage message={products.error} onRetry={products.reload} />
        ) : products.data.items.length === 0 ? (
          <div>
            <EmptyState title="No dishes found" text="Try a different search or clear the filters." />
            <div className="mt-4 text-center"><button className="btn-secondary" onClick={clear}>Clear filters</button></div>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">{products.data.pagination.total} dish(es)</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.data.items.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
            <Pagination pagination={products.data.pagination} onChange={(p) => update({ page: String(p) }, false)} />
          </>
        )}
      </div>
    </div>
  );
}
