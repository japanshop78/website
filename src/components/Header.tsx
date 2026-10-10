"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import { useProductData } from "@/context/ProductDataContext";
import { useCart } from "@/context/CartContext";
import SunIcon from "@/components/icons/SunIcon";
import MoonIcon from "@/components/icons/MoonIcon";
import SearchIcon from "./icons/SearchIcon";
import CartIcon from "./icons/CartIcon";
import MenuIcon from "./icons/MenuIcon";
import CloseIcon from "./icons/CloseIcon";
import SettingsIcon from "./icons/SettingsIcon";
import LiveSearchDropdown from "./LiveSearchDropdown";
import { getAssetPath } from "@/utils/assetPath";

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const { theme, toggleTheme } = useTheme();
  const { categories } = useProductData();
  const { totalItems, openCartDrawer } = useCart();
  const mounted = useIsMounted();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-6 xl:gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-zinc-900 dark:text-white shrink-0">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <Image
                src={getAssetPath("/logo.jpg")}
                alt="Japan Shop Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span>Japan Shop</span>
          </Link>

          {/* Desktop Navigation Categories */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id || category.name}
                href={`/category/${category.id}`}
                className="text-sm font-semibold text-zinc-600 transition-colors hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400 whitespace-nowrap"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>


        {/* Right side items: Search, Cart, Theme Toggle, Admin Settings & Mobile menu */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search Icon Button */}
          {/* <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 rounded-lg text-zinc-700 hover:text-indigo-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-indigo-400 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
            title="Tìm kiếm sản phẩm"
            aria-label="Tìm kiếm sản phẩm"
          >
            <SearchIcon className="h-6 w-6" />
          </button> */}

          {/* Cart Icon Button */}
          <button
            type="button"
            onClick={openCartDrawer}
            className="relative p-2 text-zinc-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400 cursor-pointer transition-colors"
            title="Giỏ hàng"
            aria-label="Xem giỏ hàng"
          >
            <CartIcon className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white animate-in zoom-in-50 duration-200">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          {mounted ? (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-zinc-700 hover:text-indigo-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-indigo-400 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
              aria-label="Chuyển đổi giao diện"
            >
              {theme === "light" ? (
                <MoonIcon className="h-6 w-6" />
              ) : (
                <SunIcon className="h-6 w-6" />
              )}
            </button>
          ) : (
            <div className="h-10 w-10" />
          )}

          {/* Admin Settings Button */}
          <Link
            href="/admin"
            className="p-2 rounded-lg text-zinc-700 hover:text-indigo-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-indigo-400 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
            title="Quản lý sản phẩm (Admin)"
            aria-label="Quản lý sản phẩm"
          >
            <SettingsIcon className="h-6 w-6" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-zinc-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400 md:hidden cursor-pointer"
          >
            {isMenuOpen ? (
              <CloseIcon className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Live Search Dropdown */}
      <LiveSearchDropdown
        isOpen={isSearchOpen}
        // onClose={() => setIsSearchOpen(false)}
        onClose={() => { }}
      />

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:hidden shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (mobileSearchQuery.trim()) {
                  setIsMenuOpen(false);
                  window.location.href = `/search?q=${encodeURIComponent(mobileSearchQuery.trim())}`;
                }
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm nội địa Nhật..."
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-4 pr-10 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 focus:border-indigo-500"
              />
              <button type="submit" className="absolute right-3 text-zinc-400">
                <SearchIcon className="h-4 w-4" />
              </button>
            </form>

            {/* Categories */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block px-3 mb-1">
                Danh mục sản phẩm
              </span>
              <nav className="flex flex-col gap-1">
                {categories.map((category) => (
                  <Link
                    key={category.id || category.name}
                    href={`/category/${category.id}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-indigo-600 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-indigo-400 transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Policies (Synchronized with Footer) */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block px-3 mb-1">
                Chính sách & Hỗ trợ
              </span>
              <nav className="flex flex-col gap-1 text-xs">
                <Link
                  href="/chinh-sach-doi-tra"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  ✓ Đổi trả & Hoàn tiền 200%
                </Link>
                <Link
                  href="/chinh-sach-van-chuyen"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  🚚 Vận chuyển & Đồng kiểm COD
                </Link>
                <Link
                  href="/chinh-sach-bao-mat"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  🔒 Bảo mật thông tin
                </Link>
              </nav>
            </div>

            {/* Hotline & Admin */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3 flex flex-col gap-2">
              <a
                href="tel:0902493895"
                className="flex items-center justify-between rounded-xl p-2.5 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-bold text-xs"
              >
                <span>📞 Hotline: 0902 493 895</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white">Gọi ngay</span>
              </a>

              <Link
                href="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-colors"
              >
                ⚙️ Quản trị cửa hàng (Admin)
              </Link>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
