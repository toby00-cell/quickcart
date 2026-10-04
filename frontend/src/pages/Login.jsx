import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { ButtonSpinner, ErrorMessage, Field } from '../components/ui';
import { BRAND } from '../config';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Enter your email and password.');
    setLoading(true);
    try {
      const u = await login(form);
      navigate(location.state?.from || (u.role === 'admin' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Log in to your {BRAND} account.</p>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <ErrorMessage message={error} />
          <Field label="Email">
            <input type="email" className="input" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password">
            <input type="password" className="input" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <button className="btn-primary w-full" disabled={loading}>
            {loading && <ButtonSpinner />} {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          New here? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
