import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { unwrap } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const EMPTY = { items: [], totalItems: 0, totalAmount: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || user.role === 'admin') return setCart(EMPTY);
    setLoading(true);
    try {
      setCart(await unwrap(api.get('/cart')));
    } catch {
      /* the cart page shows its own error state */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      refresh,
      add: async (productId, quantity = 1) => setCart(await unwrap(api.post('/cart/items', { productId, quantity }))),
      update: async (productId, quantity) => setCart(await unwrap(api.patch(`/cart/items/${productId}`, { quantity }))),
      remove: async (productId) => setCart(await unwrap(api.delete(`/cart/items/${productId}`))),
      clear: () => setCart(EMPTY),
    }),
    [cart, loading, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
