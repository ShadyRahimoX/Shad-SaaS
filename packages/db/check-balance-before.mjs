import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query(`
  SELECT u.username, u.balance_usd,
         d.invoice_id, d.status as deposit_status, d.amount_usd
  FROM users u
  LEFT JOIN deposits d ON d.user_id = u.id
  WHERE u.username = \x27deposit_tester\x27 AND d.invoice_id IS NOT NULL
  ORDER BY d.created_at DESC
  LIMIT 1
`);
console.log(JSON.stringify(r.rows, null, 2));
await pool.end();
