import fs from 'fs';
import path from 'path';
import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('Starting database migration...');
  
  const drizzleDir = path.join(process.cwd(), 'drizzle');
  const files = fs.readdirSync(drizzleDir);
  const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
  
  if (sqlFiles.length === 0) {
    throw new Error('No SQL migration files found in drizzle/ directory!');
  }
  
  console.log(`Found ${sqlFiles.length} migration files: ${sqlFiles.join(', ')}`);
  
  for (const sqlFile of sqlFiles) {
    console.log(`\n--- Running Migration: ${sqlFile} ---`);
    const sqlContent = fs.readFileSync(path.join(drizzleDir, sqlFile), 'utf8');
    
    // Split by drizzle-kit statement breakpoint
    const statements = sqlContent.split('--> statement-breakpoint');
    
    for (let statement of statements) {
      statement = statement.trim();
      if (!statement) continue;
      
      // Skip "users" table creation as it already exists in the database
      if (statement.toLowerCase().startsWith('create table "users"') || statement.toLowerCase().startsWith('create table public."users"')) {
        console.log('Skipping CREATE TABLE "users" because it already exists.');
        continue;
      }
      
      try {
        console.log(`Executing statement:\n${statement.substring(0, 100)}...`);
        await db.execute(sql.raw(statement));
        console.log('✓ Success');
      } catch (error: any) {
        const isAlreadyExists = 
          (error.message && error.message.toLowerCase().includes('already exists')) ||
          (error.cause?.message && error.cause.message.toLowerCase().includes('already exists')) ||
          (error.cause?.code === '42P07') ||
          (error.cause?.code === '42701') || // column already exists
          (error.message && error.message.toLowerCase().includes('already a foreign key')) ||
          (error.cause?.message && error.cause.message.toLowerCase().includes('already a foreign key')) ||
          (error.message && error.message.toLowerCase().includes('duplicate key')) ||
          (error.cause?.message && error.cause.message.toLowerCase().includes('duplicate key'));

        if (isAlreadyExists) {
          console.log('✓ Skipped (already exists/applied)');
        } else {
          console.error(`❌ Failed executing statement:\n${statement}`);
          console.error(error);
          throw error;
        }
      }
    }
  }
  
  console.log('Database migration completed successfully!');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
