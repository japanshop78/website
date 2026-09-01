import { Product } from "@/data/products";
import { supabaseService } from "./supabaseService";

export const productService = {
  // ==========================================================================
  // SUPABASE CLOUD CRUD OPERATIONS (Async / Live Database)
  // ==========================================================================

  /**
   * Lấy danh sách toàn bộ sản phẩm từ Supabase Cloud
   */
  async getProducts(): Promise<Product[]> {
    try {
      return await supabaseService.getProducts();
    } catch (err) {
      console.error("[productService] Lỗi khi lấy danh sách sản phẩm từ Supabase:", err);
      return [];
    }
  },

  /**
   * Lấy chi tiết 1 sản phẩm theo ID từ Supabase Cloud
   */
  async getProductById(id: string): Promise<Product | null> {
    if (!id) return null;
    try {
      return await supabaseService.getProductById(id);
    } catch (err) {
      console.error(`[productService] Lỗi khi lấy sản phẩm #${id} từ Supabase:`, err);
      return null;
    }
  },

  /**
   * Thêm sản phẩm mới vào Supabase Cloud
   */
  async createProduct(product: Product): Promise<Product> {
    return await supabaseService.createProduct(product);
  },

  /**
   * Cập nhật thông tin sản phẩm trên Supabase Cloud
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    return await supabaseService.updateProduct(id, updates);
  },

  /**
   * Xóa sản phẩm và các liên kết tương ứng trên Supabase Cloud
   */
  async deleteProduct(id: string): Promise<void> {
    return await supabaseService.deleteProduct(id);
  },

  /**
   * Đồng bộ / Cập nhật hàng loạt sản phẩm lên Supabase Cloud
   */
  async bulkUpsertProducts(products: Product[]): Promise<void> {
    return await supabaseService.bulkUpsertProducts(products);
  },

  /**
   * Lấy danh sách sản phẩm theo Category ID từ Supabase Cloud
   */
  async getProductsByCategoryId(categoryId: string): Promise<Product[]> {
    if (!categoryId) return [];
    try {
      const [allProducts, allMappings] = await Promise.all([
        supabaseService.getProducts(),
        supabaseService.getCategoryProducts(),
      ]);

      const targetId = categoryId.trim().toLowerCase();
      const normalizeId = (val: string) => val.toLowerCase().trim().replace(/^c-0?/, "").replace(/^0+/, "");
      const targetNum = normalizeId(categoryId);

      const matchedProductIds = new Set(
        allMappings
          .filter(
            (cp) =>
              cp.categoryId.toLowerCase() === targetId ||
              normalizeId(cp.categoryId) === targetNum
          )
          .map((cp) => cp.productId)
      );

      return allProducts.filter((product) => matchedProductIds.has(product.id));
    } catch (err) {
      console.error(`[productService] Lỗi getProductsByCategoryId(${categoryId}):`, err);
      return [];
    }
  },

  /**
   * Lấy danh sách sản phẩm bán chạy / nổi bật từ Supabase Cloud
   */
  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    try {
      const [products, orders] = await Promise.all([
        supabaseService.getProducts(),
        supabaseService.getProductOrders(),
      ]);

      const featuredOrders = orders.filter(
        (o) => !o.banner || o.banner.toLowerCase() === "featured" || o.banner.toLowerCase() === "sản phẩm bán chạy"
      );

      const orderMap = new Map<string, number>(
        featuredOrders.map((item) => [String(item.productId).trim(), Number(item.order)])
      );

      const featured = products
        .filter((product) => orderMap.has(String(product.id).trim()))
        .sort((a, b) => {
          const orderA = orderMap.get(String(a.id).trim()) ?? Number.MAX_SAFE_INTEGER;
          const orderB = orderMap.get(String(b.id).trim()) ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });

      if (featured.length === 0) {
        return products
          .sort((a, b) => (b.rating || 5) - (a.rating || 5))
          .slice(0, limit || 10);
      }

      return limit ? featured.slice(0, limit) : featured;
    } catch (err) {
      console.error("[productService] Lỗi getFeaturedProducts:", err);
      return [];
    }
  },

  /**
   * Tìm kiếm sản phẩm theo từ khóa từ Supabase Cloud
   */
  async searchProducts(query: string): Promise<Product[]> {
    if (!query || !query.trim()) return [];
    try {
      const products = await supabaseService.getProducts();
      const normalize = (str: string) =>
        str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const searchTarget = normalize(query);
      return products.filter(
        (product) =>
          normalize(product.name).includes(searchTarget) ||
          normalize(product.description).includes(searchTarget)
      );
    } catch (err) {
      console.error("[productService] Lỗi searchProducts:", err);
      return [];
    }
  },
};

export default productService;
