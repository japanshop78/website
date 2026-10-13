import { MetadataRoute } from "next";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import { getSiteUrl } from "@/utils/siteUrl";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const currentDate = new Date().toISOString();

  // 1. Static routes (Chỉ đưa các trang nội dung tĩnh có giá trị SEO, loại bỏ /cart và /search theo chuẩn Google)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    // {
    //   url: `${baseUrl}/chinh-sach-doi-tra`,
    //   lastModified: currentDate,
    //   changeFrequency: "monthly",
    //   priority: 0.5,
    // },
    // {
    //   url: `${baseUrl}/chinh-sach-van-chuyen`,
    //   lastModified: currentDate,
    //   changeFrequency: "monthly",
    //   priority: 0.5,
    // },
    // {
    //   url: `${baseUrl}/chinh-sach-bao-mat`,
    //   lastModified: currentDate,
    //   changeFrequency: "monthly",
    //   priority: 0.5,
    // },
  ];

  // 2. Category routes (C-01 to C-05)
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${baseUrl}/category/${category.id}`,
    lastModified: currentDate,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  // 3. Product routes (chỉ lập chỉ mục các sản phẩm đang hiển thị và có dữ liệu hợp lệ)
  const productRoutes: MetadataRoute.Sitemap = PRODUCTS.filter(
    (product) =>
      product.visible !== false &&
      product.id &&
      product.name &&
      !product.name.includes("Bản nháp")
  ).map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: currentDate,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
