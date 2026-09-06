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
  PlusIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BoltIcon,
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

  // Responsive items per view: 5 on xl/2xl, 4 on lg, 3 on md, 2 on sm/mobile
  const [itemsPerView, setItemsPerView] = useState(5);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1280) setItemsPerView(5);
      else if (w >= 1024) setItemsPerView(4);
      else if (w >= 768) setItemsPerView(3);
      else setItemsPerView(2);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prepare infinite looping products (replicate array so it scrolls seamlessly)
  const baseList = discountedProducts.length < 5
    ? [...discountedProducts, ...discountedProducts]
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

  // Auto-play animation running from right to left every 3 seconds
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
      if (diff < -40) handleNext();
      else if (diff > 40) handlePrev();
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
    <section className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 dark:from-rose-950 dark:via-red-950 dark:to-rose-950 py-12 sm:py-16 text-white relative overflow-hidden shadow-inner">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header with Title and Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight uppercase text-white sm:text-4xl">
              Ưu đãi hot
            </h2>
            <p className="mt-2 text-sm text-rose-100/90 max-w-xl">
              Cơ hội mua hàng nội địa Nhật Bản chất lượng cao với mức giá ưu đãi tốt nhất
            </p>
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
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-xl border border-zinc-200/80 dark:border-zinc-700 transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-90 sm:opacity-0 sm:group-hover/slider:opacity-100"
            aria-label="Xem sản phẩm trước"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-xl border border-zinc-200/80 dark:border-zinc-700 transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-90 sm:opacity-0 sm:group-hover/slider:opacity-100"
            aria-label="Xem sản phẩm tiếp theo"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>

          {/* Slider Viewport */}
          <div className="overflow-hidden py-2 -mx-2 sm:-mx-2.5">
            {/* Sliding Track */}
            <div
              className="flex items-stretch"
              onTransitionEnd={handleTransitionEnd}
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                transition: isTransitioning
                  ? "transform 600ms cubic-bezier(0.25, 1, 0.5, 1)"
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
                    className="shrink-0 px-2 sm:px-2.5 flex flex-col"
                    style={{ width: `${100 / itemsPerView}%` }}
                  >
                    <div className="group relative flex flex-col justify-between h-full rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-3.5 shadow-sm hover:shadow-xl transition-all duration-300 text-zinc-900 dark:text-white">
                      <div>
                        {/* Image Container */}
                        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 p-2">
                          {primaryImage ? (
                            <Image
                              src={getAssetPath(primaryImage)}
                              alt={product.name}
                              fill
                              loading="lazy"
                              className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white font-bold text-sm tracking-wide bg-black/25 backdrop-blur-md px-4 py-2 rounded-full">
                                {categoryName}
                              </span>
                            </div>
                          )}

                          {product.tag && (
                            <span className="absolute top-2.5 right-2.5 rounded-full bg-zinc-900/90 dark:bg-zinc-50/90 text-white dark:text-zinc-950 px-2 py-0.5 text-xs font-semibold shadow-xs z-10">
                              {product.tag}
                            </span>
                          )}

                          {discount && (
                            <span className="absolute top-2.5 left-2.5 w-10 h-10 rounded-full bg-rose-600 text-white text-sm font-bold flex items-center justify-center shadow-md tracking-tight z-10">
                              -{discount}%
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="mt-4 flex justify-between items-start">
                          <div>
                            {categoryName && (
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                                {categoryName}
                              </span>
                            )}
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white line-clamp-2">
                              <Link href={`/product/${product.id}`}>
                                <span aria-hidden="true" className="absolute inset-0" />
                                {product.name}
                              </Link>
                            </h3>
                            <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-500">
                              <StarIcon className="h-4 w-4 fill-current" />
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                {product.rating}
                              </span>
                              <span className="text-zinc-400">({product.reviews})</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="mt-4 flex items-center justify-between z-10">
                        <div className="flex flex-col">
                          <span className="text-xs text-zinc-400 line-through">
                            {product.oldPrice && product.oldPrice > product.price
                              ? formatPrice(product.oldPrice)
                              : "\u00A0"}
                          </span>
                          <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAdd(product)}
                          className={`rounded-full p-2 transition-all duration-200 cursor-pointer shadow-xs ${
                            isJustAdded
                              ? "bg-emerald-600 text-white scale-110"
                              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white"
                          }`}
                          title={isJustAdded ? "Đã thêm vào giỏ!" : "Thêm vào giỏ hàng"}
                        >
                          {isJustAdded ? (
                            <CheckIcon className="h-5 w-5" />
                          ) : (
                            <PlusIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots Pagination */}
          <div className="flex justify-center items-center gap-1.5 mt-4">
            {baseList.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setIsTransitioning(true);
                  setCurrentIndex(listLen + i);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeDotIndex === i
                    ? "w-6 bg-white shadow-xs"
                    : "w-1.5 bg-white/40 hover:bg-white/70"
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

