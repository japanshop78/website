"use client";

import Link from "next/link";
import Image from "next/image";
import LocationIcon from "./icons/LocationIcon";
import PhoneIcon from "./icons/PhoneIcon";
import MailIcon from "./icons/MailIcon";
import { useProductData } from "@/context/ProductDataContext";
import { getAssetPath } from "@/utils/assetPath";

export default function Footer() {
  const { categories } = useProductData();

  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-50 py-12 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12 items-start">
          {/* Logo & Intro */}
          <div className="lg:col-span-4">
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
            <p className="max-w-sm text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Cam kết 100% sản phẩm chính hãng nội địa Nhật. Trải nghiệm mua sắm uy tín và dịch vụ chăm sóc khách hàng tận tâm nhất.
            </p>
          </div>

          {/* Categories Quick Links */}
          <div className="lg:col-span-3">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">
              Danh mục
            </h3>
            <ul className="space-y-2.5">
              {categories.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/category/${item.id}`}
                    className="text-base text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Featured Contact Box (Gợi ý 1 + Gợi ý 4) */}
          <div className="md:col-span-2 lg:col-span-5">
            <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between gap-3 mb-5 border-b border-zinc-100 dark:border-zinc-800/80 pb-3.5">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Thông tin liên hệ
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Hỗ trợ 24/7
                </span>
              </div>

              <div className="space-y-3.5">
                {/* Hotline Card */}
                <a
                  href="tel:0902493895"
                  className="group flex items-center justify-between gap-3 rounded-2xl p-3 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                      <PhoneIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                        Hotline / Zalo tư vấn
                      </span>
                      <span className="block text-lg font-black text-zinc-900 dark:text-white tracking-wide">
                        0902 493 895
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-rose-600 text-white shadow-xs group-hover:bg-rose-700 transition-colors">
                    Gọi ngay
                  </span>
                </a>

                {/* Address Card */}
                <div className="flex items-start gap-3 rounded-2xl p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800/60">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40 mt-0.5">
                    <LocationIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-0.5">
                      Địa chỉ cửa hàng
                    </span>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
                      1017/26/18 Lê Văn Lương (90A đường B7, khu B, làng đại học), Ấp 3, Nhà Bè, Hồ Chí Minh, Vietnam
                    </p>
                    <a
                      href="https://maps.app.goo.gl/2PCt6anSYiPZUShA6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1.5"
                    >
                      <span>Xem trên Google Maps</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>

                {/* Email Card */}
                <a
                  href="mailto:japanshop.tuyan78@gmail.com"
                  className="group flex items-center gap-3 rounded-2xl p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-100/70 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40 group-hover:scale-105 transition-transform">
                    <MailIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-0.5">
                      Email hỗ trợ
                    </span>
                    <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      japanshop.tuyan78@gmail.com
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
          <p>© {new Date().getFullYear()} Japan Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
