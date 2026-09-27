"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  quantity: number;
}

const STORAGE_CART_KEY = "japan_shop_cart_v1";

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  toggleCartDrawer: () => void;
  addToCart: (product: Product, quantity?: number, openDrawer?: boolean) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const openCartDrawer = () => setIsCartDrawerOpen(true);
  const closeCartDrawer = () => setIsCartDrawerOpen(false);
  const toggleCartDrawer = () => setIsCartDrawerOpen((prev) => !prev);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CART_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage
  const persistCart = (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  };

  const addToCart = (product: Product, quantity = 1, openDrawer = false) => {
    const existingIndex = items.findIndex((i) => i.product.id === product.id);

    if (existingIndex > -1) {
      const next = [...items];
      next[existingIndex] = {
        ...next[existingIndex],
        quantity: next[existingIndex].quantity + quantity,
      };
      persistCart(next);
    } else {
      persistCart([...items, { product, quantity }]);
    }
    
    if (openDrawer) {
      setIsCartDrawerOpen(true);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const next = items.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    persistCart(next);
  };

  const removeFromCart = (productId: string) => {
    const next = items.filter((item) => item.product.id !== productId);
    persistCart(next);
  };

  const clearCart = () => {
    persistCart([]);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        isCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        toggleCartDrawer,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
