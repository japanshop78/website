import { categoryService } from "@/services/categoryService";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CategoryDetailPage from "./CategoryDetailPage";

export const dynamicParams = false;

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  const categories = categoryService.getAllCategories();
  const ids = new Set<string>();

  // Add all primary category IDs (standard uppercase e.g. C-01, C-02...)
  categories.forEach((category) => {
    if (category.id) {
      ids.add(category.id.toUpperCase());
    }
  });

  // Add standard IDs C-01 to C-10
  for (let i = 1; i <= 10; i++) {
    const padded = i < 10 ? `0${i}` : `${i}`;
    ids.add(`C-${padded}`);
  }

  return Array.from(ids).map((id) => ({
    id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const category = categoryService.getCategoryById(id);

  if (!category) {
    return {
      title: "Danh mục không tồn tại - Japan Shop",
    };
  }

  return {
    title: `${category.name} - Japan Shop`,
    description: category.description,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const category = categoryService.getCategoryById(id);

  if (!category) {
    notFound();
  }

  const products = categoryService.getProductsByCategoryId(category.id);
  const stats = categoryService.getCategoryStats(category.id);
  const allCategories = categoryService.getAllCategories();

  return (
    <CategoryDetailPage
      category={category}
      products={products}
      stats={stats}
      allCategories={allCategories}
    />
  );
}
