"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useProductData } from "@/context/ProductDataContext";
import { Product } from "@/data/products";
import { getAssetPath } from "@/utils/assetPath";
import ProductFormModal from "../ProductFormModal";
import SearchIcon from "@/components/icons/SearchIcon";
import PlusIcon from "@/components/icons/PlusIcon";
import StarIcon from "@/components/icons/StarIcon";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export default function ProductManagement() {
  const {
    products,
    categories,
    orders,
    addProduct,
    updateProduct,
    deleteProduct,
    getCategoryIdByProductId,
    getProductsByCategoryId,
  } = useProductData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Map order for quick lookup
  const orderMap = useMemo(() => {
    return new Map<string, number>(orders.map((o) => [o.productId, o.order]));
  }, [orders]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const productCatId = getCategoryIdByProductId(p.id);
      const matchCat = selectedCategory === "all" || productCatId === selectedCategory;
      const matchStock =
        stockFilter === "all" ||
        (stockFilter === "in_stock" && (p.stock || 0) > 0) ||
        (stockFilter === "out_of_stock" && (p.stock || 0) === 0);

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.tag && p.tag.toLowerCase().includes(q));
      return matchCat && matchStock && matchSearch;
    });
  }, [products, selectedCategory, stockFilter, searchQuery, getCategoryIdByProductId]);

  // Reset về trang 1 khi thay đổi tìm kiếm hoặc bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, stockFilter, pageSize]);

  // Tính toán phân trang
  const totalProducts = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalProducts);
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (validCurrentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" (#${id})?`)) {
      deleteProduct(id);
    }
  };

  const handleSaveProduct = (
    data: Omit<Product, "id"> & { id?: string; order?: number }
  ) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Quản Lý Toàn Bộ Sản Phẩm
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Thêm mới, sửa giá bán, mô tả, thành phần, số lượng tồn kho và phân loại
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            Thêm sản phẩm mới
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Tổng sản phẩm
          </span>
          <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-white">
            {products.length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Đang còn hàng
          </span>
          <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {products.filter((p) => (p.stock || 0) > 0).length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Hết hàng
          </span>
          <p className="mt-2 text-3xl font-black text-rose-500">
            {products.filter((p) => (p.stock || 0) === 0).length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Tổng tồn kho
          </span>
          <p className="mt-2 text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {products.reduce((sum, p) => sum + (p.stock || 0), 0)}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm, mã ID, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 py-2 pl-10 pr-4 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Danh mục:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="all">Tất cả ({products.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({getProductsByCategoryId(cat.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Tồn kho:
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="in_stock">Còn hàng</option>
              <option value="out_of_stock">Hết hàng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pagination Bar Above Table */}
      {totalProducts > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 sm:px-6 py-3.5 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Hiển thị <strong>{startIndex + 1} - {endIndex}</strong> / <strong>{totalProducts}</strong> sản phẩm
            </span>
            <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
            <div className="flex items-center gap-1.5">
              <span>Số lượng mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer focus:border-indigo-500 shadow-2xs"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
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

      {/* Products Table */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              <tr>
                <th className="py-4 px-4 sm:px-6">Sản phẩm</th>
                <th className="py-4 px-4 sm:px-6">Danh mục</th>
                <th className="py-4 px-4 sm:px-6">Giá bán</th>
                <th className="py-4 px-4 sm:px-6">Tồn kho</th>
                <th className="py-4 px-4 sm:px-6">Đánh giá</th>
                <th className="py-4 px-4 sm:px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    Không tìm thấy sản phẩm nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const productCatId = getCategoryIdByProductId(p.id);
                  const cat = categories.find((c) => c.id === productCatId);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Product Info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-1">
                            {p.images?.[0] ? (
                              <Image
                                src={getAssetPath(p.images[0])}
                                alt={p.name}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="h-full w-full bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                            )}
                          </div>
                          <div className="max-w-md">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-zinc-400">
                                #{p.id}
                              </span>
                              {p.tag && (
                                <span className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 px-2 py-0.5 text-[10px] font-bold">
                                  {p.tag}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-zinc-900 dark:text-white line-clamp-1 mt-0.5">
                              {p.name}
                            </h3>
                            <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                              {p.description.replace(/\n/g, " ")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 sm:px-6">
                        <span className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {cat ? cat.name : (productCatId || "Chưa phân loại")}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {formatPrice(p.price)}
                          </span>
                          {p.oldPrice && p.oldPrice > p.price && (
                            <span className="text-xs text-zinc-400 line-through">
                              {formatPrice(p.oldPrice)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 font-semibold text-xs ${
                            p.stock > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-500 font-bold"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              p.stock > 0 ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {p.stock > 0 ? `${p.stock} cái` : "Hết hàng"}
                        </span>
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                          <StarIcon className="h-3.5 w-3.5 fill-current" />
                          <span>{p.rating}</span>
                          <span className="text-zinc-400 font-normal">
                            ({p.reviews})
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/product/${p.id}`}
                            target="_blank"
                            className="rounded-lg p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Xem chi tiết trên web"
                          >
                            👁
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="rounded-lg bg-rose-50 dark:bg-rose-950/60 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
      />
    </div>
  );
}
