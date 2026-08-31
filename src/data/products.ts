import rawProducts from "./products.json";

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  imageBg?: string; // Tailwind gradient background
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  tag?: string;
  stock: number;
  ingredients?: string;
}

export const PRODUCTS: Product[] = rawProducts as unknown as Product[];