import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-3 text-xl font-bold">Page not found</h1>
      <p className="mt-1 text-slate-500">The page you are looking for does not exist or has moved.</p>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </div>
  );
}
