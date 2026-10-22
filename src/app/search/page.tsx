"use client";

import React, { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useProductData } from "@/context/ProductDataContext";
import { useCart } from "@/context/CartContext";
import { Product } from "@/data/products";
import { getAssetPath } from "@/utils/assetPath";
import { getProductPricing } from "@/types/promotion";
import { searchProductsEngine, saveRecentSearch, SearchMatchResult } from "@/utils/searchEngine";
import ZaloIcon from "@/components/icons/ZaloIcon";
import CheckIcon from "@/components/icons/CheckIcon";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

type SortOption = "relevance" | "price_asc" | "price_desc" | "rating";
type PriceRangeOption = "all" | "under_300" | "300_700" | "700_1500" | "above_1500";

const PRICE_RANGE_CONFIGS: { id: PriceRangeOption; label: string }[] = [
  { id: "all", label: "Tất cả mức giá" },
  { id: "under_300", label: "Dưới 300k" },
  { id: "300_700", label: "300k - 700k" },
  { id: "700_1500", label: "700k - 1.5 triệu" },
  { id: "above_1500", label: "Trên 1.5 triệu" },
];

const POPULAR_SUGGESTION_TAGS = [
  "Collagen",
  "Kem chống nắng",
  "Sữa rửa mặt",
  "Trị nám",
  "Vitamin C",
  "Tảo xoắn",
  "Bổ não DHA",
  "Cảm cúm",
];

function SearchContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [submittedQuery, setSubmittedQuery] = useState(queryParam);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRangeOption>("all");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const {
    products,
    categories,
    getCategoryIdByProductId,
    getFeaturedProducts,
    promotion,
    isPromotionActive,
  } = useProductData();
  const { addToCart } = useCart();

  // Sync khi queryParam trên URL thay đổi
  useEffect(() => {
    if (queryParam !== submittedQuery) {
      setSearchTerm(queryParam);
      setSubmittedQuery(queryParam);
      setSelectedCategory("all");
      setSelectedPriceRange("all");
    }
  }, [queryParam, submittedQuery]);

  // Lưu từ khóa vào lịch sử khi tìm kiếm
  useEffect(() => {
    if (submittedQuery) {
      saveRecentSearch(submittedQuery);
    }
  }, [submittedQuery]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    setSubmittedQuery(trimmed);
    setSelectedCategory("all");
    setSelectedPriceRange("all");
    if (trimmed) {
      saveRecentSearch(trimmed);
    }
  };

  const handleQuickTagClick = (tag: string) => {
    setSearchTerm(tag);
    setSubmittedQuery(tag);
    setSelectedCategory("all");
    setSelectedPriceRange("all");
    saveRecentSearch(tag);
  };

  // 1. Áp dụng Engine tìm kiếm thông minh (v2.0)
  const rawSearchMatches: SearchMatchResult[] = useMemo(() => {
    if (!submittedQuery) {
      return products
        .filter((p) => p.visible !== false)
        .map((p) => ({
          product: p,
          score: 1,
          matchedIn: "name" as const,
          snippet: undefined,
        }));
    }
    return searchProductsEngine(products, submittedQuery, categoryMap, getCategoryIdByProductId);
  }, [submittedQuery, products, categoryMap, getCategoryIdByProductId]);

  // 2. Thống kê số lượng sản phẩm theo từng danh mục
  const categoryFacets = useMemo(() => {
    const counts = new Map<string, number>();
    rawSearchMatches.forEach((item) => {
      const catId = getCategoryIdByProductId(item.product.id);
      if (catId) {
        counts.set(catId, (counts.get(catId) || 0) + 1);
      }
    });

    return categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        count: counts.get(cat.id) || 0,
      }))
      .filter((cat) => cat.count > 0);
  }, [rawSearchMatches, categories, getCategoryIdByProductId]);

  // 3. Lọc theo Danh mục & Khoảng giá & Sắp xếp
  const finalFilteredProducts = useMemo(() => {
    let list = rawSearchMatches;

    // Lọc theo Danh mục
    if (selectedCategory !== "all") {
      list = list.filter((item) => getCategoryIdByProductId(item.product.id) === selectedCategory);
    }

    // Lọc theo Khoảng giá
    if (selectedPriceRange !== "all") {
      list = list.filter((item) => {
        const pricing = getProductPricing(item.product, promotion, isPromotionActive);
        const price = pricing.effectivePrice;
        if (selectedPriceRange === "under_300") return price < 300000;
        if (selectedPriceRange === "300_700") return price >= 300000 && price <= 700000;
        if (selectedPriceRange === "700_1500") return price > 700000 && price <= 1500000;
        if (selectedPriceRange === "above_1500") return price > 1500000;
        return true;
      });
    }

    // Sắp xếp
    switch (sortBy) {
      case "price_asc":
        return [...list].sort(
          (a, b) =>
            getProductPricing(a.product, promotion, isPromotionActive).effectivePrice -
            getProductPricing(b.product, promotion, isPromotionActive).effectivePrice
        );
      case "price_desc":
        return [...list].sort(
          (a, b) =>
            getProductPricing(b.product, promotion, isPromotionActive).effectivePrice -
            getProductPricing(a.product, promotion, isPromotionActive).effectivePrice
        );
      case "rating":
        return [...list].sort((a, b) => (b.product.rating || 5) - (a.product.rating || 5));
      case "relevance":
      default:
        return list;
    }
  }, [
    rawSearchMatches,
    selectedCategory,
    selectedPriceRange,
    sortBy,
    promotion,
    isPromotionActive,
    getCategoryIdByProductId,
  ]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1500);
  };

  const featuredProducts = getFeaturedProducts(4);

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
                placeholder="Tìm sản phẩm theo tên, công dụng, thành phần (hỗ trợ gõ không dấu)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 py-3.5 pl-5 pr-28 text-sm sm:text-base outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 dark:focus:border-indigo-400 dark:focus:bg-zinc-950"
              />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-xs cursor-pointer"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* Quick tags */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-zinc-400 font-medium">Gợi ý từ khóa:</span>
            {POPULAR_SUGGESTION_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTagClick(tag)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  submittedQuery.toLowerCase() === tag.toLowerCase()
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Facet Filters: Categories & Price Ranges (Khi có kết quả) */}
        {rawSearchMatches.length > 0 && (
          <div className="mb-6 space-y-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs">
            {/* Category Filter Chips */}
            {categoryFacets.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-400 shrink-0 mr-1">
                  Ngành hàng:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === "all"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                  }`}
                >
                  Tất cả ({rawSearchMatches.length})
                </button>
                {categoryFacets.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                    }`}
                  >
                    {cat.name} ({cat.count})
                  </button>
                ))}
              </div>
            )}

            {/* Price Range Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-400 shrink-0 mr-1">
                Khoảng giá:
              </span>
              {PRICE_RANGE_CONFIGS.map((range) => (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => setSelectedPriceRange(range.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedPriceRange === range.id
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Info & Sorter Header */}
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
              Tìm thấy <strong className="text-zinc-900 dark:text-white">{finalFilteredProducts.length}</strong> sản phẩm phù hợp
              {selectedCategory !== "all" || selectedPriceRange !== "all" ? " (sau khi lọc)" : ""}
            </p>
          </div>

          {/* Sorting */}
          {finalFilteredProducts.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Sắp xếp theo:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="relevance">Liên quan nhất</option>
                <option value="price_asc">Giá: Thấp đến cao</option>
                <option value="price_desc">Giá: Cao đến thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>
          )}
        </div>

        {/* Product Grid or Zero-Results View */}
        {finalFilteredProducts.length === 0 ? (
          <div className="space-y-10">
            {/* Empty State Banner */}
            <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 sm:p-12 text-center bg-white dark:bg-zinc-900">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-4 text-2xl">
                🔎
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                Không tìm thấy sản phẩm nào
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
                Rất tiếc không có sản phẩm nào khớp với từ khóa &quot;{submittedQuery}&quot;. Hãy thử từ khóa ngắn hơn, không dấu hoặc liên hệ để shop nhập hàng hộ bạn.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedPriceRange("all");
                    setSearchTerm("");
                    setSubmittedQuery("");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>👁 Xem tất cả sản phẩm</span>
                </button>

                <a
                  href="https://zalo.me/0987413670"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 px-5 py-2.5 text-xs font-bold text-blue-700 dark:text-blue-300 transition-all cursor-pointer"
                >
                  <ZaloIcon className="h-4 w-4" />
                  <span>Nhờ shop tìm hàng qua Zalo</span>
                </a>
              </div>
            </div>

            {/* Gợi ý Sản phẩm nổi bật khi không có kết quả */}
            {featuredProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                    <span>🔥 Có thể bạn sẽ quan tâm</span>
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                  {featuredProducts.map((product) => {
                    const imgUrl = product.images?.[0] || "/logo.jpg";
                    const { effectivePrice } = getProductPricing(product, promotion, isPromotionActive);

                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="relative aspect-square w-full rounded-xl bg-zinc-50 dark:bg-zinc-800 overflow-hidden mb-2">
                          <Image
                            src={getAssetPath(imgUrl)}
                            alt={product.name}
                            fill
                            className="object-contain p-2 group-hover:scale-105 transition-transform"
                            sizes="(max-width: 640px) 50vw, 25vw"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase line-clamp-2">
                            {product.name}
                          </p>
                          <div className="mt-1 text-sm font-black text-rose-600 dark:text-rose-400">
                            {formatPrice(effectivePrice)}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {finalFilteredProducts.map((match) => {
              const product = match.product;
              const imgUrl = product.images?.[0] || "/logo.jpg";
              const catId = getCategoryIdByProductId(product.id);
              const catName = catId ? categoryMap.get(catId) : null;
              const {
                effectivePrice,
                effectiveOldPrice,
                discountPercent,
              } = getProductPricing(product, promotion, isPromotionActive);
              const isAdded = addedProductId === product.id;

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

                    {/* Metadata & Categories */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        {catName && (
                          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider truncate">
                            {catName}
                          </span>
                        )}
                        {match.matchedIn !== "name" && (
                          <span className="rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:text-amber-400 shrink-0">
                            {match.matchedIn === "tag" ? "Khớp nhãn" : "Khớp công dụng"}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/product/${product.id}`}
                        className="line-clamp-2 text-xs sm:text-sm font-semibold uppercase text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 transition-colors"
                      >
                        {product.name}
                      </Link>

                      {/* Đoạn Snippet trích dẫn lý do khớp nếu từ khóa nằm trong mô tả/thành phần */}
                      {match.snippet && (
                        <div className="mt-1.5 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-1 italic">
                          💬 {match.snippet}
                        </div>
                      )}
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
                      onClick={() => handleAddToCart(product)}
                      className={`rounded-xl p-2 transition-all cursor-pointer ${
                        isAdded
                          ? "bg-emerald-600 text-white scale-110"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white"
                      }`}
                      title={isAdded ? "Đã thêm vào giỏ!" : "Thêm vào giỏ hàng"}
                      aria-label="Thêm vào giỏ"
                    >
                      {isAdded ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <span className="text-sm">🛒</span>
                      )}
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
