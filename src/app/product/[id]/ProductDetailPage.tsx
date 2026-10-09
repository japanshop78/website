"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/data/products";
import { analytics } from "@/utils/analytics";


import CartIcon from "@/components/icons/CartIcon";
import StarIcon from "@/components/icons/StarIcon";
import MinusIcon from "@/components/icons/MinusIcon";
import PlusIcon from "@/components/icons/PlusIcon";
import CheckIcon from "@/components/icons/CheckIcon";
import BoltIcon from "@/components/icons/BoltIcon";
import Breadcrumb from "@/components/Breadcrumb";
import ChevronLeftIcon from "@/components/icons/ChevronLeftIcon";
import ChevronRightIcon from "@/components/icons/ChevronRightIcon";
import { getAssetPath } from "@/utils/assetPath";
import { useProductData } from "@/context/ProductDataContext";
import { useCart } from "@/context/CartContext";
import { getProductPricing } from "@/types/promotion";

const formatPrice = (price: number) =>
  price.toLocaleString("vi-VN") + "đ";

interface Props {
  product: Product;
  related: Product[];
}

export default function ProductDetailPage({ product, related }: Props) {
  const router = useRouter();
  const { categories, getProductById, getProductsByCategoryId, getCategoryIdByProductId, isLoaded, promotion, isPromotionActive } = useProductData();
  const { addToCart } = useCart();

  const currentProduct =
    (isLoaded ? getProductById(product.id) : null) || product;

  const currentProductCategoryId =
    getCategoryIdByProductId(currentProduct.id) || "C-01";

  const currentRelated =
    (isLoaded
      ? getProductsByCategoryId(currentProductCategoryId)
          .filter((p) => p.id !== currentProduct.id && p.visible !== false)
          .slice(0, 4)
      : null) || related.filter((p) => p.visible !== false);

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "ingredients">("desc");
  const [added, setAdded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Kích hoạt sự kiện ViewContent cho Meta Pixel & GA4 khi xem sản phẩm
  useEffect(() => {
    if (currentProduct?.id) {
      analytics.trackViewItem({
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
      });
    }
  }, [currentProduct?.id, currentProduct?.name, currentProduct?.price]);

  const imageList =
    currentProduct.images && currentProduct.images.length > 0
      ? currentProduct.images
      : [];
  const activeImage = imageList[activeImageIndex] || "";

  const handleAddToCart = () => {
    addToCart(currentProduct, quantity);
    analytics.trackAddToCart({
      id: currentProduct.id,
      name: currentProduct.name,
      price: currentProduct.price,
    }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(currentProduct, quantity);
    analytics.trackAddToCart({
      id: currentProduct.id,
      name: currentProduct.name,
      price: currentProduct.price,
    }, quantity);
    router.push("/cart");
  };


  const {
    effectivePrice,
    effectiveOldPrice,
    discountPercent: discount,
    savingsAmount,
  } = getProductPricing(currentProduct, promotion, isPromotionActive);

  const category = categories.find(
    (c) => c.id.toLowerCase() === currentProductCategoryId.toLowerCase()
  );
  const categoryName = category ? category.name : "Sản phẩm";
  const categoryHref = category ? `/category/${category.id}` : "/";

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl w-full px-4 py-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: categoryName, href: categoryHref },
            { label: currentProduct.name },
          ]}
        />
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl w-full px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-12 items-start">
          {/* Product Image & Gallery Slider */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="relative w-full aspect-square max-h-[460px] sm:max-h-[500px] rounded-3xl bg-white dark:bg-zinc-900 overflow-hidden shadow-lg border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-6 flex items-center justify-center group">
              {activeImage ? (
                <Image
                  key={activeImage}
                  src={getAssetPath(activeImage)}
                  alt={currentProduct.name}
                  fill
                  priority
                  className="object-contain p-2 sm:p-4 transition-transform duration-300 group-hover:scale-105 select-none"
                  sizes="(max-width: 1024px) 100vw, 42vw"
                />
              ) : (

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl tracking-wide bg-black/20 backdrop-blur-md px-8 py-4 rounded-2xl">
                    {categoryName}
                  </span>
                </div>
              )}

              {/* Slider Arrows */}
              {imageList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-100 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:hover:bg-zinc-700 hover:scale-110 cursor-pointer z-20"
                    aria-label="Hình trước"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-100 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:hover:bg-zinc-700 hover:scale-110 cursor-pointer z-20"
                    aria-label="Hình tiếp theo"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Dots indicator */}
              {imageList.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/20 dark:bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
                  {imageList.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? "w-6 bg-indigo-600 dark:bg-indigo-400"
                          : "w-2 bg-white/70 dark:bg-zinc-400 hover:bg-white"
                      }`}
                      aria-label={`Chuyển đến ảnh ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {discount && (
                <span className="absolute top-5 left-5 w-12 h-12 rounded-full bg-rose-600 text-white text-sm font-bold flex items-center justify-center shadow-md tracking-tight z-10">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Thumbnail Gallery Strip */}
            {imageList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative aspect-square w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 bg-white dark:bg-zinc-900 p-1.5 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-indigo-600 ring-2 ring-indigo-600/30 scale-105 shadow-md"
                        : "border-zinc-200 dark:border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-400"
                    }`}
                  >
                    <Image
                      src={getAssetPath(img)}
                      alt={`${currentProduct.name} - thumbnail ${idx + 1}`}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Category & Name */}

            {currentProduct.visible === false && (
              <div className="rounded-2xl border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3.5 flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Sản phẩm này hiện đang tạm ẩn</strong> trên trang chủ và danh mục. Khách hàng thông thường sẽ không tìm thấy sản phẩm này.
                </div>
              </div>
            )}

            <div>
              {/* <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {categoryName}
              </span> */}
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 uppercase dark:text-white sm:text-4xl">
                {currentProduct.name}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(currentProduct.rating)
                        ? "text-amber-400"
                        : i < currentProduct.rating
                        ? "text-amber-300"
                        : "text-zinc-300 dark:text-zinc-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {currentProduct.rating}
              </span>
              <span className="text-sm text-zinc-400">
                ({currentProduct.reviews} đánh giá)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-4">
              <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                {formatPrice(effectivePrice)}
              </span>
              {effectiveOldPrice && effectiveOldPrice > effectivePrice && (
                <div className="flex flex-col items-start">
                  <span className="text-lg text-zinc-400 line-through">
                    {formatPrice(effectiveOldPrice)}
                  </span>
                  {savingsAmount > 0 && (
                    <span className="text-sm font-semibold text-rose-500">
                      Tiết kiệm {formatPrice(savingsAmount)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Khuyến Mãi - Ưu Đãi Box */}
            <div className="rounded-2xl border-2 border-dashed border-red-500/60 dark:border-red-500/40 bg-red-50/30 dark:bg-red-950/20 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-dashed border-red-300 dark:border-red-900/60">
                <span className="text-lg leading-none" role="img" aria-label="Khuyến mãi">🎁</span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                  ƯU ĐÃI
                </span>
              </div>
              <ul className="space-y-2 text-xs sm:text-[13px] text-zinc-800 dark:text-zinc-200">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400 font-bold leading-tight">•</span>
                  <span>Miễn phí vận chuyển cho đơn hàng từ 1000.000đ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400 font-bold leading-tight">•</span>
                  <span>Cam kết chính hãng 100%</span>
                </li>
              </ul>
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Số lượng
              </label>
              <div className="flex items-center gap-0">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="h-10 w-10 flex items-center justify-center rounded-l-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Giảm số lượng"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="h-10 w-14 flex items-center justify-center border-t border-b border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="h-10 w-10 flex items-center justify-center rounded-r-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  aria-label="Tăng số lượng"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
                  added
                    ? "bg-green-600 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95"
                }`}
              >
                {added ? (
                  <>
                    <CheckIcon className="h-5 w-5" />
                    Đã thêm vào giỏ!
                  </>
                ) : (
                  <>
                    <CartIcon className="h-5 w-5" />
                    Thêm vào giỏ hàng
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-zinc-900 dark:text-white hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
              >
                <BoltIcon className="h-5 w-5" />
                Mua ngay
              </button>
            </div>

            {/* Hotline đặt mua */}
            <div className="flex justify-center items-center gap-1.5 text-sm sm:text-base text-zinc-800 dark:text-zinc-200">
              <span>Gọi đặt mua</span>
              <a
                href="tel:0902493895"
                className="font-bold text-red-700 dark:text-red-400 hover:underline transition-colors"
              >
                0902 493 895
              </a>
            </div>
          </div>
        </div>

        {/* Tabs: Description & Ingredients */}
        <div className="mt-16">
          <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 mb-8">
            {(["desc", "ingredients"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-semibold transition-colors cursor-pointer rounded-t-lg ${
                  activeTab === tab
                    ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {tab === "desc" ? "Mô tả sản phẩm" : "Thành phần & Thông số kỹ thuật"}
              </button>
            ))}
          </div>

          {activeTab === "desc" && (
            <div>
              <p className="text-base leading-8 text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
                {currentProduct.description}
              </p>
            </div>
          )}

          {activeTab === "ingredients" && currentProduct.ingredients && (
            <div>
              <p className="text-base leading-8 text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
                {currentProduct.ingredients}
              </p>
            </div>
          )}

          {activeTab === "ingredients" && !currentProduct.ingredients && (
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">Không có thông tin thành phần.</p>
          )}
        </div>

        {/* Related Products */}
        {currentRelated.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-8">
              Sản phẩm liên quan
            </h2>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {currentRelated.map((p) => {
                const relatedImg = p.images?.[0] || "";
                const {
                  effectivePrice: relatedPrice,
                  effectiveOldPrice: relatedOldPrice,
                  discountPercent: relatedDiscount,
                } = getProductPricing(p, promotion, isPromotionActive);

                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    className="group flex flex-col gap-3"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-2">
                      {relatedImg && (
                        <Image
                          src={getAssetPath(relatedImg)}
                          alt={p.name}
                          fill
                          className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/25 z-10">
                      <span className="text-white text-xs font-semibold bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        Xem chi tiết
                      </span>
                    </div>

                    {relatedDiscount && (
                      <span className="absolute top-2.5 left-2.5 w-10 h-10 rounded-full bg-rose-600 text-white text-sm font-bold flex items-center justify-center shadow-md tracking-tight z-20">
                        -{relatedDiscount}%
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {p.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">
                        {formatPrice(relatedPrice)}
                      </span>
                      {relatedOldPrice && relatedOldPrice > relatedPrice && (
                        <span className="text-xs text-zinc-400 line-through">
                          {formatPrice(relatedOldPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
