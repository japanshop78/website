import { MetadataRoute } from "next";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import { getSiteUrl } from "@/utils/siteUrl";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const currentDate = new Date().toISOString();

  // 1. Static routes (Chỉ đưa các trang nội dung tĩnh có giá trị SEO)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // 2. Category routes
  let rawCategories = await categoryService.getCategories().catch(() => []);
  if (!rawCategories || rawCategories.length === 0) {
    rawCategories = CATEGORIES;
  }
  const categoryRoutes: MetadataRoute.Sitemap = rawCategories.map((category) => ({
    url: `${baseUrl}/category/${category.id}`,
    lastModified: currentDate,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  // 3. Product routes (lập chỉ mục các sản phẩm đang hiển thị và có dữ liệu hợp lệ)
  let rawProducts = await productService.getProducts().catch(() => []);
  if (!rawProducts || rawProducts.length === 0) {
    rawProducts = PRODUCTS;
  }
  const productRoutes: MetadataRoute.Sitemap = rawProducts
    .filter(
      (product) =>
        product.visible !== false &&
        product.id &&
        product.name &&
        !product.name.includes("Bản nháp")
    )
    .map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}

