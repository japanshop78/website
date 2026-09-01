import { categoryService } from "@/services/categoryService";
import type { Metadata } from "next";
import CategoryDetailPage from "./CategoryDetailPage";
import CategoryNotFound from "./not-found";

export const dynamicParams = false;

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  const ids = new Set<string>();

  // Add standard IDs C-01 to C-20
  for (let i = 1; i <= 20; i++) {
    const padded = i < 10 ? `0${i}` : `${i}`;
    ids.add(`C-${padded}`);
  }

  return Array.from(ids).map((id) => ({
    id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const category = await categoryService.getCategoryById(id);

  if (!category) {
    return {
      title: "Danh mục - Japan Shop",
    };
  }

  return {
    title: `${category.name} - Japan Shop`,
    description: category.description,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const category = (await categoryService.getCategoryById(id));

  if (!category) {
    return <CategoryNotFound />;
  }

  const products = await categoryService.getProductsByCategoryId(category.id);
  const stats = await categoryService.getCategoryStats(category.id);
  const allCategories = await categoryService.getCategories();

  return (
    <CategoryDetailPage
      category={category}
      products={products}
      stats={stats}
      allCategories={allCategories}
    />
  );
}

