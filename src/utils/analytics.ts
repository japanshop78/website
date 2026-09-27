/**
 * Tiện ích theo dõi sự kiện chuyển đổi cho Facebook (Meta Pixel) & Google Analytics 4
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export interface AnalyticsProduct {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

export const analytics = {
  /**
   * Theo dõi xem trang (PageView)
   */
  trackPageView(url?: string): void {
    if (typeof window === "undefined") return;

    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_location: url || window.location.href,
        page_path: window.location.pathname,
      });
    }
  },

  /**
   * Khách xem chi tiết sản phẩm (ViewContent / view_item)
   */
  trackViewItem(product: AnalyticsProduct): void {
    if (typeof window === "undefined") return;

    if (typeof window.fbq === "function") {
      window.fbq("track", "ViewContent", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: product.price,
        currency: "VND",
      });
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", "view_item", {
        currency: "VND",
        value: product.price,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            price: product.price,
            quantity: 1,
          },
        ],
      });
    }
  },

  /**
   * Khách thêm vào giỏ hàng (AddToCart / add_to_cart)
   */
  trackAddToCart(product: AnalyticsProduct, quantity = 1): void {
    if (typeof window === "undefined") return;

    const totalValue = product.price * quantity;

    if (typeof window.fbq === "function") {
      window.fbq("track", "AddToCart", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: totalValue,
        currency: "VND",
      });
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", "add_to_cart", {
        currency: "VND",
        value: totalValue,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            price: product.price,
            quantity,
          },
        ],
      });
    }
  },

  /**
   * Khách đặt hàng thành công (Purchase / purchase)
   * Đây là sự kiện quan trọng nhất để thuật toán quảng cáo tối ưu đơn hàng!
   */
  trackPurchase(order: {
    orderId: string;
    total: number;
    items: AnalyticsProduct[];
  }): void {
    if (typeof window === "undefined") return;

    if (typeof window.fbq === "function") {
      window.fbq("track", "Purchase", {
        content_ids: order.items.map((i) => i.id),
        content_type: "product",
        value: order.total,
        currency: "VND",
        num_items: order.items.reduce((sum, i) => sum + (i.quantity || 1), 0),
      });
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", "purchase", {
        transaction_id: order.orderId,
        value: order.total,
        currency: "VND",
        items: order.items.map((i) => ({
          item_id: i.id,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity || 1,
        })),
      });
    }
  },
};
