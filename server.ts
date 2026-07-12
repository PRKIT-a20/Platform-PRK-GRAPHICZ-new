import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db';
import { content_planner, requests, contact_submissions, users } from './src/db/schema';
import { eq, desc } from 'drizzle-orm';

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Content Planner Routes
  app.get('/api/content_planner/:userId', async (req, res) => {
    try {
      const data = await db.query.content_planner.findMany({
        where: eq(content_planner.user_id, req.params.userId),
        orderBy: desc(content_planner.created_at),
      });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch' });
    }
  });

  app.post('/api/content_planner', async (req, res) => {
    try {
      const newRow = await db.insert(content_planner).values(req.body).returning();
      res.json({ data: newRow });
    } catch (error) {
      res.status(500).json({ error: 'Failed to insert' });
    }
  });

  app.put('/api/content_planner/:id', async (req, res) => {
    try {
      const updatedRow = await db.update(content_planner).set(req.body).where(eq(content_planner.id, req.params.id)).returning();
      res.json({ data: updatedRow[0] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update' });
    }
  });

  app.delete('/api/content_planner/:id', async (req, res) => {
    try {
      await db.delete(content_planner).where(eq(content_planner.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete' });
    }
  });

  // Requests Routes
  app.get('/api/requests', async (req, res) => {
    try {
      const data = await db.query.requests.findMany({
        orderBy: desc(requests.created_at),
      });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  });

  app.post('/api/requests', async (req, res) => {
    try {
      const newRow = await db.insert(requests).values(req.body).returning();
      res.json({ data: newRow });
    } catch (error) {
      res.status(500).json({ error: 'Failed to insert request' });
    }
  });

  app.put('/api/requests/:id', async (req, res) => {
    try {
      const updatedRow = await db.update(requests).set(req.body).where(eq(requests.id, req.params.id)).returning();
      res.json({ data: updatedRow[0] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update request' });
    }
  });

  app.delete('/api/requests/:id', async (req, res) => {
    try {
      await db.delete(requests).where(eq(requests.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete request' });
    }
  });

  // Client Invoices Routes
  app.get('/api/client_invoices', async (req, res) => {
    try {
      const data = await db.select().from(requests); // Using requests table as a substitute for client_invoices
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  });

  app.put('/api/client_invoices/:id', async (req, res) => {
    try {
      const updatedRow = await db.update(requests).set(req.body).where(eq(requests.id, req.params.id)).returning();
      res.json({ data: updatedRow[0] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  });

  // Contact Submissions Routes
  app.get('/api/contact_submissions', async (req, res) => {
    try {
      const data = await db.query.contact_submissions.findMany({
        orderBy: desc(contact_submissions.created_at),
      });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch contact submissions' });
    }
  });

  app.post('/api/contact_submissions', async (req, res) => {
    try {
      const newRow = await db.insert(contact_submissions).values(req.body).returning();
      res.json({ data: newRow });
    } catch (error) {
      res.status(500).json({ error: 'Failed to insert contact submission' });
    }
  });

  app.post('/api/register', async (req, res) => {
    try {
      const { email, full_name, role } = req.body;
      const newUser = await db.insert(users).values({
        email,
        full_name,
        role: role || 'client',
        subscription_status: 'free',
        is_verified: false
      }).returning();
      res.json({ data: newUser[0] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  // Users Routes
  app.get('/api/users', async (req, res) => {
    try {
      const data = await db.query.users.findMany({
        orderBy: desc(users.created_at),
      });
      console.log("Users in DB:", data);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    try {
      const updatedRow = await db.update(users).set(req.body).where(eq(users.id, req.params.id)).returning();
      res.json({ data: updatedRow[0] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
