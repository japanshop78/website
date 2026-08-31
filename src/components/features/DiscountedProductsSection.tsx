"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/data/products";
import { useProductData } from "@/context/ProductDataContext";
import { useCart } from "@/context/CartContext";
import { getAssetPath } from "@/utils/assetPath";
import { StarIcon, PlusIcon, CheckIcon, ChevronRightIcon } from "@/components/icons";
import BoltIcon from "@/components/icons/BoltIcon";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

const calcDiscountPercent = (price: number, oldPrice?: number) => {
  if (oldPrice && oldPrice > price) {
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }
  return 0;
};

export default function DiscountedProductsSection() {
  const { getProductsByBanner, getCategoryIdByProductId, categories } = useProductData();
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  // Filter products by banner "discount" (or "Sản phẩm giảm giá")
  const discountedProducts = getProductsByBanner("discount", 10);

  const handleAdd = (product: Product) => {
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  // If no discounted products exist yet, do not render or show minimal state
  if (discountedProducts.length === 0) {
    return null;
  }

  return (
    <section className="bg-zinc-50/80 dark:bg-zinc-950/60 py-16 sm:py-24 border-t border-zinc-200/80 dark:border-zinc-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/80 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3 shadow-xs">
              <BoltIcon className="h-3.5 w-3.5 fill-current animate-bounce" />
              <span>Ưu Đãi Đặc Biệt</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Sản Phẩm Đang Giảm Giá
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Cơ hội mua hàng nội địa Nhật Bản chất lượng cao với mức giá ưu đãi tốt nhất
            </p>
          </div>

          <Link
            href="/admin"
            className="mt-4 sm:mt-0 text-sm font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1 group"
          >
            <span>Xem ưu đãi</span>
            <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-8">
          {discountedProducts.map((product, index) => {
            const catId = getCategoryIdByProductId(product.id);
            const category = categories.find((c) => c.id === catId);
            const categoryName = category ? category.name : "";
            const isJustAdded = addedId === product.id;
            const primaryImage = product.images?.[0] || "";
            const discountPercent = calcDiscountPercent(product.price, product.oldPrice);

            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/80 p-3.5 shadow-sm hover:shadow-xl hover:border-rose-300 dark:hover:border-rose-800/60 transition-all duration-300"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-2">
                    {primaryImage ? (
                      <Image
                        src={getAssetPath(primaryImage)}
                        alt={product.name}
                        fill
                        priority={index < 4}
                        loading={index < 4 ? "eager" : "lazy"}
                        className="object-contain p-2 group-hover:scale-108 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-sm tracking-wide bg-black/25 backdrop-blur-md px-4 py-2 rounded-full">
                          {categoryName}
                        </span>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {discountPercent > 0 && (
                      <span className="absolute top-2.5 left-2.5 rounded-xl bg-rose-600 text-white px-2.5 py-1 text-xs font-black shadow-md z-10 flex items-center gap-1">
                        <span>-{discountPercent}%</span>
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="mt-3.5 px-1">
                    {categoryName && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                        {categoryName}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-2 leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      <Link href={`/product/${product.id}`}>
                        <span aria-hidden="true" className="absolute inset-0" />
                        {product.name}
                      </Link>
                    </h3>

                    <div className="mt-2 flex items-center gap-1 text-xs text-amber-500">
                      <StarIcon className="h-4 w-4 fill-current" />
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        {product.rating}
                      </span>
                      <span className="text-zinc-400">({product.reviews})</span>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-end justify-between z-10 px-1">
                  <div className="flex flex-col">
                    {product.oldPrice && product.oldPrice > product.price && (
                      <span className="text-xs font-semibold text-zinc-400 line-through">
                        {formatPrice(product.oldPrice)}
                      </span>
                    )}
                    <span className="text-base font-black text-rose-600 dark:text-rose-400">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdd(product)}
                    className={`rounded-2xl p-2.5 transition-all duration-200 cursor-pointer shadow-sm ${
                      isJustAdded
                        ? "bg-emerald-600 text-white scale-110 shadow-emerald-500/30"
                        : "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20 hover:scale-105 active:scale-95"
                    }`}
                    title={isJustAdded ? "Đã thêm vào giỏ!" : "Thêm vào giỏ hàng"}
                  >
                    {isJustAdded ? (
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
      </div>
    </section>
  );
}
