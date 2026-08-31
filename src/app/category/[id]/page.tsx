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

  // Add all primary category IDs
  categories.forEach((category) => {
    if (category.id) {
      ids.add(category.id);
      ids.add(category.id.toLowerCase());
      const numOnly = category.id.replace(/^C-0?/i, "").replace(/^0+/, "");
      if (numOnly) ids.add(numOnly);
    }
  });

  // Add standard IDs C-01 to C-20 and 1 to 20
  for (let i = 1; i <= 20; i++) {
    const padded = i < 10 ? `0${i}` : `${i}`;
    ids.add(`C-${padded}`);
    ids.add(`c-${padded}`);
    ids.add(String(i));
  }

  // Common aliases for safety
  const aliases = [
    "cham-soc-rang-mieng",
    "thuc-pham-bo-sung",
    "cham-soc-me-va-be",
    "cham-soc-mat",
    "me-va-be",
    "tpcn",
  ];
  aliases.forEach((a) => ids.add(a));

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
