import Link from "next/link";
import Image from "next/image";
import LocationIcon from "./icons/LocationIcon";
import PhoneIcon from "./icons/PhoneIcon";
import MailIcon from "./icons/MailIcon";
import { categoryService } from "@/services/categoryService";
import { getAssetPath } from "@/utils/assetPath";

export default function Footer() {
  const categories = categoryService.getAllCategories();

  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-50 py-12 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
          {/* Logo & Intro */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-zinc-900 dark:text-white mb-4">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <Image
                  src={getAssetPath("/logo.jpg")}
                  alt="Japan Shop Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span>Japan Shop</span>
            </Link>
            <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400 leading-6">
              Chúng tôi cung cấp các sản phẩm nội địa Nhật Bản chất lượng cao 100% chính hãng với dịch vụ khách hàng tốt nhất. Trải nghiệm mua sắm tuyệt vời cùng Japan Shop.
            </p>
          </div>

          {/* Categories Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">
              Danh mục
            </h3>
            <ul className="space-y-2">
              {categories.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/category/${item.id}`}
                    className="text-sm text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">
              Liên hệ
            </h3>
            <ul className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <LocationIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                <span>1017/26/18 Lê Văn Lương (90A đường B7, khu B, làng đại học), Ấp 3, Nhà Bè, Hồ Chí Minh, Vietnam</span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                <a href="tel:0902493895" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  0902493895
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                <a href="mailto:japanshop.tuyan78@gmail.com" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  japanshop.tuyan78@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
          <p>© {new Date().getFullYear()} Japan Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
