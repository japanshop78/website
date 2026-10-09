"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { orderService, Order, OrderStatus } from "@/services/orderService";
import { getAssetPath } from "@/utils/assetPath";
import PhoneIcon from "@/components/icons/PhoneIcon";
import TrashIcon from "@/components/icons/TrashIcon";

const statusConfig: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: "Chờ xác nhận",
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  confirmed: {
    label: "Đã xác nhận",
    bg: "bg-blue-50 dark:bg-blue-950/60",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  shipping: {
    label: "Đang giao hàng",
    bg: "bg-indigo-50 dark:bg-indigo-950/60",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  completed: {
    label: "Giao thành công",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  cancelled: {
    label: "Đã hủy",
    bg: "bg-rose-50 dark:bg-rose-950/60",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
  },
};

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error("Lỗi tải danh sách đơn:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const ok = await orderService.updateOrderStatus(orderId, newStatus);
      if (ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        alert("Không thể cập nhật trạng thái đơn!");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn đơn #${orderId}?`)) {
      return;
    }
    setUpdatingId(orderId);
    try {
      const ok = await orderService.deleteOrder(orderId);
      if (ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        alert("Không thể xóa đơn hàng!");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      statusFilter === "all" ? true : o.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === ""
        ? true
        : o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.phone.includes(searchQuery) ||
          o.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const countByStatus = (status: OrderStatus) =>
    orders.filter((o) => o.status === status).length;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <span>📦 Quản Lý Đơn Hàng</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {orders.length} đơn
            </span>
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Theo dõi đơn mới, gọi điện hoặc nhắn tin Zalo xác nhận đơn với khách hàng
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:bg-zinc-800 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <span>🔄 Tải lại dữ liệu</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Tất cả ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              statusFilter === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            }`}
          >
            Chờ xác nhận ({countByStatus("pending")})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("confirmed")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              statusFilter === "confirmed"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            }`}
          >
            Đã xác nhận ({countByStatus("confirmed")})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("shipping")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              statusFilter === "shipping"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            }`}
          >
            Đang giao ({countByStatus("shipping")})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              statusFilter === "completed"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            }`}
          >
            Hoàn tất ({countByStatus("completed")})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("cancelled")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              statusFilter === "cancelled"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            }`}
          >
            Đã hủy ({countByStatus("cancelled")})
          </button>
        </div>

        {/* Search */}
        <div className="w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn, SĐT, tên..."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">
          <div className="inline-block h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p>Đang tải danh sách đơn hàng từ Supabase...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400 text-xs">
          Không tìm thấy đơn hàng nào phù hợp.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusMeta = statusConfig[order.status] || statusConfig.pending;
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-4"
              >
                {/* Top: Order ID, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                      #{order.id}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                    >
                      {statusMeta.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(order.id)}
                      disabled={isUpdating}
                      title="Xóa đơn hàng"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Middle: Customer Info & Items */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Left: Customer Info (5 cols) */}
                  <div className="md:col-span-5 space-y-2.5 text-xs bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold">Người nhận</span>
                      <span className="font-bold text-sm text-zinc-900 dark:text-white">
                        {order.customerName}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold">Số điện thoại</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-zinc-900 dark:text-white">
                          {order.phone}
                        </span>
                        {/* Quick Call */}
                        <a
                          href={`tel:${order.phone}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 font-bold text-[11px] hover:bg-emerald-100"
                        >
                          <PhoneIcon className="h-3 w-3" />
                          <span>Gọi</span>
                        </a>
                        {/* Quick Zalo */}
                        <a
                          href={orderService.getZaloCustomerLink(order.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold text-[11px] hover:bg-blue-100"
                        >
                          <span>💬 Zalo</span>
                        </a>
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold">Địa chỉ giao</span>
                      <p className="text-zinc-800 dark:text-zinc-200 mt-0.5 leading-snug">
                        {order.address}
                      </p>
                    </div>

                    {order.note && (
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase font-bold">Ghi chú</span>
                        <p className="text-amber-600 dark:text-amber-400 italic mt-0.5">
                          &ldquo;{order.note}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Tạm thời ẩn hình thức thanh toán */}
                    {/* <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold">Hình thức</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {order.paymentMethod === "cod" ? "💵 Thanh toán COD" : "🏦 Chuyển khoản ngân hàng"}
                      </span>
                    </div> */}
                  </div>

                  {/* Right: Items list (7 cols) */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.image ? (
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                <Image
                                  src={getAssetPath(item.image)}
                                  alt={item.name}
                                  fill
                                  className="object-contain p-0.5"
                                />
                              </div>
                            ) : null}
                            <div className="min-w-0">
                              <span className="font-bold uppercase text-zinc-900 dark:text-white line-clamp-1">
                                {item.name}
                              </span>
                              <span className="text-zinc-400 text-[11px]">
                                Số lượng: {item.quantity} × {item.price.toLocaleString("vi-VN")}đ
                              </span>
                            </div>
                          </div>

                          <span className="font-bold text-zinc-900 dark:text-white shrink-0">
                            {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Total & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="text-xs">
                        <span className="text-zinc-400">Tổng thanh toán: </span>
                        <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                          {order.totalPrice.toLocaleString("vi-VN")}đ
                        </span>
                        {order.shippingFee > 0 ? (
                          <span className="text-[10px] text-zinc-400 ml-1">
                            (gồm {order.shippingFee.toLocaleString("vi-VN")}đ ship)
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1 font-bold">
                            (Free ship)
                          </span>
                        )}
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {order.status === "pending" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(order.id, "confirmed")}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            ✓ Xác nhận đơn
                          </button>
                        )}

                        {order.status === "confirmed" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(order.id, "shipping")}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            🚚 Bắt đầu giao
                          </button>
                        )}

                        {order.status === "shipping" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(order.id, "completed")}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            🎉 Hoàn tất giao
                          </button>
                        )}

                        {order.status !== "cancelled" && order.status !== "completed" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(order.id, "cancelled")}
                            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            Hủy đơn
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
