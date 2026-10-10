"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useProductData } from "@/context/ProductDataContext";
import { Product } from "@/data/products";
import { PromotionCampaign } from "@/types/promotion";
import { getAssetPath } from "@/utils/assetPath";
import SearchIcon from "@/components/icons/SearchIcon";
import PlusIcon from "@/components/icons/PlusIcon";
import CloseIcon from "@/components/icons/CloseIcon";
import BoltIcon from "@/components/icons/BoltIcon";

const DEFAULT_DISCOUNT_SLOTS = 20;

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export const calcDiscountPercent = (price: number, oldPrice?: number) => {
  if (oldPrice && oldPrice > price) {
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }
  return 0;
};

export const calcDiscountAmount = (price: number, oldPrice?: number) => {
  if (oldPrice && oldPrice > price) {
    return oldPrice - price;
  }
  return 0;
};

interface DragPayload {
  source: "catalog" | "slot";
  product: Product;
  fromSlotIndex?: number;
}

export default function DiscountManagement() {
  const {
    products,
    categories,
    getProductsByBanner,
    getCategoryIdByProductId,
    updateProduct,
    setBannerProducts,
    promotion,
    updatePromotion,
    discountBannerLimit,
    updateDiscountBannerLimit,
  } = useProductData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [onlyDiscounted, setOnlyDiscounted] = useState(true);
  const [previewMode, setPreviewMode] = useState<"table" | "list" | "preview">("table");

  // Số lượng ô banner có thể tùy chỉnh (lấy từ Supabase settings hoặc mặc định 20)
  const [slotCount, setSlotCount] = useState<number>(discountBannerLimit || DEFAULT_DISCOUNT_SLOTS);
  const [slotInputVal, setSlotInputVal] = useState<string>(String(discountBannerLimit || DEFAULT_DISCOUNT_SLOTS));
  // Chế độ hiển thị Cột 2: "grid" (Lưới ô) hoặc "list" (Danh sách Reorder với nút ⬆⬇ và handle kéo thả ⠿)
  const [column2View, setColumn2View] = useState<"grid" | "list">("grid");

  // Đồng bộ slotCount khi discountBannerLimit từ Supabase load về
  useEffect(() => {
    if (discountBannerLimit && discountBannerLimit !== slotCount) {
      setSlotCount(discountBannerLimit);
      setSlotInputVal(String(discountBannerLimit));
    }
  }, [discountBannerLimit]);

  // Promotional Campaign state from Supabase
  const [promoForm, setPromoForm] = useState<PromotionCampaign>(promotion);
  const [isPromoSaving, setIsPromoSaving] = useState(false);
  const [promoSaveToast, setPromoSaveToast] = useState(false);

  useEffect(() => {
    if (promotion) {
      setPromoForm(promotion);
    }
  }, [promotion]);

  const handleSavePromo = async () => {
    setIsPromoSaving(true);
    const ok = await updatePromotion(promoForm);
    setIsPromoSaving(false);
    if (ok) {
      setPromoSaveToast(true);
      setTimeout(() => setPromoSaveToast(false), 3000);
    } else {
      alert("Lỗi cập nhật cấu hình ưu đãi lên Supabase!");
    }
  };

  const handleResetPromoDefaults = async () => {
    if (window.confirm("Khôi phục cấu hình ưu đãi về mặc định (10/10 - 20/10, Giảm 10%, Freeship)?")) {
      const defaults: PromotionCampaign = {
        id: "active_campaign",
        name: "Ưu đãi hot 10/10",
        isActive: true,
        discountPercent: 10,
        isFreeship: true,
        startDate: "2026-10-10T00:00:00+07:00",
        endDate: "2026-10-20T23:59:59+07:00",
        bannerTitle: "Ưu đãi hot 🔥",
        bannerSubtitle: "Giảm 10% cho tất cả sản phẩm và Miễn phí vận chuyển từ 10/10 đến 20/10",
      };
      setPromoForm(defaults);
      await updatePromotion(defaults);
      setPromoSaveToast(true);
      setTimeout(() => setPromoSaveToast(false), 3000);
    }
  };

  // Local working state for slots (index 0 to slotCount - 1)
  const [localSlots, setLocalSlots] = useState<(Product | null)[]>(() =>
    Array(DEFAULT_DISCOUNT_SLOTS).fill(null)
  );

  // Drag state
  const [draggedItem, setDraggedItem] = useState<DragPayload | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [saveToast, setSaveToast] = useState(false);
  const [autoFillToast, setAutoFillToast] = useState(false);

  // Initialize localSlots from saved context on mount or when context changes
  useEffect(() => {
    const discountItems = getProductsByBanner("discount", slotCount);
    const initial: (Product | null)[] = Array(slotCount).fill(null);
    discountItems.forEach((p, idx) => {
      if (idx < slotCount) {
        initial[idx] = p;
      }
    });
    setLocalSlots(initial);
    setIsSaved(true);
  }, [getProductsByBanner, slotCount]);

  // Handle changing slot count (e.g. 10, 15, 20, 25, 30) và lưu vào Supabase settings
  const handleSlotCountChange = async (newCount: number) => {
    const clamped = Math.min(50, Math.max(5, newCount));
    setSlotCount(clamped);
    setSlotInputVal(String(clamped));
    setLocalSlots((prev) => {
      if (clamped === prev.length) return prev;
      if (clamped > prev.length) {
        return [...prev, ...Array(clamped - prev.length).fill(null)];
      }
      return prev.slice(0, clamped);
    });
    setIsSaved(false);
    await updateDiscountBannerLimit(clamped);
  };

  const handleCommitSlotInput = () => {
    const parsed = parseInt(slotInputVal, 10);
    if (!isNaN(parsed)) {
      handleSlotCountChange(parsed);
    } else {
      setSlotInputVal(String(slotCount));
    }
  };

  // Move product up or down by 1 position (for Reorder list view)
  const handleMoveSlot = (slotIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? slotIndex - 1 : slotIndex + 1;
    if (targetIndex < 0 || targetIndex >= slotCount) return;

    setLocalSlots((prev) => {
      const next = [...prev];
      const temp = next[slotIndex];
      next[slotIndex] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
    setIsSaved(false);
  };

  // Set of product IDs currently placed in the 10 slots
  const activeSlotProductIds = useMemo(() => {
    const set = new Set<string>();
    localSlots.forEach((p) => {
      if (p) set.add(p.id);
    });
    return set;
  }, [localSlots]);

  // Map product ID to current slot index (1-based for display)
  const productSlotNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    localSlots.forEach((p, idx) => {
      if (p) map.set(p.id, idx + 1);
    });
    return map;
  }, [localSlots]);

  // All products with discount
  const allDiscountedProducts = useMemo(() => {
    return products.filter((p) => p.oldPrice && p.oldPrice > p.price);
  }, [products]);

  // Maximum discount percentage in catalog
  const maxDiscountItem = useMemo(() => {
    if (allDiscountedProducts.length === 0) return null;
    return [...allDiscountedProducts].sort((a, b) => {
      const discA = calcDiscountPercent(a.price, a.oldPrice);
      const discB = calcDiscountPercent(b.price, b.oldPrice);
      return discB - discA;
    })[0];
  }, [allDiscountedProducts]);

  // Filtered products for Column 1 (Catalog)
  const filteredCatalogProducts = useMemo(() => {
    return products.filter((p) => {
      if (onlyDiscounted && (!p.oldPrice || p.oldPrice <= p.price)) {
        return false;
      }
      const prodCatId = getCategoryIdByProductId(p.id);
      const matchCat = selectedCategory === "all" || prodCatId === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.tag && p.tag.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [products, onlyDiscounted, selectedCategory, searchQuery, getCategoryIdByProductId]);

  // Count active slots
  const activeCount = useMemo(() => {
    return localSlots.filter(Boolean).length;
  }, [localSlots]);

  // --- Auto-Fill Top 10 Discount Logic ---
  const handleAutoFillTopDiscount = () => {
    // Sắp xếp toàn bộ sản phẩm theo % giảm giá giảm dần, sau đó theo số tiền giảm giá, rating, và số reviews
    const sorted = [...products].sort((a, b) => {
      const discPercentA = calcDiscountPercent(a.price, a.oldPrice);
      const discPercentB = calcDiscountPercent(b.price, b.oldPrice);

      if (discPercentB !== discPercentA) {
        return discPercentB - discPercentA;
      }

      const discAmountA = calcDiscountAmount(a.price, a.oldPrice);
      const discAmountB = calcDiscountAmount(b.price, b.oldPrice);
      if (discAmountB !== discAmountA) {
        return discAmountB - discAmountA;
      }

      if ((b.rating ?? 0) !== (a.rating ?? 0)) {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      return (b.reviews ?? 0) - (a.reviews ?? 0);
    });

    const topItems = sorted.slice(0, slotCount);
    const nextSlots: (Product | null)[] = Array(slotCount).fill(null);

    topItems.forEach((p, idx) => {
      nextSlots[idx] = {
        ...p,
        tag: p.tag || "Ưu đãi hot",
      };
    });

    setLocalSlots(nextSlots);
    setIsSaved(false);
    setAutoFillToast(true);
    setTimeout(() => setAutoFillToast(false), 5000);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStartFromCatalog = (e: React.DragEvent, product: Product) => {
    const payload: DragPayload = { source: "catalog", product };
    setDraggedItem(payload);
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copyMove";
  };

  const handleDragStartFromSlot = (
    e: React.DragEvent,
    fromSlotIndex: number,
    product: Product
  ) => {
    const payload: DragPayload = { source: "slot", product, fromSlotIndex };
    setDraggedItem(payload);
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== slotIndex) {
      setDragOverIndex(slotIndex);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, slotIndex: number) => {
    if (dragOverIndex === slotIndex) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetSlotIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    let payload = draggedItem;
    if (!payload) {
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (raw) payload = JSON.parse(raw);
      } catch {
        // Ignore JSON parse error
      }
    }

    if (!payload) return;

    const nextSlots = [...localSlots];

    if (payload.source === "slot" && payload.fromSlotIndex !== undefined) {
      // Swapping slots in Column 2
      const fromIndex = payload.fromSlotIndex;
      const temp = nextSlots[targetSlotIndex];
      nextSlots[targetSlotIndex] = nextSlots[fromIndex];
      nextSlots[fromIndex] = temp;
    } else if (payload.source === "catalog") {
      // Dropping from Column 1 into Column 2
      const droppedProduct = {
        ...payload.product,
        tag: payload.product.tag || "Ưu đãi hot",
      };

      // Check if product already exists in another slot
      const existingSlotIndex = nextSlots.findIndex(
        (p) => p && p.id === droppedProduct.id
      );

      if (existingSlotIndex !== -1) {
        // Swap existing slot with target slot
        const temp = nextSlots[targetSlotIndex];
        nextSlots[targetSlotIndex] = nextSlots[existingSlotIndex];
        nextSlots[existingSlotIndex] = temp;
      } else {
        // Place in target slot
        nextSlots[targetSlotIndex] = droppedProduct;
      }
    }

    setLocalSlots(nextSlots);
    setIsSaved(false);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // --- Click Actions ---
  const handleRemoveSlot = (slotIndex: number) => {
    const remainingProducts = localSlots
      .filter((_, idx) => idx !== slotIndex)
      .filter((p): p is Product => p !== null);

    const nextSlots: (Product | null)[] = Array(slotCount).fill(null);
    remainingProducts.forEach((p, idx) => {
      if (idx < slotCount) {
        nextSlots[idx] = p;
      }
    });

    setLocalSlots(nextSlots);
    setIsSaved(false);
  };

  const handleQuickAddToNextEmptySlot = (product: Product) => {
    const existingIdx = localSlots.findIndex((p) => p && p.id === product.id);

    if (existingIdx !== -1) {
      handleRemoveSlot(existingIdx);
      return;
    }

    const nextSlots = [...localSlots];
    const firstEmptyIdx = nextSlots.findIndex((p) => p === null);
    if (firstEmptyIdx === -1) {
      alert(
        `Đã đầy ${slotCount}/${slotCount} ô sản phẩm ưu đãi! Bạn có thể kéo thả vào ô muốn thay thế hoặc tăng số lượng ô.`
      );
      return;
    }

    nextSlots[firstEmptyIdx] = {
      ...product,
      tag: product.tag || "Ưu đãi hot",
    };
    setLocalSlots(nextSlots);
    setIsSaved(false);
  };


  // --- Save Changes to Database / Context ---
  const handleSaveChanges = () => {
    const productIds: string[] = [];
    localSlots.forEach((p) => {
      if (p) {
        productIds.push(p.id);
      }
    });

    setBannerProducts("discount", productIds);

    setIsSaved(true);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleResetToCurrent = () => {
    if (
      window.confirm(
        "Hủy toàn bộ thay đổi chưa lưu và quay lại cấu hình hiện tại?"
      )
    ) {
      const discountItems = getProductsByBanner("discount", slotCount);
      const initial: (Product | null)[] = Array(slotCount).fill(null);
      discountItems.forEach((p, idx) => {
        if (idx < slotCount) {
          initial[idx] = p;
        }
      });
      setLocalSlots(initial);
      setIsSaved(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 mb-2">
            <span>🏷️ Quản Lý Khuyến Mãi • Top Giảm Giá</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Quản Lý Sản Phẩm Giảm Giá
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Tự động lọc {slotCount} sản phẩm có % giảm giá cao nhất hoặc chọn & kéo thả tùy chỉnh theo ý muốn
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleAutoFillTopDiscount}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            title={`Tự động chọn ${slotCount} sản phẩm có mức giảm giá cao nhất vào các vị trí hiển thị`}
          >
            <BoltIcon className="h-4 w-4" />
            <span>Thêm tự động (Top {slotCount} giảm giá)</span>
          </button>

          {!isSaved && (
            <button
              onClick={handleResetToCurrent}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Hủy thay đổi
            </button>
          )}

          <button
            onClick={handleSaveChanges}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all cursor-pointer ${
              !isSaved
                ? "bg-emerald-600 hover:bg-emerald-500 ring-4 ring-emerald-500/20 scale-105"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            <span>💾 Lưu thay đổi</span>
            {!isSaved && (
              <span className="flex h-2 w-2 rounded-full bg-amber-300 animate-ping" />
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

      {/* KHUNG QUẢN LÝ CHIẾN DỊCH ƯU ĐÃI TOÀN SÀN (SUPABASE) */}
      <div className="rounded-3xl border border-rose-200/80 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 dark:from-rose-950/20 dark:via-zinc-900 dark:to-amber-950/10 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 dark:border-rose-900/30 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white text-lg shadow-md">
              🔥
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                  Chiến Dịch Ưu Đãi Toàn Sàn (Supabase)
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${promoForm.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                  {promoForm.isActive ? "Đang bật" : "Đã tắt"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tự động áp dụng giảm % toàn bộ sản phẩm và Freeship cho toàn bộ giỏ hàng, đồng bộ tức thì lên Supabase Cloud.
              </p>
            </div>
          </div>

          {/* Tạm thời ẩn 2 chức năng theo yêu cầu: 🔄 Mặc định 10/10 & 💾 Lưu ưu đãi lên Supabase */}
          {false && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetPromoDefaults}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                🔄 Mặc định 10/10
              </button>
              <button
                type="button"
                onClick={handleSavePromo}
                disabled={isPromoSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isPromoSaving ? "Đang lưu..." : "💾 Lưu ưu đãi lên Supabase"}
              </button>
            </div>
          )}
        </div>

        {promoSaveToast && (
          <div className="mb-4 rounded-xl bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 shadow-md flex items-center gap-2 animate-in fade-in">
            <span>✓ Đã lưu cấu hình ưu đãi thành công lên Supabase Cloud!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Trạng thái Bật/Tắt */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 space-y-2">
            <label className="font-bold text-zinc-800 dark:text-zinc-200 block">
              Trạng thái chiến dịch
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={promoForm.isActive}
                onChange={(e) => setPromoForm({ ...promoForm, isActive: e.target.checked })}
                className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {promoForm.isActive ? "🟢 Đang kích hoạt" : "⚪ Tạm dừng ưu đãi"}
              </span>
            </label>
            <p className="text-[11px] text-zinc-400">
              Gạt tắt nếu muốn kết thúc chiến dịch trước thời hạn.
            </p>
          </div>

          {/* Mức giảm % */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 space-y-2">
            <label className="font-bold text-zinc-800 dark:text-zinc-200 block">
              Mức giảm giá (% toàn sàn)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={promoForm.discountPercent}
                onChange={(e) => setPromoForm({ ...promoForm, discountPercent: Number(e.target.value) || 0 })}
                className="w-24 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-black text-rose-600 text-sm"
              />
              <span className="font-bold text-zinc-500">%</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Áp dụng giảm trực tiếp và làm tròn về hàng nghìn.
            </p>
          </div>

          {/* Vận chuyển Freeship */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 space-y-2">
            <label className="font-bold text-zinc-800 dark:text-zinc-200 block">
              Chính sách Vận chuyển
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={promoForm.isFreeship}
                onChange={(e) => setPromoForm({ ...promoForm, isFreeship: e.target.checked })}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                🚚 Miễn phí vận chuyển
              </span>
            </label>
            <p className="text-[11px] text-zinc-400">
              Áp dụng cho mọi giá trị đơn hàng trong thời gian deal.
            </p>
          </div>

          {/* Thời gian kết thúc */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 space-y-2">
            <label className="font-bold text-zinc-800 dark:text-zinc-200 block">
              Thời gian kết thúc (Countdown)
            </label>
            <input
              type="text"
              value={promoForm.endDate}
              onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })}
              placeholder="2026-10-20T23:59:59+07:00"
              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-xs"
            />
            <p className="text-[11px] text-zinc-400">
              Đồng hồ ngoài trang chủ sẽ đếm lùi về thời điểm này.
            </p>
          </div>
        </div>
      </div>

      {/* Auto Fill Toast Notification */}
      {autoFillToast && (
        <div className="rounded-2xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/70 p-4 text-rose-900 dark:text-rose-200 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚡</span>
            <div>
              <span className="text-sm font-bold block">
                Đã tự động chọn {slotCount} sản phẩm có mức % giảm giá cao nhất!
              </span>
              <span className="text-xs text-rose-700 dark:text-rose-300">
                Bạn vẫn có thể tự do kéo thả đổi vị trí hoặc gỡ bớt sản phẩm, sau đó nhấn &quot;💾 Lưu thay đổi&quot;.
              </span>
            </div>
          </div>
          <button
            onClick={() => setAutoFillToast(false)}
            className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer ml-3"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 p-4 text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✓</span>
            <span className="text-sm font-bold">
              Đã lưu thành công thứ tự và danh sách {slotCount} ô sản phẩm giảm giá!
            </span>
          </div>
          <button
            onClick={() => setSaveToast(false)}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Sản phẩm có giảm giá
          </span>
          <p className="mt-2 text-3xl font-black text-rose-500">
            {allDiscountedProducts.length}{" "}
            <span className="text-sm font-normal text-zinc-400">/ {products.length} SP</span>
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Mức giảm cao nhất
          </span>
          {maxDiscountItem ? (
            <div className="mt-2">
              <span className="inline-block rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-xs font-black">
                -{calcDiscountPercent(maxDiscountItem.price, maxDiscountItem.oldPrice)}%
              </span>
              <p className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1 mt-1">
                {maxDiscountItem.name}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">Không có SP giảm giá</p>
          )}
        </div>

        {/* Ô MỚI: Số lượng sản phẩm (Input tùy chỉnh, mặc định 20) trước Ô đã kích hoạt */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="slot-count-input" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Số lượng sản phẩm
              </label>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="slot-count-input"
                  type="number"
                  min={5}
                  max={200}
                  value={slotInputVal}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSlotInputVal(val);
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed) && parsed >= 5 && parsed <= 200) {
                      handleSlotCountChange(parsed);
                    }
                  }}
                  onBlur={handleCommitSlotInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCommitSlotInput();
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-1.5 text-2xl font-black text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="20"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Ô đã kích hoạt
          </span>
          <p className="mt-2 text-3xl font-black text-amber-500">
            {activeCount}{" "}
            <span className="text-sm font-normal text-zinc-400">/ {slotCount}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Chế độ xem
          </span>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setPreviewMode("table")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                previewMode === "table"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Kéo thả 2 Cột
            </button>
            <button
              onClick={() => setPreviewMode("list")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                previewMode === "list"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              DS Giảm giá
            </button>
            <button
              onClick={() => setPreviewMode("preview")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                previewMode === "preview"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Xem trước UI
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {previewMode === "table" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT 1: Kho sản phẩm hiển thị dạng Ô lưới (Grid Cards) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>📦 Cột 1: Kho Sản Phẩm</span>
                <span className="rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 text-xs font-bold">
                  {filteredCatalogProducts.length} SP
                </span>
              </h3>
              <span className="text-[11px] text-zinc-400 italic">
                (Kéo thả ô hoặc nhấn nút + để gán vào vị trí)
              </span>
            </div>

            {/* Search & Filter for Column 1 */}
            <div className="space-y-2.5 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Tìm sản phẩm theo tên, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 py-1.5 pl-9 pr-3 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                  <SearchIcon className="absolute left-3 top-2 h-3.5 w-3.5 text-zinc-400" />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer focus:border-indigo-500"
                >
                  <option value="all">Tất cả ngành hàng</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle only discounted */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyDiscounted}
                    onChange={(e) => setOnlyDiscounted(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <span>Chỉ hiện sản phẩm đang có giảm giá ({allDiscountedProducts.length})</span>
                </label>

                <span className="text-[11px] text-zinc-400">
                  {filteredCatalogProducts.length} kết quả
                </span>
              </div>
            </div>

            {/* Product Cards Grid in Column 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[680px] overflow-y-auto pr-1">
              {filteredCatalogProducts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-zinc-400 space-y-2">
                  <p>Không tìm thấy sản phẩm nào phù hợp.</p>
                  {onlyDiscounted && (
                    <button
                      type="button"
                      onClick={() => setOnlyDiscounted(false)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Bỏ lọc &quot;Chỉ hiện SP giảm giá&quot; để xem tất cả
                    </button>
                  )}
                </div>
              ) : (
                filteredCatalogProducts.map((p) => {
                  const isAssigned = activeSlotProductIds.has(p.id);
                  const slotNum = productSlotNumberMap.get(p.id);
                  const discPercent = calcDiscountPercent(p.price, p.oldPrice);

                  return (
                    <div
                      key={p.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStartFromCatalog(e, p)}
                      onDragEnd={handleDragEnd}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-3 bg-white dark:bg-zinc-900 transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-md select-none ${
                        isAssigned
                          ? "border-rose-300 dark:border-rose-700/60 ring-2 ring-rose-400/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-700"
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] font-semibold text-zinc-400">
                          #{p.id}
                        </span>

                        {isAssigned ? (
                          <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-black shadow-xs">
                            Ô #{slotNum}
                          </span>
                        ) : discPercent > 0 ? (
                          <span className="rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 text-[10px] font-black">
                            -{discPercent}%
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 text-[10px] font-semibold">
                            Chưa chọn
                          </span>
                        )}
                      </div>

                      {/* Image Thumbnail */}
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-1 mb-2">
                        {p.images?.[0] ? (
                          <Image
                            src={getAssetPath(p.images[0])}
                            alt={p.name}
                            fill
                            className="object-contain pointer-events-none group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="h-full w-full bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="mb-2">
                        <h4 className="font-bold text-xs uppercase text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="font-bold text-xs text-rose-600 dark:text-rose-400">
                            {formatPrice(p.price)}
                          </span>
                          {p.oldPrice && p.oldPrice > p.price && (
                            <span className="text-[10px] text-zinc-400 line-through">
                              {formatPrice(p.oldPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => handleQuickAddToNextEmptySlot(p)}
                        className={`w-full rounded-xl py-1.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                          isAssigned
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60"
                            : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60"
                        }`}
                      >
                        {isAssigned ? (
                          <>
                            <CloseIcon className="h-3 w-3" />
                            Gỡ khỏi ô #{slotNum}
                          </>
                        ) : (
                          <>
                            <PlusIcon className="h-3 w-3" />
                            Đưa vào ô
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT 2: Danh sách thứ tự các Ô sản phẩm giảm giá (Dual-view) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>🎯 Cột 2: Thứ Tự Hiển Thị Khuyến Mãi</span>
                </h3>
              </div>

              {/* View Mode Switcher for Column 2: Grid vs Reorder List */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setColumn2View("grid")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      column2View === "grid"
                        ? "bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-xs"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>📱 Lưới ô</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setColumn2View("list")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      column2View === "list"
                        ? "bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-xs"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>📋 DS Reorder (▲▼)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bộ điều khiển số lượng ô Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 gap-2 text-xs">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <span>⚙️ Số lượng ô banner hiển thị:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[10, 20, 30].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSlotCountChange(num)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      slotCount === num
                        ? "bg-rose-600 text-white shadow-xs scale-105"
                        : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {num} ô {num === 20 && "(Mặc định)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm space-y-5">
              {column2View === "grid" ? (
                /* CHẾ ĐỘ 1: LƯỚI Ô ĐỘNG (Dynamic Rows x 5 Cột) */
                <div className="space-y-5">
                  {Array.from({ length: Math.ceil(slotCount / 5) }).map((_, rowIdx) => {
                    const start = rowIdx * 5;
                    const end = Math.min(start + 5, slotCount);
                    const rowSlots = localSlots.slice(start, end);

                    return (
                      <div key={rowIdx}>
                        <div className="flex items-center justify-between mb-2.5 px-1">
                          <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                            Hàng {rowIdx + 1} (Vị trí #{start + 1} ➔ #{end})
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {rowIdx === 0 ? "5 ô đầu (Ưu tiên / LCP)" : `${end - start} ô tiếp theo`}
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-2.5">
                          {rowSlots.map((p, i) => {
                            const slotIndex = start + i;
                            const slotNum = slotIndex + 1;
                            const isDragOver = dragOverIndex === slotIndex;
                            const discPercent = p ? calcDiscountPercent(p.price, p.oldPrice) : 0;

                            return (
                              <div
                                key={slotIndex}
                                onDragOver={(e) => handleDragOver(e, slotIndex)}
                                onDragLeave={(e) => handleDragLeave(e, slotIndex)}
                                onDrop={(e) => handleDrop(e, slotIndex)}
                                draggable={Boolean(p)}
                                onDragStart={(e) => {
                                  if (p) handleDragStartFromSlot(e, slotIndex, p);
                                }}
                                onDragEnd={handleDragEnd}
                                className={`relative flex flex-col justify-between rounded-2xl border p-2 text-center transition-all duration-200 select-none min-h-[195px] ${
                                  isDragOver
                                    ? "border-rose-500 ring-4 ring-rose-500/20 bg-rose-50/60 dark:bg-rose-950/40 scale-105 z-10"
                                    : p
                                    ? "border-rose-300 dark:border-rose-700/60 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs cursor-grab active:cursor-grabbing hover:shadow-md"
                                    : "border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20 hover:border-rose-400"
                                }`}
                              >
                                {/* Slot Header Badge */}
                                <div className="flex items-center justify-between mb-1">
                                  <span
                                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shadow-2xs ${
                                      slotNum === 1
                                        ? "bg-rose-500 text-white"
                                        : slotNum === 2
                                        ? "bg-orange-500 text-white"
                                        : slotNum === 3
                                        ? "bg-amber-600 text-white"
                                        : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                    }`}
                                  >
                                    #{slotNum}
                                  </span>

                                  {p && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSlot(slotIndex)}
                                      className="text-zinc-400 hover:text-rose-500 transition-colors p-0.5 cursor-pointer"
                                      title="Gỡ khỏi ô này"
                                    >
                                      <CloseIcon className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>

                                {p ? (
                                  <div className="flex flex-col items-center flex-1 justify-between">
                                    <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-0.5 mb-1">
                                      {p.images?.[0] ? (
                                        <Image
                                          src={getAssetPath(p.images[0])}
                                          alt={p.name}
                                          fill
                                          className="object-contain pointer-events-none"
                                        />
                                      ) : (
                                        <div className="h-full w-full bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                                      )}
                                    </div>

                                    <p className="text-[10px] font-bold uppercase text-zinc-900 dark:text-white line-clamp-2 leading-tight mb-1">
                                      {p.name}
                                    </p>

                                    <div className="w-full">
                                      <div className="flex items-center justify-center gap-1 flex-wrap">
                                        <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 block truncate">
                                          {formatPrice(p.price)}
                                        </span>
                                        {discPercent > 0 && (
                                          <span className="rounded bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 px-1 py-0.2 text-[8px] font-black">
                                            -{discPercent}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-6 flex-1 text-zinc-400">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-1.5">
                                      <PlusIcon className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-[10px] font-semibold">
                                      Ô #{slotNum} trống
                                    </span>
                                    <span className="text-[8px] text-zinc-400 mt-0.5">
                                      Thả vào đây
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* CHẾ ĐỘ 2: DANH SÁCH REORDER (Kéo thả ⠿ + Nút ⬆⬇ trực quan) */
                <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 mb-3">
                    <span>💡</span>
                    <span>
                      <strong>Mẹo sắp xếp nhanh:</strong> Bạn có thể nhấn nút <strong>▲</strong> hoặc <strong>▼</strong> để hoán đổi vị trí ngay lập tức, hoặc nắm giữ biểu tượng <strong>⠿</strong> để kéo thả.
                    </span>
                  </div>

                  {localSlots.map((p, idx) => {
                    const slotNum = idx + 1;
                    const isDragOver = dragOverIndex === idx;
                    const discPercent = p ? calcDiscountPercent(p.price, p.oldPrice) : 0;

                    return (
                      <div
                        key={idx}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={(e) => handleDragLeave(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        draggable={Boolean(p)}
                        onDragStart={(e) => {
                          if (p) handleDragStartFromSlot(e, idx, p);
                        }}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all select-none ${
                          isDragOver
                            ? "border-rose-500 ring-4 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 scale-[1.01]"
                            : p
                            ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-rose-300 dark:hover:border-rose-700 shadow-2xs cursor-grab active:cursor-grabbing"
                            : "border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/10 text-zinc-400"
                        }`}
                      >
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg px-1 select-none font-bold"
                            title="Kéo thả để đổi thứ tự"
                          >
                            ⠿
                          </span>
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black shadow-2xs ${
                              slotNum <= 3
                                ? "bg-rose-500 text-white"
                                : slotNum <= 5
                                ? "bg-orange-500 text-white"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                            }`}
                          >
                            #{slotNum}
                          </span>
                        </div>

                        {p ? (
                          <>
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-0.5">
                              {p.images?.[0] ? (
                                <Image
                                  src={getAssetPath(p.images[0])}
                                  alt={p.name}
                                  fill
                                  className="object-contain pointer-events-none"
                                />
                              ) : (
                                <div className="h-full w-full bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold uppercase text-zinc-900 dark:text-white truncate">
                                {p.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                                  {formatPrice(p.price)}
                                </span>
                                {discPercent > 0 && (
                                  <span className="rounded bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 px-1.5 py-0.2 text-[10px] font-black">
                                    -{discPercent}%
                                  </span>
                                )}
                                {p.oldPrice && p.oldPrice > p.price && (
                                  <span className="text-[10px] text-zinc-400 line-through">
                                    {formatPrice(p.oldPrice)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveSlot(idx, "up")}
                                disabled={idx === 0}
                                className="h-7 w-7 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-20 disabled:hover:bg-zinc-50 disabled:hover:text-inherit flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                                title="Đưa lên trên 1 vị trí"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveSlot(idx, "down")}
                                disabled={idx === slotCount - 1}
                                className="h-7 w-7 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-20 disabled:hover:bg-zinc-50 disabled:hover:text-inherit flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                                title="Đưa xuống dưới 1 vị trí"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSlot(idx)}
                                className="h-7 w-7 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors cursor-pointer ml-1"
                                title="Gỡ sản phẩm khỏi ô"
                              >
                                <CloseIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-between py-1 text-xs text-zinc-400">
                            <span className="italic">Ô #{slotNum} đang trống (kéo thả sản phẩm vào đây)</span>
                            <div className="h-6 w-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                              <PlusIcon className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Quick Save Footer inside Column 2 */}
              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <span className="text-xs text-zinc-400">
                  {!isSaved ? "⚠️ Có thay đổi chưa lưu" : "✓ Đã lưu đồng bộ"}
                </span>

                <button
                  onClick={handleSaveChanges}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer ${
                    !isSaved
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-zinc-700 hover:bg-zinc-600"
                  }`}
                >
                  💾 Lưu {slotCount} vị trí
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List Mode: Table of all discounted products */}
      {previewMode === "list" && (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Danh Sách Tất Cả Sản Phẩm Có Giảm Giá ({allDiscountedProducts.length})
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Bảng thống kê toàn bộ sản phẩm có giá gốc (oldPrice) cao hơn giá bán (price)
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoFillTopDiscount}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <BoltIcon className="h-3.5 w-3.5" />
              <span>Lấy Top 10 Giảm Giá Điền Vào Ô</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="py-3 px-3">Mã SP</th>
                  <th className="py-3 px-3">Sản phẩm</th>
                  <th className="py-3 px-3">Giá bán</th>
                  <th className="py-3 px-3">Giá gốc</th>
                  <th className="py-3 px-3 text-center">% Giảm</th>
                  <th className="py-3 px-3">Tiết kiệm</th>
                  <th className="py-3 px-3 text-center">Đánh giá</th>
                  <th className="py-3 px-3 text-center">Tồn kho</th>
                  <th className="py-3 px-3 text-center">Vị trí ô</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[...allDiscountedProducts]
                  .sort((a, b) => {
                    const discA = calcDiscountPercent(a.price, a.oldPrice);
                    const discB = calcDiscountPercent(b.price, b.oldPrice);
                    return discB - discA;
                  })
                  .map((p) => {
                    const discPercent = calcDiscountPercent(p.price, p.oldPrice);
                    const discAmount = calcDiscountAmount(p.price, p.oldPrice);
                    const isAssigned = activeSlotProductIds.has(p.id);
                    const slotNum = productSlotNumberMap.get(p.id);

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-zinc-400">
                          #{p.id}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                              {p.images?.[0] ? (
                                <Image
                                  src={getAssetPath(p.images[0])}
                                  alt={p.name}
                                  fill
                                  className="object-contain"
                                />
                              ) : null}
                            </div>
                            <span className="font-bold text-zinc-900 dark:text-white line-clamp-1 max-w-[220px]">
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400">
                          {formatPrice(p.price)}
                        </td>
                        <td className="py-3 px-3 text-zinc-400 line-through">
                          {p.oldPrice ? formatPrice(p.oldPrice) : "-"}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 px-2 py-0.5 font-black">
                            -{discPercent}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatPrice(discAmount)}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-zinc-700 dark:text-zinc-300">
                          ★ {p.rating} ({p.reviews})
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-zinc-600 dark:text-zinc-400">
                          {p.stock}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isAssigned ? (
                            <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-black">
                              Ô #{slotNum}
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-[10px]">Chưa gán</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleQuickAddToNextEmptySlot(p)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                              isAssigned
                                ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-200"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                            }`}
                          >
                            {isAssigned ? "Gỡ bỏ" : "+ Gán vào ô"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Preview Mode */}
      {previewMode === "preview" && (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Xem trước giao diện &quot;Sản Phẩm Giảm Giá Nổi Bật&quot;
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Mô phỏng hiển thị {slotCount} ô sản phẩm khuyến mãi trên giao diện khách hàng
              </p>
            </div>
            <span className="rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-3 py-1 text-xs font-bold">
              {activeCount}/{slotCount} sản phẩm
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {localSlots.map((product, idx) => {
              if (!product) {
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-zinc-400 min-h-[220px]"
                  >
                    <span className="text-xs font-bold">Vị trí #{idx + 1} trống</span>
                  </div>
                );
              }

              const discPercent = calcDiscountPercent(product.price, product.oldPrice);

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-black">
                      #{idx + 1}
                    </span>
                    {discPercent > 0 && (
                      <span className="rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 text-[10px] font-black">
                        -{discPercent}%
                      </span>
                    )}
                  </div>

                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-800 mb-2">
                    {product.images?.[0] && (
                      <Image
                        src={getAssetPath(product.images[0])}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase text-zinc-900 dark:text-white line-clamp-2">
                      {product.name}
                    </h4>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                        {formatPrice(product.price)}
                      </span>
                      {product.oldPrice && product.oldPrice > product.price && (
                        <span className="text-[10px] text-zinc-400 line-through">
                          {formatPrice(product.oldPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
