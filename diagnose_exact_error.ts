import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function diagnose() {
  try {
    console.log('Running exact insert diagnostic with params...');
    // We try to insert with user_id = 1 (or any existing integer ID)
    // Let's first fetch a valid user ID from the database
    const userRes = await db.execute(sql`SELECT id FROM users LIMIT 1;`);
    if (userRes.rows.length === 0) {
      console.log('No users in database. Creating one...');
      const insertUser = await db.execute(sql`
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ('test_diag@example.com', 'hash', 'Diag User', 'client')
        RETURNING id;
      `);
      console.log('Created user:', insertUser.rows);
    }
    
    const validUser = await db.execute(sql`SELECT id FROM users LIMIT 1;`);
    const validId = validUser.rows[0].id;
    console.log('Using valid user ID:', validId);

    const q = sql`
      insert into "requests" ("id", "user_id", "title", "description", "status") 
      values (gen_random_uuid(), ${validId}, 'Request Diagnostic', 'Test', 'pending') 
      returning "id";
    `;
    const res = await db.execute(q);
    console.log('Insert success:', res);
  } catch (error: any) {
    console.error('Insert failed with error message:', error.message);
    if (error.cause) console.error('Error cause details:', error.cause);
    if (error.detail) console.error('Error detail:', error.detail);
    if (error.code) console.error('Error Postgres code:', error.code);
    console.error('Full Error Object:', JSON.stringify(error, null, 2));
  }
  process.exit(0);
}

diagnose();
