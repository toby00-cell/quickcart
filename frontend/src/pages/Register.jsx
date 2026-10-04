import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { ButtonSpinner, ErrorMessage, Field } from '../components/ui';

const validate = (f) => {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Enter your full name.';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.';
  if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))
    e.password = 'Use at least 8 characters, including a letter and a number.';
  if (f.confirm !== f.password) e.confirm = 'Passwords do not match.';
  return e;
};

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">It takes less than a minute.</p>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <ErrorMessage message={error} />
          <Field label="Full name" error={errors.name}>
            <input className="input" autoComplete="name" value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Email" error={errors.email}>
            <input type="email" className="input" autoComplete="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Password" error={errors.password}>
            <input type="password" className="input" autoComplete="new-password" value={form.password} onChange={set('password')} />
          </Field>
          <Field label="Confirm password" error={errors.confirm}>
            <input type="password" className="input" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
          </Field>
          <button className="btn-primary w-full" disabled={loading}>
            {loading && <ButtonSpinner />} {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
