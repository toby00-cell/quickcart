import { Link } from 'react-router-dom';
import { BRAND } from '../config';

const BLOCKS = [
  { q: 'What is this?', a: `${BRAND} is an online store with a complete order system: products, cart, checkout, payment and order tracking.` },
  { q: 'Who is it for?', a: 'Shoppers who want a simple way to buy and follow their orders, and store owners who need one place to manage products and orders.' },
  { q: 'What problem does it solve?', a: 'Orders get lost between stock, payment and delivery. Here stock is reserved when an order is placed, payment status is recorded, and every status change is visible to both the customer and the store.' },
  { q: 'How do I use it?', a: 'Customers: create an account, add products to the cart, check out, pay and watch the status on the order page. Admins: log in, manage products and categories, then move orders through processing, shipped and delivered.' },
];

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">About {BRAND}</h1>
      <div className="mt-8 space-y-6">
        {BLOCKS.map((b) => (
          <div key={b.q} className="card p-6">
            <h2 className="font-semibold text-brand-700">{b.q}</h2>
            <p className="mt-2 text-slate-600">{b.a}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex gap-3">
        <Link to="/shop" className="btn-primary">Browse products</Link>
        <Link to="/register" className="btn-secondary">Create an account</Link>
      </div>
    </div>
  );
}
