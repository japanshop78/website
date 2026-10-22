"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useProductData } from "@/context/ProductDataContext";
import {
  PromotionCampaign,
  DEFAULT_PROMOTION,
  isCampaignActive,
  formatPromoDateRange,
  calculateDiscountedPrice,
} from "@/types/promotion";
import BoltIcon from "@/components/icons/BoltIcon";
import SparklesIcon from "@/components/icons/SparklesIcon";
import CheckIcon from "@/components/icons/CheckIcon";

/**
 * Chuyển đổi chuỗi ISO (hoặc Date string) sang định dạng YYYY-MM-DDTHH:mm cho input type="datetime-local"
 */
function toDatetimeLocalString(isoStr?: string): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

/**
 * Chuyển đổi từ input datetime-local về chuỗi ISO có múi giờ địa phương
 */
function fromDatetimeLocalString(localStr: string): string {
  if (!localStr) return "";
  try {
    const d = new Date(localStr);
    if (isNaN(d.getTime())) return localStr;
    return d.toISOString();
  } catch {
    return localStr;
  }
}

function getTimeUntilTarget(targetDateStr?: string) {
  const now = new Date().getTime();
  const target = targetDateStr ? new Date(targetDateStr).getTime() : 0;
  const diff = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  return { days, hours, minutes, seconds };
}

const formatTime = (num: number) => String(num).padStart(2, "0");

const DISCOUNT_PRESETS = [5, 10, 15, 20, 25, 30, 50];

export default function PromotionManagement() {
  const { promotion, updatePromotion } = useProductData();

  const [form, setForm] = useState<PromotionCampaign>(promotion || DEFAULT_PROMOTION);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync khi promotion từ Context / Supabase thay đổi
  useEffect(() => {
    if (promotion) {
      setForm(promotion);
    }
  }, [promotion]);

  // Đồng hồ đếm ngược xem trước
  const [timeLeft, setTimeLeft] = useState(getTimeUntilTarget(form.endDate));
  useEffect(() => {
    setTimeLeft(getTimeUntilTarget(form.endDate));
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilTarget(form.endDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [form.endDate]);

  // Kiểm tra thời gian chiến dịch còn hiệu lực (chưa hết hạn)
  const hasTimeRemaining = useMemo(() => {
    if (!form.endDate) return false;
    const target = new Date(form.endDate).getTime();
    if (isNaN(target)) return false;
    return target > new Date().getTime();
  }, [form.endDate]);

  // Kiểm tra chiến dịch có đang thực sự hiệu lực không (isActive & chưa hết hạn)
  const isCurrentlyActive = useMemo(() => isCampaignActive(form), [form]);

  const dateRangeText = useMemo(() => {
    return formatPromoDateRange(form.startDate, form.endDate);
  }, [form.startDate, form.endDate]);

  // Tự động tạo subtitle gợi ý
  const handleAutoGenerateSubtitle = () => {
    const discountText =
      form.discountPercent > 0 ? `Giảm ${form.discountPercent}% cho tất cả sản phẩm` : "Ưu đãi đặc biệt";
    const shipText = form.isFreeship ? " và Miễn phí vận chuyển" : "";
    const rangeText = dateRangeText ? ` ${dateRangeText}` : "";
    const generated = `${discountText}${shipText}${rangeText}`;
    setForm((prev) => ({ ...prev, bannerSubtitle: generated }));
  };

  // Nhanh chóng đặt thời gian kết thúc
  const handleSetQuickDuration = (daysToAdd: number) => {
    const start = form.startDate ? new Date(form.startDate) : new Date();
    const end = new Date(start.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    end.setHours(23, 59, 59, 999);
    setForm((prev) => ({
      ...prev,
      endDate: end.toISOString(),
    }));
  };

  // Lưu lên Supabase
  const handleSave = async () => {
    setIsSaving(true);
    setToastMsg(null);
    try {
      const ok = await updatePromotion(form);
      if (ok) {
        setToastMsg({
          type: "success",
          text: "Đã lưu và đồng bộ thành công chiến dịch khuyến mãi lên Supabase Cloud!",
        });
        setTimeout(() => setToastMsg(null), 4000);
      } else {
        setToastMsg({
          type: "error",
          text: "Lỗi lưu cấu hình lên Supabase. Vui lòng kiểm tra kết nối mạng và khóa API!",
        });
      }
    } catch {
      setToastMsg({
        type: "error",
        text: "Đã xảy ra lỗi bất ngờ khi cập nhật chiến dịch.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Khôi phục mặc định
  const handleResetDefaults = async () => {
    if (
      window.confirm(
        "Bạn có chắc muốn khôi phục toàn bộ thông tin chiến dịch về cấu hình mẫu mặc định?"
      )
    ) {
      setForm(DEFAULT_PROMOTION);
      setIsSaving(true);
      const ok = await updatePromotion(DEFAULT_PROMOTION);
      setIsSaving(false);
      if (ok) {
        setToastMsg({
          type: "success",
          text: "Đã khôi phục chiến dịch về cấu hình mẫu mặc định thành công!",
        });
        setTimeout(() => setToastMsg(null), 4000);
      }
    }
  };

  // Mẫu tính giá thử nghiệm
  const sampleProduct = { price: 250000, oldPrice: 300000 };
  const sampleEffectivePrice = calculateDiscountedPrice(sampleProduct.price, form.discountPercent);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 mb-2">
            <span>🎁 Quản Trị Hệ Thống • Toàn Sàn</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl flex items-center gap-2">
            <span>Chiến Dịch Khuyến Mãi Toàn Sàn</span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                form.isActive && hasTimeRemaining
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  : form.isActive && !hasTimeRemaining
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                  : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {form.isActive && hasTimeRemaining
                ? "🟢 Đang kích hoạt"
                : form.isActive && !hasTimeRemaining
                ? "🟡 Đã hết hạn (Thông điệp vẫn chạy)"
                : "⚪ Đang tạm dừng"}
            </span>
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Cấu hình giảm giá tự động toàn bộ sản phẩm, miễn phí ship và đồng hồ đếm ngược hiển thị trên website.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Đưa các giá trị về cấu hình mẫu"
          >
            <span>🔄</span>
            <span>Khôi phục mẫu</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            👁 Xem trang chủ
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`rounded-2xl p-4 text-sm font-bold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
            toastMsg.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{toastMsg.type === "success" ? "✓" : "⚠️"}</span>
            <span>{toastMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-xs hover:underline cursor-pointer ml-3 font-semibold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Main Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: All Promotion Attributes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 font-bold text-lg">
                  ⚙️
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                    Thông Tin & Thuộc Tính Chiến Dịch
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Chỉnh sửa các trường dữ liệu và lưu trực tiếp vào bảng promotions trên Supabase.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Tên chiến dịch (name) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                1. Tên Chiến Dịch (Quản trị)
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Ưu đãi hot 10/10, Siêu Sale Black Friday, Mừng Lễ Quốc Khánh..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Tên để phân biệt chiến dịch trong trang quản trị nội bộ.
              </p>
            </div>

            {/* 2. Trạng thái kích hoạt (isActive) & Miễn phí vận chuyển (isFreeship) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* isActive */}
              <div
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  form.isActive
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 opacity-75"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Trạng Thái Chiến Dịch
                  </span>
                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                      form.isActive ? "bg-emerald-500 justify-end" : "bg-zinc-300 dark:bg-zinc-700 justify-start"
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                  </div>
                </div>
                <div className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>{form.isActive ? "🟢 Đang Kích Hoạt" : "⚪ Đang Tạm Tắt"}</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  {form.isActive
                    ? "Áp dụng giá ưu đãi & đồng hồ đếm ngược trên website."
                    : "Tắt toàn bộ giảm giá chiến dịch, quay về giá niêm yết."}
                </p>
              </div>

              {/* isFreeship */}
              <div
                onClick={() => setForm({ ...form, isFreeship: !form.isFreeship })}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  form.isFreeship
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 opacity-75"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Vận Chuyển Freeship
                  </span>
                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                      form.isFreeship ? "bg-indigo-600 justify-end" : "bg-zinc-300 dark:bg-zinc-700 justify-start"
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                  </div>
                </div>
                <div className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>{form.isFreeship ? "🚚 Miễn Phí Vận Chuyển" : "📦 Tính Phí Chuẩn (25k)"}</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  {form.isFreeship
                    ? "Tự động gán phí ship = 0đ cho mọi đơn hàng trong giỏ."
                    : "Áp dụng miễn phí vận chuyển chỉ khi đơn đạt ngưỡng chuẩn (1 triệu)."}
                </p>
              </div>
            </div>

            {/* 3. Mức giảm giá % (discountPercent) */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  3. Mức Giảm Giá Toàn Sàn (%)
                </label>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  Đang giảm: {form.discountPercent}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercent}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discountPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-lg font-black text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500 text-center"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-zinc-400">
                    %
                  </span>
                </div>

                {/* Slider kéo chỉnh */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                  className="w-1/2 accent-rose-600 cursor-pointer"
                />
              </div>

              {/* Phím tắt chọn nhanh % */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-zinc-400 mr-1">Gợi ý nhanh:</span>
                {DISCOUNT_PRESETS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setForm({ ...form, discountPercent: pct })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      form.discountPercent === pct
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950"
                    }`}
                  >
                    -{pct}%
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, discountPercent: 0 })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    form.discountPercent === 0
                      ? "bg-zinc-700 text-white"
                      : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  0% (Không giảm)
                </button>
              </div>
            </div>

            {/* 4. Thời gian Bắt đầu & Kết thúc (startDate, endDate) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                4. Thời Gian Diễn Ra Chiến Dịch
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* startDate */}
                <div>
                  <span className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                    Ngày bắt đầu (Start Date):
                  </span>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocalString(form.startDate)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        startDate: fromDatetimeLocalString(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* endDate */}
                <div>
                  <span className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                    Ngày kết thúc (End Date - Countdown):
                  </span>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocalString(form.endDate)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        endDate: fromDatetimeLocalString(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons for End Date */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-zinc-400 mr-1">Đặt nhanh thời hạn:</span>
                {[3, 7, 10, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleSetQuickDuration(days)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    +{days} ngày
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Tiêu đề banner & Phụ đề banner (bannerTitle, bannerSubtitle) */}
            <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                  5. Tiêu Đề Banner Trang Chủ (bannerTitle)
                </label>
                <input
                  type="text"
                  value={form.bannerTitle}
                  onChange={(e) => setForm({ ...form, bannerTitle: e.target.value })}
                  placeholder="VD: Ưu đãi hot 🔥, Đại tiệc tri ân..."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    6. Phụ Đề / Thông Điệp Chạy Chữ (bannerSubtitle)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateSubtitle}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    title="Tự động ghép văn bản từ % giảm giá và ngày đã chọn"
                  >
                    <SparklesIcon className="h-3 w-3" />
                    <span>Tạo tự động từ cấu hình</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={form.bannerSubtitle}
                  onChange={(e) => setForm({ ...form, bannerSubtitle: e.target.value })}
                  placeholder="VD: Giảm 10% cho tất cả sản phẩm và Miễn phí vận chuyển từ 10/10 đến 20/10"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <p className="mt-1 text-[11px] text-zinc-400">
                  Thông điệp này sẽ hiển thị trên thanh marquee chạy chữ ngang và phụ đề trên trang chủ.
                </p>
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                {form.updatedAt ? `Cập nhật lần cuối: ${new Date(form.updatedAt).toLocaleString("vi-VN")}` : ""}
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Đang lưu..." : "💾 Lưu Thay Đổi"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Storefront Preview & Impact Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Live Storefront Preview */}
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">👁️</span>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Xem Trước Giao Diện Trang Chủ (Live Preview)
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                Realtime
              </span>
            </div>

            {/* Mô phỏng Banner đỏ cam như ngoài Storefront */}
            <div className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 p-4 text-white relative">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-extrabold uppercase tracking-tight flex items-center gap-1.5 drop-shadow-sm">
                    {form.bannerTitle || "Ưu đãi hot 🔥"}
                  </h3>

                  {/* Trạng thái Bật/Tắt mini */}
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-xs border border-white/20">
                    {form.isActive ? (hasTimeRemaining ? "ĐANG BẬT" : "ĐÃ HẾT HẠN") : "ĐÃ TẮT"}
                  </span>
                </div>

                {/* Countdown Timer Preview: CHỈ HIỂN THỊ KHI CHƯA HẾT HẠN */}
                {form.isActive && hasTimeRemaining && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1.5 shadow-md self-start">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                      <BoltIcon className="h-3 w-3 fill-current text-amber-400" />
                      <span>Kết thúc sau:</span>
                    </span>
                    <div className="flex items-center gap-1 font-mono font-black text-xs text-white">
                      {timeLeft.days > 0 && (
                        <>
                          <span className="rounded bg-zinc-900/90 text-amber-300 px-1.5 py-0.5 border border-amber-400/30">
                            {timeLeft.days}N
                          </span>
                          <span>:</span>
                        </>
                      )}
                      <span className="rounded bg-zinc-900/90 text-amber-300 px-1.5 py-0.5 border border-amber-400/30">
                        {formatTime(timeLeft.hours)}
                      </span>
                      <span>:</span>
                      <span className="rounded bg-zinc-900/90 text-amber-300 px-1.5 py-0.5 border border-amber-400/30">
                        {formatTime(timeLeft.minutes)}
                      </span>
                      <span>:</span>
                      <span className="rounded bg-zinc-900/90 text-amber-300 px-1.5 py-0.5 border border-amber-400/30">
                        {formatTime(timeLeft.seconds)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Subtitle / Marquee Preview: Thông điệp luôn hiển thị, Thời gian áp dụng chỉ hiển thị khi chưa hết hạn */}
                <div className="rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 p-2.5 text-xs text-white">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>🔥</span>
                    <span>{form.bannerSubtitle || "Giảm giá đặc biệt toàn sàn"}</span>
                  </div>
                  {hasTimeRemaining && dateRangeText && (
                    <div className="mt-1 text-[11px] text-amber-200">
                      Thời gian áp dụng: {dateRangeText}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 text-center">
              Mô phỏng chính xác khung banner đếm ngược tại section &quot;Ưu Đãi Hot&quot; ngoài trang chủ.
            </p>
          </div>

          {/* Card: System Impact Summary (Mô phỏng tính giá & Giỏ hàng) */}
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="text-lg">🧮</span>
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Mô Phỏng Tác Động Đến Giá & Giỏ Hàng
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              {/* Sản phẩm mẫu */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                <span className="font-bold text-zinc-600 dark:text-zinc-300 block">
                  Ví dụ sản phẩm niêm yết: <span className="font-mono text-zinc-900 dark:text-white">250.000đ</span>
                </span>

                {form.isActive && form.discountPercent > 0 ? (
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Sau khi áp dụng -{form.discountPercent}%:
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                        {sampleEffectivePrice.toLocaleString("vi-VN")}đ
                      </span>
                      <span className="ml-1.5 text-[11px] text-zinc-400 line-through">
                        250.000đ
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-400 text-[11px] pt-1 border-t border-zinc-200 dark:border-zinc-700">
                    Không áp dụng giảm giá (Giá bán vẫn giữ nguyên 250.000đ)
                  </div>
                )}
              </div>

              {/* Vận chuyển */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 block">Phí ship giỏ hàng:</span>
                  <span className="text-[11px] text-zinc-400">
                    {form.isActive && form.isFreeship
                      ? "Miễn phí vận chuyển cho tất cả đơn hàng"
                      : "Áp dụng phí chuẩn 25.000đ (Freeship từ 1.000.000đ)"}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-black text-xs ${
                    form.isActive && form.isFreeship
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {form.isActive && form.isFreeship ? "0đ (Freeship)" : "25.000đ"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
