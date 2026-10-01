import { Pool } from 'pg';

const ALKASR_TOKEN = process.env.ALKASR_API_TOKEN;
const ALKASR_BASE = (process.env.ALKASR_API_BASE_URL || 'https://api.alkasr-vip.com').replace(/\/+$/, '');
const MARGIN_PERCENT = Number(process.env.DEFAULT_PROFIT_MARGIN_PERCENT || '10');
const marginMultiplier = 1 + (MARGIN_PERCENT / 100);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('=== Starting direct sync ===');
console.log('Margin:', MARGIN_PERCENT + '%');

try {
  // 1. جلب المنتجات من Alkasr
  const res = await fetch(`${ALKASR_BASE}/client/api/products`, {
    headers: { 'api-token': ALKASR_TOKEN, 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error('Alkasr HTTP ' + res.status);
  const alkasrProducts = await res.json();
  console.log('Fetched', alkasrProducts.length, 'products from Alkasr');

  // 2. جلب الفئات الحالية
  const catsRes = await pool.query('SELECT id, name, slug FROM categories');
  const catBySlug = new Map(catsRes.rows.map(c => [c.slug, c.id]));
  const catByName = new Map(catsRes.rows.map(c => [c.name.toLowerCase(), c.id]));
  console.log('Found', catsRes.rows.length, 'existing categories');

  // 3. حذف البيانات التابعة القديمة ثم حذف كل المنتجات
  await pool.query("DELETE FROM transactions WHERE reference_type = 'order'");
  await pool.query("DELETE FROM orders");
  const del = await pool.query('DELETE FROM products');
  console.log('Deleted', del.rowCount, 'old products');

  // 4. إدراج المنتجات الجديدة واحدة واحدة
  let created = 0, errors = 0;
  for (const p of alkasrProducts) {
    try {
      // حدد الفئة
      let categoryId = null;
      if (p.parent_id) {
        categoryId = catBySlug.get(`alkasr-${p.parent_id}`) || null;
      }
      if (!categoryId && p.category_name) {
        categoryId = catByName.get(p.category_name.toLowerCase()) || null;
      }
      if (!categoryId && p.category_name) {
        const slug = `alkasr-cat-${p.parent_id || p.id}`;
        const ins = await pool.query(
          `INSERT INTO categories (name, slug, active) VALUES ($1, $2, true) RETURNING id`,
          [p.category_name, slug]
        );
        categoryId = ins.rows[0].id;
        catByName.set(p.category_name.toLowerCase(), categoryId);
        catBySlug.set(slug, categoryId);
      }

      // معالجة الكميات
      let minQty = 1, maxQty = null, qtyOptions = null;
      if (p.qty_values === null) {
        minQty = 1; maxQty = 1;
      } else if (Array.isArray(p.qty_values)) {
        const nums = p.qty_values.map(Number).filter(n => !isNaN(n) && n > 0);
        qtyOptions = JSON.stringify(p.qty_values);
        if (nums.length > 0) {
          minQty = Math.min(...nums);
          maxQty = Math.max(...nums);
        }
      } else if (typeof p.qty_values === 'object') {
        minQty = Number(p.qty_values.min) || 1;
        maxQty = Number(p.qty_values.max) || null;
        qtyOptions = JSON.stringify(p.qty_values);
      }

      // ⚠️ هامش الربح
      const costPrice = p.price != null ? Number(p.price) : 0;
      const baseRef = p.base_price != null ? Number(p.base_price) : costPrice;
      const priceWithMargin = baseRef * marginMultiplier;

      // الحقول المطلوبة
      const requiredFields = JSON.stringify(
        (p.params || []).map(label => ({ label, type: 'text' }))
      );

      const imgUrl = p.category_img && p.category_img !== 'https://api.alkasr-vip.com/'
        ? p.category_img : null;

      // إدراج
      await pool.query(`
        INSERT INTO products (
          alkasr_product_id, category_id, name, description, image_url,
          price_usd, base_price_usd, product_type, min_qty, max_qty,
          qty_options, required_fields, available, sort_order
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,0)
      `, [
        p.id, categoryId, p.name, null, imgUrl,
        priceWithMargin.toFixed(10), costPrice.toFixed(10), p.product_type,
        minQty.toFixed(4), maxQty != null ? maxQty.toFixed(4) : null,
        qtyOptions, requiredFields, p.available
      ]);

      created++;
      if (created % 100 === 0) console.log('Synced', created, 'products...');
    } catch (err) {
      errors++;
      if (errors <= 5) console.error('Failed product', p.id, ':', err.message);
    }
  }

  console.log('=== Sync complete ===');
  console.log('Created:', created);
  console.log('Errors:', errors);

  const finalCount = await pool.query('SELECT COUNT(*) FROM products');
  console.log('Total in DB:', finalCount.rows[0].count);
} catch (e) {
  console.error('Fatal sync error:', e);
} finally {
  await pool.end();
}
