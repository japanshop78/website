"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { PRODUCTS as DEFAULT_PRODUCTS, Product } from "@/data/products";
import { CATEGORIES as DEFAULT_CATEGORIES, Category } from "@/data/categories";
import { CATEGORY_PRODUCTS as DEFAULT_CATEGORY_PRODUCTS, CategoryProductMapping } from "@/data/categoryProducts";
import { FEATURED_PRODUCT_ORDER as DEFAULT_ORDER, ProductOrder } from "@/data/order";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";


// Database row mappings
interface DbProductRow {
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

interface DbCategoryRow {
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

interface DbCategoryProductRow {
  id?: number | null;
  category_id: string;
  product_id: string;
  order_num?: number | null;
}

interface DbProductOrderRow {
  product_id: string;
  order_num: number;
  banner?: string | null;
}

function mapDbProduct(row: DbProductRow): Product {
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

function mapProductToDb(p: Product) {
  const images = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : [];
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

function mapDbCategory(row: DbCategoryRow): Category {
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

function mapCategoryToDb(c: Category) {
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

export type SupabaseConnectionStatus = "connected" | "not_configured" | "error" | "loading";

interface ProductContextType {
  products: Product[];
  categories: Category[];
  categoryProducts: CategoryProductMapping[];
  orders: ProductOrder[];
  isLoaded: boolean;
  supabaseStatus: SupabaseConnectionStatus;
  addProduct: (product: Omit<Product, "id"> & { id?: string; order?: number; categoryId?: string }) => Promise<void>;
  updateProduct: (id: string, updated: Partial<Product> & { order?: number; categoryId?: string }) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProductOrder: (productId: string, newOrder: number, banner?: string) => Promise<void>;
  toggleFeatured: (productId: string, isFeatured: boolean, tag?: string) => Promise<void>;
  moveProductOrder: (productId: string, direction: "up" | "down", banner?: string) => Promise<void>;
  exportJSON: () => string;
  importJSON: (jsonString: string) => boolean;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, updated: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  moveCategoryOrder: (categoryId: string, direction: "up" | "down") => Promise<void>;
  exportCategoriesJSON: () => string;
  importCategoriesJSON: (jsonString: string) => boolean;
  getProductsByCategoryId: (categoryId: string) => Product[];
  getCategoryIdByProductId: (productId: string) => string | undefined;
  setCategoryProducts: (categoryId: string, productIds: string[]) => Promise<void>;
  assignProductToCategory: (productId: string, categoryId: string, order?: number) => Promise<void>;
  removeProductFromCategory: (productId: string, categoryId: string) => Promise<void>;
  moveCategoryProductOrder: (categoryId: string, productId: string, direction: "up" | "down") => Promise<void>;
  updateCategoryProductOrder: (categoryId: string, productId: string, newOrder: number) => Promise<void>;
  exportCategoryProductsJSON: () => string;
  importCategoryProductsJSON: (jsonString: string) => boolean;
  getProductById: (id: string) => Product | undefined;
  getProductsByBanner: (banner: string, limit?: number) => Product[];
  getFeaturedProducts: (limit?: number) => Product[];
  getDiscountedProducts: (limit?: number) => Product[];
  setBannerProducts: (banner: string, productIds: string[]) => Promise<void>;
  seedInitialDataToSupabase: () => Promise<{ success: boolean; message: string }>;
  refreshFromSupabase: () => Promise<void>;
}

const ProductDataContext = createContext<ProductContextType | undefined>(undefined);

export function ProductDataProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryProducts, setCategoryProductsState] = useState<CategoryProductMapping[]>([]);
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus>("loading");

  // Fetch all data from Supabase
  const fetchDataFromSupabase = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured()) {
      setSupabaseStatus("not_configured");
      return false;
    }

    try {
      let catRes = await supabase.from("categories").select("*").order("order_num", { ascending: true });
      if (catRes.error && catRes.error.message && catRes.error.message.includes("order_num")) {
        catRes = await supabase.from("categories").select("*").order("id", { ascending: true });
      }

      let catProdRes = await supabase.from("category_products").select("*").order("order_num", { ascending: true });
      if (catProdRes.error && catProdRes.error.message && catProdRes.error.message.includes("order_num")) {
        catProdRes = await supabase.from("category_products").select("*").order("id", { ascending: true });
      }

      const [prodRes, ordRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("product_orders").select("product_id, order_num, banner").order("order_num", { ascending: true }),
      ]);

      if (catRes.error || prodRes.error || catProdRes.error || ordRes.error) {
        const isTableNotFound =
          catRes.error?.code === "PGRST205" ||
          prodRes.error?.code === "PGRST205" ||
          catProdRes.error?.code === "PGRST205" ||
          ordRes.error?.code === "PGRST205";

        if (isTableNotFound) {
          console.warn(
            "⚠️ Chưa tìm thấy bảng dữ liệu trên Supabase (Mã PGRST205). Vui lòng vào Supabase SQL Editor và chạy file 'supabase-schema.sql' để khởi tạo bảng."
          );
        } else {
          console.error("Supabase fetch error:", {
            categories: catRes.error,
            products: prodRes.error,
            categoryProducts: catProdRes.error,
            orders: ordRes.error,
          });
        }
        setSupabaseStatus("error");
        return false;
      }

      // Map records directly from Supabase Cloud
      const dbCategories = (catRes.data as unknown as DbCategoryRow[]) || [];
      const dbProducts = (prodRes.data as unknown as DbProductRow[]) || [];
      const dbCatProducts = (catProdRes.data as unknown as DbCategoryProductRow[]) || [];
      const dbOrders = (ordRes.data as unknown as DbProductOrderRow[]) || [];

      const loadedProducts = dbProducts.map(mapDbProduct);
      const loadedCategories = dbCategories
        .map(mapDbCategory)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      const loadedCatProducts: CategoryProductMapping[] = dbCatProducts.map((cp, idx) => ({
        categoryId: String(cp.category_id).trim(),
        productId: String(cp.product_id).trim(),
        order: typeof cp.order_num === "number" ? cp.order_num : (typeof cp.id === "number" ? cp.id : idx + 1),
      }));
      const loadedOrders: ProductOrder[] = dbOrders.map((o) => ({
        productId: String(o.product_id).trim(),
        order: Number(o.order_num) || 0,
        banner: o.banner ? String(o.banner).toLowerCase().trim() : "featured",
      }));

      setProducts(loadedProducts);
      setCategories(loadedCategories);
      setCategoryProductsState(loadedCatProducts);
      setOrders(loadedOrders);
      setSupabaseStatus("connected");
      return true;
    } catch (err) {
      console.error("Failed to connect to Supabase", err);
      setSupabaseStatus("error");
      return false;
    }
  }, []);

  // Initial Load
  useEffect(() => {
    let isMounted = true;

    // Purge any legacy localStorage keys to keep browser clean
    try {
      const keysToClean = [
        "japan_shop_products", "japan_shop_products_v2", "japan_shop_products_v3", "japan_shop_products_v4", "japan_shop_products_v5", "japan_shop_products_v6",
        "japan_shop_categories", "japan_shop_categories_v2", "japan_shop_categories_v3", "japan_shop_categories_v4", "japan_shop_categories_v5", "japan_shop_categories_v6",
        "japan_shop_category_products", "japan_shop_category_products_v2", "japan_shop_category_products_v3", "japan_shop_category_products_v4", "japan_shop_category_products_v5", "japan_shop_category_products_v6",
        "japan_shop_order", "japan_shop_order_v2", "japan_shop_order_v3", "japan_shop_order_v4", "japan_shop_order_v5", "japan_shop_order_v6",
      ];
      keysToClean.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }

    async function init() {
      if (isSupabaseConfigured()) {
        await fetchDataFromSupabase();
      } else {
        if (isMounted) {
          setSupabaseStatus("not_configured");
        }
      }

      if (isMounted) {
        setIsLoaded(true);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [fetchDataFromSupabase]);

  // --- Seed Initial Data to Supabase ---
  const seedInitialDataToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    if (!supabase || !isSupabaseConfigured()) {
      return { success: false, message: "Chưa cấu hình Supabase URL và Anon Key trong .env" };
    }

    try {
      setSupabaseStatus("loading");

      // 1. Categories
      const categoriesToInsert = DEFAULT_CATEGORIES.map(mapCategoryToDb);
      const { error: catErr } = await supabase.from("categories").upsert(categoriesToInsert, { onConflict: "id" });
      if (catErr) throw new Error(`Lỗi danh mục: ${catErr.message}`);

      // 2. Products
      const productsToInsert = DEFAULT_PRODUCTS.map(mapProductToDb);
      const { error: prodErr } = await supabase.from("products").upsert(productsToInsert, { onConflict: "id" });
      if (prodErr) throw new Error(`Lỗi sản phẩm: ${prodErr.message}`);

      // 3. Category Products
      const catProdToInsert = DEFAULT_CATEGORY_PRODUCTS.map((cp) => ({
        category_id: String(cp.categoryId).trim(),
        product_id: String(cp.productId).trim(),
      }));
      // Clear old mappings to avoid duplicates
      try {
        await supabase.from("category_products").delete().gte("id", 0);
      } catch {
        // ignore
      }
      const { error: cpErr } = await supabase.from("category_products").insert(catProdToInsert);
      if (cpErr) {
        await supabase.from("category_products").upsert(catProdToInsert, { onConflict: "category_id,product_id" });
      }

      // 4. Orders
      const ordersToInsert = DEFAULT_ORDER.map((o) => ({
        product_id: String(o.productId).trim(),
        order_num: Number(o.order),
        banner: o.banner ? String(o.banner).toLowerCase().trim() : "featured",
      }));
      try {
        await supabase.from("product_orders").delete().gte("id", 0);
      } catch {
        // ignore
      }
      const { error: ordErr } = await supabase.from("product_orders").insert(ordersToInsert);
      if (ordErr) {
        await supabase.from("product_orders").upsert(ordersToInsert, { onConflict: "product_id,banner" });
      }

      await fetchDataFromSupabase();
      setSupabaseStatus("connected");
      return { success: true, message: `Đồng bộ thành công ${DEFAULT_PRODUCTS.length} sản phẩm và ${DEFAULT_CATEGORIES.length} danh mục lên Supabase!` };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setSupabaseStatus("error");
      return { success: false, message: `Thất bại: ${errorMsg}` };
    }
  };

  const refreshFromSupabase = async () => {
    await fetchDataFromSupabase();
  };

  // --- Product CRUD with Supabase sync ---
  const addProduct = async (item: Omit<Product, "id"> & { id?: string; order?: number; categoryId?: string }) => {
    const nextId = item.id?.trim() || String(Date.now());
    const images = Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : [];
    const newProduct: Product = {
      id: nextId,
      name: item.name,
      description: item.description,
      images,
      imageBg: item.imageBg,
      price: item.price,
      oldPrice: item.oldPrice,
      rating: item.rating ?? 5.0,
      reviews: item.reviews ?? 0,
      tag: item.tag,
      stock: item.stock,
      ingredients: item.ingredients,
    };

    const newProducts = [...products, newProduct];
    let newCategoryProducts = [...categoryProducts];

    if (item.categoryId) {
      newCategoryProducts = [...newCategoryProducts, { categoryId: item.categoryId, productId: nextId }];
    }

    setProducts(newProducts);
    setCategoryProductsState(newCategoryProducts);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from("products").insert(mapProductToDb(newProduct));
        if (item.categoryId) {
          await supabase.from("category_products").insert({ category_id: item.categoryId, product_id: nextId });
        }
      } catch (err) {
        console.error("Failed to add product to Supabase", err);
      }
    }
  };

  const updateProduct = async (id: string, updated: Partial<Product> & { order?: number; categoryId?: string }) => {
    const updatedProducts = products.map((p) => (p.id === id ? { ...p, ...updated } : p));
    let updatedCategoryProducts = [...categoryProducts];

    if (updated.categoryId !== undefined) {
      updatedCategoryProducts = updatedCategoryProducts.filter((cp) => cp.productId !== id);
      if (updated.categoryId) {
        updatedCategoryProducts.push({ categoryId: updated.categoryId, productId: id });
      }
    }

    setProducts(updatedProducts);
    setCategoryProductsState(updatedCategoryProducts);

    if (supabase && isSupabaseConfigured()) {
      try {
        const fullProduct = updatedProducts.find((p) => p.id === id);
        if (fullProduct) {
          await supabase.from("products").update(mapProductToDb(fullProduct)).eq("id", id);
        }
        if (updated.categoryId !== undefined) {
          await supabase.from("category_products").delete().eq("product_id", id);
          if (updated.categoryId) {
            await supabase.from("category_products").insert({ category_id: updated.categoryId, product_id: id });
          }
        }
      } catch (err) {
        console.error("Failed to update product in Supabase", err);
      }
    }
  };

  const deleteProduct = async (id: string) => {
    const newProducts = products.filter((p) => p.id !== id);
    const newOrders = orders.filter((o) => o.productId !== id);
    const newCategoryProducts = categoryProducts.filter((cp) => cp.productId !== id);

    setProducts(newProducts);
    setOrders(newOrders);
    setCategoryProductsState(newCategoryProducts);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from("products").delete().eq("id", id);
        await supabase.from("category_products").delete().eq("product_id", id);
        await supabase.from("product_orders").delete().eq("product_id", id);
      } catch (err) {
        console.error("Failed to delete product in Supabase", err);
      }
    }
  };

  const updateProductOrder = async (productId: string, newOrder: number, banner: string = "featured") => {
    const existing = orders.find((o) => o.productId === productId && (o.banner || "featured") === banner);
    let newOrders: ProductOrder[];
    if (existing) {
      newOrders = orders.map((o) =>
        o.productId === productId && (o.banner || "featured") === banner
          ? { ...o, order: newOrder, banner }
          : o
      );
    } else {
      newOrders = [...orders, { productId, order: newOrder, banner }];
    }

    setOrders(newOrders);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from("product_orders").upsert({
          product_id: productId,
          order_num: newOrder,
          banner,
        });
      } catch (err) {
        console.error("Failed to update order in Supabase", err);
      }
    }
  };

  const setBannerProducts = async (banner: string, productIds: string[]) => {
    const targetBanner = banner.toLowerCase().trim();
    // Featured banner strictly stores maximum 10 products
    const finalIds = targetBanner === "featured"
      ? productIds.slice(0, 10)
      : productIds;

    const remainingOrders = orders.filter((o) => {
      const b = (o.banner || "featured").toLowerCase().trim();
      return b !== targetBanner && !(targetBanner === "featured" && (b === "featured"));
    });

    const newBannerOrders: ProductOrder[] = finalIds.map((pId, idx) => ({
      productId: String(pId).trim(),
      order: idx + 1,
      banner: targetBanner,
    }));

    const updatedOrders = [...remainingOrders, ...newBannerOrders];
    setOrders(updatedOrders);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from("product_orders").delete().eq("banner", targetBanner);
        if (targetBanner === "featured") {
          await supabase.from("product_orders").delete().eq("banner", "featured");
        }
        if (newBannerOrders.length > 0) {
          await supabase.from("product_orders").insert(
            newBannerOrders.map((o) => ({
              product_id: o.productId,
              order_num: o.order,
              banner: o.banner,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to sync banner products in Supabase", err);
      }
    }
  };

  const toggleFeatured = async (productId: string, isFeatured: boolean, defaultTag = "Bán chạy") => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    if (isFeatured) {
      await updateProduct(productId, { tag: target.tag || defaultTag });
    } else {
      await updateProduct(productId, { tag: undefined });
    }
  };

  const moveProductOrder = async (productId: string, direction: "up" | "down", banner: string = "featured") => {
    const currentBannerProducts = getProductsByBanner(banner);
    const currentIndex = currentBannerProducts.findIndex((p) => p.id === productId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentBannerProducts.length) return;

    const otherProduct = currentBannerProducts[targetIndex];
    const bannerOrders = orders.filter((o) => (o.banner || "featured") === banner);
    const orderMap = new Map<string, number>(bannerOrders.map((o) => [o.productId, o.order]));

    const currentOrder = orderMap.get(productId) ?? currentIndex + 1;
    const otherOrder = orderMap.get(otherProduct.id) ?? targetIndex + 1;

    let newOrders = [...orders];
    newOrders = newOrders.map((o) => {
      if (o.productId === productId && (o.banner || "featured") === banner) return { ...o, order: otherOrder };
      if (o.productId === otherProduct.id && (o.banner || "featured") === banner) return { ...o, order: currentOrder };
      return o;
    });

    setOrders(newOrders);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from("product_orders").upsert([
          { product_id: productId, order_num: otherOrder, banner },
          { product_id: otherProduct.id, order_num: currentOrder, banner },
        ]);
      } catch (err) {
        console.error("Failed to update move order in Supabase", err);
      }
    }
  };

  // --- Category CRUD with Supabase sync ---
  const sortCategories = (cats: Category[]) =>
    [...cats].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    });

  const addCategory = async (category: Category) => {
    const newCategories = sortCategories([...categories, category]);
    setCategories(newCategories);

    if (supabase && isSupabaseConfigured()) {
      try {
        const row = mapCategoryToDb(category);
        const { error } = await supabase.from("categories").insert(row);
        if (error && error.message && error.message.includes("order_num")) {
          const { order_num, ...rest } = row;
          await supabase.from("categories").insert(rest);
        }
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
            const { order_num, ...rest } = row;
            await supabase.from("categories").update(rest).eq("id", id);
          }
        }
      } catch (err) {
        console.error("Failed to update category in Supabase", err);
      }
    }
  };

  const moveCategoryOrder = async (categoryId: string, direction: "up" | "down") => {
    const currentIndex = categories.findIndex((c) => c.id === categoryId);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCats = [...categories];
    const [moved] = newCats.splice(currentIndex, 1);
    newCats.splice(targetIndex, 0, moved);

    // Re-assign order 1..N
    const updated = newCats.map((c, idx) => ({ ...c, order: idx + 1 }));
    setCategories(updated);

    if (supabase && isSupabaseConfigured()) {
      const client = supabase;
      try {
        await Promise.all(
          updated.map((c) =>
            client.from("categories").update({ order_num: c.order }).eq("id", c.id)
          )
        );
      } catch (err) {
        console.error("Failed to reorder categories in Supabase", err);
      }
    }
  };

  const deleteCategory = async (id: string) => {
    const newCategories = categories.filter((cat) => cat.id !== id);
    const newCategoryProducts = categoryProducts.filter((cp) => cp.categoryId !== id);

    setCategories(newCategories);
    setCategoryProductsState(newCategoryProducts);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from("categories").delete().eq("id", id);
        await supabase.from("category_products").delete().eq("category_id", id);
      } catch (err) {
        console.error("Failed to delete category in Supabase", err);
      }
    }
  };

  // --- Category-Product Mappings ---
  const getProductsByCategoryId = useCallback(
    (categoryId: string) => {
      const targetId = categoryId.toLowerCase().trim();
      const normalizeId = (val: string) =>
        val.toLowerCase().trim().replace(/^c-0?/, "").replace(/^0+/, "");
      const targetNum = normalizeId(categoryId);

      const matchedMappings = categoryProducts
        .filter(
          (cp) =>
            cp.categoryId.toLowerCase().trim() === targetId ||
            normalizeId(cp.categoryId) === targetNum
        )
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

      const productMap = new Map(products.map((p) => [String(p.id).trim(), p]));
      const result: Product[] = [];
      for (const cp of matchedMappings) {
        const prod = productMap.get(String(cp.productId).trim());
        if (prod) {
          result.push(prod);
        }
      }
      return result;
    },
    [categoryProducts, products]
  );

  const getCategoryIdByProductId = useCallback(
    (productId: string) => {
      const targetId = String(productId).trim();
      const match = categoryProducts.find(
        (cp) => String(cp.productId).trim() === targetId
      );
      return match?.categoryId;
    },
    [categoryProducts]
  );

  const setCategoryProducts = async (categoryId: string, productIds: string[]) => {
    const targetId = categoryId.trim();
    const remaining = categoryProducts.filter((cp) => cp.categoryId !== targetId);
    const newMappings: CategoryProductMapping[] = productIds.map((pId, idx) => ({
      categoryId: targetId,
      productId: pId,
      order: idx + 1,
    }));

    const updated = [...remaining, ...newMappings];
    setCategoryProductsState(updated);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from("category_products").delete().eq("category_id", targetId);
        if (newMappings.length > 0) {
          try {
            await supabase.from("category_products").insert(
              newMappings.map((m) => ({ category_id: m.categoryId, product_id: m.productId, order_num: m.order }))
            );
          } catch (insertErr: unknown) {
            const msg = insertErr instanceof Error ? insertErr.message : String(insertErr);
            if (msg.includes("order_num")) {
              await supabase.from("category_products").insert(
                newMappings.map((m) => ({ category_id: m.categoryId, product_id: m.productId }))
              );
            } else {
              throw insertErr;
            }
          }
        }
      } catch (err) {
        console.error("Failed to set category products in Supabase", err);
      }
    }
  };

  const assignProductToCategory = async (productId: string, categoryId: string, order?: number) => {
    const exists = categoryProducts.some(
      (cp) => String(cp.productId).trim() === String(productId).trim() && cp.categoryId === categoryId
    );
    if (!exists) {
      const existingInCat = categoryProducts.filter((cp) => cp.categoryId === categoryId);
      const nextOrder = typeof order === "number" ? order : existingInCat.length + 1;
      const updated = [...categoryProducts, { categoryId, productId, order: nextOrder }];
      setCategoryProductsState(updated);

      if (supabase && isSupabaseConfigured()) {
        try {
          try {
            await supabase.from("category_products").insert({ category_id: categoryId, product_id: productId, order_num: nextOrder });
          } catch (insertErr: unknown) {
            const msg = insertErr instanceof Error ? insertErr.message : String(insertErr);
            if (msg.includes("order_num")) {
              await supabase.from("category_products").insert({ category_id: categoryId, product_id: productId });
            } else {
              throw insertErr;
            }
          }
        } catch (err) {
          console.error("Failed to assign product category in Supabase", err);
        }
      }
    }
  };

  const moveCategoryProductOrder = async (
    categoryId: string,
    productId: string,
    direction: "up" | "down"
  ) => {
    const targetCatId = categoryId.trim();
    const targetProdId = String(productId).trim();

    const catProds = categoryProducts
      .filter((cp) => cp.categoryId === targetCatId)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    const index = catProds.findIndex((cp) => String(cp.productId).trim() === targetProdId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === catProds.length - 1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const currentItem = catProds[index];
    const swapItem = catProds[swapIndex];

    const currentOrder = currentItem.order ?? index + 1;
    const swapOrder = swapItem.order ?? swapIndex + 1;

    const newCurrentOrder = currentOrder === swapOrder ? (direction === "up" ? swapOrder - 1 : swapOrder + 1) : swapOrder;
    const newSwapOrder = currentOrder === swapOrder ? currentOrder : currentOrder;

    const newMappings = categoryProducts.map((cp) => {
      if (cp.categoryId === targetCatId && String(cp.productId).trim() === String(currentItem.productId).trim()) {
        return { ...cp, order: newCurrentOrder };
      }
      if (cp.categoryId === targetCatId && String(cp.productId).trim() === String(swapItem.productId).trim()) {
        return { ...cp, order: newSwapOrder };
      }
      return cp;
    });

    setCategoryProductsState(newMappings);

    if (supabase && isSupabaseConfigured()) {
      try {
        try {
          await supabase
            .from("category_products")
            .update({ order_num: newCurrentOrder })
            .match({ category_id: targetCatId, product_id: currentItem.productId });
          await supabase
            .from("category_products")
            .update({ order_num: newSwapOrder })
            .match({ category_id: targetCatId, product_id: swapItem.productId });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("order_num")) throw err;
        }
      } catch (err) {
        console.error("Failed to update category product order in Supabase", err);
      }
    }
  };

  const updateCategoryProductOrder = async (
    categoryId: string,
    productId: string,
    newOrder: number
  ) => {
    const targetCatId = categoryId.trim();
    const targetProdId = String(productId).trim();

    const newMappings = categoryProducts.map((cp) => {
      if (cp.categoryId === targetCatId && String(cp.productId).trim() === targetProdId) {
        return { ...cp, order: newOrder };
      }
      return cp;
    });

    setCategoryProductsState(newMappings);

    if (supabase && isSupabaseConfigured()) {
      try {
        try {
          await supabase
            .from("category_products")
            .update({ order_num: newOrder })
            .match({ category_id: targetCatId, product_id: targetProdId });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("order_num")) throw err;
        }
      } catch (err) {
        console.error("Failed to update category product order in Supabase", err);
      }
    }
  };

  const removeProductFromCategory = async (productId: string, categoryId: string) => {
    const updated = categoryProducts.filter(
      (cp) => !(cp.productId === productId && cp.categoryId === categoryId)
    );
    setCategoryProductsState(updated);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from("category_products").delete().match({ category_id: categoryId, product_id: productId });
      } catch (err) {
        console.error("Failed to remove product from category in Supabase", err);
      }
    }
  };

  // --- JSON Import/Export ---
  const exportJSON = () => JSON.stringify(products, null, 2);

  const importJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) return false;
      const newOrders: ProductOrder[] = parsed.map((p: Product, idx: number) => ({
        productId: String(p.id),
        order: idx + 1,
      }));
      setProducts(parsed);
      setOrders(newOrders);
      return true;
    } catch {
      return false;
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

  const exportCategoryProductsJSON = () => JSON.stringify(categoryProducts, null, 2);

  const importCategoryProductsJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) return false;
      setCategoryProductsState(parsed);
      return true;
    } catch {
      return false;
    }
  };

  // --- Selectors ---
  const getProductById = useCallback(
    (id: string) => {
      const targetId = String(id).trim().toLowerCase();
      return products.find(
        (p) => String(p.id).trim().toLowerCase() === targetId
      );
    },
    [products]
  );

  const getProductsByBanner = useCallback(
    (bannerName: string, limit?: number): Product[] => {
      const target = bannerName.toLowerCase().trim();
      const bannerOrders = orders.filter((o) => {
        const b = (o.banner || "featured").toLowerCase().trim();
        return (
          b === target ||
          (target === "featured" && (b === "featured")) ||
          (target === "discount" && (b === "discount"))
        );
      });

      const orderMap = new Map<string, number>(
        bannerOrders.map((o) => [String(o.productId).trim(), Number(o.order)])
      );

      const bannerProducts = products
        .filter((p) => orderMap.has(String(p.id).trim()))
        .sort((a, b) => {
          const orderA =
            orderMap.get(String(a.id).trim()) ?? Number.MAX_SAFE_INTEGER;
          const orderB =
            orderMap.get(String(b.id).trim()) ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });

      if (bannerProducts.length > 0) {
        return limit ? bannerProducts.slice(0, limit) : bannerProducts;
      }

      // Fallbacks
      if (target === "featured") {
        return [...products]
          .sort((a, b) => (b.rating || 5) - (a.rating || 5))
          .slice(0, limit || 10);
      }

      if (target === "discount") {
        return [...products]
          .filter((p) => p.oldPrice && p.oldPrice > p.price)
          .slice(0, limit || 10);
      }

      return [];
    },
    [orders, products]
  );

  const getFeaturedProducts = useCallback(
    (limit?: number) => {
      return getProductsByBanner("featured", limit);
    },
    [getProductsByBanner]
  );

  const getDiscountedProducts = useCallback(
    (limit?: number) => {
      return getProductsByBanner("discount", limit);
    },
    [getProductsByBanner]
  );

  return (
    <ProductDataContext.Provider
      value={{
        products,
        categories,
        categoryProducts,
        orders,
        isLoaded,
        supabaseStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductOrder,
        toggleFeatured,
        moveProductOrder,
        exportJSON,
        importJSON,
        addCategory,
        updateCategory,
        deleteCategory,
        moveCategoryOrder,
        exportCategoriesJSON,
        importCategoriesJSON,
        getProductsByCategoryId,
        getCategoryIdByProductId,
        setCategoryProducts,
        assignProductToCategory,
        removeProductFromCategory,
        moveCategoryProductOrder,
        updateCategoryProductOrder,
        exportCategoryProductsJSON,
        importCategoryProductsJSON,
        getProductById,
        getProductsByBanner,
        getFeaturedProducts,
        getDiscountedProducts,
        setBannerProducts,
        seedInitialDataToSupabase,
        refreshFromSupabase,
      }}
    >
      {children}
    </ProductDataContext.Provider>
  );
}

export function useProductData() {
  const context = useContext(ProductDataContext);
  if (!context) {
    throw new Error("useProductData must be used within a ProductDataProvider");
  }
  return context;
}
