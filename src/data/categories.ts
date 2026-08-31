import rawCategories from "./categories.json";

export interface Category {
  id: string;
  name: string;
  description: string;
  bannerGradient: string;
  badgeColor: string;
  iconName: "ToothIcon" | "PillIcon" | "HeartIcon" | "EyeIcon" | "DropIcon" | "ShirtIcon" | "DeviceIcon" | "HomeIcon" | "SparklesIcon";
  itemCountText: string;
  subcategories?: string[];
}

export const CATEGORIES: Category[] = rawCategories as unknown as Category[];
