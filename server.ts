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
