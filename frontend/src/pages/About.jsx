import { Link } from 'react-router-dom';
import { BRAND, GROUP } from '../config';

const BLOCKS = [
  { q: 'What is this?', a: `${BRAND} is a food ordering and delivery app for Nigerian meals. Customers browse the menu, order, pay and track delivery. The kitchen team manages dishes and moves each order along.` },
  { q: 'Who is it for?', a: 'Hungry customers anywhere in Nigeria who want home-style meals delivered, and restaurant staff who need one place to manage the menu and orders.' },
  { q: 'What problem does it solve?', a: 'Phone-call orders get missed and nobody knows where a meal is. Here every order has a tracking code, a recorded payment status and a clear step-by-step status from kitchen to doorstep.' },
  { q: 'How do I use it?', a: 'Customers: create an account, add dishes to the cart, enter your state, LGA and address, pay, then watch your order status or track it with its code. Admins: log in, manage dishes and regions, and update each order as it is confirmed, prepared, sent out and delivered.' },
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
      <p className="mt-8 text-sm text-slate-500">Built by {GROUP} as a full-stack capstone project for TS Academy.</p>
      <div className="mt-4 flex gap-3">
        <Link to="/shop" className="btn-primary">See the menu</Link>
        <Link to="/register" className="btn-secondary">Create an account</Link>
      </div>
    </div>
  );
}
