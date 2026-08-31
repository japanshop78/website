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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggleTheme } = useTheme();
  const { categories } = useProductData();
  const { totalItems } = useCart();
  const mounted = useIsMounted();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      alert(`Đang tìm kiếm: ${searchQuery}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-zinc-900 dark:text-white">
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
          <nav className="hidden md:flex items-center gap-6">
            {categories.map((category) => (
              <Link
                key={category.id || category.name}
                href={`/category/${category.id}`}
                className="text-sm font-medium text-zinc-600 transition-colors hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side items: Search, Cart, Theme Toggle, Admin Settings & Mobile menu */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search Icon Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 rounded-lg text-zinc-700 hover:text-indigo-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-indigo-400 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
            title="Tìm kiếm sản phẩm"
            aria-label="Tìm kiếm sản phẩm"
          >
            <SearchIcon className="h-6 w-6" />
          </button>

          {/* Cart Icon Link */}
          <Link
            href="/cart"
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
          </Link>

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

      {/* Expandable Search Bar */}
      {isSearchOpen && (
        <div className="border-t border-zinc-200 bg-white/95 backdrop-blur-md px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/95 shadow-md animate-in fade-in duration-200">
          <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                autoFocus
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-4 pr-20 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-indigo-400 dark:focus:bg-zinc-950"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="submit"
                  className="p-1.5 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 cursor-pointer"
                  aria-label="Tìm kiếm"
                >
                  <SearchIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  aria-label="Đóng tìm kiếm"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="relative mb-3 flex items-center">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-1.5 pl-4 pr-10 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900"
            />
            <button type="submit" className="absolute right-3 text-zinc-400">
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>

          <nav className="flex flex-col gap-2">
            {categories.map((category) => (
              <Link
                key={category.id || category.name}
                href={`/category/${category.id}`}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-indigo-600 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-indigo-400"
              >
                {category.name}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40"
            >
              ⚙️ Quản lý sản phẩm (Admin)
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
