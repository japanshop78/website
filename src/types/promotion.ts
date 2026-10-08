export interface PromotionCampaign {
  id: string;
  name: string;
  isActive: boolean;
  discountPercent: number;
  isFreeship: boolean;
  startDate: string;
  endDate: string;
  bannerTitle: string;
  bannerSubtitle: string;
  updatedAt?: string;
}

export interface DbPromotionRow {
  id: string;
  name: string;
  is_active: boolean;
  discount_percent: number;
  is_freeship: boolean;
  start_date: string;
  end_date: string;
  banner_title: string;
  banner_subtitle: string;
  updated_at?: string;
}

/**
 * Làm tròn giá về hàng nghìn gần nhất (VD: 310500 -> 310000)
 */
export function calculateDiscountedPrice(price: number, discountPercent: number): number {
  if (discountPercent <= 0) return price;
  const discounted = price * (1 - discountPercent / 100);
  return Math.floor(discounted / 1000) * 1000;
}

/**
 * Kiểm tra xem chiến dịch có đang trong thời gian hiệu lực không.
 * Nếu isActive = true và nằm giữa startDate - endDate (hoặc nếu là thời gian preview).
 */
export function isCampaignActive(promo: PromotionCampaign | null | undefined): boolean {
  if (!promo || !promo.isActive) return false;
  const now = new Date().getTime();
  const end = new Date(promo.endDate).getTime();
  
  // Nếu ngày hợp lệ, check khoảng thời gian.
  // Đồng thời cho phép nếu hiện tại đang trong khoảng hoặc nếu start nằm trong tương lai gần nhưng isActive = true
  // Để tiện nhất: nếu now <= end (chưa hết hạn) và isActive = true thì coi là hợp lệ.
  return now <= end;
}

export interface ProductPricing {
  originalPrice: number;        // Giá niêm yết gốc (product.price)
  effectivePrice: number;       // Giá bán thực tế sau khi giảm 10% (làm tròn nghìn)
  effectiveOldPrice?: number;   // Giá gạch ngang (oldPrice gốc nếu có, hoặc product.price nếu chưa có)
  discountPercent: number | null; // % giảm giá hiển thị trên badge (-10%, -25%...), null nếu 0
  savingsAmount: number;        // Số tiền tiết kiệm được
  hasPromo: boolean;            // Cờ chiến dịch khuyến mãi toàn sàn đang kích hoạt
}

/**
 * Tính toán giá bán thực tế, giá gạch ngang và % giảm giá đồng bộ cho toàn bộ sản phẩm trên website.
 */
export function getProductPricing(
  product: { price: number; oldPrice?: number },
  promotion: PromotionCampaign | null | undefined,
  isPromotionActive: boolean
): ProductPricing {
  const hasPromo = Boolean(isPromotionActive && promotion && (promotion.discountPercent || 0) > 0);
  const promoPercent = hasPromo && promotion ? promotion.discountPercent : 0;

  if (!hasPromo) {
    const hasOldDiscount = Boolean(product.oldPrice && product.oldPrice > product.price);
    const oldDiscountPercent = hasOldDiscount && product.oldPrice
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null;

    return {
      originalPrice: product.price,
      effectivePrice: product.price,
      effectiveOldPrice: product.oldPrice && product.oldPrice > product.price ? product.oldPrice : undefined,
      discountPercent: oldDiscountPercent,
      savingsAmount: product.oldPrice && product.oldPrice > product.price ? product.oldPrice - product.price : 0,
      hasPromo: false,
    };
  }

  // Khi có chiến dịch khuyến mãi toàn sàn (VD: 10%):
  const effectivePrice = calculateDiscountedPrice(product.price, promoPercent);
  const effectiveOldPrice = product.oldPrice && product.oldPrice > product.price
    ? product.oldPrice
    : product.price;

  const baseOld = effectiveOldPrice;
  const totalPercent = baseOld > effectivePrice
    ? Math.max(promoPercent, Math.round(((baseOld - effectivePrice) / baseOld) * 100))
    : promoPercent;

  const savingsAmount = effectiveOldPrice > effectivePrice ? effectiveOldPrice - effectivePrice : 0;

  return {
    originalPrice: product.price,
    effectivePrice,
    effectiveOldPrice: effectiveOldPrice > effectivePrice ? effectiveOldPrice : undefined,
    discountPercent: totalPercent > 0 ? totalPercent : null,
    savingsAmount,
    hasPromo: true,
  };
}
