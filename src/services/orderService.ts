import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type OrderStatus =
  | "pending"    // Chờ xác nhận
  | "confirmed"  // Đã xác nhận
  | "shipping"   // Đang giao hàng
  | "completed"  // Giao thành công
  | "cancelled"; // Đã hủy

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod: "cod" | "banking";
  subtotal: number;
  shippingFee: number;
  totalPrice: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
}

interface SupabaseOrderRow {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  note: string | null;
  payment_method: string;
  subtotal: number;
  shipping_fee: number;
  total_price: number;
  items: OrderItem[];
  status: string;
  created_at: string;
}

const mapRowToOrder = (row: SupabaseOrderRow): Order => ({
  id: row.id,
  customerName: row.customer_name,
  phone: row.phone,
  address: row.address,
  note: row.note || "",
  paymentMethod: (row.payment_method === "banking" ? "banking" : "cod"),
  subtotal: Number(row.subtotal) || 0,
  shippingFee: Number(row.shipping_fee) || 0,
  totalPrice: Number(row.total_price) || 0,
  items: Array.isArray(row.items) ? row.items : [],
  status: (row.status as OrderStatus) || "pending",
  createdAt: row.created_at,
});

export const orderService = {
  /**
   * Tạo đơn hàng mới và lưu vào Supabase
   */
  async createOrder(data: {
    id: string;
    customerName: string;
    phone: string;
    address: string;
    note?: string;
    paymentMethod: "cod" | "banking";
    subtotal: number;
    shippingFee: number;
    totalPrice: number;
    items: OrderItem[];
  }): Promise<{ success: boolean; data?: Order; error?: string }> {
    const payload = {
      id: data.id,
      customer_name: data.customerName.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      note: data.note?.trim() || "",
      payment_method: data.paymentMethod,
      subtotal: data.subtotal,
      shipping_fee: data.shippingFee,
      total_price: data.totalPrice,
      items: data.items,
      status: "pending" as OrderStatus,
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from("orders")
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.error("[orderService] Lỗi lưu đơn hàng vào Supabase:", error);
          return { success: false, error: error.message };
        }

        const savedOrder = mapRowToOrder(inserted as SupabaseOrderRow);

        // Kích hoạt thông báo tự động qua Zalo Webhook nếu có cấu hình
        this.sendZaloWebhookNotification(savedOrder).catch((err) => {
          console.warn("[orderService] Không thể gửi Zalo Webhook:", err);
        });

        return { success: true, data: savedOrder };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[orderService] Lỗi kết nối Supabase:", message);
        return { success: false, error: message };
      }
    } else {
      console.warn("[orderService] Supabase chưa được cấu hình, lưu đơn tạm thời");
      return {
        success: true,
        data: {
          ...data,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      };
    }
  },

  /**
   * Lấy danh sách đơn hàng cho trang Admin
   */
  async getOrders(statusFilter?: OrderStatus | "all"): Promise<Order[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[orderService] Lỗi lấy danh sách đơn:", error);
        return [];
      }

      return (data || []).map((row) => mapRowToOrder(row as SupabaseOrderRow));
    } catch (err) {
      console.error("[orderService] Lỗi kết nối getOrders:", err);
      return [];
    }
  },

  /**
   * Cập nhật trạng thái đơn hàng
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) {
        console.error("[orderService] Lỗi cập nhật trạng thái đơn:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[orderService] Lỗi updateOrderStatus:", err);
      return false;
    }
  },

  /**
   * Xóa đơn hàng (chỉ dùng cho Admin nếu có đơn rác)
   */
  async deleteOrder(orderId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) {
        console.error("[orderService] Lỗi xóa đơn hàng:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[orderService] Lỗi deleteOrder:", err);
      return false;
    }
  },

  /**
   * Bắn Webhook thông báo đơn hàng mới qua Zalo Bot / n8n / Forwarder
   */
  async sendZaloWebhookNotification(order: Order): Promise<void> {
    const webhookUrl = process.env.NEXT_PUBLIC_ZALO_WEBHOOK_URL;
    if (!webhookUrl) return;

    const message = [
      `🛍️ [ĐƠN HÀNG MỚI - JAPAN SHOP] #${order.id}`,
      `👤 Khách hàng: ${order.customerName}`,
      `📞 Số điện thoại: ${order.phone}`,
      `📍 Địa chỉ: ${order.address}`,
      `💰 Tổng tiền: ${order.totalPrice.toLocaleString("vi-VN")}đ (${order.paymentMethod === "cod" ? "COD" : "Chuyển khoản"})`,
      `📦 Sản phẩm (${order.items.length}):`,
      ...order.items.map((it, idx) => `  ${idx + 1}. ${it.name} (SL: ${it.quantity})`),
      order.note ? `📝 Ghi chú: ${order.note}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        text: message,
        order,
      }),
    });
  },

  /**
   * Tạo link Zalo chat nhanh cho khách hàng gửi đơn xác nhận
   */
  formatZaloOrderMessage(order: Order): string {
    const itemsText = order.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.name} (SL: ${it.quantity}) - ${(it.price * it.quantity).toLocaleString("vi-VN")}đ`
      )
      .join("\n");

    return `Chào Japan Shop! Tôi vừa đặt đơn hàng #${order.id} trên website:\n\n${itemsText}\n\nTổng thanh toán: ${order.totalPrice.toLocaleString("vi-VN")}đ\nNgười nhận: ${order.customerName} - ${order.phone}\nĐịa chỉ: ${order.address}${order.note ? `\nGhi chú: ${order.note}` : ""}\n\nNhờ Shop kiểm tra và xác nhận giúp tôi nhé!`;
  },

  /**
   * Tạo link mở Zalo với số điện thoại của khách hàng (dành cho Admin)
   */
  getZaloCustomerLink(phone: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    return `https://zalo.me/${cleanPhone}`;
  },
};
