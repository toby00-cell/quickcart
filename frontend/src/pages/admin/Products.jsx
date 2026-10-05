import { useState } from 'react';
import api, { getErrorMessage, unwrap } from '../../api/client';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { ButtonSpinner, EmptyState, ErrorMessage, Field, Modal, Pagination, Spinner } from '../../components/ui';
import { money } from '../../utils/format';

const blank = { name: '', description: '', price: '', stock: '', category: '', imageUrl: '', icon: '', isActive: true };

function ProductForm({ product, categories, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(
    product
      ? { name: product.name, description: product.description || '', price: product.price, stock: product.stock, category: product.category?._id || product.category, imageUrl: product.imageUrl || '', icon: product.icon || '', isActive: product.isActive }
      : blank
  );
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const v = {};
    if (form.name.trim().length < 2) v.name = 'Enter a product name.';
    if (!(Number(form.price) > 0)) v.price = 'Price must be greater than 0.';
    if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) v.stock = 'Stock must be a whole number (0 or more).';
    if (!form.category) v.category = 'Choose a category.';
    setErrors(v);
    if (Object.keys(v).length) return;

    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category,
      imageUrl: form.imageUrl.trim(),
      icon: form.icon.trim(),
      isActive: form.isActive,
    };
    setSaving(true);
    try {
      if (product) await api.patch(`/products/${product._id}`, body);
      else await api.post('/products', body);
      toast.success(product ? 'Product updated' : 'Product created');
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal title={product ? 'Edit dish' : 'Add dish'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <ErrorMessage message={error} />
        <Field label="Name" error={errors.name}><input className="input" value={form.name} onChange={set('name')} /></Field>
        <Field label="Description"><textarea className="input" rows="3" value={form.description} onChange={set('description')} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (₦)" error={errors.price}><input className="input" type="number" min="0" step="any" value={form.price} onChange={set('price')} /></Field>
          <Field label="Portions available" error={errors.stock}><input className="input" type="number" min="0" step="1" value={form.stock} onChange={set('stock')} /></Field>
        </div>
        <Field label="Category" error={errors.category}>
          <select className="input" value={form.category} onChange={set('category')}>
            <option value="">Select...</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Emoji icon (optional)"><input className="input" maxLength="8" placeholder="🍲" value={form.icon} onChange={set('icon')} /></Field>
        <Field label="Image (optional)"><input className="input" placeholder="/images/dish.jpg or https://..." value={form.imageUrl} onChange={set('imageUrl')} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Visible in the shop</label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving && <ButtonSpinner />} {saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Products() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const categories = useFetch(() => unwrap(api.get('/categories')));
  const { data, loading, error, reload } = useFetch(
    () => unwrap(api.get('/products', { params: { search: debounced.trim() || undefined, page, limit: 10 } })),
    [debounced, page]
  );

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${p._id}`);
      toast.success('Product deleted');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input className="input max-w-xs" placeholder="Search dishes..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <button className="btn-primary" onClick={() => setEditing('new')} disabled={!categories.data?.length}>+ Add dish</button>
      </div>
      {categories.data && categories.data.length === 0 && <p className="mt-2 text-sm text-amber-700">Create a category (region) first, then you can add dishes.</p>}

      <div className="mt-4">
        {loading ? (
          <Spinner label="Loading dishes..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={reload} />
        ) : data.items.length === 0 ? (
          <EmptyState title="No dishes found" />
        ) : (
          <>
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Portions</th><th className="p-3">Visible</th><th className="p-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((p) => (
                    <tr key={p._id}>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-slate-500">{p.category?.name}</td>
                      <td className="p-3">{money(p.price)}</td>
                      <td className={`p-3 ${p.stock === 0 ? 'font-semibold text-red-600' : ''}`}>{p.stock}</td>
                      <td className="p-3">{p.isActive ? 'Yes' : 'No'}</td>
                      <td className="space-x-3 p-3 text-right">
                        <button className="font-medium text-brand-600 hover:underline" onClick={() => setEditing(p)}>Edit</button>
                        <button className="font-medium text-red-600 hover:underline" onClick={() => remove(p)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onChange={setPage} />
          </>
        )}
      </div>

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          categories={categories.data || []}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}
