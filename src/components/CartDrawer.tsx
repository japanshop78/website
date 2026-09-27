"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Product } from "@/data/products";
import { getAssetPath } from "@/utils/assetPath";
import CloseIcon from "./icons/CloseIcon";
import TrashIcon from "./icons/TrashIcon";
import BagIcon from "./icons/BagIcon";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export default function CartDrawer() {
  const {
    items,
    totalItems,
    totalPrice,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeFromCart,
  } = useCart();

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCartDrawer();
      }
    };
    if (isCartDrawerOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isCartDrawerOpen, closeCartDrawer]);

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeCartDrawer}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 border border-zinc-200/80 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛍️</span>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Giỏ Hàng Của Bạn
            </h2>
            <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {totalItems}
            </span>
          </div>
          <button
            type="button"
            onClick={closeCartDrawer}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Đóng giỏ hàng"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-zinc-100 dark:divide-zinc-800 min-h-0">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
                  <BagIcon className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                  Giỏ hàng trống
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mb-6">
                  Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm nội địa Nhật chính hãng ngay nhé!
                </p>
                <button
                  type="button"
                  onClick={closeCartDrawer}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Khám Phá Sản Phẩm Ngay
                </button>
              </div>
            ) : (
              items.map((item) => {
                const imgUrl = item.product.images?.[0] || "/logo.jpg";
                return (
                  <div key={item.product.id} className="py-3 flex gap-3.5 items-center">
                    {/* Thumbnail */}
                    <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                      <Image
                        src={getAssetPath(imgUrl)}
                        alt={item.product.name}
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.product.id}`}
                        onClick={closeCartDrawer}
                        className="text-xs font-semibold text-zinc-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {item.product.name}
                      </Link>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {formatPrice(item.product.price)}
                        </span>
                        {item.product.oldPrice && item.product.oldPrice > item.product.price && (
                          <span className="text-[10px] text-zinc-400 line-through">
                            {formatPrice(item.product.oldPrice)}
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 text-xs font-bold"
                            aria-label="Giảm"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-semibold text-zinc-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 text-xs font-bold"
                            aria-label="Tăng"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-zinc-400 hover:text-rose-500 p-1 transition-colors"
                          title="Xóa khỏi giỏ"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Subtotal & CTA */}
          {items.length > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-5 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Tạm tính:</span>
                <span className="text-base font-extrabold text-zinc-900 dark:text-white">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={closeCartDrawer}
                  className="w-full py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-center cursor-pointer"
                >
                  Tiếp tục xem hàng
                </button>
                <Link
                  href="/cart"
                  onClick={closeCartDrawer}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🛍️</span>
                  <span>Đặt hàng ngay</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
}
