import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  role: text('role').default('client'),
  subscriptionStatus: text('subscription_status').default('free'),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const requests = pgTable('requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Will store string user_id initially or uid
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('pending'),
  deliveryUrl: text('delivery_url'),
  productType: text('product_type'),
  deadline: text('deadline'),
  brandId: uuid('brand_id'),
  reviewCount: integer('review_count').default(0),
  projectNr: text('project_nr'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactSubmissions = pgTable('contact_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  status: text('status').default('unread'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const receipts = pgTable('receipts', {
  id: uuid('id').defaultRandom().primaryKey(),
  amount: integer('amount'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const clientInvoices = pgTable('client_invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id'),
  fileUrl: text('file_url'),
  status: text('status').default('Pending'),
  amount: integer('amount'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id'),
  role: text('role'),
});
