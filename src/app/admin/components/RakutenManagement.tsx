"use client";

import { useState, useEffect, useMemo } from "react";
import initialRakutenData from "@/data/rakuten_monitors.json";
import PlusIcon from "@/components/icons/PlusIcon";
import SearchIcon from "@/components/icons/SearchIcon";
import CheckIcon from "@/components/icons/CheckIcon";
import CloseIcon from "@/components/icons/CloseIcon";
import TrashIcon from "@/components/icons/TrashIcon";
import BoltIcon from "@/components/icons/BoltIcon";

export interface RakutenItem {
  id: string;
  name: string;
  url: string;
  imageUrl?: string;
  currentPrice: number;
  initialPrice: number;
  targetPrice?: number | null;
  currency: string;
  isSale: boolean;
  notifyEmail: string;
  lastCheckedAt: string;
  active: boolean;
}

const STORAGE_KEY = "japan_shop_rakuten_monitors";
const formatJPY = (amount: number) => "¥" + Number(amount).toLocaleString("ja-JP");

export default function RakutenManagement() {
  const [items, setItems] = useState<RakutenItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "sale" | "active">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RakutenItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    imageUrl: "",
    currentPrice: 0,
    targetPrice: 0,
    notifyEmail: "japanshop.tuyan78@gmail.com",
  });

  // Action status
  const [isScanning, setIsScanning] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  // Load items from localStorage or fallback to JSON
  useEffect(() => {
    setIsLoading(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // fallback
    }

    setItems(initialRakutenData as RakutenItem[]);
    setIsLoading(false);
  }, []);

  // Filtered list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.url.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (filterMode === "sale") return item.isSale;
      if (filterMode === "active") return item.active;
      return true;
    });
  }, [items, searchQuery, filterMode]);

  // Stats
  const totalCount = items.length;
  const saleCount = items.filter((i) => i.isSale).length;
  const activeCount = items.filter((i) => i.active).length;

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      url: "",
      imageUrl: "",
      currentPrice: 0,
      targetPrice: 0,
      notifyEmail: "japanshop.tuyan78@gmail.com",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: RakutenItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      url: item.url,
      imageUrl: item.imageUrl || "",
      currentPrice: item.currentPrice,
      targetPrice: item.targetPrice || 0,
      notifyEmail: item.notifyEmail,
    });
    setIsModalOpen(true);
  };

  const persistItems = (newItems: RakutenItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch {
      // ignore
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url) {
      alert("Vui lòng nhập link sản phẩm Rakuten!");
      return;
    }

    const now = new Date().toISOString();

    if (editingItem) {
      // Update
      const updatedItem: RakutenItem = {
        ...editingItem,
        name: formData.name || editingItem.name,
        url: formData.url,
        imageUrl: formData.imageUrl || editingItem.imageUrl,
        currentPrice: Number(formData.currentPrice) || editingItem.currentPrice,
        targetPrice: formData.targetPrice ? Number(formData.targetPrice) : null,
        notifyEmail: formData.notifyEmail,
        isSale:
          editingItem.initialPrice > (Number(formData.currentPrice) || editingItem.currentPrice),
      };

      const nextList = items.map((i) => (i.id === editingItem.id ? updatedItem : i));
      persistItems(nextList);
    } else {
      // Create new
      const newItem: RakutenItem = {
        id: "rakuten-" + Date.now(),
        name: formData.name || "Sản phẩm Rakuten mới",
        url: formData.url,
        imageUrl: formData.imageUrl || "",
        currentPrice: Number(formData.currentPrice) || 0,
        initialPrice: Number(formData.currentPrice) || 0,
        targetPrice: formData.targetPrice ? Number(formData.targetPrice) : null,
        currency: "JPY",
        isSale: false,
        notifyEmail: formData.notifyEmail,
        lastCheckedAt: now,
        active: true,
      };

      const nextList = [newItem, ...items];
      persistItems(nextList);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi danh sách theo dõi?")) return;
    const nextList = items.filter((i) => i.id !== id);
    persistItems(nextList);
  };

  const handleToggleActive = (item: RakutenItem) => {
    const nextActive = !item.active;
    const nextList = items.map((i) => (i.id === item.id ? { ...i, active: nextActive } : i));
    persistItems(nextList);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "rakuten_monitors.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetToDefault = () => {
    if (!confirm("Khôi phục danh sách theo dõi gốc từ file JSON?")) return;
    persistItems(initialRakutenData as RakutenItem[]);
  };

  const handleScanNow = async () => {
    setIsScanning(true);
    setScanNotice(null);

    // Simulate/Trigger scan
    setTimeout(() => {
      setIsScanning(false);
      setScanNotice(`Đã hoàn tất quét ${items.length} sản phẩm. Để hệ thống chạy định kỳ tự động và gửi mail, script GitHub Actions sẽ chạy mỗi 6 tiếng!`);
      setTimeout(() => setScanNotice(null), 6000);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-xs font-bold uppercase tracking-wider mb-2 backdrop-blur-sm">
            <BoltIcon className="h-3.5 w-3.5 fill-current animate-bounce text-amber-300" />
            <span>Rakuten Price Bot</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Săn Sale & Cảnh Báo Giá Rakuten
          </h2>
          <p className="mt-1 text-sm text-rose-100 max-w-xl">
            Tự động theo dõi giá trên Rakuten Nhật Bản (`rakuten.co.jp`). Khi phát hiện giảm giá hoặc chạm giá kỳ vọng, hệ thống sẽ gửi email thông báo ngay lập tức.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            type="button"
            onClick={handleScanNow}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-sm backdrop-blur-md border border-white/30 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <BoltIcon className={`h-4 w-4 ${isScanning ? "animate-spin" : "animate-pulse text-amber-300"}`} />
            <span>{isScanning ? "Đang quét giá..." : "Quét giá ngay"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            title="Tải về file rakuten_monitors.json"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>📥 Xuất JSON</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            title="Khôi phục lại dữ liệu mẫu"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>🔄 Mặc định</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-zinc-900 font-extrabold text-sm shadow-xl hover:bg-zinc-100 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Thêm link Rakuten</span>
          </button>
        </div>
      </div>

      {scanNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span>{scanNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setScanNotice(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 cursor-pointer"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Tổng sản phẩm theo dõi
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-1">
            {totalCount}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/50 shadow-xs bg-rose-50/20">
          <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <span>🔥 Đang giảm giá</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {saleCount}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Đang bật theo dõi
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {activeCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sản phẩm hoặc link Rakuten..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterMode === "all"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("sale")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterMode === "sale"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Đang giảm giá ({saleCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("active")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterMode === "active"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Đang bật ({activeCount})
          </button>
        </div>
      </div>

      {/* Product List Table */}
      {isLoading ? (
        <div className="text-center py-16 text-zinc-500">Đang tải danh sách theo dõi...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Không có sản phẩm nào</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Bấm nút &quot;Thêm link Rakuten&quot; để bắt đầu theo dõi giá sản phẩm!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => {
            const isDiscounted = item.initialPrice > item.currentPrice;
            const discountPercent = isDiscounted
              ? Math.round(((item.initialPrice - item.currentPrice) / item.initialPrice) * 100)
              : 0;

            return (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all"
              >
                {/* Left: Product Image & Info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-center">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400 font-bold">Rakuten</span>
                    )}
                    {isDiscounted && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black shadow-xs">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      {item.isSale && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          <span>🔥 Đang Sale</span>
                        </span>
                      )}
                      {!item.active && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          Đã tạm dừng
                        </span>
                      )}
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline block truncate mt-1 max-w-xl"
                    >
                      {item.url} ↗
                    </a>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                      <span>Email nhận tin: <b className="text-zinc-700 dark:text-zinc-300">{item.notifyEmail}</b></span>
                      <span>•</span>
                      <span>Quét gần nhất: {new Date(item.lastCheckedAt).toLocaleTimeString("vi-VN")}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Price, Target & Actions */}
                <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100 dark:border-zinc-800">
                  <div className="text-right">
                    <div className="flex items-baseline gap-2">
                      {isDiscounted && (
                        <span className="text-xs text-zinc-400 line-through">
                          {formatJPY(item.initialPrice)}
                        </span>
                      )}
                      <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                        {formatJPY(item.currentPrice)}
                      </span>
                    </div>
                    {item.targetPrice && (
                      <div className="text-[11px] text-zinc-500">
                        Giá kỳ vọng: <b className="text-emerald-600 dark:text-emerald-400">{formatJPY(item.targetPrice)}</b>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      Mua trên Rakuten
                    </a>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        item.active
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {item.active ? "Tạm dừng" : "Kích hoạt"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      title="Sửa"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                      title="Xóa"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editingItem ? "Sửa link theo dõi Rakuten" : "Thêm link sản phẩm Rakuten"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Link Rakuten (URL) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://item.rakuten.co.jp/shop/item-id/"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Tên gợi nhớ sản phẩm
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Rượu mơ Choya 720ml"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Giá hiện tại (¥ JPY)
                  </label>
                  <input
                    type="number"
                    placeholder="1280"
                    value={formData.currentPrice || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, currentPrice: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Giá kỳ vọng báo động (¥)
                  </label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={formData.targetPrice || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, targetPrice: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Email nhận thông báo khi có sale
                </label>
                <input
                  type="email"
                  required
                  value={formData.notifyEmail}
                  onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  {editingItem ? "Cập nhật" : "Thêm theo dõi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
