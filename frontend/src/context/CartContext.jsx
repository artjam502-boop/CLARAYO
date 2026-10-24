import React from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

const C = createContext();
export const useCart = () => useContext(C);

const cartKey = (product) => `${product._id}:${product.selectedSize || ''}`;
const loadCart = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('clarayo_cart') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    localStorage.removeItem('clarayo_cart');
    return [];
  }
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState(loadCart);
  const save = (next) => {
    setItems(next);
    localStorage.setItem('clarayo_cart', JSON.stringify(next));
  };
  const add = (product, quantity = 1) => {
    const sellerId = typeof product.seller === 'object' ? product.seller?._id : product.seller;
    if (user?.role === 'seller' && String(sellerId) === String(user._id)) {
      toast.error('You cannot add your own product to the cart');
      return false;
    }
    const key = cartKey(product);
    const existing = items.find((item) => cartKey(item) === key);
    save(existing
      ? items.map((item) => cartKey(item) === key ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } : item)
      : [...items, { ...product, quantity }]);
    toast.success(`${product.name}${product.selectedSize ? ` (${product.selectedSize})` : ''} added to cart`);
    return true;
  };
  const update = (key, quantity) => save(quantity < 1
    ? items.filter((item) => cartKey(item) !== key)
    : items.map((item) => cartKey(item) === key ? { ...item, quantity } : item));
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  return <C.Provider value={{
    items,
    add,
    update,
    remove: (key) => save(items.filter((item) => cartKey(item) !== key)),
    clear: () => save([]),
    total,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    cartKey,
  }}>{children}</C.Provider>;
}
