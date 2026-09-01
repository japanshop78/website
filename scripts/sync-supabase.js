/**
 * Optimized Supabase Data Sync Script for Japan Shop
 * Usage: npm run db:sync
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env file not found at ' + envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseKey = keyMatch ? keyMatch[1].trim() : '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing in .env');
  process.exit(1);
}

const headers = {
  'apikey': supabaseKey,
  'Authorization': 'Bearer ' + supabaseKey,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates'
};

async function postBatch(endpoint, items, batchSize = 50) {
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(chunk)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to post batch to ${endpoint} (${i}-${i + chunk.length}): ${res.status} ${res.statusText} - ${errText}`);
    }
  }
}

async function sync() {
  console.log('🚀 Starting optimized sync to Supabase: ' + supabaseUrl);

  const catPath = path.join(rootDir, 'src', 'data', 'categories.json');
  const prodPath = path.join(rootDir, 'src', 'data', 'products.json');
  const catProdPath = path.join(rootDir, 'src', 'data', 'category_products.json');
  const orderPath = path.join(rootDir, 'src', 'data', 'order.json');

  const categories = JSON.parse(fs.readFileSync(catPath, 'utf8'));
  const products = JSON.parse(fs.readFileSync(prodPath, 'utf8'));
  const categoryProducts = JSON.parse(fs.readFileSync(catProdPath, 'utf8'));
  const orders = JSON.parse(fs.readFileSync(orderPath, 'utf8'));

  console.log(`📦 Reading local data: ${categories.length} categories, ${products.length} products, ${categoryProducts.length} mappings, ${orders.length} orders.`);

  // 1. Categories
  const dbCategories = categories.map((c, idx) => {
    const numMatch = c.id.match(/\d+/);
    const defaultOrder = numMatch ? parseInt(numMatch[0], 10) : idx + 1;
    return {
      id: c.id,
      slug: c.id.toLowerCase(),
      name: c.name,
      description: c.description || '',
      banner_gradient: c.bannerGradient || 'from-indigo-600 to-violet-700',
      badge_color: c.badgeColor || 'bg-indigo-500',
      icon_name: c.iconName || 'SparklesIcon',
      item_count_text: c.itemCountText || '0 sản phẩm',
      subcategories: c.subcategories || [],
      order_num: c.order !== undefined ? Number(c.order) : defaultOrder,
    };
  });
  try {
    await postBatch('categories?on_conflict=id', dbCategories);
  } catch (err) {
    if (err.message && err.message.includes('order_num')) {
      const fallbackCats = dbCategories.map(({ order_num, ...rest }) => rest);
      await postBatch('categories?on_conflict=id', fallbackCats);
    } else {
      throw err;
    }
  }
  console.log(`✅ Synced ${dbCategories.length} categories.`);

  // 2. Products
  const dbProducts = products.map(p => {
    const images = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : (p.image ? [p.image] : []);
    return {
      id: p.id,
      name: p.name,
      description: p.description || '',
      image: images[0] || '',
      images: images,
      image_bg: p.imageBg || '',
      price: p.price,
      old_price: p.oldPrice || null,
      rating: p.rating || 5.0,
      reviews: p.reviews || 0,
      tag: p.tag || null,
      stock: p.stock || 0,
    };
  });

  try {
    await postBatch('products?on_conflict=id', dbProducts, 50);
  } catch (err) {
    if (err.message && err.message.includes("images")) {
      console.warn("⚠️ Cột 'images' chưa có trong bảng 'products' trên Supabase. Đang đồng bộ không có cột images...");
      const fallbackProducts = dbProducts.map(({ images, ...rest }) => rest);
      await postBatch('products?on_conflict=id', fallbackProducts, 50);
    } else {
      throw err;
    }
  }
  console.log(`✅ Synced ${dbProducts.length} products.`);

  // 3. Category Products
  // Clean old mappings and insert current
  await fetch(`${supabaseUrl}/rest/v1/category_products?id=gt.0`, {
    method: 'DELETE',
    headers: headers
  });

  const dbCatProd = categoryProducts.map((cp, idx) => ({
    category_id: cp.categoryId,
    product_id: cp.productId,
    order_num: typeof cp.order === 'number' ? cp.order : idx + 1,
  }));
  try {
    await postBatch('category_products', dbCatProd, 100);
  } catch (err) {
    if (err.message && err.message.includes('order_num')) {
      const fallbackCatProd = dbCatProd.map(({ order_num, ...rest }) => rest);
      await postBatch('category_products', fallbackCatProd, 100);
    } else {
      throw err;
    }
  }
  console.log(`✅ Synced ${dbCatProd.length} category mappings.`);

  // 4. Orders
  await fetch(`${supabaseUrl}/rest/v1/product_orders?order_num=gte.0`, {
    method: 'DELETE',
    headers: headers
  });

  const dbOrders = orders.map(o => ({
    product_id: o.productId,
    order_num: o.order,
    banner: o.banner || 'featured',
  }));
  try {
    await postBatch('product_orders', dbOrders);
  } catch (err) {
    if (err.message && err.message.includes("banner")) {
      console.warn("⚠️ Cột 'banner' chưa có trong bảng 'product_orders'. Đang đồng bộ danh sách bán chạy...");
      // Filter unique product_id for backward compatibility
      const seen = new Set();
      const uniqueOrders = [];
      for (const o of orders) {
        if (!seen.has(o.productId)) {
          seen.add(o.productId);
          uniqueOrders.push({
            product_id: o.productId,
            order_num: o.order,
          });
        }
      }
      await postBatch('product_orders?on_conflict=product_id', uniqueOrders);
    } else {
      throw err;
    }
  }
  console.log(`✅ Synced ${dbOrders.length} product banner orders.`);

  console.log('🎉 ---------------------------------------------');
  console.log('🎉 ALL DATA SYNCED SUCCESSFULLY TO SUPABASE CLOUD!');
  console.log('🎉 ---------------------------------------------');
}

sync().catch((err) => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
