"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Category } from "@/data/categories";
import { useProductData } from "@/context/ProductDataContext";
import CategoryFormModal from "./CategoryFormModal";
import PlusIcon from "@/components/icons/PlusIcon";
import SearchIcon from "@/components/icons/SearchIcon";
import {
  ToothIcon,
  PillIcon,
  HeartIcon,
  EyeIcon,
  DropIcon,
  ShirtIcon,
  DeviceIcon,
  HomeIcon,
  SparklesIcon,
} from "@/components/icons";

const renderCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case "ToothIcon":
      return <ToothIcon className="h-5 w-5" />;
    case "PillIcon":
      return <PillIcon className="h-5 w-5" />;
    case "HeartIcon":
      return <HeartIcon className="h-5 w-5" />;
    case "EyeIcon":
      return <EyeIcon className="h-5 w-5" />;
    case "DropIcon":
      return <DropIcon className="h-5 w-5" />;
    case "ShirtIcon":
      return <ShirtIcon className="h-5 w-5" />;
    case "DeviceIcon":
      return <DeviceIcon className="h-5 w-5" />;
    case "HomeIcon":
      return <HomeIcon className="h-5 w-5" />;
    default:
      return <SparklesIcon className="h-5 w-5" />;
  }
};

export default function CategoryManagement() {
  const {
    categories,
    categoryProducts,
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategoryOrder,
  } = useProductData();

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Map category product counts
  const categoryProductCountMap = useMemo(() => {
    const map = new Map<string, number>();
    categoryProducts.forEach((cp) => {
      const current = map.get(cp.categoryId) || 0;
      map.set(cp.categoryId, current + 1);
    });
    return map;
  }, [categoryProducts]);

  // Filtered and sorted categories
  const filteredCategories = useMemo(() => {
    const list = [...categories].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    const count = categoryProductCountMap.get(id) || 0;
    if (count > 0) {
      if (
        !window.confirm(
          `CẢNH BÁO: Danh mục "${name}" (#${id}) hiện đang có ${count} sản phẩm trực thuộc.\nBạn có chắc chắn vẫn muốn xóa danh mục này?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}" (#${id})?`)) {
        return;
      }
    }
    deleteCategory(id);
  };

  const handleSaveCategory = (catData: Category) => {
    const assignedCount = categoryProductCountMap.get(catData.id) || 0;

    const withCountText = {
      ...catData,
      itemCountText: `${assignedCount} sản phẩm`,
    };

    if (editingCategory) {
      updateCategory(editingCategory.id, withCountText);
    } else {
      addCategory(withCountText);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Quản Lý Danh Mục Sản Phẩm
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Thêm mới, cấu hình ngành hàng và quản lý sản phẩm thuộc danh mục
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            Thêm danh mục mới
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Tổng số danh mục
          </span>
          <p className="mt-2 text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {categories.length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Tổng sản phẩm phân bổ
          </span>
          <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-white">
            {categoryProducts.length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            TB sản phẩm / Danh mục
          </span>
          <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {categories.length > 0 ? (categoryProducts.length / categories.length).toFixed(1) : 0}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Danh mục chưa có SP
          </span>
          <p className="mt-2 text-3xl font-black text-amber-500">
            {categories.filter((c) => (categoryProductCountMap.get(c.id) || 0) === 0).length}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên danh mục, mã ID..."
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
      </div>

      {/* Categories Table List View */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              <tr>
                <th className="py-4 px-4 sm:px-6 w-28 text-center">Thứ tự</th>
                <th className="py-4 px-4 sm:px-6">Danh mục</th>
                <th className="py-4 px-4 sm:px-6 hidden md:table-cell">Mô tả</th>
                <th className="py-4 px-4 sm:px-6 text-center">Số sản phẩm</th>
                <th className="py-4 px-4 sm:px-6 hidden lg:table-cell">Chủ đề màu</th>
                <th className="py-4 px-4 sm:px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    Không tìm thấy danh mục nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, index) => {
                  const productCount = categoryProductCountMap.get(cat.id) || 0;

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* 1. Order Column */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <span className="inline-flex items-center justify-center font-mono text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
                          #{cat.order || index + 1}
                        </span>
                      </td>

                      {/* 2. Category Info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 shadow-2xs">
                            {renderCategoryIcon(cat.iconName || "SparklesIcon")}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white leading-tight">
                              {cat.name}
                            </h3>
                            <Link
                              href={`/category/${cat.id}`}
                              target="_blank"
                              className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                            >
                              /category/{cat.id} ↗
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* 3. Description */}
                      <td className="py-4 px-4 sm:px-6 hidden md:table-cell max-w-sm">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {cat.description || "(Chưa có mô tả)"}
                        </p>
                      </td>

                      {/* 4. Product Count */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            productCount > 0
                              ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60"
                              : "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60"
                          }`}
                        >
                          {productCount} SP
                        </span>
                      </td>

                      {/* 5. Color / Gradient Theme */}
                      <td className="py-4 px-4 sm:px-6 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-5 w-12 rounded-lg bg-gradient-to-r ${cat.bannerGradient} shadow-2xs shrink-0`}
                          />
                        </div>
                      </td>

                      {/* 6. Action Buttons */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => moveCategoryOrder(cat.id, "up")}
                            disabled={index === 0}
                            title="Chuyển lên trên"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveCategoryOrder(cat.id, "down")}
                            disabled={index === filteredCategories.length - 1}
                            title="Chuyển xuống dưới"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            ▼
                          </button>
                          <Link
                            href={`/category/${cat.id}`}
                            target="_blank"
                            className="hidden sm:inline-flex items-center h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            title="Xem trang danh mục ngoài website"
                          >
                            👁 Xem
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="h-8 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/40 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors cursor-pointer"
                          >
                            🗑 Xóa
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

      {/* Category Modal with 2-Column Layout */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCategory}
        initialCategory={editingCategory}
        existingCount={categories.length}
      />
    </div>
  );
}
