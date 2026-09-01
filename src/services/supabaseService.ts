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
  order_num?: number | null;
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

export function mapCategoryToDbRow(c: Category): Record<string, unknown> {
  const numMatch = c.id.match(/\d+/);
  const defaultOrder = numMatch ? parseInt(numMatch[0], 10) : 0;
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
    order_num: c.order !== undefined ? Number(c.order) : defaultOrder,
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
    try {
      const { data, error } = await supabase.from("categories").select("*").order("order_num", { ascending: true });
      if (!error && data) {
        return data.map(mapDbCategoryToCategory).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      }
    } catch {
      // ignore
    }
    const { data, error } = await supabase.from("categories").select("*").order("id", { ascending: true });
    if (error) {
      console.error("[supabaseService] getCategories error:", error.message);
      throw error;
    }
    return (data || []).map(mapDbCategoryToCategory).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  },

  async createCategory(category: Category): Promise<Category> {
    if (!supabase) throw new Error("Supabase is not configured");
    const row = mapCategoryToDbRow(category);
    try {
      const { data, error } = await supabase.from("categories").insert(row).select().single();
      if (!error && data) return mapDbCategoryToCategory(data);
      if (error && error.message && error.message.includes("order_num")) {
        // Fallback without order_num if column not present yet
        const { order_num, ...rest } = row;
        const { data: fallbackData, error: fallbackErr } = await supabase.from("categories").insert(rest).select().single();
        if (fallbackErr) throw fallbackErr;
        return mapDbCategoryToCategory(fallbackData);
      }
      if (error) throw error;
    } catch (err) {
      console.error("[supabaseService] createCategory error:", err);
      throw err;
    }
    return category;
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
    if (updates.order !== undefined) payload.order_num = Number(updates.order);

    const { error } = await supabase.from("categories").update(payload).eq("id", id);
    if (error) {
      if (error.message && error.message.includes("order_num")) {
        delete payload.order_num;
        const { error: retryErr } = await supabase.from("categories").update(payload).eq("id", id);
        if (retryErr) throw retryErr;
        return;
      }
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
    if (error) {
      if (error.message && error.message.includes("order_num")) {
        const fallbackRows = rows.map(({ order_num, ...rest }) => rest);
        const { error: retryErr } = await supabase.from("categories").upsert(fallbackRows, { onConflict: "id" });
        if (retryErr) throw retryErr;
        return;
      }
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // CATEGORY PRODUCT MAPPINGS
  // --------------------------------------------------------------------------
  async getCategoryProducts(): Promise<CategoryProductMapping[]> {
    if (!supabase) return [];
    let { data, error } = await supabase.from("category_products").select("*").order("order_num", { ascending: true });
    if (error && error.message && error.message.includes("order_num")) {
      const fallback = await supabase.from("category_products").select("*").order("id", { ascending: true });
      data = fallback.data;
      error = fallback.error;
    }
    if (error) {
      console.error("[supabaseService] getCategoryProducts error:", error.message);
      throw error;
    }
    return (data || []).map((r, idx) => ({
      categoryId: r.category_id,
      productId: r.product_id,
      order: typeof r.order_num === "number" ? r.order_num : (typeof r.id === "number" ? r.id : idx + 1),
    }));
  },

  async assignProductCategory(categoryId: string, productId: string, order?: number): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    const payload: Record<string, unknown> = { category_id: categoryId, product_id: productId };
    if (typeof order === "number") payload.order_num = order;
    try {
      const { error } = await supabase.from("category_products").upsert(
        payload,
        { onConflict: "category_id,product_id" }
      );
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("order_num")) {
        const { error } = await supabase.from("category_products").upsert(
          { category_id: categoryId, product_id: productId },
          { onConflict: "category_id,product_id" }
        );
        if (error) throw error;
      } else {
        throw err;
      }
    }
  },

  async updateCategoryProductOrder(categoryId: string, productId: string, order: number): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    try {
      const { error } = await supabase
        .from("category_products")
        .update({ order_num: order })
        .match({ category_id: categoryId, product_id: productId });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("order_num")) throw err;
    }
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
    const rows = mappings.map((m, idx) => ({
      category_id: m.categoryId,
      product_id: m.productId,
      order_num: typeof m.order === "number" ? m.order : idx + 1,
    }));
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      try {
        const { error } = await supabase.from("category_products").upsert(chunk, { onConflict: "category_id,product_id" });
        if (error) throw error;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("order_num")) {
          const fallbackChunk = chunk.map(({ order_num, ...rest }) => rest);
          const { error } = await supabase.from("category_products").upsert(fallbackChunk, { onConflict: "category_id,product_id" });
          if (error) throw error;
        } else {
          throw err;
        }
      }
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
      productId: String(r.product_id).trim(),
      order: Number(r.order_num) || 0,
      banner: r.banner ? String(r.banner).toLowerCase().trim() : "featured",
    }));
  },

  async updateProductOrder(productId: string, orderNum: number, banner: string = "featured"): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    const bannerKey = banner.toLowerCase().trim();
    const pId = String(productId).trim();
    const { error } = await supabase.from("product_orders").upsert(
      { product_id: pId, order_num: Number(orderNum), banner: bannerKey },
      { onConflict: "product_id,banner" }
    );
    if (error) {
      // Fallback if unique constraint is product_id only
      const { error: fallbackErr } = await supabase.from("product_orders").upsert(
        { product_id: pId, order_num: Number(orderNum), banner: bannerKey },
        { onConflict: "product_id" }
      );
      if (fallbackErr) throw fallbackErr;
    }
  },

  async bulkUpsertProductOrders(orders: ProductOrder[]): Promise<void> {
    if (!supabase) throw new Error("Supabase is not configured");
    const rows = orders.map((o) => ({
      product_id: String(o.productId).trim(),
      order_num: Number(o.order),
      banner: o.banner ? String(o.banner).toLowerCase().trim() : "featured",
    }));
    // Try to delete existing and re-insert for clean sync
    try {
      await supabase.from("product_orders").delete().gte("id", 0);
    } catch {
      // ignore
    }
    const { error } = await supabase.from("product_orders").insert(rows);
    if (error) {
      console.warn("[supabaseService] fallback upserting orders:", error.message);
      const { error: upsertErr } = await supabase.from("product_orders").upsert(rows, { onConflict: "product_id,banner" });
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
