"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Category } from "@/data/categories";
import { Product } from "@/data/products";
import { CategoryStats } from "@/services/categoryService";
import { useProductData } from "@/context/ProductDataContext";
import { useCart } from "@/context/CartContext";
import {
  ShirtIcon,
  DeviceIcon,
  HomeIcon,
  SparklesIcon,
  PillIcon,
  ToothIcon,
  HeartIcon,
  DropIcon,
  EyeIcon,
  StarIcon,
  PlusIcon,
  CartIcon,
  CheckIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
  ArrowUpDownIcon,
  SearchIcon
} from "@/components/icons";
import Breadcrumb from "@/components/Breadcrumb";
import { getAssetPath } from "@/utils/assetPath";

interface Props {
  category: Category;
  products: Product[];
  stats: CategoryStats;
  allCategories: Category[];
}

const formatPrice = (price: number) => {
  return price.toLocaleString("vi-VN") + "đ";
};

const calcDiscount = (price: number, oldPrice: number) => {
  return Math.round(((oldPrice - price) / oldPrice) * 100);
};

export default function CategoryDetailPage({
  category,
  products,
  stats,
  allCategories
}: Props) {
  const { getProductsByCategoryId, isLoaded } = useProductData();
  const { addToCart } = useCart();
  const activeProducts = useMemo(() => {
    return isLoaded ? getProductsByCategoryId(category.id) : products;
  }, [isLoaded, getProductsByCategoryId, category.id, products]);

  const activeStats = useMemo(() => {
    if (activeProducts.length === 0) return stats;
    const prices = activeProducts.map((p) => p.price);
    return {
      totalProducts: activeProducts.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgRating: Number(
        (activeProducts.reduce((acc, p) => acc + p.rating, 0) / activeProducts.length).toFixed(1)
      ),
      totalReviews: activeProducts.reduce((acc, p) => acc + p.reviews, 0),
    };
  }, [activeProducts, stats]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId((current) => (current === product.id ? null : current));
    }, 1800);
  };

  // Render category icon dynamically
  const renderCategoryIcon = (iconName: string, className = "h-8 w-8") => {
    switch (iconName) {
      case "PillIcon":
        return <PillIcon className={className} />;
      case "ToothIcon":
        return <ToothIcon className={className} />;
      case "HeartIcon":
        return <HeartIcon className={className} />;
      case "DropIcon":
        return <DropIcon className={className} />;
      case "EyeIcon":
        return <EyeIcon className={className} />;
      case "ShirtIcon":
        return <ShirtIcon className={className} />;
      case "DeviceIcon":
        return <DeviceIcon className={className} />;
      case "HomeIcon":
        return <HomeIcon className={className} />;
      case "SparklesIcon":
        return <SparklesIcon className={className} />;
      default:
        return <SparklesIcon className={className} />;
    }
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...activeProducts];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tag && p.tag.toLowerCase().includes(q))
      );
    }

    // Subcategory (tag/keyword filter)
    if (selectedSubcategory !== "all") {
      const sub = selectedSubcategory.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(sub) ||
          p.description.toLowerCase().includes(sub) ||
          (p.ingredients && p.ingredients.toLowerCase().includes(sub))
      );
    }

    // Price filter
    if (priceFilter === "under-500k") {
      result = result.filter((p) => p.price < 500000);
    } else if (priceFilter === "500k-1m") {
      result = result.filter((p) => p.price >= 500000 && p.price <= 1000000);
    } else if (priceFilter === "above-1m") {
      result = result.filter((p) => p.price > 1000000);
    }

    // Sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, searchQuery, selectedSubcategory, priceFilter, sortBy]);

  const otherCategories = allCategories.filter((c) => c.id !== category.id);

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Breadcrumb */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Trang chủ", href: "/" },
              { label: "Danh mục", href: "/" },
              { label: category.name },
            ]}
          />
        </div>
      </div>

      {/* Category Hero Banner */}
      <div className="relative overflow-hidden bg-zinc-900 text-white">
        <div
          className={`absolute inset-0 bg-gradient-to-r ${category.bannerGradient} opacity-90`}
        />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2.5 rounded-full bg-white/20 px-3.5 py-1 text-sm font-semibold backdrop-blur-md mb-4 text-white">
                {renderCategoryIcon(category.iconName, "h-4 w-4")}
                <span>{category.name}</span>
                <span className="opacity-60">•</span>
                <span className="opacity-90">{activeStats.totalProducts} sản phẩm hiện có</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
                {category.name}
              </h1>
              <p className="mt-3 text-base text-zinc-100 sm:text-lg max-w-xl leading-relaxed">
                {category.description}
              </p>

              {/* Subcategories tags */}
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mr-1">
                    Gợi ý:
                  </span>
                  <button
                    onClick={() => setSelectedSubcategory("all")}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                      selectedSubcategory === "all"
                        ? "bg-white text-zinc-900 shadow-md font-semibold"
                        : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                    }`}
                  >
                    Tất cả
                  </button>
                  {category.subcategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubcategory(sub)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                        selectedSubcategory === sub
                          ? "bg-white text-zinc-900 shadow-md font-semibold"
                          : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats Box */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl bg-black/30 backdrop-blur-md p-4 border border-white/10 text-center">
              <div className="p-3">
                <span className="block text-2xl font-black text-white">{activeStats.totalProducts}</span>
                <span className="text-xs text-zinc-300">Mẫu sản phẩm</span>
              </div>
              <div className="p-3">
                <span className="block text-2xl font-black text-amber-300">
                  {activeStats.avgRating}★
                </span>
                <span className="text-xs text-zinc-300">Đánh giá trung bình</span>
              </div>
              <div className="col-span-2 sm:col-span-1 p-3">
                <span className="block text-sm font-bold text-white truncate">
                  {formatPrice(activeStats.minPrice)}
                </span>
                <span className="text-xs text-zinc-300">Giá chỉ từ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Controls Bar: Search, Filters, Sorting & View Toggle */}
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          {/* Search inside category */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={`Tìm trong danh mục ${category.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-indigo-400"
            />
            <SearchIcon className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Price Filter dropdown */}
            <div className="flex items-center gap-1.5">
              <FilterIcon className="h-4 w-4 text-zinc-400" />
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer focus:border-indigo-500"
              >
                <option value="all">Tất cả mức giá</option>
                <option value="under-500k">Dưới 500.000đ</option>
                <option value="500k-1m">500.000đ - 1.000.000đ</option>
                <option value="above-1m">Trên 1.000.000đ</option>
              </select>
            </div>

            {/* Sort options */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDownIcon className="h-4 w-4 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "featured" | "price-asc" | "price-desc" | "rating")}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer focus:border-indigo-500"
              >
                <option value="featured">Nổi bật nhất</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>

            {/* View switcher */}
            <div className="hidden sm:flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 p-0.5 bg-zinc-50 dark:bg-zinc-800">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                }`}
                title="Dạng lưới"
              >
                <GridIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                }`}
                title="Dạng danh sách"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters summary */}
        {(selectedSubcategory !== "all" || priceFilter !== "all" || searchQuery) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>Đang lọc theo:</span>
            {selectedSubcategory !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 font-medium">
                Loại: {selectedSubcategory}
                <button
                  onClick={() => setSelectedSubcategory("all")}
                  className="hover:text-indigo-900 dark:hover:text-indigo-100 cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {priceFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 font-medium">
                Mức giá:{" "}
                {priceFilter === "under-500k"
                  ? "< 500k"
                  : priceFilter === "500k-1m"
                  ? "500k - 1tr"
                  : "> 1tr"}
                <button
                  onClick={() => setPriceFilter("all")}
                  className="hover:text-indigo-900 dark:hover:text-indigo-100 cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 font-medium">
                Từ khóa: &quot;{searchQuery}&quot;
                <button
                  onClick={() => setSearchQuery("")}
                  className="hover:text-indigo-900 dark:hover:text-indigo-100 cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedSubcategory("all");
                setPriceFilter("all");
                setSearchQuery("");
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer ml-2"
            >
              Đặt lại tất cả
            </button>
          </div>
        )}

        {/* Product Count indicator */}
        <div className="mt-6 mb-4 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <p>
            Hiển thị <span className="font-semibold text-zinc-900 dark:text-white">{filteredProducts.length}</span> sản phẩm
          </p>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="my-16 flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-16 px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
              <SearchIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Không tìm thấy sản phẩm phù hợp
            </h3>
            <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Hãy thử thay đổi tiêu chí tìm kiếm hoặc đặt lại các bộ lọc đã chọn.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSubcategory("all");
                setPriceFilter("all");
              }}
              className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          </div>
        )}

        {/* Product Grid View */}
        {filteredProducts.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => {
              const discount =
                product.oldPrice && product.oldPrice > product.price
                  ? calcDiscount(product.price, product.oldPrice)
                  : null;
              const isAdded = addedProductId === product.id;
              const primaryImage = product.images?.[0] || "";

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 p-2">
                      {primaryImage ? (
                        <Image
                          src={getAssetPath(primaryImage)}
                          alt={product.name}
                          fill
                          priority={index < 4}
                          loading={index < 4 ? "eager" : "lazy"}
                          className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${product.imageBg} opacity-90 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center`}
                        >
                          <span className="text-white font-bold text-sm tracking-wide bg-black/25 backdrop-blur-md px-4 py-2 rounded-full">
                            {category.name}
                          </span>
                        </div>
                      )}

                      {discount && (
                        <span className="absolute top-3 right-3 rounded-full bg-rose-600 text-white px-2 py-0.5 text-xs font-bold shadow-xs z-10">
                          -{discount}%
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="mt-4">
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-white line-clamp-2">
                        <Link href={`/product/${product.id}`}>
                          <span aria-hidden="true" className="absolute inset-0" />
                          {product.name}
                        </Link>
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Rating */}
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs">
                        <StarIcon className="h-4 w-4 text-amber-400" />
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {product.rating}
                        </span>
                        <span className="text-zinc-400">({product.reviews} đánh giá)</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="mt-5 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3 z-10">
                    <div className="flex flex-col">
                      {product.oldPrice && product.oldPrice > product.price && (
                        <span className="text-xs text-zinc-400 line-through">
                          {formatPrice(product.oldPrice)}
                        </span>
                      )}
                      <span className="text-base font-bold text-zinc-900 dark:text-white">
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      className={`flex items-center gap-1 rounded-full p-2.5 transition-all duration-200 cursor-pointer ${
                        isAdded
                          ? "bg-green-600 text-white"
                          : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-indigo-600 dark:hover:bg-indigo-400 hover:text-white"
                      }`}
                      title={isAdded ? "Đã thêm vào giỏ" : "Thêm vào giỏ hàng"}
                    >
                      {isAdded ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <PlusIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Product List View */}
        {filteredProducts.length > 0 && viewMode === "list" && (
          <div className="flex flex-col gap-4">
            {filteredProducts.map((product, index) => {
              const discount =
                product.oldPrice && product.oldPrice > product.price
                  ? calcDiscount(product.price, product.oldPrice)
                  : null;
              const isAdded = addedProductId === product.id;
              const primaryImage = product.images?.[0] || "";

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col sm:flex-row items-center gap-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="relative aspect-square w-full sm:w-44 shrink-0 overflow-hidden rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 p-2">
                    {primaryImage ? (
                      <Image
                        src={getAssetPath(primaryImage)}
                        alt={product.name}
                        fill
                        priority={index < 4}
                        loading={index < 4 ? "eager" : "lazy"}
                        className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, 176px"
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${product.imageBg} opacity-90 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center`}
                      >
                        <span className="text-white font-bold text-xs bg-black/25 backdrop-blur-md px-3 py-1 rounded-full">
                          {category.name}
                        </span>
                      </div>
                    )}
                    {discount && (
                      <span className="absolute top-2.5 right-2.5 rounded-full bg-rose-600 text-white px-2 py-0.5 text-xs font-bold z-10">
                        -{discount}%
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between w-full">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                        <Link href={`/product/${product.id}`}>
                          {product.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-amber-500">
                          <StarIcon className="h-4 w-4 fill-current" />
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {product.rating}
                          </span>
                          <span className="text-zinc-400">({product.reviews} đánh giá)</span>
                        </div>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Còn {product.stock} sản phẩm
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-zinc-900 dark:text-white">
                          {formatPrice(product.price)}
                        </span>
                        {product.oldPrice && product.oldPrice > product.price && (
                          <span className="text-xs text-zinc-400 line-through">
                            {formatPrice(product.oldPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/product/${product.id}`}
                          className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          Chi tiết
                        </Link>
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                            isAdded
                              ? "bg-green-600 text-white"
                              : "bg-indigo-600 text-white hover:bg-indigo-500"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <CheckIcon className="h-4 w-4" />
                              Đã thêm
                            </>
                          ) : (
                            <>
                              <CartIcon className="h-4 w-4" />
                              Thêm vào giỏ
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Other Categories Carousel / Navigation */}
        <div className="mt-24 border-t border-zinc-200 dark:border-zinc-800 pt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Khám phá các danh mục khác
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Tìm kiếm thêm các sản phẩm đa dạng từ Japan Shop
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                className="group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 transition-all duration-300 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-800"
              >
                <div
                  className={`absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-gradient-to-br ${cat.bannerGradient} opacity-20 group-hover:scale-125 transition-transform duration-500`}
                />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-xs">
                    {renderCategoryIcon(cat.iconName, "h-6 w-6")}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {cat.itemCountText}
                    </p>
                  </div>
                </div>
                <p className="relative mt-4 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {cat.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
