import { Link } from 'react-router-dom';
import { money } from '../utils/format';

export function ProductImage({ product, className = '' }) {
  if (product.imageUrl) {
    return <img src={product.imageUrl} alt={product.name} className={`object-cover ${className}`} loading="lazy" />;
  }
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-50 text-6xl ${className}`}>
      {product.icon || '🍽️'}
    </div>
  );
}

export default function ProductCard({ product }) {
  const out = product.stock === 0;
  return (
    <Link to={`/shop/${product._id}`} className="card group overflow-hidden transition hover:shadow-md">
      <ProductImage product={product} className="aspect-square w-full" />
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{product.category?.name}</p>
        <h3 className="mt-1 line-clamp-1 font-semibold group-hover:text-brand-600">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold">{money(product.price)}</span>
          {out ? (
            <span className="text-xs font-semibold text-red-600">Sold out</span>
          ) : product.stock <= 5 ? (
            <span className="text-xs font-semibold text-amber-600">Only {product.stock} portions left</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
