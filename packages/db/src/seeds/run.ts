import 'dotenv/config';
import { seedDepositMethods } from './deposit-methods.js';
import { db, paymentMethods } from '../index.js';

async function main() {
  console.log('=== Seeding deposit methods ===');
  const result = await seedDepositMethods();
  console.log('Result:', result);

  const all = await db.select().from(paymentMethods);
  console.log('Total in DB:', all.length);
  console.log('Sample:');
  for (const m of all.slice(0, 3)) {
    console.log(' -', m.code, '|', m.name, '|', m.type, '| layout:', (m.config as any)?.ui_layout);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
