import { pgTable, text, timestamp, uuid, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  full_name: text('full_name'),
  role: text('role').default('client').notNull(),
  subscription_status: text('subscription_status').default('free').notNull(),
  is_verified: boolean('is_verified').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const requests = pgTable('requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').default('pending').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  delivery_url: text('delivery_url'),
  project_nr: text('project_nr'),
  review_count: integer('review_count').default(0),
  product_type: text('product_type'),
});

export const contact_submissions = pgTable('contact_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  status: text('status').default('pending').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const content_planner = pgTable('content_planner', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  post_date: text('post_date'),
  content_pillar: text('content_pillar'),
  boost: text('boost'),
  concept: text('concept'),
  text_on_design: text('text_on_design'),
  design_description: text('design_description'),
  caption: text('caption'),
  notice: text('notice'),
  scheduled_date: text('scheduled_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
