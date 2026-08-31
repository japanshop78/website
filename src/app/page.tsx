import FeaturedProductsSection from "@/components/features/FeaturedProductsSection";
import DiscountedProductsSection from "@/components/features/DiscountedProductsSection";

export default function Home() {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      {/* Featured Products */}
      <FeaturedProductsSection />

      {/* Discounted Products */}
      <DiscountedProductsSection />

      {/* CTA Section */}
      <section className="bg-zinc-50 dark:bg-zinc-950 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden bg-zinc-900 dark:bg-zinc-900 px-6 py-20 shadow-2xl rounded-3xl sm:px-12 md:py-24 lg:flex lg:items-center lg:gap-x-20 lg:px-24">
            <div className="mx-auto max-w-md lg:mx-0 lg:flex-auto">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Đăng ký nhận tin. <br />Nhận ngay ưu đãi 10%.
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-300">
                Đừng bỏ lỡ các đợt giảm giá lớn, bộ sưu tập giới hạn và mẹo mua sắm độc quyền từ chúng tôi.
              </p>
              <form className="mt-10 flex max-w-md gap-x-4">
                <input
                  type="email"
                  required
                  placeholder="Nhập email của bạn"
                  className="min-w-0 flex-auto rounded-full border-0 bg-white/5 px-4 py-2.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                />
                <button
                  type="submit"
                  className="flex-none rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
                >
                  Đăng ký
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

