"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/data/products";
import { useProductData } from "@/context/ProductDataContext";
import { useCart } from "@/context/CartContext";
import { getAssetPath } from "@/utils/assetPath";
import { StarIcon, PlusIcon, CheckIcon, ChevronRightIcon } from "@/components/icons";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export default function FeaturedProductsSection() {
  const { getFeaturedProducts, getCategoryIdByProductId, categories } = useProductData();
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const featuredProducts = getFeaturedProducts(10);

  const handleAdd = (product: Product) => {
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <section className="bg-white py-16 dark:bg-zinc-900 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Sản Phẩm Bán Chạy
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Được mua nhiều nhất tuần này
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-8">
          {featuredProducts.map((product, index) => {
            const catId = getCategoryIdByProductId(product.id);
            const category = categories.find((c) => c.id === catId);
            const categoryName = category ? category.name : "";
            const isJustAdded = addedId === product.id;

            const primaryImage = product.images?.[0] || "";

            return (
              <div key={product.id} className="group relative flex flex-col justify-between">
                <div>
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 p-2">
                    {primaryImage ? (
                      <Image
                        src={getAssetPath(primaryImage)}
                        alt={product.name}
                        fill
                        priority={index < 5}
                        loading={index < 5 ? "eager" : "lazy"}
                        className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-sm tracking-wide bg-black/25 backdrop-blur-md px-4 py-2 rounded-full">
                          {categoryName}
                        </span>
                      </div>
                    )}
                  </div>

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

                <div className="mt-4 flex items-center justify-between z-10">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-400 line-through">
                      {product.oldPrice && product.oldPrice > product.price
                        ? formatPrice(product.oldPrice)
                        : "\u00A0"}
                    </span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(product)}
                    className={`rounded-full p-2 transition-all duration-200 cursor-pointer shadow-xs ${
                      isJustAdded
                        ? "bg-emerald-600 text-white scale-110"
                        : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-indigo-600 dark:hover:bg-indigo-400 hover:text-white"
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
