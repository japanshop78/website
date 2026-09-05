"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/data/products";
import { useProductData } from "@/context/ProductDataContext";
import { useCart } from "@/context/CartContext";
import { getAssetPath } from "@/utils/assetPath";
import {
  StarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BoltIcon,
  CartIcon,
} from "@/components/icons";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

const calcDiscount = (price: number, oldPrice: number) =>
  Math.round(((oldPrice - price) / oldPrice) * 100);

export default function DiscountedProductsSection() {
  const { getProductsByBanner, getCategoryIdByProductId, categories } = useProductData();
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  // Filter products by banner "discount" (or "Sản phẩm giảm giá")
  const discountedProducts = getProductsByBanner("discount", 15);

  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Prepare infinite looping products
  const baseList = discountedProducts.length < 3
    ? [...discountedProducts, ...discountedProducts, ...discountedProducts]
    : discountedProducts;
  const listLen = baseList.length;
  const extendedProducts = [...baseList, ...baseList, ...baseList];

  const [currentIndex, setCurrentIndex] = useState(listLen);

  const handleNext = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handlePrev = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, []);

  // Continuous auto-scroll every 3 seconds (3s)
  useEffect(() => {
    if (isPaused || listLen === 0) return;
    const interval = setInterval(() => {
      handleNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, listLen, handleNext]);

  // Seamless jump when reaching boundaries
  const handleTransitionEnd = () => {
    if (currentIndex >= listLen * 2) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex - listLen);
    } else if (currentIndex < listLen) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex + listLen);
    }
  };

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (diff < -30) handleNext();
      else if (diff > 30) handlePrev();
    }
    touchStartX.current = null;
    setIsPaused(false);
  };

  const handleAdd = (product: Product) => {
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  if (discountedProducts.length === 0) {
    return null;
  }

  const activeDotIndex = ((currentIndex % listLen) + listLen) % listLen;

  return (
    <section className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 dark:from-rose-950 dark:via-red-950 dark:to-rose-950 py-8 sm:py-14 text-white relative overflow-hidden shadow-inner">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 max-w-5xl mx-auto text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 border border-white/30 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider mb-2.5 backdrop-blur-sm shadow-xs">
            <BoltIcon className="h-4 w-4 fill-current animate-bounce text-amber-300" />
            <span>Ưu Đãi Đặc Biệt</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            Sản Phẩm Đang Giảm Giá
          </h2>
          <p className="mt-2 text-sm text-rose-100/90 max-w-xl">
            Cơ hội mua hàng nội địa Nhật Bản chất lượng cao với mức giá ưu đãi tốt nhất
          </p>
        </div>

        {/* Large Product Slider Container */}
        <div
          className="relative max-w-5xl mx-auto group/slider"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation Arrows inside slider edges like reference image */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
            aria-label="Sản phẩm trước"
          >
            <ChevronLeftIcon className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
            aria-label="Sản phẩm tiếp theo"
          >
            <ChevronRightIcon className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>

          {/* Viewport showing 1 large product slide at a time */}
          <div className="overflow-hidden rounded-3xl shadow-2xl">
            <div
              className="flex items-stretch"
              onTransitionEnd={handleTransitionEnd}
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
                transition: isTransitioning
                  ? "transform 500ms cubic-bezier(0.25, 1, 0.5, 1)"
                  : "none",
              }}
            >
              {extendedProducts.map((product, idx) => {
                const catId = getCategoryIdByProductId(product.id);
                const category = categories.find((c) => c.id === catId);
                const categoryName = category ? category.name : "";
                const isJustAdded = addedId === product.id;

                const primaryImage = product.images?.[0] || "";
                const discount =
                  product.oldPrice && product.oldPrice > product.price
                    ? calcDiscount(product.price, product.oldPrice)
                    : null;

                return (
                  <div
                    key={`${product.id}-${idx}`}
                    className="w-full shrink-0"
                  >
                    <div className="group relative bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white transition-all duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[360px] sm:min-h-[420px]">
                        {/* Left: Big Product Image */}
                        <div className="md:col-span-6 relative aspect-square sm:aspect-4/3 md:aspect-auto md:h-full bg-zinc-50 dark:bg-zinc-800/60 p-6 sm:p-10 flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800">
                          {primaryImage ? (
                            <div className="relative w-full h-[240px] sm:h-[300px] md:h-[360px]">
                              <Image
                                src={getAssetPath(primaryImage)}
                                alt={product.name}
                                fill
                                loading="lazy"
                                className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            </div>
                          ) : (
                            <div className="h-48 flex items-center justify-center">
                              <span className="text-zinc-400 font-medium">{categoryName}</span>
                            </div>
                          )}

                          {/* Large Circle Discount Badge */}
                          {discount && (
                            <span className="absolute top-4 left-4 sm:top-6 sm:left-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-600 text-white text-sm sm:text-base font-black flex items-center justify-center shadow-lg tracking-tight z-10 animate-pulse">
                              -{discount}%
                            </span>
                          )}

                          {/* Status Tag Badge */}
                          {product.tag && (
                            <span className="absolute top-4 right-4 sm:top-6 right-6 rounded-full bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 px-3 py-1 text-xs font-bold shadow-md z-10">
                              {product.tag}
                            </span>
                          )}
                        </div>

                        {/* Right: Rich Product Details */}
                        <div className="md:col-span-6 p-6 sm:p-10 flex flex-col justify-between h-full">
                          <div>
                            {categoryName && (
                              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-2">
                                {categoryName}
                              </span>
                            )}
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                              <Link
                                href={`/product/${product.id}`}
                                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                              >
                                {product.name}
                              </Link>
                            </h3>

                            {/* Star Rating */}
                            <div className="mt-2.5 flex items-center gap-1.5 text-sm text-amber-500">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, starI) => (
                                  <StarIcon key={starI} className="h-4 w-4 fill-current" />
                                ))}
                              </div>
                              <span className="font-bold text-zinc-800 dark:text-zinc-200 ml-1">
                                {product.rating}
                              </span>
                              <span className="text-zinc-400 text-xs">
                                ({product.reviews} đánh giá)
                              </span>
                            </div>

                            {/* Description preview */}
                            {product.description && (
                              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                                {product.description}
                              </p>
                            )}
                          </div>

                          {/* Price & Action Button Bar */}
                          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div className="flex flex-col">
                              {product.oldPrice && product.oldPrice > product.price && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm sm:text-base text-zinc-400 line-through">
                                    {formatPrice(product.oldPrice)}
                                  </span>
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                                    Tiết kiệm {formatPrice(product.oldPrice - product.price)}
                                  </span>
                                </div>
                              )}
                              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-rose-600 dark:text-rose-400 tracking-tight mt-0.5">
                                {formatPrice(product.price)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => handleAdd(product)}
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base font-bold transition-all duration-200 shadow-md cursor-pointer ${
                                  isJustAdded
                                    ? "bg-emerald-600 text-white scale-105"
                                    : "bg-rose-600 hover:bg-rose-700 text-white hover:shadow-lg hover:shadow-rose-600/30 active:scale-95"
                                }`}
                              >
                                {isJustAdded ? (
                                  <>
                                    <CheckIcon className="h-5 w-5" />
                                    <span>Đã thêm</span>
                                  </>
                                ) : (
                                  <>
                                    <CartIcon className="h-5 w-5" />
                                    <span>Thêm giỏ hàng</span>
                                  </>
                                )}
                              </button>

                              <Link
                                href={`/product/${product.id}`}
                                className="px-4 py-3 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-white text-sm font-semibold transition-all"
                              >
                                Chi tiết
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots Pagination */}
          <div className="flex justify-center items-center gap-1.5 mt-5">
            {baseList.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setIsTransitioning(true);
                  setCurrentIndex(listLen + i);
                }}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  activeDotIndex === i
                    ? "w-7 bg-white shadow-sm"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Chuyển đến sản phẩm ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

