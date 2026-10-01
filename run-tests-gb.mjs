import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function query(sql, params) {
  const res = await pool.query(sql, params);
  return res.rows;
}

const adminKey = process.env.ADMIN_SYNC_KEY || "temp-dev-key-12345";
const BASE = "http://localhost:3000";

// Ensure active_theme_slug is default initially
await query(`UPDATE settings SET value = \x27"default"\x27 WHERE key = \x27active_theme_slug\x27;`);

console.log("=========================================");
console.log("Test A — Migration SQL Checks");
console.log("=========================================");
const themesRows = await query(`SELECT slug, name_en, is_dark FROM themes ORDER BY slug;`);
console.log("SELECT slug, name_en, is_dark FROM themes ORDER BY slug;");
console.log(JSON.stringify(themesRows, null, 2));

const constraintRows = await query(`SELECT conname FROM pg_constraint WHERE conname=\x27themes_slug_format_check\x27;`);
console.log("SELECT conname FROM pg_constraint WHERE conname=\x27themes_slug_format_check\x27;");
console.log(JSON.stringify(constraintRows, null, 2));

console.log("\n=========================================");
console.log("Test B — Public Active Theme");
console.log("=========================================");
const pubThemeRes = await fetch(`${BASE}/api/public/theme`).then(r => r.json());
console.log("curl http://localhost:3000/api/public/theme");
console.log(JSON.stringify(pubThemeRes, null, 2));

const pubThemeAllRes = await fetch(`${BASE}/api/public/theme/all`).then(r => r.json());
console.log("\ncurl http://localhost:3000/api/public/theme/all");
console.log("Theme count:", pubThemeAllRes.data?.length);
console.log("Slugs:", pubThemeAllRes.data?.map(t => t.slug));

console.log("\n=========================================");
console.log("Test C — Admin List");
console.log("=========================================");
const adminListRes = await fetch(`${BASE}/api/admin/themes`, {
  headers: { "X-Admin-Key": adminKey },
}).then(r => r.json());
console.log("curl -H X-Admin-Key:
