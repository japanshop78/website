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
    resetCategoriesToDefault,
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

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(
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
          <button
            onClick={() => {
              if (window.confirm("Khôi phục toàn bộ danh mục và phân loại về cấu hình mặc định ban đầu?")) {
                resetCategoriesToDefault();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 px-3.5 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors cursor-pointer"
          >
            🔄 Khôi phục gốc
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

      {/* Category Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCategories.map((cat) => {
          const productCount = categoryProductCountMap.get(cat.id) || 0;

          return (
            <div
              key={cat.id}
              className="group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Background gradient hint */}
              <div
                className={`absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br ${cat.bannerGradient} opacity-10 group-hover:scale-125 transition-transform duration-500`}
              />

              <div>
                {/* Top Row: Icon + ID + Product Count */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 shadow-xs">
                      {renderCategoryIcon(cat.iconName || "SparklesIcon")}
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-zinc-400">
                        #{cat.id}
                      </span>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-tight">
                        {cat.name}
                      </h3>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      productCount > 0
                        ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                        : "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {productCount} sản phẩm
                  </span>
                </div>

                {/* Category ID Link */}
                <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mb-2">
                  /category/{cat.id}
                </p>

                {/* Description */}
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                  {cat.description || "(Chưa có mô tả cho danh mục này)"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 z-10">
                <Link
                  href={`/category/${cat.id}`}
                  target="_blank"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  👁 Xem trang danh mục
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    ✏️ Sửa thông tin
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors cursor-pointer"
                  >
                    🗑 Xóa
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
