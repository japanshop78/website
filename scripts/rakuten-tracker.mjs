/**
 * Rakuten Japan Price Tracker & Automated Email Notification Engine
 * Can be executed locally: `node scripts/rakuten-tracker.mjs`
 * Or in GitHub Actions via scheduled cron workflow.
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "../src/data/rakuten_monitors.json");

const isTest = process.argv.includes("--test");

// Environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RAKUTEN_APP_ID = process.env.RAKUTEN_APPLICATION_ID;
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;
const NOTIFY_FROM_EMAIL =
  process.env.NOTIFY_FROM_EMAIL || "Japan Shop Alerts <onboarding@resend.dev>";

/**
 * Helper to format Japanese Yen
 */
function formatJPY(amount) {
  return "¥" + Number(amount).toLocaleString("ja-JP");
}

/**
 * Extract Shop ID and Item ID from Rakuten URL
 */
function extractRakutenIds(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("rakuten.co.jp")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return { shopId: parts[0], itemId: parts[1] };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Fetch latest product price, title, image using official Rakuten Ichiba API
 */
async function fetchRakutenProduct(url) {
  if (!RAKUTEN_APP_ID) {
    console.warn("⚠️ RAKUTEN_APPLICATION_ID is not configured. Please set RAKUTEN_APPLICATION_ID to query the Rakuten API.");
    return null;
  }

  const ids = extractRakutenIds(url);
  if (!ids) {
    console.warn(`⚠️ Could not parse Rakuten Shop ID and Item ID from URL: ${url}`);
    return null;
  }

  const headers = {
    Referer: "https://japanshop78.github.io/website/",
    Origin: "https://japanshop78.github.io",
    "User-Agent": "Mozilla/5.0",
  };

  const itemCode = `${ids.shopId}:${ids.itemId}`;

  try {
    let apiUrl;
    if (RAKUTEN_ACCESS_KEY) {
      // New Rakuten OpenAPI 2026
      apiUrl = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701?format=json&itemCode=${encodeURIComponent(itemCode)}&applicationId=${encodeURIComponent(RAKUTEN_APP_ID)}&accessKey=${encodeURIComponent(RAKUTEN_ACCESS_KEY)}`;
    } else {
      // Legacy API endpoint
      apiUrl = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?format=json&itemCode=${encodeURIComponent(itemCode)}&applicationId=${encodeURIComponent(RAKUTEN_APP_ID)}`;
    }

    let res = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      const errText = await res.text();
      // If itemCode failed, fallback to searching by keyword within shop
      if (RAKUTEN_ACCESS_KEY && errText.includes("wrong_parameter")) {
        const fallbackUrl = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701?format=json&keyword=${encodeURIComponent(ids.itemId)}&shopCode=${encodeURIComponent(ids.shopId)}&applicationId=${encodeURIComponent(RAKUTEN_APP_ID)}&accessKey=${encodeURIComponent(RAKUTEN_ACCESS_KEY)}`;
        res = await fetch(fallbackUrl, { headers, signal: AbortSignal.timeout(10000) });
      } else {
        console.error(`Rakuten API error HTTP ${res.status}:`, errText);
        return null;
      }
    }

    const json = await res.json();
    const item = json.Items?.[0]?.Item;
    if (!item) {
      console.warn(`No product found on Rakuten API for item code: ${itemCode}`);
      return null;
    }

    return {
      name: item.itemName,
      price: Number(item.itemPrice),
      imageUrl:
        item.mediumImageUrls?.[0]?.imageUrl ||
        item.smallImageUrls?.[0]?.imageUrl ||
        "",
      inStock: item.availability === 1,
    };
  } catch (e) {
    console.error(`Rakuten API fetch exception:`, e.message);
    return null;
  }
}

/**
 * Send Email alert via Resend API
 */
async function sendAlertEmail({ toEmail, product, oldPrice, currentPrice, discountPercent }) {
  if (isTest) {
    console.log(`[TEST MODE] Would send alert email to ${toEmail} for: ${product.name}`);
    console.log(`Price dropped: ${formatJPY(oldPrice)} -> ${formatJPY(currentPrice)} (-${discountPercent}%)`);
    return true;
  }

  if (!RESEND_API_KEY) {
    console.warn(`[WARNING] RESEND_API_KEY is not set. Skipping email send to ${toEmail}.`);
    console.log(`Alert details: ${product.name} down to ${formatJPY(currentPrice)} (was ${formatJPY(oldPrice)})`);
    return false;
  }

  const emailSubject = `🚨 [GIẢM GIÁ RAKUTEN] -${discountPercent}%: ${product.name.slice(0, 45)}...`;

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e4e4e7; }
        .header { background: linear-gradient(135deg, #e11d48, #be123c); color: white; padding: 28px 24px; text-align: center; }
        .badge { display: inline-block; background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.4); border-radius: 9999px; padding: 4px 14px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .title { margin: 0; font-size: 22px; font-weight: 800; }
        .body { padding: 32px 24px; }
        .product-card { display: flex; gap: 20px; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; margin-bottom: 24px; }
        .product-img { width: 110px; height: 110px; object-fit: contain; border-radius: 12px; background: #ffffff; padding: 6px; border: 1px solid #cbd5e1; }
        .product-info { flex: 1; }
        .product-name { font-size: 15px; font-weight: bold; line-height: 1.4; margin-bottom: 10px; color: #0f172a; }
        .price-row { display: flex; align-items: baseline; gap: 10px; }
        .old-price { font-size: 14px; text-decoration: line-through; color: #94a3b8; }
        .new-price { font-size: 24px; font-weight: 900; color: #e11d48; }
        .discount-tag { display: inline-block; background: #ffe4e6; color: #e11d48; font-size: 13px; font-weight: 800; padding: 3px 8px; border-radius: 6px; }
        .cta-btn { display: block; text-align: center; background: #e11d48; color: #ffffff !important; text-decoration: none; padding: 16px 24px; border-radius: 9999px; font-weight: 800; font-size: 16px; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.35); transition: background 0.2s; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">🔥 Rakuten Price Alert</div>
          <h1 class="title">Phát hiện sản phẩm giảm giá!</h1>
        </div>
        <div class="body">
          <div class="product-card">
            ${
              product.imageUrl
                ? `<img src="${product.imageUrl}" class="product-img" alt="${product.name}" />`
                : ""
            }
            <div class="product-info">
              <div class="product-name">${product.name}</div>
              <div class="price-row">
                <span class="old-price">${formatJPY(oldPrice)}</span>
                <span class="new-price">${formatJPY(currentPrice)}</span>
                <span class="discount-tag">-${discountPercent}%</span>
              </div>
            </div>
          </div>

          <a href="${product.url}" target="_blank" class="cta-btn">
            Mở Rakuten mua ngay (${formatJPY(currentPrice)}) →
          </a>
        </div>
        <div class="footer">
          Hệ thống theo dõi giá tự động Japan Shop (C3 Shop).<br/>
          Thời gian quét: ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFY_FROM_EMAIL,
        to: [toEmail],
        subject: emailSubject,
        html: htmlBody,
      }),
    });

    if (res.ok) {
      console.log(`[SUCCESS] Email sent successfully to ${toEmail} for ${product.name}`);
      return true;
    } else {
      const errData = await res.text();
      console.error(`[ERROR] Resend API error:`, errData);
      return false;
    }
  } catch (err) {
    console.error(`[ERROR] Failed to send email:`, err.message);
    return false;
  }
}

/**
 * Load items to monitor from local JSON
 */
function loadMonitoredProducts() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      console.log(`Loaded ${parsed.length} items from local JSON file.`);
      return { items: parsed.filter((i) => i.active !== false), allItems: parsed };
    } catch (e) {
      console.error("Failed to parse local JSON:", e.message);
    }
  }

  return { items: [], allItems: [] };
}

/**
 * Save updated product back to local JSON
 */
function saveUpdatedProduct(updatedItem, allItems) {
  try {
    const nextList = allItems.map((i) => (i.id === updatedItem.id ? updatedItem : i));
    fs.writeFileSync(DATA_FILE, JSON.stringify(nextList, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to write to local JSON:", e.message);
  }
}

/**
 * Main Runner Function
 */
async function runTracker() {
  console.log("==========================================");
  console.log("🚀 RAKUTEN PRICE TRACKER - STARTING CHECK");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("==========================================");

  const { items, allItems } = loadMonitoredProducts();

  if (items.length === 0) {
    console.log("No active products to monitor. Exiting.");
    return;
  }

  console.log(`Processing ${items.length} monitored product(s)...`);

  let checkedCount = 0;
  let alertCount = 0;

  for (const item of items) {
    checkedCount++;
    console.log(`\n[${checkedCount}/${items.length}] Checking: ${item.name}`);
    console.log(`URL: ${item.url}`);
    console.log(`Recorded Price: ${formatJPY(item.currentPrice)} (Initial: ${formatJPY(item.initialPrice)})`);

    const scraped = await fetchRakutenProduct(item.url);

    if (!scraped || scraped.price === null) {
      console.warn(`⚠️ Could not determine price for "${item.name}". Skipping.`);
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }

    const livePrice = scraped.price;
    const oldPrice = item.currentPrice;
    const initialPrice = item.initialPrice || oldPrice;
    const nowIso = new Date().toISOString();

    console.log(`Live Scraped Price: ${formatJPY(livePrice)}`);

    // Detect price drop / sale
    const hasPriceDropped = livePrice < oldPrice;
    const hitTargetPrice = item.targetPrice && livePrice <= item.targetPrice;
    const isDiscounted = livePrice < initialPrice;

    const discountPercent =
      initialPrice > livePrice
        ? Math.round(((initialPrice - livePrice) / initialPrice) * 100)
        : 0;

    const shouldAlert = hasPriceDropped || hitTargetPrice;

    if (shouldAlert) {
      alertCount++;
      console.log(`🎉 SALE DETECTED! Price dropped from ${formatJPY(oldPrice)} down to ${formatJPY(livePrice)} (-${discountPercent}%)`);

      const recipient = item.notifyEmail || "japanshop.tuyan78@gmail.com";
      await sendAlertEmail({
        toEmail: recipient,
        product: {
          ...item,
          name: scraped.name || item.name,
          imageUrl: scraped.imageUrl || item.imageUrl,
        },
        oldPrice: oldPrice,
        currentPrice: livePrice,
        discountPercent: discountPercent,
      });
    } else {
      console.log(`No price drop detected. Price remains at ${formatJPY(livePrice)}.`);
    }

    // Prepare updated item
    const updated = {
      ...item,
      name: scraped.name || item.name,
      imageUrl: scraped.imageUrl || item.imageUrl,
      currentPrice: livePrice,
      isSale: isDiscounted,
      lastCheckedAt: nowIso,
    };

    saveUpdatedProduct(updated, allItems);

    // Sleep 1.5 seconds between requests to avoid rate limits
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n==========================================");
  console.log(`✅ TRACKER COMPLETED. Checked: ${checkedCount}, Alerts sent: ${alertCount}`);
  console.log("==========================================");
}

runTracker().catch((err) => {
  console.error("Fatal error running tracker:", err);
  process.exit(1);
});
