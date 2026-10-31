"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/data/products";
import { useProductData } from "@/context/ProductDataContext";
import { useCart } from "@/context/CartContext";
import { getAssetPath } from "@/utils/assetPath";
import { analytics } from "@/utils/analytics";
import { getProductPricing, formatPromoDateRange } from "@/types/promotion";
import { useInfiniteCarousel } from "@/hooks/useInfiniteCarousel";
import {
  StarIcon,
  PlusIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BoltIcon,
  PhoneIcon,
} from "@/components/icons";

const HOTLINE_MARQUEE_ITEMS = [
  { badge: "Tư vấn 24/7" },
  { badge: "Zalo đặt hàng nhanh" },
  { badge: "Hàng nội địa Nhật 100%" },
];

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

function getTimeUntilTarget(targetDateStr?: string) {
  const now = new Date().getTime();
  const target = targetDateStr ? new Date(targetDateStr).getTime() : 0;
  const diff = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  return { days, hours, minutes, seconds };
}

const formatTime = (num: number) => String(num).padStart(2, "0");

export default function DiscountedProductsSection() {
  const {
    getProductsByBanner,
    getCategoryIdByProductId,
    categories,
    promotion,
    isPromotionActive,
    discountBannerLimit = 20,
  } = useProductData();
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setIsMounted(true);
    setTimeLeft(getTimeUntilTarget(promotion?.endDate));
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilTarget(promotion?.endDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [promotion?.endDate]);

  const discountedProducts = getProductsByBanner("discount", discountBannerLimit);

  const {
    itemsPerView,
    baseList,
    listLen,
    extendedItems: extendedProducts,
    currentIndex,
    activeDotIndex,
    isTransitioning,
    handleNext,
    handlePrev,
    handleTransitionEnd,
    handleTouchStart,
    handleTouchEnd,
    selectSlide,
  } = useInfiniteCarousel({
    items: discountedProducts,
    autoPlayIntervalMs: 2000,
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

  if (discountedProducts.length === 0) {
    return null;
  }

  const promoDateRangeText = formatPromoDateRange(promotion?.startDate, promotion?.endDate);
  const hasTimeRemaining = isMounted && !!promotion?.endDate && new Date(promotion.endDate).getTime() > new Date().getTime();

  return (
    <section id="discount-section" className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 dark:from-rose-950 dark:via-red-950 dark:to-rose-950 pt-4 sm:pt-8 pb-0 text-white relative overflow-hidden shadow-inner">
      {/* Ambient Background Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-rose-400/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full px-3 sm:px-6 lg:px-8 relative z-10">
        {/* Header with Title, Countdown Timer, Marquee and Controls */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5 sm:gap-4 mb-3 sm:mb-6">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 flex-1 min-w-0 flex-wrap lg:flex-nowrap">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight uppercase text-white flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span>{promotion?.bannerTitle || "Ưu đãi hot 🔥"}</span>
            </h2>

            {/* 1. Countdown Timer */}
            {promotion?.isActive && hasTimeRemaining && (
              <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-lg shrink-0">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <BoltIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current animate-bounce text-amber-400" />
                  <span className="hidden sm:inline">Kết thúc sau:</span>
                </span>
                <div className="flex items-center gap-0.5 sm:gap-1 font-mono font-black text-[11px] sm:text-sm text-white" suppressHydrationWarning>
                  {isMounted ? (
                    <>
                      {timeLeft.days > 0 && (
                        <>
                          <span className="rounded-md sm:rounded-lg bg-zinc-900/90 text-amber-300 px-1.5 sm:px-2 py-0.5 border border-amber-400/30 shadow-inner" suppressHydrationWarning>
                            {timeLeft.days}N
                          </span>
                          <span className="text-amber-300 font-bold">:</span>
                        </>
                      )}
                      <span className="rounded-md sm:rounded-lg bg-zinc-900/90 text-amber-300 px-1.5 sm:px-2 py-0.5 border border-amber-400/30 shadow-inner" suppressHydrationWarning>
                        {formatTime(timeLeft.hours)}
                      </span>
                      <span className="text-amber-300 font-bold">:</span>
                      <span className="rounded-md sm:rounded-lg bg-zinc-900/90 text-amber-300 px-1.5 sm:px-2 py-0.5 border border-amber-400/30 shadow-inner" suppressHydrationWarning>
                        {formatTime(timeLeft.minutes)}
                      </span>
                      <span className="text-amber-300 font-bold">:</span>
                      <span className="rounded-md sm:rounded-lg bg-zinc-900/90 text-amber-300 px-1.5 sm:px-2 py-0.5 border border-amber-400/30 shadow-inner" suppressHydrationWarning>
                        {formatTime(timeLeft.seconds)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="rounded-md sm:rounded-lg bg-zinc-900/90 text-amber-300 px-1.5 sm:px-2 py-0.5 border border-amber-400/30 shadow-inner">00</span>
                      <span className="text-amber-300 font-bold">:</span>
                      <span className="rounded-md sm:rounded-lg bg-zinc-900/90 text-amber-300 px-1.5 sm:px-2 py-0.5 border border-amber-400/30 shadow-inner">00</span>
                      <span className="text-amber-300 font-bold">:</span>
                      <span className="rounded-md sm:rounded-lg bg-zinc-900/90 text-amber-300 px-1.5 sm:px-2 py-0.5 border border-amber-400/30 shadow-inner">00</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 2. Seamless Scrolling Marquee Text */}
            {(promotion?.isActive || promotion?.bannerSubtitle) && (
              <div className="w-full lg:w-auto lg:flex-1 overflow-hidden py-0.5 sm:py-1 select-none group/marquee min-w-0">
                <div className="animate-marquee flex items-center whitespace-nowrap">
                  {/* Instance 1 */}
                  <div className="flex items-center gap-6 sm:gap-12 shrink-0 pr-6 sm:pr-12">
                    <span className="flex items-center gap-2 text-xs sm:text-lg md:text-xl font-bold uppercase tracking-wide text-white">
                      <span className="text-amber-100 font-extrabold">
                        {promotion?.bannerSubtitle}
                      </span>
                      {!promotion?.bannerSubtitle && promotion?.isFreeship && (
                        <>
                          <span className="text-white/40 font-normal">&</span>
                          <span className="text-rose-100">
                            Miễn phí vận chuyển
                          </span>
                        </>
                      )}
                      {hasTimeRemaining && promoDateRangeText && (
                        <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-white text-[10px] sm:text-xs font-semibold tracking-wider">
                          {promoDateRangeText}
                        </span>
                      )}
                    </span>

                    <span className="text-white/35 text-xs sm:text-base font-normal">✦</span>

                    <span className="flex items-center gap-2 text-xs sm:text-lg md:text-xl font-bold uppercase tracking-wide text-white">
                      <span className="text-amber-100 font-extrabold">
                        {promotion?.bannerSubtitle}
                      </span>
                      {!promotion?.bannerSubtitle && promotion?.isFreeship && (
                        <>
                          <span className="text-white/40 font-normal">&</span>
                          <span className="text-rose-100">
                            Miễn phí vận chuyển
                          </span>
                        </>
                      )}
                      {hasTimeRemaining && promoDateRangeText && (
                        <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-white text-[10px] sm:text-xs font-semibold tracking-wider">
                          {promoDateRangeText}
                        </span>
                      )}
                    </span>

                    <span className="text-white/35 text-xs sm:text-base font-normal">✦</span>
                  </div>

                  {/* Instance 2 */}
                  <div className="flex items-center gap-6 sm:gap-12 shrink-0 pr-6 sm:pr-12" aria-hidden="true">
                    <span className="flex items-center gap-2 text-xs sm:text-lg md:text-xl font-bold uppercase tracking-wide text-white">
                      <span className="text-amber-100 font-extrabold">
                        {promotion?.bannerSubtitle}
                      </span>
                      {!promotion?.bannerSubtitle && promotion?.isFreeship && (
                        <>
                          <span className="text-white/40 font-normal">&</span>
                          <span className="text-rose-100">
                            Miễn phí vận chuyển
                          </span>
                        </>
                      )}
                      {hasTimeRemaining && promoDateRangeText && (
                        <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-white text-[10px] sm:text-xs font-semibold tracking-wider">
                          {promoDateRangeText}
                        </span>
                      )}
                    </span>

                    <span className="text-white/35 text-xs sm:text-base font-normal">✦</span>

                    <span className="flex items-center gap-2 text-xs sm:text-lg md:text-xl font-bold uppercase tracking-wide text-white">
                      <span className="text-amber-100 font-extrabold">
                        {promotion?.bannerSubtitle}
                      </span>
                      {!promotion?.bannerSubtitle && promotion?.isFreeship && (
                        <>
                          <span className="text-white/40 font-normal">&</span>
                          <span className="text-rose-100">
                            Miễn phí vận chuyển
                          </span>
                        </>
                      )}
                      {hasTimeRemaining && promoDateRangeText && (
                        <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-white text-[10px] sm:text-xs font-semibold tracking-wider">
                          {promoDateRangeText}
                        </span>
                      )}
                    </span>

                    <span className="text-white/35 text-xs sm:text-base font-normal">✦</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls in Header */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Xem sản phẩm trước"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Xem sản phẩm tiếp theo"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Carousel Slider Container */}
        <div
          className="relative group/slider"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Side Floating Arrow Buttons (Positioned at image height on mobile so they never overlap product text) */}
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
          <div className="overflow-hidden py-2 sm:py-3 -mx-1.5 sm:-mx-2.5">
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
                    <div className="group relative flex flex-col justify-between h-full rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-2.5 sm:p-3.5 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 text-zinc-900 dark:text-white overflow-hidden">
                      {/* Shimmer Light Sweep Effect on Hover */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none z-20" />

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
                              className="object-contain p-1 group-hover:scale-108 transition-transform duration-500"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white font-bold text-xs sm:text-sm tracking-wide bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-full">
                                {categoryName}
                              </span>
                            </div>
                          )}

                          {/* Glowing Discount Badge */}
                          {discount && (
                            <span className="absolute top-2 left-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white text-[10px] sm:text-xs font-black flex items-center justify-center shadow-lg shadow-rose-950/30 ring-2 ring-white/80 tracking-tight z-10 animate-pulse">
                              -{discount}%
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="mt-2.5 sm:mt-3.5">
                          {categoryName && (
                            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5 sm:mb-1 truncate">
                              {categoryName}
                            </span>
                          )}
                          <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 uppercase dark:text-white line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                            <Link href={`/product/${product.id}`}>
                              <span aria-hidden="true" className="absolute inset-0" />
                              {product.name}
                            </Link>
                          </h3>
                          <div className="mt-1 flex items-center gap-1 text-[11px] sm:text-xs text-amber-500">
                            <StarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                              {product.rating}
                            </span>
                            <span className="text-zinc-400">({product.reviews})</span>
                          </div>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="mt-2.5 sm:mt-3.5 pt-2 sm:pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
                        <div className="flex items-center justify-between z-10 gap-1.5 sm:gap-2">
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
                            <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 truncate">
                              {formatPrice(effectivePrice)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAdd(product)}
                            className={`relative z-20 shrink-0 rounded-full p-1.5 sm:p-2 transition-all duration-200 cursor-pointer shadow-xs ${
                              isJustAdded
                                ? "bg-emerald-600 text-white scale-110"
                                : "bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-rose-600/30 hover:scale-105 active:scale-95"
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
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots Pagination */}
          <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-1.5 mt-2.5 sm:mt-4 px-10 sm:px-0">
            {baseList.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeDotIndex === i
                    ? "w-5 sm:w-6 bg-white shadow-xs"
                    : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Chuyển đến sản phẩm ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Seamless Scrolling Hotline Marquee */}
      <div className="backdrop-blur-xs py-2 sm:py-3 overflow-hidden select-none relative z-10 mt-1 sm:mt-0">
        <div className="animate-marquee-slow flex items-center whitespace-nowrap">
          {/* Instance 1 */}
          <div className="flex items-center gap-16 sm:gap-60 shrink-0 pr-16 sm:pr-60">
            {[...HOTLINE_MARQUEE_ITEMS, ...HOTLINE_MARQUEE_ITEMS].map((item, idx) => (
              <span key={`hl-1-${idx}`} className="flex items-center gap-16 sm:gap-60">
                <a
                  href="tel:0902493895"
                  className="inline-flex items-center gap-2 text-sm sm:text-xl font-bold uppercase tracking-wide text-white hover:text-amber-200 transition-colors cursor-pointer group"
                >
                  <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-white/20 text-white shadow-xs group-hover:bg-amber-400 group-hover:text-zinc-950 transition-all">
                    <PhoneIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </span>
                  <span>
                    Hotline: <strong className="text-amber-200 font-extrabold tracking-wider">0902 493 895</strong>
                  </span>
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-white/95 font-medium normal-case tracking-normal">
                    {item.badge}
                  </span>
                </a>
                <span className="text-white/35 text-xs sm:text-sm font-normal">✦</span>
              </span>
            ))}
          </div>

          {/* Instance 2 */}
          <div className="flex items-center gap-16 sm:gap-60 shrink-0 pr-16 sm:pr-60" aria-hidden="true">
            {[...HOTLINE_MARQUEE_ITEMS, ...HOTLINE_MARQUEE_ITEMS].map((item, idx) => (
              <span key={`hl-2-${idx}`} className="flex items-center gap-16 sm:gap-60">
                <a
                  href="tel:0902493895"
                  tabIndex={-1}
                  className="inline-flex items-center gap-2 text-sm sm:text-xl font-bold uppercase tracking-wide text-white hover:text-amber-200 transition-colors cursor-pointer group"
                >
                  <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-white/20 text-white shadow-xs group-hover:bg-amber-400 group-hover:text-zinc-950 transition-all">
                    <PhoneIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </span>
                  <span>
                    Hotline: <strong className="text-amber-200 font-extrabold tracking-wider">0902 493 895</strong>
                  </span>
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-white/95 font-medium normal-case tracking-normal">
                    {item.badge}
                  </span>
                </a>
                <span className="text-white/35 text-xs sm:text-sm font-normal">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
