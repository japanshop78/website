"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product } from "@/data/products";
import { getAssetPath } from "@/utils/assetPath";
import CloseIcon from "@/components/icons/CloseIcon";
import CheckIcon from "@/components/icons/CheckIcon";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, "id"> & { id?: string; order?: number }) => void;
  initialProduct?: Product | null;
  initialOrder?: number;
}

const AVAILABLE_GALLERY_IMAGES = [
  { path: "/images/C-01-01.jpg", name: "C-01-01.jpg", desc: "Kem đánh răng Sunstar" },
  { path: "/images/C-01-02.jpg", name: "C-01-02.jpg", desc: "Nước súc miệng Propolinse" },
  { path: "/images/C-02-01.jpg", name: "C-02-01.jpg", desc: "Tăng chiều cao GH Creation" },
  { path: "/images/C-03-01.jpg", name: "C-03-01.jpg", desc: "Bọt vệ sinh Laurier" },
  { path: "/images/C-04-01.jpg", name: "C-04-01.jpg", desc: "Nhỏ mắt Santen PC" },
  { path: "/images/C-04-02.jpg", name: "C-04-02.jpg", desc: "Nhỏ mắt Rohto Vita" },
];

export default function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  initialProduct,
  initialOrder = 1,
}: Props) {
  const isEdit = Boolean(initialProduct);

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [oldPrice, setOldPrice] = useState<string>("");
  const [tag, setTag] = useState<string>("");
  const [stock, setStock] = useState<number>(100);
  const [order, setOrder] = useState<number>(1);
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [isCustomPath, setIsCustomPath] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setId(initialProduct.id);
      setName(initialProduct.name);
      setPrice(initialProduct.price);
      setOldPrice(initialProduct.oldPrice ? String(initialProduct.oldPrice) : "");
      setTag(initialProduct.tag || "");
      setStock(initialProduct.stock ?? 100);
      setOrder(initialOrder);
      const imgText = initialProduct.images && initialProduct.images.length > 0
        ? initialProduct.images.join("\n")
        : "/images/C-01-01.jpg";
      setImage(imgText);
      setDescription(initialProduct.description || "");
      setIngredients(initialProduct.ingredients || "");
    } else {
      // Defaults for new product
      setId("");
      setName("");
      setPrice(100000);
      setOldPrice("");
      setTag("Mới");
      setStock(100);
      setOrder(initialOrder);
      setImage("/images/C-01-01.jpg");
      setDescription("CÔNG DỤNG:\n- Công dụng 1...\n- Công dụng 2...");
      setIngredients("Xuất xứ: Nhật Bản\n\nThành phần:\n- ");
    }
  }, [initialProduct, initialOrder, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }

    const imgList = image.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    const finalImages = imgList.length > 0 ? imgList : ["/images/C-01-01.jpg"];

    onSave({
      id: isEdit ? id : id.trim() || undefined,
      name: name.trim(),
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : undefined,
      tag: tag.trim() || undefined,
      stock: Number(stock),
      order: Number(order),
      images: finalImages,
      description: description.trim(),
      ingredients: ingredients.trim() || undefined,
      rating: initialProduct?.rating ?? 5.0,
      reviews: initialProduct?.reviews ?? 0,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {isEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isEdit
                ? "Chỉnh sửa thông tin, hình ảnh & thành phần"
                : "Nhập đầy đủ thông tin để lưu sản phẩm vào hệ thống"}
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

        {/* Form Body - 2 Columns */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* CỘT 1 (Bên trái): Thông tin cơ bản, Giá bán, Hình ảnh, Mô tả */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  1. Thông Tin Sản Phẩm & Hình Ảnh
                </span>
              </div>

              {/* Tên sản phẩm */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tên sản phẩm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: VIÊN UỐNG TĂNG CHIỀU CAO..."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>

              {/* Giá & Giá cũ & Tồn kho */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Giá bán hiện tại (đ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Giá niêm yết cũ (đ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value)}
                    placeholder="Để trống nếu ko giảm"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Số lượng tồn kho
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Kho ảnh có sẵn trong public/images/ */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      Chọn ảnh sản phẩm
                    </label>
                    <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-[10px] font-bold">
                      public/images/
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomPath(!isCustomPath)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {isCustomPath ? "Ẩn nhập đường dẫn" : "Nhập đường dẫn khác"}
                  </button>
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {AVAILABLE_GALLERY_IMAGES.map((imgItem) => {
                    const isSelected = image === imgItem.path;

                    return (
                      <button
                        key={imgItem.path}
                        type="button"
                        onClick={() => {
                          setImage(imgItem.path);
                          setIsCustomPath(false);
                        }}
                        className={`group relative flex flex-col items-center rounded-xl p-1.5 border transition-all cursor-pointer ${
                          isSelected
                            ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-950/50 shadow-xs"
                            : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500"
                        }`}
                        title={imgItem.desc}
                      >
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-700/60 p-1 mb-1">
                          <Image
                            src={getAssetPath(imgItem.path)}
                            alt={imgItem.desc}
                            fill
                            className="object-contain"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                              <CheckIcon className="h-2.5 w-2.5" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-medium text-zinc-700 dark:text-zinc-300 truncate w-full text-center">
                          {imgItem.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected image detail info */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-200/60 dark:border-zinc-700/60">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>Đang chọn:</span>
                    <strong className="font-mono text-indigo-600 dark:text-indigo-400 truncate">
                      {image || "(Chưa chọn ảnh)"}
                    </strong>
                  </div>
                </div>

                {/* Custom path input field */}
                {isCustomPath && (
                  <div className="pt-1 animate-in fade-in duration-150">
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Đường dẫn file ảnh trong public hoặc link URL:
                    </label>
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="/images/C-05-01.jpg hoặc https://..."
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Mô tả chi tiết - Mở rộng thoải mái */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Mô tả & Hướng dẫn sử dụng
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    (Hỗ trợ viết nhiều dòng)
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập thông tin chi tiết về sản phẩm, công dụng, hướng dẫn sử dụng, đối tượng khuyên dùng, lưu ý..."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 leading-relaxed min-h-[170px] resize-y"
                />
              </div>
            </div>

            {/* CỘT 2 (Bên phải): Thành phần & Thông tin chi tiết */}
            <div className="lg:col-span-6 space-y-4 bg-zinc-50 dark:bg-zinc-950/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col h-full">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    2. Thành Phần & Thông Tin Chi Tiết
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400">
                  (Hỗ trợ xuống dòng tự do)
                </span>
              </div>

              {/* Quick Template Insert Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Chèn mẫu cấu trúc nhanh:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setIngredients(
                        (prev) =>
                          (prev ? prev + "\n\n" : "") +
                          "Xuất xứ: Nhật Bản\nNhà sản xuất: Kobayashi Pharmaceutical Co., Ltd.\nDung tích: Chai 500ml\n\nThành phần:\n- Dipotassium Glycyrrhizinate: 25mg\n- Chlorpheniramine Maleate: 3mg\n- Vitamin B6: 10mg\n- Taurine: 100mg\n- Vitamin B12: 1mg"
                      )
                    }
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shadow-2xs"
                  >
                    + Mẫu Thuốc nhỏ mắt
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setIngredients(
                        (prev) =>
                          (prev ? prev + "\n\n" : "") +
                          "Xuất xứ: Nhật Bản\nQuy cách: Hộp 60 viên\nĐối tượng: Trẻ từ 1 tuổi trở lên\n\nThành phần:\n- Canxi: 250mg\n- Axit Folic: 400mcg\n- Sắt: 10mg\n- Vitamin D3: 5mcg"
                      )
                    }
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shadow-2xs"
                  >
                    + Mẫu Thực phẩm bổ sung
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setIngredients(
                        (prev) =>
                          (prev ? prev + "\n\n" : "") +
                          "Xuất xứ: Nhật Bản\nTrọng lượng: Tuýp 50g\nChỉ số chống nắng: SPF50+ PA++++\n\nThành phần:\n- Chiết xuất dầu Jojoba\n- Chiết xuất quả Acerola\n- Hyaluronic Acid"
                      )
                    }
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shadow-2xs"
                  >
                    + Mẫu Kem / Mỹ phẩm
                  </button>
                </div>
              </div>

              {/* Textarea for ingredients */}
              <div className="flex-1 flex flex-col">
                <textarea
                  rows={14}
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="Nhập thông tin xuất xứ, nhà sản xuất, quy cách đóng gói và danh sách thành phần chi tiết..."
                  className="w-full flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 leading-relaxed min-h-[320px] resize-y font-sans"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
