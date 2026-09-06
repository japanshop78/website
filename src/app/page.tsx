import FeaturedProductsSection from "@/components/features/FeaturedProductsSection";
import DiscountedProductsSection from "@/components/features/DiscountedProductsSection";

export default function Home() {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      {/* Discounted Products */}
      <DiscountedProductsSection />

      {/* Featured Products */}
      <FeaturedProductsSection />

    </div>
  );
}

