"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useProductData } from "@/context/ProductDataContext";
import { Product } from "@/data/products";
import { getAssetPath } from "@/utils/assetPath";
import SearchIcon from "./icons/SearchIcon";
import CloseIcon from "./icons/CloseIcon";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

interface LiveSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function LiveSearchDropdown({ isOpen, onClose, className = "" }: LiveSearchDropdownProps) {
  const router = useRouter();
  const { products, categories, getCategoryIdByProductId } = useProductData();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Category map for fast name lookup
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  // Filter products
  const searchResults = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return products
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.tag && p.tag.toLowerCase().includes(q)) ||
          (p.ingredients && p.ingredients.toLowerCase().includes(q))
        );
      })
      .slice(0, 6);
  }, [debouncedQuery, products]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedIndex >= 0 && searchResults[selectedIndex]) {
      const selected = searchResults[selectedIndex];
      onClose();
      router.push(`/product/${selected.id}`);
      return;
    }
    if (query.trim()) {
      const targetQuery = encodeURIComponent(query.trim());
      onClose();
      router.push(`/search?q=${targetQuery}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`border-t border-zinc-200 bg-white/95 backdrop-blur-md px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/95 shadow-lg animate-in fade-in duration-150 ${className}`}
    >
      <div className="mx-auto max-w-2xl relative">
        {/* Search Input Box */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm theo tên sản phẩm, công dụng, thành phần..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-2.5 pl-4 pr-24 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-indigo-400 dark:focus:bg-zinc-950"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                aria-label="Xóa từ khóa"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              className="p-1.5 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
              aria-label="Tìm kiếm"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              aria-label="Đóng tìm kiếm"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Live Dropdown Results */}
        {debouncedQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-zinc-200 bg-white/98 backdrop-blur-md shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/98 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {searchResults.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Không tìm thấy sản phẩm nào cho &quot;{debouncedQuery}&quot;
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Hãy thử gõ từ khóa ngắn hơn (ví dụ: collagen, son, kem chống nắng, sữa chua...)
                </p>
              </div>
            ) : (
              <div>
                <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <span>Gợi ý sản phẩm ({searchResults.length})</span>
                  <span className="text-[10px] text-zinc-400">Dùng ↑ ↓ để chọn, Enter để xem</span>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[380px] overflow-y-auto">
                  {searchResults.map((product, idx) => {
                    const imgUrl = product.images?.[0] || "/logo.jpg";
                    const catId = getCategoryIdByProductId(product.id);
                    const catName = catId ? categoryMap.get(catId) : null;
                    const isSelected = selectedIndex === idx;

                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        onClick={onClose}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center gap-3.5 p-3 transition-colors ${
                          isSelected
                            ? "bg-indigo-50/80 dark:bg-indigo-950/40"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                          <Image
                            src={getAssetPath(imgUrl)}
                            alt={product.name}
                            fill
                            className="object-contain p-1"
                            sizes="48px"
                          />
                        </div>

                        {/* Title & Price */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {catName && (
                              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                                {catName}
                              </span>
                            )}
                            {product.tag && (
                              <span className="rounded-md bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                {product.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate mt-0.5">
                            {product.name}
                          </p>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              {formatPrice(product.price)}
                            </span>
                            {product.oldPrice && product.oldPrice > product.price && (
                              <span className="text-[10px] text-zinc-400 line-through">
                                {formatPrice(product.oldPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* View all results button */}
                <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <span>Xem tất cả kết quả cho &quot;{debouncedQuery}&quot; →</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
