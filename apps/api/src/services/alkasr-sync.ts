import { db, categories, products } from '@shad-saas/db';
import { getAlkasrContent, getAlkasrProducts } from '@shad-saas/providers';
import { eq } from 'drizzle-orm';

/**
 * مزامنة الفئات من Alkasr.
 */
export async function syncAlkasrCategories(): Promise<{ created: number; updated: number }> {
  const content = await getAlkasrContent(0);
  
  // Handlers for varying payload structures (array vs object with categories)
  const alkasrCategories = Array.isArray(content) 
    ? content 
    : (content.categories || (content.data as any)?.categories || []);
  
  let created = 0;
  let updated = 0;
  
  for (const cat of alkasrCategories) {
    const slug = `alkasr-${cat.id}`;
    
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    
    if (existing.length > 0) {
      await db
        .update(categories)
        .set({ name: cat.name, active: true })
        .where(eq(categories.id, existing[0].id));
      updated++;
    } else {
      await db.insert(categories).values({
        name: cat.name,
        slug,
        active: true,
      });
      created++;
    }
  }
  
  return { created, updated };
}

/**
 * مزامنة المنتجات من Alkasr.
 */
export async function syncAlkasrProducts(): Promise<{ created: number; updated: number; total: number; errors: number }> {
  const alkasrProducts = await getAlkasrProducts();
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  // Pre-fetch categories لتحسين الأداء
  const existingCats = await db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories);
  const catByName = new Map(existingCats.map(c => [c.name.toLowerCase(), c.id]));
  const catBySlug = new Map(existingCats.map(c => [c.slug, c.id]));
  
  for (const p of alkasrProducts) {
    try {
      // 1. تحديد categoryId
      let categoryId: string | null = null;
      
      // حاول أولاً بـ slug
      if (p.parent_id) {
        categoryId = catBySlug.get(`alkasr-${p.parent_id}`) || null;
      }
      
      // إذا لم تجد، ابحث بالاسم
      if (!categoryId && p.category_name) {
        categoryId = catByName.get(p.category_name.toLowerCase()) || null;
      }
      
      // إذا لم تجد، أنشئ فئة جديدة تلقائياً
      if (!categoryId && p.category_name) {
        const slug = `alkasr-cat-${p.parent_id || p.id}`;
        const [newCat] = await db.insert(categories).values({
          name: p.category_name,
          slug,
          active: true,
        }).returning({ id: categories.id });
        categoryId = newCat.id;
        catByName.set(p.category_name.toLowerCase(), newCat.id);
        catBySlug.set(slug, newCat.id);
      }
      
      // 2. معالجة qty_values
      let minQty = '1';
      let maxQty: string | null = null;
      let qtyOptions: unknown = null;
      
      if (p.qty_values === null) {
        // package: qty = 1 دائماً
        minQty = '1';
        maxQty = '1';
      } else if (Array.isArray(p.qty_values)) {
        // مصفوفة قيم محددة
        const values = p.qty_values.map(Number).filter(n => !isNaN(n) && n > 0);
        qtyOptions = p.qty_values; // احفظ الأصل
        if (values.length > 0) {
          minQty = String(Math.min(...values));
          maxQty = String(Math.max(...values));
        }
      } else if (typeof p.qty_values === 'object') {
        // نطاق min-max (قد يكون عشرياً)
        const min = Number(p.qty_values.min);
        const max = Number(p.qty_values.max);
        if (!isNaN(min) && min > 0) minQty = String(min);
        if (!isNaN(max) && max > 0) maxQty = String(max);
        qtyOptions = p.qty_values; // احفظ الأصل
      }
      
      // 3. حساب الأسعار
      const price = p.price != null ? String(p.price) : '0';
      const basePrice = p.base_price != null ? String(p.base_price) : price;
      
      const data = {
        alkasrProductId: p.id,
        name: p.name,
        description: null,
        imageUrl: p.category_img && p.category_img !== 'https://api.alkasr-vip.com/' 
          ? p.category_img 
          : null,
        priceUsd: price,
        basePriceUsd: basePrice,
        productType: p.product_type,  // يقبل أي قيمة
        minQty,
        maxQty,
        qtyOptions,
        requiredFields: p.params ? p.params.map(label => ({ label, type: 'text' })) : [],
        available: p.available,
        categoryId,
      };
      
      // 4. Upsert
      const existing = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.alkasrProductId, p.id))
        .limit(1);
      
      if (existing.length > 0) {
        await db.update(products).set(data).where(eq(products.id, existing[0].id));
        updated++;
      } else {
        await db.insert(products).values(data);
        created++;
      }
    } catch (err) {
      errors++;
      console.error(`Failed to sync product ${p.id} (${p.name}):`, err);
      // استمر — لا توقف الـ loop بسبب منتج واحد
    }
  }
  
  return { created, updated, total: alkasrProducts.length, errors };
}
