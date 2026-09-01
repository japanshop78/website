"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useProductData } from "@/context/ProductDataContext";
import { getAssetPath } from "@/utils/assetPath";
import SearchIcon from "@/components/icons/SearchIcon";
import PlusIcon from "@/components/icons/PlusIcon";
import CloseIcon from "@/components/icons/CloseIcon";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export default function CategoryProductManagement() {
  const {
    categories,
    products,
    categoryProducts,
    assignProductToCategory,
    removeProductFromCategory,
    moveCategoryProductOrder,
  } = useProductData();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || "C-01"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Map category to product count
  const categoryCountMap = useMemo(() => {
    const map = new Map<string, number>();
    categoryProducts.forEach((cp) => {
      const cur = map.get(cp.categoryId) || 0;
      map.set(cp.categoryId, cur + 1);
    });
    return map;
  }, [categoryProducts]);

  // Selected Category
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || categories[0];
  }, [categories, selectedCategoryId]);

  // Products belonging to the selected category (sorted by category order)
  const assignedProducts = useMemo(() => {
    if (!activeCategory) return [];
    const catMappings = categoryProducts
      .filter((cp) => cp.categoryId.toLowerCase() === activeCategory.id.toLowerCase())
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    const q = searchQuery.toLowerCase().trim();
    const list: (typeof products[0] & { categoryOrder: number })[] = [];

    catMappings.forEach((cp, idx) => {
      const p = products.find((prod) => String(prod.id).trim() === String(cp.productId).trim());
      if (!p) return;
      if (
        q &&
        !(
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.tag && p.tag.toLowerCase().includes(q))
        )
      ) {
        return;
      }
      list.push({
        ...p,
        categoryOrder: cp.order ?? idx + 1,
      });
    });

    return list;
  }, [products, categoryProducts, activeCategory, searchQuery]);

  // Pagination for assigned products
  const totalAssigned = assignedProducts.length;
  const totalPages = Math.ceil(totalAssigned / pageSize) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalAssigned);
  const paginatedProducts = useMemo(() => {
    return assignedProducts.slice(startIndex, endIndex);
  }, [assignedProducts, startIndex, endIndex]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (validCurrentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  // Products not in the selected category (available to add)
  const unassignedProductsForActiveCategory = useMemo(() => {
    if (!activeCategory) return [];
    const matchedIds = new Set(
      categoryProducts
        .filter((cp) => cp.categoryId.toLowerCase() === activeCategory.id.toLowerCase())
        .map((cp) => cp.productId)
    );

    const q = pickerSearch.toLowerCase().trim();
    return products.filter((p) => {
      const isAlreadyIn = matchedIds.has(p.id);
      if (isAlreadyIn) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.tag && p.tag.toLowerCase().includes(q))
      );
    });
  }, [products, categoryProducts, activeCategory, pickerSearch]);

  // Unassigned products overall (not in any category)
  const orphanProducts = useMemo(() => {
    const allAssignedIds = new Set(categoryProducts.map((cp) => cp.productId));
    return products.filter((p) => !allAssignedIds.has(p.id));
  }, [products, categoryProducts]);

  const handleAddProductToCategory = (productId: string) => {
    if (!activeCategory) return;
    assignProductToCategory(productId, activeCategory.id);
  };

  const handleRemoveProductFromCategory = (productId: string) => {
    if (!activeCategory) return;
    removeProductFromCategory(productId, activeCategory.id);
  };

  const handleChangeProductCategory = (productId: string, newCategoryId: string) => {
    if (!newCategoryId) return;
    if (activeCategory) {
      removeProductFromCategory(productId, activeCategory.id);
    }
    assignProductToCategory(productId, newCategoryId);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Sản Phẩm Thuộc Danh Mục
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Quản lý và phân bổ các sản phẩm vào từng danh mục (Lưu cấu trúc JSON: &#123; categoryId, productId &#125;)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsPickerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            Gán sản phẩm vào danh mục
          </button>
        </div>
      </div>

      {/* Warning for orphan products if any */}
      {orphanProducts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Có {orphanProducts.length} sản phẩm chưa được phân loại vào danh mục nào!
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Các sản phẩm: {orphanProducts.map((p) => p.name).slice(0, 3).join(", ")}
                {orphanProducts.length > 3 ? "..." : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPickerOpen(true)}
            className="rounded-xl bg-amber-600 text-white px-3.5 py-1.5 text-xs font-bold hover:bg-amber-500 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            Gán vào danh mục ngay
          </button>
        </div>
      )}

      {/* Category Pills Navigation */}
      <div className="overflow-x-auto pb-1">
        <div className="flex items-center gap-2 min-w-max">
          {categories.map((cat) => {
            const count = categoryCountMap.get(cat.id) || 0;
            const isSelected = activeCategory?.id === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md scale-102"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Category Header Banner */}
      {activeCategory && (
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs">
          <div
            className={`absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-gradient-to-br ${activeCategory.bannerGradient} opacity-15`}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-zinc-400">
                  Mã: #{activeCategory.id}
                </span>
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 text-xs font-bold">
                  {assignedProducts.length} sản phẩm
                </span>
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                {activeCategory.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
                {activeCategory.description || "Chưa có mô tả cho danh mục này."}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href={`/category/${activeCategory.id}`}
                target="_blank"
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                👁 Xem trên web
              </Link>
              <button
                onClick={() => setIsPickerOpen(true)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Thêm sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search for assigned products */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm sản phẩm trong danh mục này..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 py-2 pl-9 pr-4 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900"
          />
          <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-2 text-xs text-zinc-400 hover:text-zinc-600"
            >
              Xóa
            </button>
          )}
        </div>

        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Hiển thị: <strong>{assignedProducts.length}</strong> sản phẩm
        </span>
      </div>

      {/* Pagination Bar Above Table */}
      {totalAssigned > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 sm:px-6 py-3.5 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Hiển thị <strong>{startIndex + 1} - {endIndex}</strong> / <strong>{totalAssigned}</strong> sản phẩm
            </span>
            <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
            <div className="flex items-center gap-1.5">
              <span>Số lượng mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer focus:border-indigo-500 shadow-2xs"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={validCurrentPage === 1}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-white dark:bg-zinc-800/80"
              >
                ‹ Trước
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 text-xs text-zinc-400 font-bold"
                      >
                        ...
                      </span>
                    );
                  }
                  const isCurrent = page === validCurrentPage;
                  return (
                    <button
                      key={`page-${page}`}
                      type="button"
                      onClick={() => setCurrentPage(page as number)}
                      className={`min-w-[32px] h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-white dark:bg-zinc-800/60"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage === totalPages}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-white dark:bg-zinc-800/80"
              >
                Sau ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products Table in this Category */}
      {assignedProducts.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center shadow-xs">
          <span className="text-4xl block mb-2">📦</span>
          <h4 className="text-base font-bold text-zinc-900 dark:text-white">
            Chưa có sản phẩm nào trong danh mục &quot;{activeCategory?.name}&quot;
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
            Hãy bấm vào nút bên dưới để chọn các sản phẩm trong kho và gán trực thuộc vào danh mục này.
          </p>
          <button
            onClick={() => setIsPickerOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Gán sản phẩm ngay
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <tr>
                  <th className="py-4 px-4 sm:px-6 w-28 text-center">Thứ tự</th>
                  <th className="py-4 px-4 sm:px-6">Sản phẩm</th>
                  <th className="py-4 px-4 sm:px-6 min-w-[200px]">Chuyển sang danh mục khác</th>
                  <th className="py-4 px-4 sm:px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {paginatedProducts.map((p, pIdx) => {
                  const globalIdx = startIndex + pIdx;
                  const isFirst = globalIdx === 0;
                  const isLast = globalIdx === assignedProducts.length - 1;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* 1. Order Column */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <span className="inline-flex items-center justify-center font-mono text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
                          #{p.categoryOrder}
                        </span>
                      </td>

                      {/* 2. Product Info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-1">
                            {p.images?.[0] ? (
                              <Image
                                src={getAssetPath(p.images[0])}
                                alt={p.name}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="h-full w-full bg-zinc-100 dark:bg-zinc-700 rounded-lg" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-md">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-zinc-400">
                                #{p.id}
                              </span>
                              {p.tag && (
                                <span className="rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 text-[10px] font-bold">
                                  {p.tag}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate mt-0.5">
                              {p.name}
                            </h4>
                            <Link
                              href={`/product/${p.id}`}
                              target="_blank"
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                            >
                              /product/{p.id} ↗
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* 3. Fast Category Changer */}
                      <td className="py-4 px-4 sm:px-6">
                        <select
                          value={activeCategory?.id}
                          onChange={(e) => handleChangeProductCategory(p.id, e.target.value)}
                          className="w-full max-w-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer focus:border-indigo-500"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.id === activeCategory?.id ? "(Hiện tại)" : ""}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 7. Action Buttons */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => moveCategoryProductOrder(activeCategory.id, p.id, "up")}
                            disabled={isFirst}
                            title="Chuyển lên trên"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveCategoryProductOrder(activeCategory.id, p.id, "down")}
                            disabled={isLast}
                            title="Chuyển xuống dưới"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            ▼
                          </button>
                          <Link
                            href={`/product/${p.id}`}
                            target="_blank"
                            className="hidden sm:inline-flex items-center h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            title="Xem trang sản phẩm"
                          >
                            👁 Xem
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemoveProductFromCategory(p.id)}
                            className="h-8 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/40 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Gỡ sản phẩm khỏi danh mục này"
                          >
                            <CloseIcon className="h-3 w-3" />
                            Gỡ khỏi DM
                          </button>
                        </div>
                      </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Picker for Adding Products to Active Category */}
      {isPickerOpen && activeCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Gán sản phẩm vào danh mục: {activeCategory.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Chọn các sản phẩm có sẵn trong kho để thêm vào danh mục #{activeCategory.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPickerOpen(false);
                  setPickerSearch("");
                }}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors ml-1 cursor-pointer"
                title="Đóng"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Search Box */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm để gán (tên, mã ID...)"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 py-2.5 pl-10 pr-4 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                />
                <SearchIcon className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-zinc-100 dark:divide-zinc-800">
              {unassignedProductsForActiveCategory.length === 0 ? (
                <div className="py-12 text-center text-zinc-400">
                  <span className="text-3xl block mb-1">🎉</span>
                  <p className="text-xs">
                    {pickerSearch
                      ? "Không tìm thấy sản phẩm nào phù hợp với từ khóa."
                      : "Tất cả sản phẩm trong kho đã được gán vào danh mục này!"}
                  </p>
                </div>
              ) : (
                unassignedProductsForActiveCategory.map((p) => (
                  <div
                    key={p.id}
                    className="pt-2 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-1">
                        {p.images?.[0] ? (
                          <Image
                            src={getAssetPath(p.images[0])}
                            alt={p.name}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="h-full w-full bg-zinc-200 dark:bg-zinc-700" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-zinc-400 block">
                          #{p.id}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {p.name}
                        </h4>
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {formatPrice(p.price)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddProductToCategory(p.id)}
                      className="rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-3.5 py-1.5 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shrink-0 shadow-2xs"
                    >
                      + Gán vào DM
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-3 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Có sẵn: <strong>{unassignedProductsForActiveCategory.length}</strong> sản phẩm
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
