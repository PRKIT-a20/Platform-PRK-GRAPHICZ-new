import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function initDb() {
  console.log('Dropping and re-creating tables...');
  await db.execute(sql`
    DROP TABLE IF EXISTS content_planner CASCADE;
    DROP TABLE IF EXISTS requests CASCADE;
    DROP TABLE IF EXISTS contact_submissions CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);

  await db.execute(sql`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT,
      role TEXT NOT NULL DEFAULT 'client',
      subscription_status TEXT NOT NULL DEFAULT 'free',
      is_verified BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER REFERENCES users(id) NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      delivery_url TEXT,
      project_nr TEXT,
      review_count INTEGER DEFAULT 0,
      product_type TEXT
    );

    CREATE TABLE contact_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE content_planner (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER REFERENCES users(id) NOT NULL,
      post_date TEXT,
      content_pillar TEXT,
      boost TEXT,
      concept TEXT,
      text_on_design TEXT,
      design_description TEXT,
      caption TEXT,
      notice TEXT,
      scheduled_date TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log('Tables re-created successfully');
}

initDb().catch(console.error);
