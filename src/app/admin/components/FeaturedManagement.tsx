"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useProductData } from "@/context/ProductDataContext";
import { Product } from "@/data/products";
import { getAssetPath } from "@/utils/assetPath";
import SearchIcon from "@/components/icons/SearchIcon";
import StarIcon from "@/components/icons/StarIcon";
import PlusIcon from "@/components/icons/PlusIcon";
import CloseIcon from "@/components/icons/CloseIcon";

const MAX_FEATURED_SLOTS = 10;

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

const calcDiscount = (price: number, oldPrice?: number) => {
  if (oldPrice && oldPrice > price) {
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }
  return 0;
};

const PRESET_TAGS = [
  "Bán chạy nhất",
  "Bán chạy",
  "Hot",
  "Mới",
  "Khuyên dùng",
  "Ưu đãi hot",
];

interface DragPayload {
  source: "catalog" | "slot";
  product: Product;
  fromSlotIndex?: number;
}

export default function FeaturedManagement() {
  const {
    products,
    categories,
    getProductsByBanner,
    getCategoryIdByProductId,
    updateProduct,
    setBannerProducts,
  } = useProductData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [previewMode, setPreviewMode] = useState<"table" | "preview">("table");

  // Local working state for the 10 slots (index 0 to 9)
  const [localSlots, setLocalSlots] = useState<(Product | null)[]>(() =>
    Array(MAX_FEATURED_SLOTS).fill(null)
  );

  // Drag state
  const [draggedItem, setDraggedItem] = useState<DragPayload | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [saveToast, setSaveToast] = useState(false);

  // Initialize localSlots from saved context on mount or when context changes
  useEffect(() => {
    const featured = getProductsByBanner("featured", MAX_FEATURED_SLOTS);
    const initial: (Product | null)[] = Array(MAX_FEATURED_SLOTS).fill(null);
    featured.forEach((p, idx) => {
      if (idx < MAX_FEATURED_SLOTS) {
        initial[idx] = p;
      }
    });
    setLocalSlots(initial);
    setIsSaved(true);
  }, [getProductsByBanner]);

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

  // Filtered products for Column 1 (Catalog)
  const filteredCatalogProducts = useMemo(() => {
    return products.filter((p) => {
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
  }, [products, selectedCategory, searchQuery, getCategoryIdByProductId]);

  // Count active slots
  const activeCount = useMemo(() => {
    return localSlots.filter(Boolean).length;
  }, [localSlots]);

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
        tag: payload.product.tag || "Bán chạy",
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
    // Filter out the removed slot and keep all other active products in order
    const remainingProducts = localSlots
      .filter((_, idx) => idx !== slotIndex)
      .filter((p): p is Product => p !== null);

    // Reconstruct the 10 slots with all remaining products collapsed to the front
    const nextSlots: (Product | null)[] = Array(MAX_FEATURED_SLOTS).fill(null);
    remainingProducts.forEach((p, idx) => {
      if (idx < MAX_FEATURED_SLOTS) {
        nextSlots[idx] = p;
      }
    });

    setLocalSlots(nextSlots);
    setIsSaved(false);
  };

  const handleQuickAddToNextEmptySlot = (product: Product) => {
    const existingIdx = localSlots.findIndex((p) => p && p.id === product.id);

    if (existingIdx !== -1) {
      // Toggle off and auto-collapse
      handleRemoveSlot(existingIdx);
      return;
    }

    const nextSlots = [...localSlots];
    const firstEmptyIdx = nextSlots.findIndex((p) => p === null);
    if (firstEmptyIdx === -1) {
      alert(
        `Đã đầy 10/10 ô sản phẩm bán chạy! Bạn có thể kéo thả vào ô muốn thay thế.`
      );
      return;
    }

    nextSlots[firstEmptyIdx] = {
      ...product,
      tag: product.tag || "Bán chạy",
    };
    setLocalSlots(nextSlots);
    setIsSaved(false);
  };

  const handleTagChange = (slotIndex: number, newTag: string) => {
    const nextSlots = [...localSlots];
    const target = nextSlots[slotIndex];
    if (target) {
      nextSlots[slotIndex] = { ...target, tag: newTag };
      setLocalSlots(nextSlots);
      setIsSaved(false);
    }
  };

  // --- Save Changes to Database / Context ---
  const handleSaveChanges = () => {
    const productIds: string[] = [];
    localSlots.forEach((p) => {
      if (p) {
        productIds.push(p.id);
      }
    });

    setBannerProducts("featured", productIds);

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
      const featured = getProductsByBanner("featured", MAX_FEATURED_SLOTS);
      const initial: (Product | null)[] = Array(MAX_FEATURED_SLOTS).fill(null);
      featured.forEach((p, idx) => {
        if (idx < MAX_FEATURED_SLOTS) {
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
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
            <span>Kéo & Thả Sản Phẩm • 10 Vị Trí</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Quản Lý Sản Phẩm Bán Chạy
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Kéo thả sản phẩm từ Cột 1 sang 10 ô vị trí ở Cột 2 (hoặc kéo đổi vị trí giữa các ô)
          </p>
        </div>

        {/* Header Action Buttons & Save Button */}
        <div className="flex flex-wrap items-center gap-2.5">
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

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 p-4 text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✓</span>
            <span className="text-sm font-bold">
              Đã lưu thành công thứ tự và danh sách 10 ô sản phẩm bán chạy!
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Ô đã kích hoạt
          </span>
          <p className="mt-2 text-3xl font-black text-amber-500">
            {activeCount}{" "}
            <span className="text-sm font-normal text-zinc-400">/ {MAX_FEATURED_SLOTS}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Top #1 Bán chạy
          </span>
          <p className="mt-2 text-sm font-bold text-zinc-900 dark:text-white line-clamp-2">
            {localSlots[0]?.name || "(Chưa gán vị trí #1)"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Trạng thái lưu
          </span>
          <p
            className={`mt-2 text-sm font-bold flex items-center gap-1.5 ${
              isSaved
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-500 animate-pulse"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isSaved ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {isSaved ? "Đã đồng bộ" : "Chưa lưu thay đổi"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Chế độ xem
          </span>
          <div className="mt-2 flex items-center gap-1.5">
            <button
              onClick={() => setPreviewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                previewMode === "table"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Kéo thả 2 Cột
            </button>
            <button
              onClick={() => setPreviewMode("preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
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

      {/* Main 2-Column Drag and Drop Area */}
      {previewMode === "table" ? (
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
            <div className="flex flex-col sm:flex-row gap-2.5 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
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

            {/* Product Cards Grid in Column 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[680px] overflow-y-auto pr-1">
              {filteredCatalogProducts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-zinc-400">
                  Không tìm thấy sản phẩm nào phù hợp.
                </div>
              ) : (
                filteredCatalogProducts.map((p) => {
                  const isAssigned = activeSlotProductIds.has(p.id);
                  const slotNum = productSlotNumberMap.get(p.id);

                  return (
                    <div
                      key={p.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStartFromCatalog(e, p)}
                      onDragEnd={handleDragEnd}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-3 bg-white dark:bg-zinc-900 transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-md select-none ${
                        isAssigned
                          ? "border-amber-300 dark:border-amber-700/60 ring-2 ring-amber-400/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] font-semibold text-zinc-400">
                          #{p.id}
                        </span>

                        {isAssigned ? (
                          <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-black shadow-xs">
                            Ô #{slotNum}
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
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                            {formatPrice(p.price)}
                          </span>
                          {p.oldPrice && p.oldPrice > p.price && (
                            <>
                              <span className="text-[10px] text-zinc-400 line-through">
                                {formatPrice(p.oldPrice)}
                              </span>
                              <span className="rounded bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 px-1 py-0.2 text-[9px] font-black">
                                -{calcDiscount(p.price, p.oldPrice)}%
                              </span>
                            </>
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
                            : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
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

          {/* CỘT 2: Danh sách thứ tự 10 Ô sản phẩm hiển thị theo 2 hàng (Mỗi hàng 5 ô) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>🎯 Cột 2: Thứ Tự 10 Ô Hiển Thị</span>
                <span className="rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-xs font-black">
                  {activeCount}/10 ô
                </span>
              </h3>
              <span className="text-[11px] text-zinc-400 italic">
                (Kéo đổi vị trí giữa các ô)
              </span>
            </div>

            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm space-y-5">
              {/* HÀNG 1: Vị trí #1 - #5 */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Hàng 1 (Vị trí #1 ➔ #5)
                  </span>
                  <span className="text-[11px] text-zinc-400">5 ô hàng đầu</span>
                </div>

                <div className="grid grid-cols-5 gap-2.5">
                  {localSlots.slice(0, 5).map((p, i) => {
                    const slotIndex = i;
                    const slotNum = i + 1;
                    const isDragOver = dragOverIndex === slotIndex;

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
                        className={`relative flex flex-col justify-between rounded-2xl border p-2 text-center transition-all duration-200 select-none min-h-[190px] ${
                          isDragOver
                            ? "border-indigo-500 ring-4 ring-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-950/40 scale-105 z-10"
                            : p
                            ? "border-amber-300 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs cursor-grab active:cursor-grabbing hover:shadow-md"
                            : "border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20 hover:border-indigo-400"
                        }`}
                      >
                        {/* Slot Header Badge */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shadow-2xs ${
                              slotNum === 1
                                ? "bg-amber-500 text-white"
                                : slotNum === 2
                                ? "bg-zinc-400 dark:bg-zinc-600 text-white"
                                : slotNum === 3
                                ? "bg-amber-700 text-white"
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

                            <p className="text-[10px] font-bold text-zinc-900 dark:text-white line-clamp-2 leading-tight mb-1">
                              {p.name}
                            </p>

                            <div className="w-full space-y-1">
                              <select
                                value={p.tag || "Bán chạy"}
                                onChange={(e) =>
                                  handleTagChange(slotIndex, e.target.value)
                                }
                                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[9px] font-bold py-0.5 px-1 text-zinc-800 dark:text-zinc-200 outline-none"
                              >
                                {PRESET_TAGS.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>

                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 block truncate">
                                  {formatPrice(p.price)}
                                </span>
                                {p.oldPrice && p.oldPrice > p.price && (
                                  <span className="rounded bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 px-1 py-0.2 text-[8px] font-black">
                                    -{calcDiscount(p.price, p.oldPrice)}%
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

              {/* HÀNG 2: Vị trí #6 - #10 */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Hàng 2 (Vị trí #6 ➔ #10)
                  </span>
                  <span className="text-[11px] text-zinc-400">5 ô hàng dưới</span>
                </div>

                <div className="grid grid-cols-5 gap-2.5">
                  {localSlots.slice(5, 10).map((p, i) => {
                    const slotIndex = i + 5;
                    const slotNum = slotIndex + 1;
                    const isDragOver = dragOverIndex === slotIndex;

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
                        className={`relative flex flex-col justify-between rounded-2xl border p-2 text-center transition-all duration-200 select-none min-h-[190px] ${
                          isDragOver
                            ? "border-indigo-500 ring-4 ring-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-950/40 scale-105 z-10"
                            : p
                            ? "border-amber-300 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs cursor-grab active:cursor-grabbing hover:shadow-md"
                            : "border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20 hover:border-indigo-400"
                        }`}
                      >
                        {/* Slot Header Badge */}
                        <div className="flex items-center justify-between mb-1">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
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

                            <p className="text-[10px] font-bold text-zinc-900 dark:text-white line-clamp-2 leading-tight mb-1">
                              {p.name}
                            </p>

                            <div className="w-full space-y-1">
                              <select
                                value={p.tag || "Bán chạy"}
                                onChange={(e) =>
                                  handleTagChange(slotIndex, e.target.value)
                                }
                                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[9px] font-bold py-0.5 px-1 text-zinc-800 dark:text-zinc-200 outline-none"
                              >
                                {PRESET_TAGS.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>

                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                 <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 block truncate">
                                   {formatPrice(p.price)}
                                 </span>
                                 {p.oldPrice && p.oldPrice > p.price && (
                                   <span className="rounded bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 px-1 py-0.2 text-[8px] font-black">
                                     -{calcDiscount(p.price, p.oldPrice)}%
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
                  💾 Lưu 10 vị trí
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live Preview Mode */
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Xem trước giao diện &quot;Sản Phẩm Bán Chạy&quot;
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Giao diện thực tế hiển thị tối đa {MAX_FEATURED_SLOTS} sản phẩm trên trang chủ
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 text-xs font-bold">
              ✓ Trực tiếp (Live)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-8">
            {localSlots
              .filter((p): p is Product => p !== null)
              .map((product) => {
                const prodCatId = getCategoryIdByProductId(product.id);
                const category = categories.find(
                  (c) => c.id === prodCatId
                );
                const categoryName = category ? category.name : "";

                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 p-2">
                        {product.images?.[0] ? (
                          <Image
                            src={getAssetPath(product.images[0])}
                            alt={product.name}
                            fill
                            className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-bold text-sm bg-black/25 backdrop-blur-md px-4 py-2 rounded-full">
                              {categoryName}
                            </span>
                          </div>
                        )}
                        {product.tag && (
                          <span className="absolute top-3 left-3 rounded-full bg-zinc-900/90 dark:bg-zinc-50/90 text-white dark:text-zinc-950 px-2.5 py-1 text-xs font-semibold shadow-xs z-10">
                            {product.tag}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex justify-between items-start">
                        <div>
                          {categoryName && (
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                              {categoryName}
                            </span>
                          )}
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white line-clamp-2">
                            {product.name}
                          </h3>
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-500">
                            <StarIcon className="h-4 w-4 fill-current" />
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                              {product.rating}
                            </span>
                            <span className="text-zinc-400">
                              ({product.reviews})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs text-zinc-400 line-through">
                          {product.oldPrice && product.oldPrice > product.price
                            ? formatPrice(product.oldPrice)
                            : "\u00A0"}
                        </span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          {formatPrice(product.price)}
                        </span>
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
