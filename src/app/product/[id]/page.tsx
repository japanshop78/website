import { productService } from "@/services/productService";
import type { Metadata } from "next";
import ProductDetailPage from "./ProductDetailPage";
import ProductNotFound from "./not-found";
import { getSiteUrl } from "@/utils/siteUrl";

export const dynamicParams = false;

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  const ids = new Set<string>();

  // Pre-generate range 1 to 200 for static export slots
  for (let i = 1; i <= 200; i++) {
    ids.add(String(i));
  }

  return Array.from(ids).map((id) => ({
    id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await productService.getProductById(id);
  const baseUrl = getSiteUrl();

  if (!product) {
    return {
      title: "Sản phẩm không tìm thấy - Japan Shop",
      description: "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh tại Japan Shop.",
    };
  }

  const primaryImage = product.images?.[0]
    ? (product.images[0].startsWith("http")
        ? product.images[0]
        : `${baseUrl}${product.images[0]}`)
    : `${baseUrl}/logo.jpg`;

  const description = product.description
    ? product.description.slice(0, 160)
    : "Hàng nội địa Nhật Bản chính hãng, cam kết chất lượng 100%.";

  return {
    title: `${product.name} - Japan Shop`,
    description,
    openGraph: {
      title: `${product.name} - Japan Shop`,
      description,
      url: `${baseUrl}/product/${product.id}`,
      siteName: "Japan Shop",
      locale: "vi_VN",
      type: "website",
      images: [
        {
          url: primaryImage,
          width: 600,
          height: 600,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [primaryImage],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const product = await productService.getProductById(id);
  const baseUrl = getSiteUrl();

  if (!product) return <ProductNotFound />;

  const imageUrls = product.images && product.images.length > 0
    ? product.images.map((img) => (img.startsWith("http") ? img : `${baseUrl}${img}`))
    : [`${baseUrl}/logo.jpg`];

  // Schema Product (Lưu ý: Không bao gồm tình trạng còn hàng theo yêu cầu)
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: imageUrls,
    description: product.description || product.name,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "VND",
      url: `${baseUrl}/product/${product.id}`,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating || 5,
      reviewCount: product.reviews || 1,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.name,
        item: `${baseUrl}/product/${product.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailPage product={product} related={[]} />
    </>
  );
}
