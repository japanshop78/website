"use client";

import React, { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useProductData } from "@/context/ProductDataContext";
import { useCart } from "@/context/CartContext";
import { Product } from "@/data/products";
import { getAssetPath } from "@/utils/assetPath";
import { getProductPricing } from "@/types/promotion";
import SearchIcon from "@/components/icons/SearchIcon";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

type SortOption = "relevance" | "price_asc" | "price_desc" | "rating";

function SearchContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [submittedQuery, setSubmittedQuery] = useState(queryParam);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  const { products, categories, getCategoryIdByProductId, promotion, isPromotionActive } = useProductData();
  const { addToCart } = useCart();

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchTerm.trim());
  };

  const filteredProducts = useMemo(() => {
    if (!submittedQuery) return [];
    const q = submittedQuery.toLowerCase();
    const matches = products.filter((p) => {
      if (p.visible === false) return false;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.tag && p.tag.toLowerCase().includes(q)) ||
        (p.ingredients && p.ingredients.toLowerCase().includes(q))
      );
    });

    switch (sortBy) {
      case "price_asc":
        return [...matches].sort(
          (a, b) =>
            getProductPricing(a, promotion, isPromotionActive).effectivePrice -
            getProductPricing(b, promotion, isPromotionActive).effectivePrice
        );
      case "price_desc":
        return [...matches].sort(
          (a, b) =>
            getProductPricing(b, promotion, isPromotionActive).effectivePrice -
            getProductPricing(a, promotion, isPromotionActive).effectivePrice
        );
      case "rating":
        return [...matches].sort((a, b) => (b.rating || 5) - (a.rating || 5));
      case "relevance":
      default:
        return matches;
    }
  }, [submittedQuery, products, sortBy, promotion, isPromotionActive]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-6">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-white font-medium">Tìm kiếm</span>
        </div>

        {/* Search Header Banner */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-xs mb-8">
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm theo tên, công dụng, thành phần..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 py-3.5 pl-5 pr-28 text-base outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:focus:border-indigo-400 dark:focus:bg-zinc-950"
              />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-xs"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* Quick tags */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-zinc-400 font-medium">Gợi ý từ khóa:</span>
            {["Collagen", "Kem chống nắng", "Sữa rửa mặt", "Trị nám", "Vitamin C", "Tảo xoắn"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchTerm(tag);
                  setSubmittedQuery(tag);
                }}
                className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-zinc-600 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info & Sorter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
              {submittedQuery ? (
                <>
                  Kết quả cho &quot;<span className="text-indigo-600 dark:text-indigo-400">{submittedQuery}</span>&quot;
                </>
              ) : (
                "Tất cả sản phẩm"
              )}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Tìm thấy <strong className="text-zinc-900 dark:text-white">{filteredProducts.length}</strong> sản phẩm phù hợp
            </p>
          </div>

          {/* Sorting */}
          {filteredProducts.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Sắp xếp theo:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none focus:border-indigo-600"
              >
                <option value="relevance">Liên quan nhất</option>
                <option value="price_asc">Giá: Thấp đến cao</option>
                <option value="price_desc">Giá: Cao đến thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white dark:bg-zinc-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
              <SearchIcon className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
              Không tìm thấy sản phẩm nào
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
              Rất tiếc chúng tôi không tìm thấy sản phẩm nào khớp với từ khóa của bạn. Vui lòng kiểm tra lại chính tả hoặc thử tìm kiếm với từ khóa khác.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Về Trang Chủ Khám Phá
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const imgUrl = product.images?.[0] || "/logo.jpg";
              const catId = getCategoryIdByProductId(product.id);
              const catName = catId ? categoryMap.get(catId) : null;
              const {
                effectivePrice,
                effectiveOldPrice,
                discountPercent,
              } = getProductPricing(product, promotion, isPromotionActive);

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div>
                    {/* Thumbnail */}
                    <Link
                      href={`/product/${product.id}`}
                      className="relative block aspect-square w-full overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-800"
                    >
                      <Image
                        src={getAssetPath(imgUrl)}
                        alt={product.name}
                        fill
                        className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      {discountPercent ? (
                        <span className="absolute top-2 left-2 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs z-10">
                          -{discountPercent}%
                        </span>
                      ) : null}
                    </Link>

                    {/* Metadata */}
                    <div className="mt-3">
                      {catName && (
                        <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                          {catName}
                        </span>
                      )}
                      <Link
                        href={`/product/${product.id}`}
                        className="line-clamp-2 text-xs sm:text-sm font-semibold uppercase text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 transition-colors"
                      >
                        {product.name}
                      </Link>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-sm sm:text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                        {formatPrice(effectivePrice)}
                      </div>
                      {effectiveOldPrice && effectiveOldPrice > effectivePrice && (
                        <div className="text-[10px] text-zinc-400 line-through">
                          {formatPrice(effectiveOldPrice)}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(product, 1)}
                      className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-2 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-colors"
                      title="Thêm vào giỏ hàng"
                      aria-label="Thêm vào giỏ"
                    >
                      <span className="text-sm">🛒</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
