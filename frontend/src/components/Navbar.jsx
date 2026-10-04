import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { BRAND } from '../config';

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition hover:text-brand-600 ${isActive ? 'text-brand-600' : 'text-slate-600'}`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-xl font-extrabold text-brand-600" onClick={close}>
          {BRAND}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/shop" className={linkClass}>Shop</NavLink>
          <NavLink to="/about" className={linkClass}>About</NavLink>
          {user && !isAdmin && <NavLink to="/orders" className={linkClass}>My orders</NavLink>}
          {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-3">
          {!isAdmin && (
            <Link to="/cart" className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Cart">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {cart.totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
                  {cart.totalItems}
                </span>
              )}
            </Link>
          )}

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <span className="text-sm text-slate-600">Hi, {user.name.split(' ')[0]}</span>
                <button onClick={handleLogout} className="btn-secondary">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">Log in</Link>
                <Link to="/register" className="btn-primary">Sign up</Link>
              </>
            )}
          </div>

          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-1 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <NavLink to="/shop" className="block py-2 text-sm font-medium" onClick={close}>Shop</NavLink>
          <NavLink to="/about" className="block py-2 text-sm font-medium" onClick={close}>About</NavLink>
          {user && !isAdmin && <NavLink to="/orders" className="block py-2 text-sm font-medium" onClick={close}>My orders</NavLink>}
          {isAdmin && <NavLink to="/admin" className="block py-2 text-sm font-medium" onClick={close}>Admin</NavLink>}
          <div className="flex gap-2 pt-2">
            {user ? (
              <button onClick={handleLogout} className="btn-secondary w-full">Log out</button>
            ) : (
              <>
                <Link to="/login" className="btn-secondary flex-1" onClick={close}>Log in</Link>
                <Link to="/register" className="btn-primary flex-1" onClick={close}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
