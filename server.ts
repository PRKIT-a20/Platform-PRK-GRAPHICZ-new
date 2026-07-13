import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import apiApp from './api/index';

async function startServer() {
  const app = express();
  
  // Configure CORS
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://prkgraphicz.vercel.app'] 
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  };
  app.use(cors(corsOptions));
  
  app.use(express.json());
  const PORT = process.env.PORT || 3000;

  // Mount the secure, unified API router
  app.use(apiApp);

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

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
