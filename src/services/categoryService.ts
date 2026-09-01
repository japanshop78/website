import { Category } from "@/data/categories";
import { Product } from "@/data/products";
import { supabaseService } from "./supabaseService";

export interface CategoryStats {
  totalProducts: number;
  minPrice: number;
  maxPrice: number;
  avgRating: number;
  totalReviews: number;
}

const normalize = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeId = (id: string) =>
  id
    .toLowerCase()
    .trim()
    .replace(/^c-0?/, "")
    .replace(/^0+/, "");

export const categoryService = {
  // ==========================================================================
  // SUPABASE CLOUD CRUD OPERATIONS (Async / Live Database)
  // ==========================================================================

  /**
   * Lấy danh sách toàn bộ danh mục từ Supabase Cloud
   */
  async getCategories(): Promise<Category[]> {
    try {
      return await supabaseService.getCategories();
    } catch (err) {
      console.error("[categoryService] Lỗi khi lấy danh mục từ Supabase:", err);
      return [];
    }
  },

  /**
   * Tạo danh mục mới trên Supabase Cloud
   */
  async createCategory(category: Category): Promise<Category> {
    return await supabaseService.createCategory(category);
  },

  /**
   * Chỉnh sửa danh mục trên Supabase Cloud
   */
  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    return await supabaseService.updateCategory(id, updates);
  },

  /**
   * Xóa danh mục trên Supabase Cloud
   */
  async deleteCategory(id: string): Promise<void> {
    return await supabaseService.deleteCategory(id);
  },

  /**
   * Đồng bộ / Cập nhật hàng loạt danh mục lên Supabase Cloud
   */
  async bulkUpsertCategories(categories: Category[]): Promise<void> {
    return await supabaseService.bulkUpsertCategories(categories);
  },

  /**
   * Lấy chi tiết danh mục theo ID từ Supabase Cloud
   */
  async getCategoryById(id: string): Promise<Category | null> {
    if (!id) return null;
    try {
      const categories = await supabaseService.getCategories();
      const targetId = id.trim().toLowerCase();
      const targetNum = normalizeId(id);

      const direct = categories.find(
        (cat) =>
          cat.id.toLowerCase() === targetId ||
          normalizeId(cat.id) === targetNum ||
          normalize(cat.name) === normalize(id)
      );
      if (direct) return direct;

      // Fallback alias matching
      const targetSlug = normalize(id);
      if (targetSlug.includes("me") && targetSlug.includes("be")) {
        return categories.find((c) => c.id === "C-03") || null;
      }
      if (targetSlug.includes("mat")) {
        return categories.find((c) => c.id === "C-04") || null;
      }
      if (
        targetSlug.includes("ca-nhan") ||
        targetSlug.includes("personal") ||
        targetSlug.includes("rang") ||
        targetSlug.includes("mieng")
      ) {
        return categories.find((c) => c.id === "C-01") || null;
      }
      if (
        targetSlug.includes("thuc-pham") ||
        targetSlug.includes("bo-sung") ||
        targetSlug.includes("tpcn") ||
        targetSlug.includes("chuc-nang")
      ) {
        return categories.find((c) => c.id === "C-02") || null;
      }
      if (targetSlug.includes("gia-dung") || targetSlug.includes("do-gia-dung")) {
        return categories.find((c) => c.id === "C-05") || null;
      }

      return null;
    } catch (err) {
      console.error(`[categoryService] Lỗi getCategoryById(${id}):`, err);
      return null;
    }
  },

  /**
   * Lấy chi tiết danh mục theo tên từ Supabase Cloud
   */
  async getCategoryByName(name: string): Promise<Category | null> {
    if (!name) return null;
    try {
      const categories = await supabaseService.getCategories();
      const targetName = normalize(name);
      return categories.find((cat) => normalize(cat.name) === targetName) || null;
    } catch (err) {
      console.error(`[categoryService] Lỗi getCategoryByName(${name}):`, err);
      return null;
    }
  },

  /**
   * Lấy danh sách sản phẩm thuộc danh mục dựa theo Category ID từ Supabase Cloud
   */
  async getProductsByCategoryId(categoryId: string): Promise<Product[]> {
    if (!categoryId) return [];
    try {
      const [products, mappings] = await Promise.all([
        supabaseService.getProducts(),
        supabaseService.getCategoryProducts(),
      ]);

      const targetId = categoryId.trim().toLowerCase();
      const targetNum = normalizeId(categoryId);

      const matchedProductIds = new Set(
        mappings
          .filter(
            (cp) =>
              cp.categoryId.toLowerCase() === targetId ||
              normalizeId(cp.categoryId) === targetNum
          )
          .map((cp) => cp.productId)
      );

      return products.filter((product) => matchedProductIds.has(product.id));
    } catch (err) {
      console.error(`[categoryService] Lỗi getProductsByCategoryId(${categoryId}):`, err);
      return [];
    }
  },

  /**
   * Thống kê tổng hợp số liệu của danh mục từ Supabase Cloud
   */
  async getCategoryStats(categoryId: string): Promise<CategoryStats> {
    const prods = await this.getProductsByCategoryId(categoryId);
    if (prods.length === 0) {
      return {
        totalProducts: 0,
        minPrice: 0,
        maxPrice: 0,
        avgRating: 5.0,
        totalReviews: 0,
      };
    }

    const prices = prods.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgRating =
      prods.reduce((sum, p) => sum + p.rating, 0) / prods.length;
    const totalReviews = prods.reduce((sum, p) => sum + p.reviews, 0);

    return {
      totalProducts: prods.length,
      minPrice,
      maxPrice,
      avgRating: Number(avgRating.toFixed(1)),
      totalReviews,
    };
  },
};

export default categoryService;
