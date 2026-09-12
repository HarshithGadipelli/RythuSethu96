import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem("rythujanasethu_cart") || localStorage.getItem("rythusethu_cart");
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(item => item && item.crop && item.crop._id);
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("rythujanasethu_cart", JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  const addToCart = (crop, quantity = 1, isPrebooked = false, autoOpen = true) => {
    if (!crop || !crop._id) return;
    const qty = Math.max(1, Number(quantity) || 1);

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.crop?._id === crop._id && !!item.isPrebooked === !!isPrebooked);
      if (existingIdx > -1) {
        return prev.map((item, idx) => 
          idx === existingIdx
            ? { ...item, quantity: (Number(item.quantity) || 1) + qty }
            : item
        );
      }
      return [...prev, { crop, quantity: qty, isPrebooked: !!isPrebooked }];
    });

    if (autoOpen) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (cropId, isPrebooked = false) => {
    setCart(prev => prev.filter(item => !(item.crop?._id === cropId && !!item.isPrebooked === !!isPrebooked)));
  };

  const updateQuantity = (cropId, isPrebooked, newQuantity) => {
    const qty = Number(newQuantity);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(cropId, isPrebooked);
      return;
    }
    setCart(prev => prev.map(item => 
      item.crop?._id === cropId && !!item.isPrebooked === !!isPrebooked
        ? { ...item, quantity: qty }
        : item
    ));
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = Number(item.crop?.price) || 0;
      const qty = Number(item.quantity) || 1;
      return total + (price * qty);
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + (Number(item.quantity) || 1), 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};
