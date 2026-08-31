import rawCategoryProducts from "./category_products.json";

export interface CategoryProductMapping {
  categoryId: string;
  productId: string;
}

export const CATEGORY_PRODUCTS: CategoryProductMapping[] = rawCategoryProducts as CategoryProductMapping[];
