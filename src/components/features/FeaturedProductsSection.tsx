"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/data/products";
import { useProductData } from "@/context/ProductDataContext";
import { useCart } from "@/context/CartContext";
import { getAssetPath } from "@/utils/assetPath";
import { analytics } from "@/utils/analytics";
import { getProductPricing } from "@/types/promotion";
import { useInfiniteCarousel } from "@/hooks/useInfiniteCarousel";
import { StarIcon, PlusIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export default function FeaturedProductsSection() {
  const { getFeaturedProducts, getCategoryIdByProductId, categories, promotion, isPromotionActive, featuredBannerLimit } = useProductData();
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const featuredProducts = getFeaturedProducts(featuredBannerLimit || 20);

  const {
    itemsPerView,
    baseList,
    listLen,
    extendedItems: extendedProducts,
    currentIndex,
    activeDotIndex,
    setIsPaused,
    isTransitioning,
    handleNext,
    handlePrev,
    handleTransitionEnd,
    handleTouchStart,
    handleTouchEnd,
    selectSlide,
  } = useInfiniteCarousel({
    items: featuredProducts,
    autoPlayIntervalMs: 3000,
  });

  const handleAdd = (product: Product) => {
    const pricing = getProductPricing(product, promotion, isPromotionActive);
    addToCart(product, 1);
    analytics.trackAddToCart({
      id: product.id,
      name: product.name,
      price: pricing.effectivePrice,
    }, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="bg-zinc-50/80 dark:bg-zinc-950/60 py-8 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800/80 relative overflow-hidden">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        {/* Header with Title and Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-4 sm:mb-10">
          <div>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Sản Phẩm Bán Chạy
            </h2>
          </div>

          {/* Navigation Controls in Header */}
          <div className="hidden sm:flex items-center gap-2 mt-4 sm:mt-0">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Xem sản phẩm trước"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Xem sản phẩm tiếp theo"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Carousel Slider Container */}
        <div
          className="relative group/slider"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Side Floating Arrow Buttons */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute -left-1.5 sm:-left-5 top-[32%] sm:top-1/2 -translate-y-1/2 z-30 flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/95 dark:bg-zinc-800/95 text-zinc-800 dark:text-zinc-100 shadow-lg border border-zinc-200/80 dark:border-zinc-700 transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-85 sm:opacity-0 sm:group-hover/slider:opacity-100"
            aria-label="Xem sản phẩm trước"
          >
            <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute -right-1.5 sm:-right-5 top-[32%] sm:top-1/2 -translate-y-1/2 z-30 flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/95 dark:bg-zinc-800/95 text-zinc-800 dark:text-zinc-100 shadow-lg border border-zinc-200/80 dark:border-zinc-700 transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-85 sm:opacity-0 sm:group-hover/slider:opacity-100"
            aria-label="Xem sản phẩm tiếp theo"
          >
            <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Slider Viewport */}
          <div className="overflow-hidden py-2 -mx-1.5 sm:-mx-2.5">
            {/* Sliding Track */}
            <div
              className="flex items-stretch"
              onTransitionEnd={handleTransitionEnd}
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                transition: isTransitioning ? "transform 600ms cubic-bezier(0.25, 1, 0.5, 1)" : "none",
              }}
            >
              {extendedProducts.map((product, idx) => {
                const catId = getCategoryIdByProductId(product.id);
                const category = categories.find((c) => c.id === catId);
                const categoryName = category ? category.name : "";
                const isJustAdded = addedId === product.id;

                const primaryImage = product.images?.[0] || "";
                const {
                  effectivePrice,
                  effectiveOldPrice,
                  discountPercent: discount,
                  savingsAmount,
                } = getProductPricing(product, promotion, isPromotionActive);

                const isAboveTheFold = (idx >= listLen && idx < listLen + 5) || idx < 5;

                return (
                  <div
                    key={`${product.id}-${idx}`}
                    className="shrink-0 px-1.5 sm:px-2.5 flex flex-col"
                    style={{ width: `${100 / itemsPerView}%` }}
                  >
                    <div className="group relative flex flex-col justify-between h-full rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-2.5 sm:p-3.5 shadow-sm hover:shadow-xl transition-all duration-300">
                      <div>
                        {/* Image Container */}
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl sm:rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 p-1.5 sm:p-2">
                          {primaryImage ? (
                            <Image
                              src={getAssetPath(primaryImage)}
                              alt={product.name}
                              fill
                              priority={isAboveTheFold}
                              loading={isAboveTheFold ? "eager" : "lazy"}
                              className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white font-bold text-xs sm:text-sm tracking-wide bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-full">
                                {categoryName}
                              </span>
                            </div>
                          )}

                          {discount && (
                            <span className="absolute top-2 left-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-600 text-white text-[10px] sm:text-xs font-bold flex items-center justify-center shadow-md tracking-tight z-10">
                              -{discount}%
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="mt-2.5 sm:mt-4">
                          {categoryName && (
                            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5 sm:mb-1 truncate">
                              {categoryName}
                            </span>
                          )}
                          <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 uppercase dark:text-white line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
                            <Link href={`/product/${product.id}`}>
                              <span aria-hidden="true" className="absolute inset-0" />
                              {product.name}
                            </Link>
                          </h3>
                          <div className="mt-1 sm:mt-1.5 flex items-center gap-1 text-[11px] sm:text-xs text-amber-500">
                            <StarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                              {product.rating}
                            </span>
                            <span className="text-zinc-400">({product.reviews})</span>
                          </div>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between z-10 gap-1.5">
                        <div className="flex flex-col min-w-0">
                          {effectiveOldPrice && effectiveOldPrice > effectivePrice ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] sm:text-xs text-zinc-400 line-through">
                                {formatPrice(effectiveOldPrice)}
                              </span>
                              {savingsAmount > 0 && (
                                <span className="hidden sm:inline text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  -{formatPrice(savingsAmount)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] sm:text-xs text-transparent">{"\u00A0"}</span>
                          )}
                          <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 truncate">
                            {formatPrice(effectivePrice)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAdd(product)}
                          className={`relative z-20 shrink-0 rounded-full p-1.5 sm:p-2 transition-all duration-200 cursor-pointer shadow-xs ${
                            isJustAdded
                              ? "bg-emerald-600 text-white scale-110"
                              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-indigo-600 dark:hover:bg-indigo-400 hover:text-white"
                          }`}
                          title={isJustAdded ? "Đã thêm vào giỏ!" : "Thêm vào giỏ hàng"}
                        >
                          {isJustAdded ? (
                            <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          ) : (
                            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots pagination */}
          <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-1.5 mt-4 sm:mt-6 px-10 sm:px-0">
            {baseList.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectSlide(i)}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  activeDotIndex === i
                    ? "w-5 sm:w-7 bg-indigo-600 dark:bg-indigo-400 shadow-xs"
                    : "w-1.5 sm:w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600"
                }`}
                aria-label={`Chuyển đến vị trí ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
