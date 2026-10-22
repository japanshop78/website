import { Product } from "@/data/products";

/**
 * Chuẩn hóa chuỗi tiếng Việt: chuyển thành chữ thường, bỏ dấu thanh, dấu mũ, dấu móc và ký tự đặc biệt
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  let res = str.toLowerCase();

  // Thay thế ký tự đ/Đ
  res = res.replace(/đ/g, "d").replace(/Đ/g, "d");

  // Chuẩn hóa Unicode NFD để tách dấu và xóa dấu tổ hợp
  res = res.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Thay thế các biến thể đặc biệt nếu còn
  res = res
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y");

  return res.trim();
}

/**
 * Tách từ khóa thành các token có nghĩa
 */
export function tokenizeQuery(query: string): string[] {
  const normalized = removeVietnameseTones(query);
  return normalized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export interface SearchMatchResult {
  product: Product;
  score: number;
  snippet?: string;
  matchedIn: "name" | "tag" | "ingredients" | "description";
}

/**
 * Chấm điểm độ liên quan của sản phẩm dựa trên từ khóa tìm kiếm
 */
export function calculateProductRelevance(
  product: Product,
  rawQuery: string,
  tokens: string[],
  categoryName?: string
): SearchMatchResult | null {
  if (product.visible === false) return null;

  const rawQ = rawQuery.toLowerCase().trim();
  const normQ = removeVietnameseTones(rawQ);

  if (!normQ || tokens.length === 0) return null;

  const rawName = product.name.toLowerCase();
  const normName = removeVietnameseTones(product.name);

  const normTag = removeVietnameseTones(product.tag || "");

  const rawIngr = (product.ingredients || "").toLowerCase();
  const normIngr = removeVietnameseTones(product.ingredients || "");

  const rawDesc = (product.description || "").toLowerCase();
  const normDesc = removeVietnameseTones(product.description || "");

  const normCat = categoryName ? removeVietnameseTones(categoryName) : "";

  let score = 0;
  let matchedIn: "name" | "tag" | "ingredients" | "description" = "description";

  // 1. Khớp chính xác cụm từ nguyên bản trong Tên SP
  if (rawName.includes(rawQ)) {
    score += 150;
    matchedIn = "name";
  } else if (normName.includes(normQ)) {
    score += 120;
    matchedIn = "name";
  }

  // Khớp đầu tên sản phẩm
  if (normName.startsWith(normQ)) {
    score += 50;
    matchedIn = "name";
  }

  // 2. Khớp trong Thẻ Tag hoặc Danh Mục
  if (normTag.includes(normQ)) {
    score += 40;
    if (matchedIn !== "name") matchedIn = "tag";
  }
  if (normCat && normCat.includes(normQ)) {
    score += 30;
  }

  // 3. Khớp trong Thành Phần (Ingredients)
  if (rawIngr.includes(rawQ)) {
    score += 35;
    if (matchedIn === "description") matchedIn = "ingredients";
  } else if (normIngr.includes(normQ)) {
    score += 25;
    if (matchedIn === "description") matchedIn = "ingredients";
  }

  // 4. Khớp trong Mô Tả (Description)
  if (rawDesc.includes(rawQ)) {
    score += 20;
  } else if (normDesc.includes(normQ)) {
    score += 15;
  }

  // 5. Khớp theo từng từ khóa (Tokens)
  let nameTokenHits = 0;
  let allTokenHits = 0;

  tokens.forEach((token) => {
    let tokenHit = false;
    if (normName.includes(token)) {
      score += 12;
      nameTokenHits++;
      tokenHit = true;
      matchedIn = "name";
    }
    if (normTag.includes(token)) {
      score += 6;
      tokenHit = true;
    }
    if (normIngr.includes(token)) {
      score += 5;
      tokenHit = true;
    }
    if (normDesc.includes(token)) {
      score += 3;
      tokenHit = true;
    }
    if (tokenHit) allTokenHits++;
  });

  // Thưởng điểm nếu tất cả các từ trong cụm tìm kiếm đều xuất hiện trong tên sản phẩm
  if (tokens.length > 1 && nameTokenHits === tokens.length) {
    score += 50;
  }

  // Thưởng điểm nếu tất cả các từ đều tìm thấy trong sản phẩm
  if (tokens.length > 1 && allTokenHits === tokens.length) {
    score += 25;
  }

  // Nếu không có điểm nào thì coi như không khớp
  if (score <= 0) return null;

  // Tạo snippet giải thích nếu từ khóa không nằm trong tên sản phẩm
  let snippet: string | undefined = undefined;
  if (matchedIn === "description" || matchedIn === "ingredients") {
    const sourceText = matchedIn === "ingredients" ? product.ingredients || "" : product.description || "";
    snippet = extractSearchSnippet(sourceText, tokens);
  }

  return {
    product,
    score,
    snippet,
    matchedIn,
  };
}

/**
 * Trích đoạn ngắn (~80 ký tự) xung quanh vị trí xuất hiện từ khóa để hiển thị giải thích
 */
export function extractSearchSnippet(text: string, tokens: string[], maxLength: number = 90): string {
  if (!text) return "";
  const normText = removeVietnameseTones(text);

  let firstIndex = -1;
  let matchedToken = "";

  for (const token of tokens) {
    const idx = normText.indexOf(token);
    if (idx !== -1 && (firstIndex === -1 || idx < firstIndex)) {
      firstIndex = idx;
      matchedToken = token;
    }
  }

  if (firstIndex === -1) {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  }

  // Lấy vị trí bắt đầu và kết thúc xung quanh từ khóa
  const half = Math.floor((maxLength - matchedToken.length) / 2);
  const start = Math.max(0, firstIndex - half);
  const end = Math.min(text.length, firstIndex + matchedToken.length + half);

  let snippet = text.slice(start, end).replace(/\s+/g, " ");
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
}

/**
 * Engine tìm kiếm sản phẩm: Chuẩn hóa, lọc, chấm điểm và sắp xếp theo độ liên quan
 */
export function searchProductsEngine(
  products: Product[],
  query: string,
  categoryMap?: Map<string, string>,
  getCategoryIdByProductId?: (productId: string) => string | undefined
): SearchMatchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const tokens = tokenizeQuery(trimmed);
  if (tokens.length === 0) return [];

  const results: SearchMatchResult[] = [];

  for (const product of products) {
    let catName: string | undefined = undefined;
    if (getCategoryIdByProductId && categoryMap) {
      const catId = getCategoryIdByProductId(product.id);
      if (catId) catName = categoryMap.get(catId);
    }

    const match = calculateProductRelevance(product, trimmed, tokens, catName);
    if (match) {
      results.push(match);
    }
  }

  // Sắp xếp theo score giảm dần (độ liên quan cao nhất lên đầu)
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Quản lý lịch sử tìm kiếm gần đây trong LocalStorage
 */
const RECENT_SEARCHES_KEY = "c3_shop_recent_searches";
const MAX_RECENT_SEARCHES = 6;

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): void {
  if (typeof window === "undefined") return;
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return;

  try {
    const current = getRecentSearches();
    const updated = [trimmed, ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore storage errors
  }
}
