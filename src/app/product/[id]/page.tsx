import { productService } from "@/services/productService";
import type { Metadata } from "next";
import ProductDetailPage from "./ProductDetailPage";
import ProductNotFound from "./not-found";

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

  if (!product) {
    return {
      title: "Sản phẩm không tìm thấy - Japan Shop",
      description: "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh tại Japan Shop.",
    };
  }

  const primaryImage = product.images?.[0]
    ? (product.images[0].startsWith("http")
        ? product.images[0]
        : `https://japanshop.vn${product.images[0]}`)
    : "https://japanshop.vn/logo.jpg";

  const description = product.description
    ? product.description.slice(0, 160)
    : "Hàng nội địa Nhật Bản chính hãng, cam kết chất lượng 100%.";

  return {
    title: `${product.name} - Japan Shop`,
    description,
    openGraph: {
      title: `${product.name} - Japan Shop`,
      description,
      url: `https://japanshop.vn/product/${product.id}`,
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

  if (!product) return <ProductNotFound />;

  return <ProductDetailPage product={product} related={[]} />;
}

