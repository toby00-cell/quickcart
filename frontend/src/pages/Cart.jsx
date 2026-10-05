import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import { ProductImage } from '../components/ProductCard';
import { EmptyState, Spinner } from '../components/ui';
import { money } from '../utils/format';

export default function Cart() {
  const { cart, loading, update, remove } = useCart();
  const toast = useToast();
  const [busy, setBusy] = useState('');

  const run = async (id, fn) => {
    setBusy(id);
    try {
      await fn();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  };

  if (loading && cart.items.length === 0) return <Spinner label="Loading your cart..." />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Your cart</h1>

      {cart.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Your cart is empty" text="Add a few dishes and they will show up here." actionLabel="View the menu" to="/shop" />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {cart.items.map(({ product, quantity, subtotal }) => (
              <div key={product._id} className="card flex gap-4 p-4">
                <ProductImage product={product} className="h-20 w-20 shrink-0 rounded-lg" />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between gap-2">
                    <Link to={`/shop/${product._id}`} className="font-semibold hover:text-brand-600">{product.name}</Link>
                    <span className="font-bold">{money(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-slate-300">
                      <button className="px-3 py-1" disabled={busy === product._id || quantity <= 1} onClick={() => run(product._id, () => update(product._id, quantity - 1))} aria-label="Decrease">−</button>
                      <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                      <button className="px-3 py-1" disabled={busy === product._id || quantity >= product.stock} onClick={() => run(product._id, () => update(product._id, quantity + 1))} aria-label="Increase">+</button>
                    </div>
                    <button className="text-sm font-medium text-red-600 hover:underline" disabled={busy === product._id} onClick={() => run(product._id, () => remove(product._id))}>
                      Remove
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{money(product.price)} each</p>
                </div>
              </div>
            ))}
          </div>

          <aside className="card h-fit p-5">
            <h2 className="font-semibold">Order summary</h2>
            <div className="mt-4 flex justify-between text-sm text-slate-600"><span>Items</span><span>{cart.totalItems}</span></div>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{money(cart.totalAmount)}</span></div>
            <Link to="/checkout" className="btn-primary mt-5 w-full">Proceed to checkout</Link>
            <Link to="/shop" className="btn-secondary mt-2 w-full">Back to menu</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
