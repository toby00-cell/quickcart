import { Link } from 'react-router-dom';
import { BRAND, GROUP } from '../config';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row">
        <p>© {new Date().getFullYear()} {BRAND}. Built by {GROUP}, TS Academy Capstone.</p>
        <div className="flex gap-5">
          <Link to="/shop" className="hover:text-brand-600">Menu</Link>
          <Link to="/track" className="hover:text-brand-600">Track order</Link>
          <Link to="/about" className="hover:text-brand-600">About</Link>
          <Link to="/login" className="hover:text-brand-600">Log in</Link>
        </div>
      </div>
    </footer>
  );
}
