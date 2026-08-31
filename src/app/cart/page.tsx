"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { getAssetPath } from "@/utils/assetPath";
import Breadcrumb from "@/components/Breadcrumb";
import {
  TrashIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  CartIcon,
  MessengerIcon,
  PhoneIcon,
  ChevronRightIcon,
} from "@/components/icons";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export default function CartPage() {
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  // Customer info state for checkout
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "banking">("cod");

  // Order success state
  const [orderSuccessData, setOrderSuccessData] = useState<{
    orderId: string;
    name: string;
    phone: string;
    address: string;
    total: number;
    paymentMethod: string;
    itemCount: number;
  } | null>(null);

  // Shipping cost rule: Free ship for orders >= 500.000đ, otherwise 25.000đ
  const shippingFee = totalPrice >= 500000 || totalPrice === 0 ? 0 : 25000;
  const finalTotal = totalPrice + shippingFee;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      alert("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng!");
      return;
    }

    const orderId = `JP-${Date.now().toString().slice(-6)}`;
    const successPayload = {
      orderId,
      name: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      total: finalTotal,
      paymentMethod:
        paymentMethod === "cod"
          ? "Thanh toán khi nhận hàng (COD)"
          : "Chuyển khoản ngân hàng",
      itemCount: totalItems,
    };

    setOrderSuccessData(successPayload);
    clearCart();
  };

  const handleSendViaMessenger = () => {
    if (items.length === 0) return;

    const itemsText = items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.product.name} (SL: ${it.quantity}) - ${formatPrice(
            it.product.price * it.quantity
          )}`
      )
      .join("\n");

    let msg = `Chào Japan Shop, tôi muốn đặt đơn hàng:\n\n${itemsText}\n\nTổng thanh toán: ${formatPrice(
      finalTotal
    )}`;

    if (customerName.trim() || phone.trim() || address.trim()) {
      msg += `\n\nThông tin người nhận:\n- Họ tên: ${customerName || "(Chưa nhập)"}\n- SĐT: ${phone || "(Chưa nhập)"}\n- Địa chỉ: ${address || "(Chưa nhập)"}`;
    }

    if (note.trim()) {
      msg += `\n- Ghi chú: ${note}`;
    }

    const encoded = encodeURIComponent(msg);
    window.open(
      `https://www.messenger.com/t/108292607259915?text=${encoded}`,
      "_blank"
    );
  };

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: "Trang chủ", href: "/" },
              { label: "Giỏ hàng" },
            ]}
          />
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
              <span>Giỏ Hàng Của Bạn</span>
              {totalItems > 0 && (
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-3 py-0.5 text-xs font-bold">
                  {totalItems} sản phẩm
                </span>
              )}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Kiểm tra danh sách sản phẩm, nhập thông tin nhận hàng và tiến hành đặt hàng nhanh chóng
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?")) {
                  clearCart();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer self-start sm:self-auto"
            >
              <TrashIcon className="h-4 w-4" />
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Empty Cart State */}
        {items.length === 0 && !orderSuccessData ? (
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center shadow-sm max-w-2xl mx-auto my-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 mb-5 shadow-inner">
              <CartIcon className="h-10 w-10 stroke-1" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
              Giỏ hàng của bạn đang trống!
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá ngay các sản phẩm nội địa Nhật Bản chính hãng, chất lượng cao tại Japan Shop!
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-indigo-500 transition-all cursor-pointer"
              >
                <span>Khám phá sản phẩm ngay</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}

        {/* Main 2-Column Layout */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* CỘT 1: Danh sách sản phẩm trong giỏ (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
                {items.map(({ product, quantity }) => {
                  const itemSubtotal = product.price * quantity;

                  return (
                    <div
                      key={product.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Link
                          href={`/product/${product.id}`}
                          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-1.5 group"
                        >
                          {product.images?.[0] ? (
                            <Image
                              src={getAssetPath(product.images[0])}
                              alt={product.name}
                              fill
                              className="object-contain group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="h-full w-full bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                          )}
                        </Link>

                        <div className="flex-1 min-w-0 pr-2">
                          {product.tag && (
                            <span className="inline-block rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-black px-1.5 py-0.5 mb-1">
                              {product.tag}
                            </span>
                          )}
                          <Link
                            href={`/product/${product.id}`}
                            className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-snug"
                          >
                            {product.name}
                          </Link>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                              {formatPrice(product.price)}
                            </span>
                            {product.oldPrice && product.oldPrice > product.price && (
                              <span className="text-[11px] text-zinc-400 line-through">
                                {formatPrice(product.oldPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quantity Stepper, Subtotal, Remove */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100 dark:border-zinc-800">
                        {/* Stepper */}
                        <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                            title="Giảm số lượng"
                          >
                            <MinusIcon className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-zinc-900 dark:text-white">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                            title="Tăng số lượng"
                          >
                            <PlusIcon className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right min-w-[90px]">
                          <span className="font-black text-sm text-zinc-900 dark:text-white block">
                            {formatPrice(itemSubtotal)}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            ({quantity} × {formatPrice(product.price)})
                          </span>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Xóa sản phẩm"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Free ship notification banner */}
              <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 flex items-center gap-3">
                <span className="text-2xl">🚚</span>
                <div className="text-xs">
                  {totalPrice >= 500000 ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ Đơn hàng của bạn đã đủ điều kiện được MIỄN PHÍ VẬN CHUYỂN toàn quốc!
                    </span>
                  ) : (
                    <span className="text-zinc-600 dark:text-zinc-300">
                      Mua thêm{" "}
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        {formatPrice(500000 - totalPrice)}
                      </strong>{" "}
                      để được <strong>MIỄN PHÍ VẬN CHUYỂN</strong> toàn quốc.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  ← Tiếp tục xem sản phẩm khác
                </Link>
              </div>
            </div>

            {/* CỘT 2: Thông tin giao hàng & Đặt hàng (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Order Summary Box */}
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-black text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  Tóm Tắt Đơn Hàng
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Tạm tính ({totalItems} sản phẩm):</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>

                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Phí vận chuyển:</span>
                    <span>
                      {shippingFee === 0 ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Miễn phí
                        </span>
                      ) : (
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {formatPrice(shippingFee)}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      Tổng thanh toán:
                    </span>
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* Form Thông Tin Nhận Hàng */}
                <form onSubmit={handleCheckoutSubmit} className="space-y-3 pt-2">
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-2">
                      Thông Tin Giao Hàng
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 dark:text-zinc-400 mb-1">
                      Họ và tên người nhận <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 dark:text-zinc-400 mb-1">
                      Số điện thoại liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="VD: 0902493895"
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 dark:text-zinc-400 mb-1">
                      Địa chỉ nhận hàng chi tiết <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 dark:text-zinc-400 mb-1">
                      Ghi chú đơn hàng (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="VD: Giao giờ hành chính, gọi trước..."
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Hình thức thanh toán
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cod")}
                        className={`rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer ${
                          paymentMethod === "cod"
                            ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/40 font-bold text-indigo-700 dark:text-indigo-300"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <span className="block">💵 Thanh toán khi nhận hàng (COD)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("banking")}
                        className={`rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer ${
                          paymentMethod === "banking"
                            ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/40 font-bold text-indigo-700 dark:text-indigo-300"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <span className="block">🏦 Chuyển khoản ngân hàng</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Checkout Button */}
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-indigo-500 active:scale-98 transition-all cursor-pointer mt-3"
                  >
                    🛍️ Đặt Hàng Ngay ({formatPrice(finalTotal)})
                  </button>
                </form>

                {/* Secondary: Messenger Order */}
                <div className="pt-2">
                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                    <span className="bg-white dark:bg-zinc-900 px-2 text-[10px] text-zinc-400 uppercase font-bold absolute">
                      hoặc
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendViaMessenger}
                    className="w-full rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 py-3 px-4 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <MessengerIcon className="h-4 w-4" />
                    <span>Gửi Đơn Hàng Qua Messenger Cho Shop</span>
                  </button>
                </div>
              </div>

              {/* Hotline Support Card */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    <PhoneIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-white block">
                      Hỗ trợ đặt hàng nhanh:
                    </span>
                    <a
                      href="tel:0902493895"
                      className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      0902493895
                    </a>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-400">
                  (8:00 - 21:00)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Order Success Confirmation Modal */}
        {orderSuccessData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckIcon className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                Đặt Hàng Thành Công!
              </h2>

              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Cảm ơn bạn <strong>{orderSuccessData.name}</strong> đã đặt mua tại Japan Shop.
                Chúng tôi sẽ liên hệ với bạn qua số điện thoại{" "}
                <strong>{orderSuccessData.phone}</strong> để xác nhận và giao hàng sớm nhất!
              </p>

              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 p-4 text-left text-xs space-y-2 border border-zinc-200 dark:border-zinc-700">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    #{orderSuccessData.orderId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Địa chỉ giao:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right max-w-[240px] truncate">
                    {orderSuccessData.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Hình thức:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {orderSuccessData.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-2 text-sm">
                  <span className="font-bold text-zinc-900 dark:text-white">
                    Tổng thanh toán:
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {formatPrice(orderSuccessData.total)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setOrderSuccessData(null)}
                  className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-500 cursor-pointer"
                >
                  Tiếp tục mua sắm
                </button>
                <Link
                  href="/"
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 inline-flex items-center justify-center"
                >
                  Về trang chủ
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
