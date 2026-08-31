import { Category, CATEGORIES } from "@/data/categories";
import { Product, PRODUCTS } from "@/data/products";
import { CATEGORY_PRODUCTS } from "@/data/categoryProducts";
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
      const data = await supabaseService.getCategories();
      return data.length > 0 ? data : CATEGORIES;
    } catch (err) {
      console.warn("[categoryService] Fallback to local categories due to Supabase error:", err);
      return CATEGORIES;
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

  // ==========================================================================
  // SYNCHRONOUS / STATIC HELPER METHODS (Static Generation & Fallback)
  // ==========================================================================

  /**
   * Lấy danh sách toàn bộ danh mục đồng bộ (dùng cho generateStaticParams / render)
   */
  getAllCategories(): Category[] {
    return CATEGORIES;
  },

  /**
   * Lấy chi tiết danh mục theo ID (ví dụ: "C-01", "c-01", "1")
   */
  getCategoryById(id: string): Category | undefined {
    if (!id) return undefined;
    const targetId = id.trim().toLowerCase();
    const targetNum = normalizeId(id);

    const direct = CATEGORIES.find(
      (cat) =>
        cat.id.toLowerCase() === targetId ||
        normalizeId(cat.id) === targetNum ||
        normalize(cat.name) === normalize(id)
    );
    if (direct) return direct;

    // Fallback alias matching
    const targetSlug = normalize(id);
    if (targetSlug.includes("me") && targetSlug.includes("be")) {
      return CATEGORIES.find((c) => c.id === "C-03");
    }
    if (targetSlug.includes("mat")) {
      return CATEGORIES.find((c) => c.id === "C-04");
    }
    if (
      targetSlug.includes("ca-nhan") ||
      targetSlug.includes("personal") ||
      targetSlug.includes("rang") ||
      targetSlug.includes("mieng")
    ) {
      return CATEGORIES.find((c) => c.id === "C-01");
    }
    if (
      targetSlug.includes("thuc-pham") ||
      targetSlug.includes("bo-sung") ||
      targetSlug.includes("tpcn") ||
      targetSlug.includes("chuc-nang")
    ) {
      return CATEGORIES.find((c) => c.id === "C-02");
    }
    if (targetSlug.includes("gia-dung") || targetSlug.includes("do-gia-dung")) {
      return CATEGORIES.find((c) => c.id === "C-05");
    }

    return undefined;
  },

  /**
   * Lấy chi tiết danh mục theo tên
   */
  getCategoryByName(name: string): Category | undefined {
    if (!name) return undefined;
    const targetName = normalize(name);
    return CATEGORIES.find((cat) => normalize(cat.name) === targetName);
  },

  /**
   * Lấy danh sách sản phẩm thuộc danh mục dựa theo Category ID
   */
  getProductsByCategoryId(categoryId: string): Product[] {
    if (!categoryId) return [];
    const targetId = categoryId.trim().toLowerCase();
    const targetNum = normalizeId(categoryId);

    const matchedProductIds = new Set(
      CATEGORY_PRODUCTS.filter(
        (cp) =>
          cp.categoryId.toLowerCase() === targetId ||
          normalizeId(cp.categoryId) === targetNum
      ).map((cp) => cp.productId)
    );

    return PRODUCTS.filter((product) => matchedProductIds.has(product.id));
  },

  /**
   * Thống kê tổng hợp số liệu của danh mục
   */
  getCategoryStats(categoryId: string): CategoryStats {
    const prods = this.getProductsByCategoryId(categoryId);
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
