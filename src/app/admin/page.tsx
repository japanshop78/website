"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProductData } from "@/context/ProductDataContext";
import CategoryManagement from "./components/CategoryManagement";
import CategoryProductManagement from "./components/CategoryProductManagement";
import ProductManagement from "./components/ProductManagement";
import FeaturedManagement from "./components/FeaturedManagement";
import DiscountManagement from "./components/DiscountManagement";

type AdminTab =
  | "categories"
  | "category_products"
  | "products"
  | "featured"
  | "discount";

const AUTH_STORAGE_KEY = "japan_shop_admin_authenticated_v1";
const ADMIN_PASSKEY = process.env.NEXT_PUBLIC_ADMIN_PASSKEY || "japan2024";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passkeyInput, setPasskeyInput] = useState("");
  const [showPasskey, setShowPasskey] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("products");

  // Supabase seed & refresh state
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [seedNotice, setSeedNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    categories,
    products,
    categoryProducts,
    getFeaturedProducts,
    supabaseStatus,
    seedInitialDataToSupabase,
    refreshFromSupabase,
  } = useProductData();

  // Check authentication status on mount
  useEffect(() => {
    try {
      const sessionAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
      const localAuth = localStorage.getItem(AUTH_STORAGE_KEY);

      if (sessionAuth === "true" || localAuth === "true") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const inputTrimmed = passkeyInput.trim();

    if (!inputTrimmed) {
      setErrorMsg("Vui lòng nhập mã passkey quản trị!");
      return;
    }

    if (inputTrimmed === ADMIN_PASSKEY) {
      setIsAuthenticated(true);
      try {
        if (rememberDevice) {
          localStorage.setItem(AUTH_STORAGE_KEY, "true");
        } else {
          sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
        }
      } catch {
        // Storage fallback
      }
    } else {
      setErrorMsg("Mã passkey không chính xác! Vui lòng thử lại.");
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Storage fallback
    }
    setIsAuthenticated(false);
    setPasskeyInput("");
    setErrorMsg("");
  };

  const handleSeedData = async () => {
    const confirmSeed = window.confirm(
      "Thao tác này sẽ tải toàn bộ danh mục và sản phẩm mẫu ban đầu lên cơ sở dữ liệu Supabase của bạn. Bạn có muốn tiếp tục?"
    );
    if (!confirmSeed) return;

    setIsSeeding(true);
    setSeedNotice(null);

    const result = await seedInitialDataToSupabase();
    setIsSeeding(false);
    setSeedNotice({
      type: result.success ? "success" : "error",
      message: result.message,
    });
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await refreshFromSupabase();
    setIsRefreshing(false);
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // Passkey Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-xl">
          {/* Lock Icon Header */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 shadow-inner mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Bảo Mật Quản Trị
            </h2>
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              Vui lòng nhập mã Passkey để truy cập bảng quản lý Japan Shop
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Mã Passkey Admin
              </label>
              <div className="relative">
                <input
                  type={showPasskey ? "text" : "password"}
                  autoFocus
                  required
                  value={passkeyInput}
                  onChange={(e) => {
                    setPasskeyInput(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="Nhập mã passkey..."
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPasskey(!showPasskey)}
                  className="absolute right-3 top-3 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showPasskey ? "🙈 Ẩn" : "👁 Hiện"}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-3 text-xs font-semibold text-rose-600 dark:text-rose-400 animate-in fade-in duration-200">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Ghi nhớ phiên đăng nhập</span>
              </label>

              <Link
                href="/"
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Về trang chủ
              </Link>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-500 transition-all cursor-pointer mt-2"
            >
              🔓 Xác nhận mở khóa
            </button>
          </form>
        </div>
      </div>
    );
  }

  const featuredProducts = getFeaturedProducts();
  const discountedProducts = products.filter(
    (p) => p.oldPrice && p.oldPrice > p.price
  );

  const navItems = [
    {
      id: "products" as AdminTab,
      label: "Quản lý Sản phẩm",
      icon: "📦",
      count: products.length,
      color: "indigo",
      desc: "Thêm, sửa, giá bán, tồn kho",
    },
    {
      id: "categories" as AdminTab,
      label: "Quản lý Danh mục",
      icon: "🏷️",
      count: categories.length,
      color: "indigo",
      desc: "Phân loại nhóm ngành hàng",
    },
    {
      id: "category_products" as AdminTab,
      label: "Sản phẩm - Danh mục",
      icon: "🗂️",
      count: categoryProducts.length,
      color: "indigo",
      desc: "Gán sản phẩm vào danh mục",
    },
    {
      id: "featured" as AdminTab,
      label: "Sản phẩm Bán chạy",
      icon: "🔥",
      count: featuredProducts.length,
      color: "amber",
      desc: "Thứ tự hiển thị trang chủ",
    },
    {
      id: "discount" as AdminTab,
      label: "Sản phẩm Giảm giá",
      icon: "⚡",
      count: discountedProducts.length,
      color: "rose",
      desc: "Chương trình khuyến mãi",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-6 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Top Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 text-xl font-bold">
              ⛩️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
                  Trang Quản Trị Japan Shop
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 px-2.5 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  v2.0
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Hệ thống quản lý phân loại danh mục, sản phẩm, kho hàng và khuyến mãi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            >
              👁 Xem cửa hàng
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/40 px-3.5 py-2 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors cursor-pointer"
              title="Khóa và đăng xuất khỏi trang admin"
            >
              🔒 Khóa / Đăng xuất
            </button>
          </div>
        </div>

        {/* Database & Cloud Sync Status Banner */}
        <div className="mb-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-lg">
                🗄️
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Cơ sở dữ liệu
                  </span>
                  {supabaseStatus === "connected" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Supabase Cloud Online
                    </span>
                  )}
                  {supabaseStatus === "not_configured" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Dữ liệu mặc định (Chưa điền Key Supabase)
                    </span>
                  )}
                  {supabaseStatus === "error" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Lỗi kết nối Supabase
                    </span>
                  )}
                  {supabaseStatus === "loading" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      <span className="h-2 w-2 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      Đang kết nối...
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {supabaseStatus === "connected" && "Mọi thay đổi thêm/sửa/xóa sẽ tự động cập nhật lên Supabase Cloud và hiển thị ngay cho khách hàng."}
                  {supabaseStatus === "not_configured" && "Đang đọc trực tiếp từ tệp JSON. Điền .env để đồng bộ đám mây."}
                  {supabaseStatus === "error" && "Chưa tìm thấy bảng trên Supabase. Vui lòng mở Supabase SQL Editor và chạy nội dung file supabase-schema.sql để khởi tạo bảng."}
                  {supabaseStatus === "loading" && "Đang kiểm tra kết nối tới Supabase Cloud..."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>🔄</span>
                <span>{isRefreshing ? "Đang tải lại..." : "Tải lại dữ liệu"}</span>
              </button>

              <button
                onClick={handleSeedData}
                disabled={isSeeding || supabaseStatus === "not_configured"}
                title={
                  supabaseStatus === "not_configured"
                    ? "Cần cấu hình Supabase trong .env trước"
                    : "Đẩy toàn bộ sản phẩm và danh mục gốc lên Supabase"
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>⚡</span>
                <span>{isSeeding ? "Đang đồng bộ..." : "Đồng bộ dữ liệu gốc lên Supabase"}</span>
              </button>
            </div>
          </div>

          {seedNotice && (
            <div
              className={`mt-3 rounded-xl p-3 text-xs font-medium ${
                seedNotice.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300"
              }`}
            >
              {seedNotice.type === "success" ? "✅" : "⚠️"} {seedNotice.message}
            </div>
          )}
        </div>

        {/* Mobile Horizontal Tabs (< lg) */}
        <div className="lg:hidden mb-6 overflow-x-auto pb-1">
          <div className="flex gap-2 min-w-max p-1 rounded-2xl bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-300/60 dark:border-zinc-800">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-md scale-[1.02]"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-black ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                        : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main 2-Column Sidebar Layout (Desktop: lg+) */}
        <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-6 items-start">
          {/* Left Sidebar (Desktop) */}
          <aside className="hidden lg:flex flex-col gap-4 sticky top-6">
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
              <div className="px-3 py-2 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Menu Quản Trị
                </span>
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl text-left transition-all cursor-pointer group ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-bold scale-[1.01]"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-xl flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}>
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm truncate">
                            {item.label}
                          </div>
                          <div className={`text-[11px] truncate font-normal ${
                            isActive ? "text-indigo-100" : "text-zinc-400 dark:text-zinc-500"
                          }`}>
                            {item.desc}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black shrink-0 ${
                          isActive
                            ? "bg-white text-indigo-700 shadow-xs"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"
                        }`}
                      >
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar Quick Summary Footer */}
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 px-2 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Tổng sản phẩm:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{products.length} SP</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Danh mục:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{categories.length} nhóm</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Đang giảm giá:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{discountedProducts.length} SP</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main className="min-w-0">
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 lg:p-7 shadow-sm">
              {activeTab === "products" && <ProductManagement />}
              {activeTab === "categories" && <CategoryManagement />}
              {activeTab === "category_products" && <CategoryProductManagement />}
              {activeTab === "featured" && <FeaturedManagement />}
              {activeTab === "discount" && <DiscountManagement />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

