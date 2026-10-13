import { MetadataRoute } from "next";
import { getSiteUrl } from "@/utils/siteUrl";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/admin", "/cart", "/search"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
