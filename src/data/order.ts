import rawOrders from "./order.json";

export interface ProductOrder {
  productId: string; // Mã sản phẩm (id)
  order: number;     // Thứ tự hiển thị (số càng nhỏ hiển thị càng trước, ví dụ: 1, 2, 3...)
  banner?: string;   // Tên/loại banner (ví dụ: "featured" | "discount" | "Sản phẩm bán chạy" | "Sản phẩm giảm giá")
}

export const FEATURED_PRODUCT_ORDER: ProductOrder[] = rawOrders as ProductOrder[];

export const BEST_SELLER_ORDER = FEATURED_PRODUCT_ORDER;
