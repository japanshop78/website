import { Product, PRODUCTS } from "@/data/products";
import { CATEGORY_PRODUCTS } from "@/data/categoryProducts";
import { FEATURED_PRODUCT_ORDER } from "@/data/order";
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
      const data = await supabaseService.getProducts();
      return data.length > 0 ? data : PRODUCTS;
    } catch (err) {
      console.warn("[productService] Fallback to local products due to Supabase error:", err);
      return PRODUCTS;
    }
  },

  /**
   * Lấy chi tiết 1 sản phẩm theo ID từ Supabase Cloud
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const product = await supabaseService.getProductById(id);
      if (product) return product;
    } catch (err) {
      console.warn(`[productService] Fallback to local product #${id}:`, err);
    }
    return PRODUCTS.find((p) => p.id === id || p.id.toLowerCase() === id.toLowerCase()) || null;
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

  // ==========================================================================
  // SYNCHRONOUS / STATIC HELPER METHODS (Static Generation & Fallback)
  // ==========================================================================

  /**
   * Lấy danh sách sản phẩm đồng bộ (dùng cho generateStaticParams / render tức thì)
   */
  getAllProducts(): Product[] {
    return PRODUCTS;
  },

  /**
   * Lấy danh sách sản phẩm theo Category ID
   */
  getProductsByCategoryId(categoryId: string): Product[] {
    if (!categoryId) return [];
    const targetId = categoryId.trim().toLowerCase();
    const normalizeId = (val: string) => val.toLowerCase().trim().replace(/^c-0?/, "").replace(/^0+/, "");
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
   * Lấy danh sách sản phẩm bán chạy / nổi bật
   */
  getFeaturedProducts(limit?: number): Product[] {
    const orderMap = new Map<string, number>(
      FEATURED_PRODUCT_ORDER.map((item) => [item.productId, item.order])
    );

    const featured = [...PRODUCTS]
      .filter((product) => orderMap.has(product.id))
      .sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const orderB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });

    if (featured.length === 0) {
      return [...PRODUCTS]
        .sort((a, b) => (b.rating || 5) - (a.rating || 5))
        .slice(0, limit || 10);
    }

    return limit ? featured.slice(0, limit) : featured;
  },

  /**
   * Tìm kiếm sản phẩm theo từ khóa
   */
  searchProducts(query: string): Product[] {
    if (!query || !query.trim()) return [];
    const normalize = (str: string) =>
      str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const searchTarget = normalize(query);
    return PRODUCTS.filter(
      (product) =>
        normalize(product.name).includes(searchTarget) ||
        normalize(product.description).includes(searchTarget)
    );
  },
};

export default productService;
