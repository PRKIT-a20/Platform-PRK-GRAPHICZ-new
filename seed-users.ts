import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './src/db/schema.js';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  const users = [
    { email: 'prkgraphicz@gmail.com', role: 'super_admin', full_name: 'PRK Graphicz' },
    { email: 'prkverkenner@gmail.com', role: 'admin', full_name: 'Admin User' },
    { email: 'angoetab@gmail.com', role: 'client', full_name: 'Client User' }
  ];
  
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('PrkGraphicz2026!', salt);

  for (const u of users) {
    try {
      await db.insert(schema.users).values({
        email: u.email,
        password_hash: passwordHash,
        full_name: u.full_name,
        role: u.role,
        is_verified: true
      });
      console.log(`Inserted ${u.email}`);
    } catch(e) {
      console.error(`Failed ${u.email}:`, e);
    }
  }
}

seed().catch(console.error);
