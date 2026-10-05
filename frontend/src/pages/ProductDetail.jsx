import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage, unwrap } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ProductImage } from '../components/ProductCard';
import { ButtonSpinner, ErrorMessage, Spinner } from '../components/ui';
import { money } from '../utils/format';

export default function ProductDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const { data: product, loading, error, reload } = useFetch(() => unwrap(api.get(`/products/${id}`)), [id]);

  if (loading) return <Spinner label="Loading product..." />;
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorMessage message={error} onRetry={reload} />
        <Link to="/shop" className="btn-secondary mt-4">Back to menu</Link>
      </div>
    );

  const out = product.stock === 0;

  const addToCart = async () => {
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    setAdding(true);
    try {
      await add(product._id, qty);
      toast.success(`${product.name} added to your cart`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/shop" className="text-sm text-slate-500 hover:text-brand-600">← Back to menu</Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <ProductImage product={product} className="aspect-square w-full rounded-xl" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{product.category?.name}</p>
          <h1 className="mt-1 text-3xl font-extrabold">{product.name}</h1>
          <p className="mt-3 text-3xl font-bold text-brand-700">{money(product.price)}</p>
          <p className="mt-4 whitespace-pre-line text-slate-600">{product.description || 'No description provided.'}</p>
          <p className={`mt-4 text-sm font-semibold ${out ? 'text-red-600' : 'text-emerald-600'}`}>
            {out ? 'Sold out' : `${product.stock} portions available`}
          </p>

          {isAdmin ? (
            <p className="mt-6 rounded-lg bg-slate-100 p-3 text-sm text-slate-600">You are logged in as an admin. Manage this product from the admin area.</p>
          ) : (
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                <button className="px-3 py-2 text-lg" onClick={() => setQty(Math.max(1, qty - 1))} disabled={out} aria-label="Decrease">−</button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button className="px-3 py-2 text-lg" onClick={() => setQty(Math.min(product.stock, qty + 1))} disabled={out} aria-label="Increase">+</button>
              </div>
              <button className="btn-primary flex-1" disabled={out || adding} onClick={addToCart}>
                {adding && <ButtonSpinner />} {out ? 'Sold out' : adding ? 'Adding...' : 'Add to cart'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
