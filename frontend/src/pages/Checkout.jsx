import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import api, { getErrorMessage, unwrap } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ButtonSpinner, ErrorMessage, Field, Spinner } from '../components/ui';
import { money } from '../utils/format';

export default function Checkout() {
  const { user } = useAuth();
  const { cart, loading, clear } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  if (loading && cart.items.length === 0) return <Spinner label="Loading your cart..." />;
  if (cart.items.length === 0 && !placing) return <Navigate to="/cart" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const v = {};
    if (form.fullName.trim().length < 2) v.fullName = 'Enter the recipient name.';
    if (form.phone.trim().length < 7) v.phone = 'Enter a valid phone number.';
    if (form.street.trim().length < 2) v.street = 'Enter the street address.';
    if (form.city.trim().length < 2) v.city = 'Enter the city.';
    if (form.state.trim().length < 2) v.state = 'Enter the state.';
    setErrors(v);
    if (Object.keys(v).length) return;

    setPlacing(true);
    try {
      const order = await unwrap(api.post('/orders', { shippingAddress: form }));
      clear();
      toast.success('Order placed. Complete your payment below.');
      navigate(`/orders/${order._id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Checkout</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <form onSubmit={submit} className="card space-y-4 p-5 lg:col-span-2" noValidate>
          <h2 className="font-semibold">Delivery details</h2>
          <ErrorMessage message={error} />
          <Field label="Full name" error={errors.fullName}><input className="input" value={form.fullName} onChange={set('fullName')} /></Field>
          <Field label="Phone number" error={errors.phone}><input className="input" value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Street address" error={errors.street}><input className="input" value={form.street} onChange={set('street')} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" error={errors.city}><input className="input" value={form.city} onChange={set('city')} /></Field>
            <Field label="State" error={errors.state}><input className="input" value={form.state} onChange={set('state')} /></Field>
          </div>
          <button className="btn-primary w-full sm:w-auto" disabled={placing}>
            {placing && <ButtonSpinner />} {placing ? 'Placing order...' : `Place order · ${money(cart.totalAmount)}`}
          </button>
        </form>

        <aside className="card h-fit p-5">
          <h2 className="font-semibold">Summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {cart.items.map((i) => (
              <li key={i.product._id} className="flex justify-between gap-3">
                <span className="text-slate-600">{i.quantity} × {i.product.name}</span>
                <span className="font-medium">{money(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{money(cart.totalAmount)}</span></div>
          <Link to="/cart" className="mt-3 block text-center text-sm text-brand-600 hover:underline">Edit cart</Link>
        </aside>
      </div>
    </div>
  );
}
