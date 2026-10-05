import { NavLink, Outlet } from 'react-router-dom';

const link = ({ isActive }) =>
  `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`;

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Admin</h1>
      <nav className="mt-4 flex gap-2 overflow-x-auto">
        <NavLink end to="/admin" className={link}>Dashboard</NavLink>
        <NavLink to="/admin/products" className={link}>Menu</NavLink>
        <NavLink to="/admin/categories" className={link}>Categories</NavLink>
        <NavLink to="/admin/orders" className={link}>Orders</NavLink>
      </nav>
      <div className="mt-6"><Outlet /></div>
    </div>
  );
}
