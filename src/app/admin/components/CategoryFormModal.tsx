"use client";

import { useState, useEffect } from "react";
import { Category } from "@/data/categories";
import CloseIcon from "@/components/icons/CloseIcon";
import {
  ToothIcon,
  PillIcon,
  HeartIcon,
  EyeIcon,
  DropIcon,
  ShirtIcon,
  DeviceIcon,
  HomeIcon,
  SparklesIcon,
} from "@/components/icons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (catData: Category) => void;
  initialCategory?: Category | null;
  existingCount: number;
}

const AVAILABLE_ICONS = [
  { name: "ToothIcon", label: "Răng miệng", Icon: ToothIcon },
  { name: "PillIcon", label: "Thuốc / TPCN", Icon: PillIcon },
  { name: "HeartIcon", label: "Sức khỏe / Nữ", Icon: HeartIcon },
  { name: "EyeIcon", label: "Mắt / Thị lực", Icon: EyeIcon },
  { name: "DropIcon", label: "Serum / Tinh chất", Icon: DropIcon },
  { name: "ShirtIcon", label: "Thời trang", Icon: ShirtIcon },
  { name: "DeviceIcon", label: "Thiết bị", Icon: DeviceIcon },
  { name: "HomeIcon", label: "Gia dụng", Icon: HomeIcon },
  { name: "SparklesIcon", label: "Làm đẹp / Khác", Icon: SparklesIcon },
] as const;

const GRADIENT_PRESETS = [
  {
    name: "Xanh Cyan - Indigo",
    value: "from-cyan-500 via-blue-500 to-indigo-600",
    badge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
  {
    name: "Cam Hổ Phách - Rose",
    value: "from-amber-500 via-orange-500 to-rose-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  {
    name: "Hồng - Fuchsia",
    value: "from-pink-500 via-rose-400 to-fuchsia-500",
    badge: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  },
  {
    name: "Xanh Dương - Sky",
    value: "from-blue-600 via-indigo-500 to-sky-400",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    name: "Xanh Lá - Emerald",
    value: "from-emerald-500 via-teal-500 to-cyan-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    name: "Tím - Violet",
    value: "from-purple-600 via-violet-500 to-indigo-500",
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
];

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSave,
  initialCategory,
  existingCount,
}: Props) {
  const isEdit = Boolean(initialCategory);

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState<Category["iconName"]>("SparklesIcon");
  const [selectedGradientIndex, setSelectedGradientIndex] = useState(0);

  useEffect(() => {
    if (initialCategory) {
      setId(initialCategory.id);
      setName(initialCategory.name);
      setDescription(initialCategory.description || "");
      setIconName(initialCategory.iconName || "SparklesIcon");

      const matchedGradIdx = GRADIENT_PRESETS.findIndex(
        (g) => g.value === initialCategory.bannerGradient
      );
      setSelectedGradientIndex(matchedGradIdx >= 0 ? matchedGradIdx : 0);
    } else {
      const nextNum = String(existingCount + 1).padStart(2, "0");
      setId(`C-${nextNum}`);
      setName("");
      setDescription("");
      setIconName("SparklesIcon");
      setSelectedGradientIndex(0);
    }
  }, [initialCategory, existingCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }

    const currentGrad = GRADIENT_PRESETS[selectedGradientIndex] || GRADIENT_PRESETS[0];

    const categoryData: Category = {
      id: id.trim() || `C-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      iconName,
      bannerGradient: currentGrad.value,
      badgeColor: currentGrad.badge,
      itemCountText: initialCategory?.itemCountText || "0 sản phẩm",
      subcategories: initialCategory?.subcategories,
    };

    onSave(categoryData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {isEdit ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isEdit ? `Mã danh mục: #${id}` : "Nhập thông tin nhóm ngành hàng sản phẩm"}
            </p>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 shadow-sm transition-colors cursor-pointer"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors ml-1 cursor-pointer"
              title="Đóng"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Tên & Mã */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Mã danh mục (ID)</span>
                <span className="text-[10px] text-zinc-400 font-normal lowercase tracking-normal bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Tự động</span>
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={id}
                placeholder="VD: C-05"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 outline-none font-mono cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Tên danh mục <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Chăm Sóc Da Mặt"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-semibold"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Mô tả ngắn gọn danh mục
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả công dụng và các dòng sản phẩm trong danh mục này..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
            />
          </div>

          {/* Chọn Icon */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              Biểu tượng đại diện (Icon)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {AVAILABLE_ICONS.map(({ name: iName, label, Icon }) => {
                const isSelected = iconName === iName;
                return (
                  <button
                    key={iName}
                    type="button"
                    onClick={() => setIconName(iName as Category["iconName"])}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-[10px] text-center leading-tight truncate w-full">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tông màu / Gradient */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              Chủ đề màu sắc / Banner
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GRADIENT_PRESETS.map((preset, idx) => {
                const isSelected = selectedGradientIndex === idx;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setSelectedGradientIndex(idx)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/30 font-semibold"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-lg bg-gradient-to-r ${preset.value} shrink-0 shadow-xs`}
                    />
                    <span className="text-[11px] text-zinc-800 dark:text-zinc-200 line-clamp-1">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

