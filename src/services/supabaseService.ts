import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Product } from "@/data/products";
import { Category } from "@/data/categories";
import { CategoryProductMapping } from "@/data/categoryProducts";
import { ProductOrder } from "@/data/order";

// Supabase Connection Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

/**
 * Check whether Supabase environment variables are properly defined
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY.length > 20
  );
};

/**
 * Supabase client instance
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// ============================================================================
// DATABASE TYPES & MAPPING HELPERS
// ============================================================================

export interface DbProductRow {
  id: string;
  name: string;
  description: string | null;
  image?: string | null;
  images?: string[] | null;
  image_bg: string | null;
  price: number;
  old_price: number | null;
  rating: number;
  reviews: number;
  tag: string | null;
  stock: number;
  ingredients: string | null;
}

export interface DbCategoryRow {
  id: string;
  slug?: string | null;
  name: string;
  description: string | null;
  banner_gradient: string | null;
  badge_color: string | null;
  icon_name: string | null;
  item_count_text: string | null;
  subcategories: string[] | null;
}

export interface DbCategoryProductRow {
  category_id: string;
  product_id: string;
}

export interface DbProductOrderRow {
  product_id: string;
  order_num: number;
  banner?: string | null;
}

export function mapDbProductToProduct(row: DbProductRow): Product {
  const images = Array.isArray(row.images) && row.images.length > 0
    ? row.images
    : (row.image ? [row.image] : []);

  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    ingredients: row.ingredients || undefined,
    images,
    imageBg: row.image_bg || undefined,
    price: Number(row.price) || 0,
    oldPrice: row.old_price !== null && row.old_price !== undefined ? Number(row.old_price) : undefined,
    rating: Number(row.rating) || 5.0,
    reviews: Number(row.reviews) || 0,
    tag: row.tag || undefined,
    stock: Number(row.stock) || 0,
  };
}

export function mapProductToDbRow(p: Product): Record<string, unknown> {
  const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : [];
  return {
    id: p.id,
    name: p.name,
    description: p.description || "",
    ingredients: p.ingredients ?? null,
    image: images[0] || "",
    images,
    image_bg: p.imageBg || "",
    price: p.price,
    old_price: p.oldPrice ?? null,
    rating: p.rating ?? 5.0,
    reviews: p.reviews ?? 0,
    tag: p.tag ?? null,
    stock: p.stock ?? 0,
  };
}

export function mapDbCategoryToCategory(row: DbCategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    bannerGradient: row.banner_gradient || "from-indigo-600 to-violet-700",
    badgeColor: row.badge_color || "bg-indigo-500",
    iconName: (row.icon_name || "SparklesIcon") as Category["iconName"],
    itemCountText: row.item_count_text || "0 sản phẩm",
    subcategories: Array.isArray(row.subcategories) ? row.subcategories : [],
  };
}

export function mapCategoryToDbRow(c: Category): Record<string, unknown> {
  return {
    id: c.id,
    slug: c.id.toLowerCase(),
    name: c.name,
    description: c.description || "",
    banner_gradient: c.bannerGradient || "from-indigo-600 to-violet-700",
    badge_color: c.badgeColor || "bg-indigo-500",
    icon_name: c.iconName || "SparklesIcon",
    item_count_text: c.itemCountText || "0 sản phẩm",
    subcategories: c.subcategories || [],
  };
}

// ============================================================================
// SUPABASE SERVICE CRUD OPERATIONS
// ============================================================================

export const supabaseService = {
  /**
   * Test database connectivity
   */
  async checkConnection(): Promise<{ success: boolean; status: "connected" | "not_configured" | "error"; message?: string }> {
    if (!supabase) {
      return { success: false, status: "not_configured", message: "Supabase credentials are not configured" };
    }
    try {
      const { error } = await supabase.from("products").select("id").limit(1);
      if (error) throw error;
      return { success: true, status: "connected" };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { success: false, status: "error", message: msg };
    }
  },

  // --------------------------------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------------------------------
  async getProducts(): Promise<Product[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from("products").select("*").order("id", { ascending: true });
    if (error) {
      console.error("[supabaseService] getProducts error:", error.message);
      throw error;
    }
    return (data || []).map(mapDbProductToProduct);
  },

  async getProductById(id: string): Promise<Product | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (error) {
      console.error(`[supabaseService] getProductById(${id}) error:`, error.message);
      throw error;
    }
    return data ? mapDbProductToProduct(data) : null;
  },

  async createProduct(product: Product): Promise<Product> {
    if (!supabase) throw new Error("Supabase is not configured");
    const row = mapProductToDbRow(product);
    const { data, error } = await supabase.from("products").insert(row).select().single();
    if (error) {
      console.error("[supabaseService] createProduct error:", error.message);
      throw error;
    }
    return mapDbProductToProduct(data);
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.ingredients !== undefined) payload.ingredients = updates.ingredients;
    if (updates.images !== undefined) {
      payload.images = updates.images;
      payload.image = updates.images[0] || "";
    }
    if (updates.imageBg !== undefined) payload.image_bg = updates.imageBg;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.oldPrice !== undefined) payload.old_price = updates.oldPrice;
    if (updates.rating !== undefined) payload.rating = updates.rating;
    if (updates.reviews !== undefined) payload.reviews = updates.reviews;
    if (updates.tag !== undefined) payload.tag = updates.tag;
    if (updates.stock !== undefined) payload.stock = updates.stock;

    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) {
      console.error(`[supabaseService] updateProduct(${id}) error:`, error.message);
      throw error;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    // Clean related mapping & order records
    await supabase.from("category_products").delete().eq("product_id", id);
    await supabase.from("product_orders").delete().eq("product_id", id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error(`[supabaseService] deleteProduct(${id}) error:`, error.message);
      throw error;
    }
  },

  async bulkUpsertProducts(products: Product[]): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    const rows = products.map(mapProductToDbRow);
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from("products").upsert(chunk, { onConflict: "id" });
      if (error) throw error;
    }
  },

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------
  async getCategories(): Promise<Category[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from("categories").select("*").order("id", { ascending: true });
    if (error) {
      console.error("[supabaseService] getCategories error:", error.message);
      throw error;
    }
    return (data || []).map(mapDbCategoryToCategory);
  },

  async createCategory(category: Category): Promise<Category> {
    if (!supabase) throw new Error("Supabase is not configured");
    const row = mapCategoryToDbRow(category);
    const { data, error } = await supabase.from("categories").insert(row).select().single();
    if (error) {
      console.error("[supabaseService] createCategory error:", error.message);
      throw error;
    }
    return mapDbCategoryToCategory(data);
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.bannerGradient !== undefined) payload.banner_gradient = updates.bannerGradient;
    if (updates.badgeColor !== undefined) payload.badge_color = updates.badgeColor;
    if (updates.iconName !== undefined) payload.icon_name = updates.iconName;
    if (updates.itemCountText !== undefined) payload.item_count_text = updates.itemCountText;
    if (updates.subcategories !== undefined) payload.subcategories = updates.subcategories;

    const { error } = await supabase.from("categories").update(payload).eq("id", id);
    if (error) {
      console.error(`[supabaseService] updateCategory(${id}) error:`, error.message);
      throw error;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    await supabase.from("category_products").delete().eq("category_id", id);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      console.error(`[supabaseService] deleteCategory(${id}) error:`, error.message);
      throw error;
    }
  },

  async bulkUpsertCategories(categories: Category[]): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    const rows = categories.map(mapCategoryToDbRow);
    const { error } = await supabase.from("categories").upsert(rows, { onConflict: "id" });
    if (error) throw error;
  },

  // --------------------------------------------------------------------------
  // CATEGORY PRODUCT MAPPINGS
  // --------------------------------------------------------------------------
  async getCategoryProducts(): Promise<CategoryProductMapping[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from("category_products").select("*");
    if (error) {
      console.error("[supabaseService] getCategoryProducts error:", error.message);
      throw error;
    }
    return (data || []).map((r) => ({
      categoryId: r.category_id,
      productId: r.product_id,
    }));
  },

  async assignProductCategory(categoryId: string, productId: string): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    const { error } = await supabase.from("category_products").upsert(
      { category_id: categoryId, product_id: productId },
      { onConflict: "category_id,product_id" }
    );
    if (error) throw error;
  },

  async removeProductCategory(categoryId: string, productId: string): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    const { error } = await supabase
      .from("category_products")
      .delete()
      .match({ category_id: categoryId, product_id: productId });
    if (error) throw error;
  },

  async bulkUpsertCategoryProducts(mappings: CategoryProductMapping[]): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    const rows = mappings.map((m) => ({ category_id: m.categoryId, product_id: m.productId }));
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from("category_products").upsert(chunk, { onConflict: "category_id,product_id" });
      if (error) throw error;
    }
  },

  // --------------------------------------------------------------------------
  // PRODUCT ORDERS (BANNER SORTING: FEATURED, DISCOUNT, ETC.)
  // --------------------------------------------------------------------------
  async getProductOrders(): Promise<ProductOrder[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from("product_orders").select("*").order("order_num", { ascending: true });
    if (error) {
      console.error("[supabaseService] getProductOrders error:", error.message);
      throw error;
    }
    return (data || []).map((r) => ({
      productId: r.product_id,
      order: r.order_num,
      banner: r.banner || "featured",
    }));
  },

  async updateProductOrder(productId: string, orderNum: number, banner: string = "featured"): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    const { error } = await supabase.from("product_orders").upsert(
      { product_id: productId, order_num: orderNum, banner },
      { onConflict: "product_id,banner" }
    );
    if (error) {
      // Fallback if unique constraint is product_id only
      const { error: fallbackErr } = await supabase.from("product_orders").upsert(
        { product_id: productId, order_num: orderNum, banner },
        { onConflict: "product_id" }
      );
      if (fallbackErr) throw fallbackErr;
    }
  },

  async bulkUpsertProductOrders(orders: ProductOrder[]): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    const rows = orders.map((o) => ({
      product_id: o.productId,
      order_num: o.order,
      banner: o.banner || "featured",
    }));
    // Try to delete existing and re-insert for clean sync
    await supabase.from("product_orders").delete().neq("id", 0);
    const { error } = await supabase.from("product_orders").insert(rows);
    if (error) {
      console.warn("[supabaseService] fallback upserting orders:", error.message);
      const { error: upsertErr } = await supabase.from("product_orders").upsert(rows);
      if (upsertErr) throw upsertErr;
    }
  },

  // --------------------------------------------------------------------------
  // FULL SEED / RESET DATA
  // --------------------------------------------------------------------------
  async seedAllData(payload: {
    categories: Category[];
    products: Product[];
    categoryProducts: CategoryProductMapping[];
    orders: ProductOrder[];
  }): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      return { success: false, message: "Supabase chưa được cấu hình" };
    }
    try {
      await this.bulkUpsertCategories(payload.categories);
      await this.bulkUpsertProducts(payload.products);
      await this.bulkUpsertCategoryProducts(payload.categoryProducts);
      await this.bulkUpsertProductOrders(payload.orders);
      return {
        success: true,
        message: `Đồng bộ thành công ${payload.categories.length} danh mục, ${payload.products.length} sản phẩm lên Supabase Cloud!`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi đồng bộ";
      console.error("[supabaseService] seedAllData failed:", msg);
      return { success: false, message: `Lỗi đồng bộ: ${msg}` };
    }
  },
};

export default supabaseService;
