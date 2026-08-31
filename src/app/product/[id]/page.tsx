import { productService } from "@/services/productService";
import { CATEGORY_PRODUCTS } from "@/data/categoryProducts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailPage from "./ProductDetailPage";

export const dynamicParams = false;

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  const products = productService.getAllProducts();
  const ids = new Set<string>();

  products.forEach((p) => {
    if (p.id) ids.add(p.id);
  });

  // Pre-generate range 1 to 200 for safety with static export
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
      title: "Sản phẩm không tồn tại - Japan Shop",
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

  if (!product) {
    notFound();
  }

  const mapping = CATEGORY_PRODUCTS.find((cp) => cp.productId === product.id);
  const related = mapping
    ? productService
        .getProductsByCategoryId(mapping.categoryId)
        .filter((p) => p.id !== product.id)
        .slice(0, 4)
    : [];

  return <ProductDetailPage product={product} related={related} />;
}
