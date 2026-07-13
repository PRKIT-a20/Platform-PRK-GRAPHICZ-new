import { pgTable, text, timestamp, uuid, boolean, integer, serial } from 'drizzle-orm/pg-core';

// 1. Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash'),
  full_name: text('full_name'),
  role: text('role').default('client'), // super_admin, admin, designer, client
  subscription_status: text('subscription_status').default('free'),
  is_verified: boolean('is_verified').default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 2. Packages Table
export const packages = pgTable('packages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(), // Cent/Euro amount
  request_limit: integer('request_limit').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 3. Services Table
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 4. Package Services Join Table (relational package services)
export const package_services = pgTable('package_services', {
  id: serial('id').primaryKey(),
  package_id: integer('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  service_id: integer('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
});

// 5. Subscriptions Table
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  client_id: integer('client_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  package_id: integer('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  start_date: timestamp('start_date').defaultNow().notNull(),
  end_date: timestamp('end_date'),
  status: text('status').default('active').notNull(), // active, canceled, expired
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 6. Invoices Table
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  client_id: integer('client_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  subscription_id: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  invoice_number: text('invoice_number').notNull(),
  amount: integer('amount').notNull(), // total price in cents/Euros
  status: text('status').default('unpaid').notNull(), // paid, unpaid, draft, void
  due_date: timestamp('due_date'),
  file_url: text('file_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 7. Invoice Items Table
export const invoice_items = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoice_id: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  description: text('description').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  price: integer('price').notNull(), // item unit price
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 8. Payments Table
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoice_id: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  amount: integer('amount').notNull(),
  status: text('status').default('completed').notNull(), // completed, failed, pending
  payment_method: text('payment_method'),
  transaction_id: text('transaction_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 9. Contact Submissions Table
export const contact_submissions = pgTable('contact_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  status: text('status').default('unread').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 10. Requests Table
export const requests = pgTable('requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('pending').notNull(),
  delivery_url: text('delivery_url'),
  product_type: text('product_type'),
  deadline: text('deadline'),
  brand_id: uuid('brand_id'),
  review_count: integer('review_count').default(0),
  project_nr: text('project_nr'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 11. Projects Table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  request_id: uuid('request_id').references(() => requests.id, { onDelete: 'set null' }),
  name: text('name'),
  description: text('description'),
  client_id: integer('client_id').references(() => users.id, { onDelete: 'cascade' }),
  designer_id: integer('designer_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status').default('briefing').notNull(), // briefing, design, review, revision, completed
  deadline: timestamp('deadline'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 12. Project Tasks Table
export const project_tasks = pgTable('project_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  assigned_user_id: integer('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('todo').notNull(), // todo, in_progress, review, done
  deadline: timestamp('deadline'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 13. Content Planner Table
export const content_planner = pgTable('content_planner', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id'),
  client_id: integer('client_id').references(() => users.id, { onDelete: 'cascade' }),
  project_id: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  post_date: text('post_date'),
  content_pillar: text('content_pillar'),
  boost: text('boost'),
  concept: text('concept'),
  text_on_design: text('text_on_design'),
  design_description: text('design_description'),
  caption: text('caption'),
  notice: text('notice'),
  scheduled_date: text('scheduled_date'),
  title: text('title'),
  content_type: text('content_type'),
  description: text('description'),
  status: text('status').default('pending').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 14. Activity Logs Table
export const activity_logs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // status_changed, approved, uploaded, invoice_created, etc.
  module: text('module').notNull(), // requests, projects, proofing, brand_vault, billing
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 15. Brand Folders Table
export const brand_folders = pgTable('brand_folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  client_id: integer('client_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  parent_id: uuid('parent_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 16. Brand Files Table
export const brand_files = pgTable('brand_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  folder_id: uuid('folder_id').references(() => brand_folders.id, { onDelete: 'cascade' }).notNull(),
  file_name: text('file_name').notNull(),
  file_url: text('file_url').notNull(),
  file_size: integer('file_size'),
  mime_type: text('mime_type'),
  visibility: text('visibility').default('client').notNull(), // client, designer, admin
  version: integer('version').default(1).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 17. Proofing Galleries Table
export const proofing_galleries = pgTable('proofing_galleries', {
  id: uuid('id').primaryKey().defaultRandom(),
  client_id: integer('client_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  project_id: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('pending_review').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 18. Proofing Items Table
export const proofing_items = pgTable('proofing_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  gallery_id: uuid('gallery_id').references(() => proofing_galleries.id, { onDelete: 'cascade' }).notNull(),
  file_name: text('file_name').notNull(),
  file_url: text('file_url').notNull(),
  client_selected: boolean('client_selected').default(false).notNull(),
  favorite_count: integer('favorite_count').default(0).notNull(),
  approved_by: integer('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approved_at: timestamp('approved_at'),
  status: text('status').default('pending').notNull(), // pending, approved, rejected
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 19. Proofing Versions Table
export const proofing_versions = pgTable('proofing_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  proofing_item_id: uuid('proofing_item_id').references(() => proofing_items.id, { onDelete: 'cascade' }).notNull(),
  version_number: integer('version_number').notNull(),
  file_url: text('file_url').notNull(),
  uploaded_by: integer('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 20. Conversations Table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  client_id: integer('client_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  partner_id: integer('partner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), // admin or designer
  project_id: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 21. Messages Table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversation_id: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  sender_id: integer('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  message_text: text('message_text').notNull(),
  file_url: text('file_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 22. Notifications Table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // request, project, proofing, message, billing, etc.
  title: text('title').notNull(),
  message: text('message').notNull(),
  related_module: text('related_module'),
  related_id: text('related_id'),
  is_read: boolean('is_read').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 23. Strategy Boards Table
export const strategy_boards = pgTable('strategy_boards', {
  id: uuid('id').primaryKey().defaultRandom(),
  client_id: integer('client_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  project_id: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  goals: text('goals'),
  target_audience: text('target_audience'),
  brand_direction: text('brand_direction'),
  moodboards: text('moodboards'),
  feedback: text('feedback'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 24. Wiki Articles Table
export const wiki_articles = pgTable('wiki_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  visibility: text('visibility').default('public').notNull(), // public, client, internal
  client_id: integer('client_id').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
