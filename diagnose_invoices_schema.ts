import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function diagnose() {
  try {
    console.log('Diagnosing invoices table metadata...');
    const result = await db.execute(sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'invoices';
    `);
    console.log('Columns in "invoices" table:', JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('Diagnosis failed:', error);
  }
  process.exit(0);
}

diagnose();
