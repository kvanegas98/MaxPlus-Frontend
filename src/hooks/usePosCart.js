import { useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

const INITIAL_ORDER_INFO = { customerName: '', phone: '' };

function genCartItemId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Compare only modifier IDs (ignore quantity) for merge logic
function modifierIdsEqual(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a.map((m) => m.id)].sort();
  const sortedB = [...b.map((m) => m.id)].sort();
  return sortedA.every((id, i) => id === sortedB[i]);
}

// Sum of modifiers total including per-modifier quantity
function calcModifiersTotal(mods) {
  return mods.reduce((s, m) => s + (m.precio ?? m.price ?? 0) * (m.quantity ?? 1), 0);
}

export function usePosCart() {
  const [cartItems, setCartItems]   = useLocalStorage('pos_cartItems', []);
  const [orderType, setOrderType]   = useLocalStorage('pos_orderType', 'venta');
  const [orderInfo, setOrderInfo]   = useLocalStorage('pos_orderInfo', INITIAL_ORDER_INFO);
  const [selectedCustomer, setSelectedCustomer] = useLocalStorage('pos_selectedCustomer', null);

  // selectedModifiers: array of { id, nombre, precio, isAvailable, quantity }
  const addToCart = (product, selectedModifiers = []) => {
    if (!product.isAvailable) return;
    setCartItems((prev) => {
      // Merge into an existing line with same product + same modifier IDs
      const existing = prev.find(
        (item) =>
          item.id === product.id &&
          modifierIdsEqual(item.selectedModifiers ?? [], selectedModifiers)
      );
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === existing.cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      const modifiersTotal = calcModifiersTotal(selectedModifiers);
      return [
        ...prev,
        {
          ...product,
          cartItemId:        genCartItemId(),
          quantity:          1,
          note:              '',
          selectedModifiers,
          basePrice:         product.price,
          price:             product.price + modifiersTotal,
        },
      ];
    });
  };

  // Update quantity of a cart line (by cartItemId)
  const updateQuantity = (cartItemId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.cartItemId !== cartItemId || item.quantity > 0)
    );
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const addItemNote = (cartItemId, note) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, note: note.trim() } : item
      )
    );
  };

  // Replace selectedModifiers on an existing cart line (edit from cart)
  const updateCartItemModifiers = (cartItemId, newModifiers) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId) return item;
        const modifiersTotal = calcModifiersTotal(newModifiers);
        return {
          ...item,
          selectedModifiers: newModifiers,
          price: (item.basePrice ?? item.price) + modifiersTotal,
        };
      })
    );
  };

  const updateOrderInfo = (updates) => {
    setOrderInfo((prev) => ({ ...prev, ...updates }));
  };

  const clearCart = () => setCartItems([]);

  const resetOrder = () => {
    setCartItems([]);
    setOrderType('venta');
    setOrderInfo(INITIAL_ORDER_INFO);
    setSelectedCustomer(null);
  };

  const total = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems]
  );

  return {
    cartItems, addToCart, updateQuantity, removeFromCart, addItemNote,
    updateCartItemModifiers,
    clearCart, resetOrder, total,
    orderType, setOrderType,
    orderInfo, updateOrderInfo,
    selectedCustomer, setSelectedCustomer,
  };
}
