"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useProductData } from "@/context/ProductDataContext";
import { getAssetPath } from "@/utils/assetPath";
import { getProductPricing } from "@/types/promotion";
import {
  searchProductsEngine,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
} from "@/utils/searchEngine";
import SearchIcon from "./icons/SearchIcon";
import CloseIcon from "./icons/CloseIcon";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

const POPULAR_SEARCH_TAGS = [
  "Collagen",
  "Kem chống nắng",
  "Sữa rửa mặt",
  "Trị nám",
  "Vitamin C",
  "Tảo xoắn",
];

interface LiveSearchDropdownProps {
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

export default function LiveSearchDropdown({ isOpen, onClose, className = "" }: LiveSearchDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { products, categories, getCategoryIdByProductId, promotion, isPromotionActive } = useProductData();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpenResults, setIsOpenResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount / when opened (do NOT auto-focus to avoid popping open dropdown on page load)
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
    } else {
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(-1);
      setIsOpenResults(false);
    }
  }, [isOpen]);

  // Automatically close dropdown and reset query when route changes
  useEffect(() => {
    setIsOpenResults(false);
    setQuery("");
    setDebouncedQuery("");
    setSelectedIndex(-1);
  }, [pathname]);

  // Debounce search query (180ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = query.trim();
      setDebouncedQuery(trimmed);
      if (trimmed) {
        setIsOpenResults(true);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // Close suggestion dropdown on outside click or touch
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpenResults(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handleCloseDropdown = (clearText: boolean = false) => {
    setIsOpenResults(false);
    setSelectedIndex(-1);
    if (clearText) {
      setQuery("");
      setDebouncedQuery("");
    }
    inputRef.current?.blur();
    onClose?.();
  };

  // Category map for fast name lookup
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  // Filter & rank products using intelligent search engine (v2.0)
  const searchResults = useMemo(() => {
    if (!debouncedQuery) return [];
    return searchProductsEngine(products, debouncedQuery, categoryMap, getCategoryIdByProductId).slice(0, 6);
  }, [debouncedQuery, products, categoryMap, getCategoryIdByProductId]);

  const handleSubmit = (searchKeyword?: string) => {
    const finalQuery = (searchKeyword !== undefined ? searchKeyword : query).trim();
    if (finalQuery) {
      saveRecentSearch(finalQuery);
      setRecentSearches(getRecentSearches());
      const targetQuery = encodeURIComponent(finalQuery);
      handleCloseDropdown(false);
      router.push(`/search?q=${targetQuery}`);
    }
  };

  const handleSelectRecentOrPopular = (keyword: string) => {
    setQuery(keyword);
    setDebouncedQuery(keyword);
    handleSubmit(keyword);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCloseDropdown(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        const item = searchResults[selectedIndex];
        saveRecentSearch(query.trim() || item.product.name);
        handleCloseDropdown(true);
        router.push(`/product/${item.product.id}`);
        return;
      }
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`relative z-30 border-t border-zinc-200 bg-white/95 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 dark:border-zinc-800 dark:bg-zinc-950/95 ${className}`}
    >
      <div className="mx-auto max-w-2xl relative">
        {/* Search Input Box */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm theo tên sản phẩm, công dụng, thành phần..."
            value={query}
            onFocus={() => setIsOpenResults(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="w-full rounded-xl sm:rounded-2xl border border-zinc-200 bg-zinc-50 py-2 sm:py-2.5 pl-3.5 pr-14 text-xs sm:text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-indigo-400 dark:focus:bg-zinc-950"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setDebouncedQuery("");
                  inputRef.current?.focus();
                }}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                aria-label="Xóa từ khóa"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              className="p-1.5 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 cursor-pointer"
              aria-label="Tìm kiếm"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Live Dropdown: Khi có từ khóa */}
        {isOpenResults && debouncedQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-zinc-200 bg-white backdrop-blur-md shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {searchResults.length === 0 ? (
              <div className="p-5 sm:p-6 text-center space-y-2">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Không tìm thấy sản phẩm nào cho &quot;{debouncedQuery}&quot;
                </p>
                <p className="text-xs text-zinc-400">
                  Thử tìm kiếm không dấu hoặc dùng các từ khóa gợi ý:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSelectRecentOrPopular(tag)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 hover:text-indigo-600 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <span>Sản phẩm phù hợp ({searchResults.length})</span>
                  <span className="hidden sm:inline text-[10px] text-zinc-400">Dùng ↑ ↓ để chọn, Enter để xem</span>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[60vh] sm:max-h-[380px] overflow-y-auto">
                  {searchResults.map((match, idx) => {
                    const product = match.product;
                    const imgUrl = product.images?.[0] || "/logo.jpg";
                    const catId = getCategoryIdByProductId(product.id);
                    const catName = catId ? categoryMap.get(catId) : null;
                    const isSelected = selectedIndex === idx;
                    const { effectivePrice, effectiveOldPrice } = getProductPricing(product, promotion, isPromotionActive);

                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        onClick={() => {
                          saveRecentSearch(debouncedQuery);
                          handleCloseDropdown(true);
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center gap-3 p-2.5 sm:p-3 transition-colors ${
                          isSelected
                            ? "bg-indigo-50/80 dark:bg-indigo-950/40"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                          <Image
                            src={getAssetPath(imgUrl)}
                            alt={product.name}
                            fill
                            className="object-contain p-1"
                            sizes="48px"
                          />
                        </div>

                        {/* Title, Snippet & Price */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {catName && (
                              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 truncate">
                                {catName}
                              </span>
                            )}
                            {match.matchedIn !== "name" && (
                              <span className="rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400 shrink-0">
                                {match.matchedIn === "tag" ? "Khớp nhãn" : "Khớp công dụng"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold uppercase text-zinc-900 dark:text-white truncate mt-0.5">
                            {product.name}
                          </p>

                          {match.snippet && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate italic mt-0.5">
                              💬 {match.snippet}
                            </p>
                          )}

                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              {formatPrice(effectivePrice)}
                            </span>
                            {effectiveOldPrice && effectiveOldPrice > effectivePrice && (
                              <span className="text-[10px] text-zinc-400 line-through">
                                {formatPrice(effectiveOldPrice)}
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
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Xem tất cả kết quả cho &quot;{debouncedQuery}&quot; →</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Dropdown: Khi ô tìm kiếm trống (Gợi ý lịch sử & từ khóa thịnh hành) */}
        {isOpenResults && !debouncedQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 p-3.5 sm:p-4 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Lịch sử tìm kiếm gần đây */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    🕒 Tìm kiếm gần đây
                  </span>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-[11px] text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Xóa lịch sử
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {recentSearches.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => handleSelectRecentOrPopular(keyword)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                    >
                      <span>🔍</span>
                      <span>{keyword}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Từ khóa thịnh hành */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  🔥 Gợi ý từ khóa hot
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpenResults(false)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Đóng ✕
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSelectRecentOrPopular(tag)}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-indigo-500 hover:text-indigo-600 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
