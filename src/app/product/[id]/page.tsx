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
      title: "Sản phẩm - Japan Shop",
    };
  }

  return {
    title: `${product.name} - Japan Shop`,
    description: product.description,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const product = await productService.getProductById(id);

  if (!product) return <ProductNotFound />;

  return <ProductDetailPage product={product} related={[]} />;
}

