import { useState } from 'react';
import api, { getErrorMessage, unwrap } from '../../api/client';
import useFetch from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { ButtonSpinner, EmptyState, ErrorMessage, Spinner } from '../../components/ui';

export default function Categories() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => unwrap(api.get('/categories')));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error('Category name must be at least 2 characters.');
    setBusy(true);
    try {
      const body = { name: name.trim(), description: description.trim() || undefined };
      if (editing) await api.patch(`/categories/${editing._id}`, body);
      else await api.post('/categories', body);
      toast.success(editing ? 'Category updated' : 'Category created');
      setName(''); setDescription(''); setEditing(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (c) => { setEditing(c); setName(c.name); setDescription(c.description || ''); };
  const cancelEdit = () => { setEditing(null); setName(''); setDescription(''); };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await api.delete(`/categories/${c._id}`);
      toast.success('Category deleted');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={save} className="card h-fit space-y-3 p-5">
        <h2 className="font-semibold">{editing ? 'Edit category' : 'Add category'}</h2>
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy}>{busy && <ButtonSpinner />} {editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      <div className="lg:col-span-2">
        {loading ? <Spinner /> : error ? <ErrorMessage message={error} onRetry={reload} /> : data.length === 0 ? (
          <EmptyState title="No categories yet" text="Add your first category to start adding products." />
        ) : (
          <div className="card divide-y divide-slate-100">
            {data.map((c) => (
              <div key={c._id} className="flex items-center justify-between gap-3 p-4">
                <div><p className="font-medium">{c.name}</p>{c.description && <p className="text-sm text-slate-500">{c.description}</p>}</div>
                <div className="space-x-3 text-sm">
                  <button className="font-medium text-brand-600 hover:underline" onClick={() => startEdit(c)}>Edit</button>
                  <button className="font-medium text-red-600 hover:underline" onClick={() => remove(c)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
