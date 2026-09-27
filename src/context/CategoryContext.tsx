"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CATEGORIES as DEFAULT_CATEGORIES, Category } from "@/data/categories";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface DbCategoryRow {
  id: string;
  name: string;
  description: string | null;
  banner_gradient: string | null;
  badge_color: string | null;
  icon_name: string | null;
  item_count_text: string | null;
  subcategories: string[] | null;
  order_num?: number | null;
}

export function mapDbCategory(row: DbCategoryRow): Category {
  const parseOrder = () => {
    if (row.order_num !== null && row.order_num !== undefined) {
      return Number(row.order_num);
    }
    const numMatch = row.id.match(/\d+/);
    return numMatch ? parseInt(numMatch[0], 10) : 999;
  };

  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    bannerGradient: row.banner_gradient || "from-indigo-600 to-violet-700",
    badgeColor: row.badge_color || "bg-indigo-500",
    iconName: (row.icon_name || "SparklesIcon") as Category["iconName"],
    itemCountText: row.item_count_text || "0 sản phẩm",
    subcategories: Array.isArray(row.subcategories) ? row.subcategories : [],
    order: parseOrder(),
  };
}

export function mapCategoryToDb(c: Category) {
  const numMatch = c.id.match(/\d+/);
  const defaultOrder = numMatch ? parseInt(numMatch[0], 10) : 0;
  return {
    id: c.id,
    name: c.name,
    description: c.description || "",
    banner_gradient: c.bannerGradient || "from-indigo-600 to-violet-700",
    badge_color: c.badgeColor || "bg-indigo-500",
    icon_name: c.iconName || "SparklesIcon",
    item_count_text: c.itemCountText || "0 sản phẩm",
    subcategories: c.subcategories || [],
    order_num: c.order !== undefined ? Number(c.order) : defaultOrder,
  };
}

export interface CategoryContextType {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, updated: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  moveCategoryOrder: (categoryId: string, direction: "up" | "down") => Promise<void>;
  saveCategoryOrder: (orderedCategories: Category[]) => Promise<boolean>;
  exportCategoriesJSON: () => string;
  importCategoriesJSON: (jsonString: string) => boolean;
}

export const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({
  children,
  initialCategories = DEFAULT_CATEGORIES,
}: {
  children: React.ReactNode;
  initialCategories?: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const sortCategories = (cats: Category[]) =>
    [...cats].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    });

  const addCategory = async (category: Category) => {
    const nextOrder = category.order ?? (categories.length + 1);
    const catWithOrder = { ...category, order: nextOrder };
    const newCategories = sortCategories([...categories, catWithOrder]);
    setCategories(newCategories);

    if (supabase && isSupabaseConfigured()) {
      try {
        const row = mapCategoryToDb(catWithOrder);
        const { error } = await supabase.from("categories").insert(row);
        if (error && error.message && error.message.includes("order_num")) {
          const rowCopy: Record<string, unknown> = { ...row };
          delete rowCopy.order_num;
          await supabase.from("categories").insert(rowCopy);
        }
        await supabase.from("product_orders").upsert(
          {
            product_id: category.id,
            order_num: nextOrder,
            banner: "category",
          },
          { onConflict: "product_id,banner" }
        );
      } catch (err) {
        console.error("Failed to add category in Supabase", err);
      }
    }
  };

  const updateCategory = async (id: string, updated: Partial<Category>) => {
    const updatedList = categories.map((cat) => (cat.id === id ? { ...cat, ...updated } : cat));
    const newCategories = sortCategories(updatedList);
    setCategories(newCategories);

    if (supabase && isSupabaseConfigured()) {
      try {
        const fullCat = newCategories.find((c) => c.id === id);
        if (fullCat) {
          const row = mapCategoryToDb(fullCat);
          const { error } = await supabase.from("categories").update(row).eq("id", id);
          if (error && error.message && error.message.includes("order_num")) {
            const rowCopy: Record<string, unknown> = { ...row };
            delete rowCopy.order_num;
            await supabase.from("categories").update(rowCopy).eq("id", id);
          }
        }
      } catch (err) {
        console.error("Failed to update category in Supabase", err);
      }
    }
  };

  const saveCategoryOrder = async (orderedCategories: Category[]): Promise<boolean> => {
    const updated = orderedCategories.map((c, idx) => ({ ...c, order: idx + 1 }));
    setCategories(updated);

    if (supabase && isSupabaseConfigured()) {
      try {
        await Promise.allSettled(
          updated.map((c) =>
            supabase!.from("categories").update({ order_num: c.order }).eq("id", c.id)
          )
        );

        await supabase.from("product_orders").delete().eq("banner", "category");
        await supabase.from("product_orders").insert(
          updated.map((c) => ({
            product_id: c.id,
            order_num: c.order,
            banner: "category",
          }))
        );

        return true;
      } catch (err) {
        console.error("Failed to save category order in Supabase", err);
        return false;
      }
    }
    return true;
  };

  const moveCategoryOrder = async (categoryId: string, direction: "up" | "down") => {
    const currentIndex = categories.findIndex((c) => c.id === categoryId);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCats = [...categories];
    const [moved] = newCats.splice(currentIndex, 1);
    newCats.splice(targetIndex, 0, moved);

    await saveCategoryOrder(newCats);
  };

  const deleteCategory = async (id: string) => {
    const newCategories = categories.filter((cat) => cat.id !== id);
    setCategories(newCategories);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from("categories").delete().eq("id", id);
        await supabase.from("category_products").delete().eq("category_id", id);
        await supabase.from("product_orders").delete().eq("product_id", id).eq("banner", "category");
      } catch (err) {
        console.error("Failed to delete category in Supabase", err);
      }
    }
  };

  const exportCategoriesJSON = () => JSON.stringify(categories, null, 2);

  const importCategoriesJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) return false;
      setCategories(parsed);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        setCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        moveCategoryOrder,
        saveCategoryOrder,
        exportCategoriesJSON,
        importCategoriesJSON,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error("useCategories must be used within a CategoryProvider");
  }
  return context;
}
