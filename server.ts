import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { db } from "./src/db";
import * as schema from "./src/db/schema";
import { eq, sql, asc, desc, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

app.use(express.json());
app.use(cookieParser());

// Auth middleware
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return next(); // Just continue, some routes don't need auth
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
  } catch (err) {}
  next();
};

app.use(authenticate);

// --- Auth Routes ---
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }
    
    // Hash password (we will store it in 'uid' for simplicity since we removed Firebase Auth, or add a password column. Wait, schema doesn't have a password column. We can use 'uid' to store the hashed password since it's unique and text.)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [newUser] = await db.insert(schema.users).values({
      email,
      uid: hashedPassword,
      fullName: full_name || '',
      role: 'client'
    }).returning();
    
    const safeUser = { ...newUser, uid: undefined };
    const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.json({ user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Auto-create admin if logging in with prkgraphicz@gmail.com and it doesn't exist
    if (email === 'prkgraphicz@gmail.com') {
      const adminExists = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      if (adminExists.length === 0) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.insert(schema.users).values({
          email,
          uid: hashedPassword,
          fullName: 'Admin',
          role: 'admin'
        });
      }
    }
    
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const user = users[0];
    const valid = await bcrypt.compare(password, user.uid);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const safeUser = { ...user, uid: undefined };
    const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.json({ user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

app.get("/api/auth/me", (req, res) => {
  if ((req as any).user) {
    res.json({ user: (req as any).user });
  } else {
    res.json({ user: null });
  }
});

// --- Dynamic REST Proxy for MockSupabase ---
app.post("/api/rest/:table", async (req, res) => {
  try {
    const table = req.params.table as keyof typeof schema;
    if (!schema[table]) {
      return res.status(400).json({ error: `Table ${table} not found` });
    }
    
    const dbTable = schema[table] as any;
    const { type, data, filters, order, single } = req.body;

    const getColumnKey = (colName: string) => {
      if (dbTable[colName]) return colName;
      for (const key of Object.keys(dbTable)) {
         if (dbTable[key]?.name === colName) return key;
      }
      return colName;
    };

    const mapInputData = (inputData: any) => {
      if (!inputData) return inputData;
      const isArray = Array.isArray(inputData);
      const items = isArray ? inputData : [inputData];
      const result = items.map((item: any) => {
        const mappedItem: any = {};
        for (const [key, value] of Object.entries(item)) {
          mappedItem[getColumnKey(key)] = value;
        }
        return mappedItem;
      });
      return isArray ? result : result[0];
    };

    const mapOutputData = (outputData: any) => {
      if (!outputData) return outputData;
      const isArray = Array.isArray(outputData);
      const items = isArray ? outputData : [outputData];
      const result = items.map((item: any) => {
        const mappedItem: any = {};
        for (const [key, value] of Object.entries(item)) {
          const colName = dbTable[key]?.name || key;
          mappedItem[colName] = value;
        }
        return mappedItem;
      });
      return isArray ? result : result[0];
    };
    
    let result: any = null;
    
    // Build where clause
    let whereClause = undefined;
    if (filters && filters.length > 0) {
      const conditions = filters.map((f: any) => {
        const colKey = getColumnKey(f.col);
        if (f.op === 'eq') return eq(dbTable[colKey], f.val);
        return undefined; // Add more if needed
      }).filter(Boolean);
      if (conditions.length > 0) {
        whereClause = and(...conditions);
      }
    }

    if (type === 'insert') {
      const mappedData = mapInputData(data);
      result = await db.insert(dbTable).values(mappedData).returning();
      result = mapOutputData(result);
    } else if (type === 'update') {
      const mappedData = mapInputData(data);
      let q = db.update(dbTable).set(mappedData);
      if (whereClause) q = (q as any).where(whereClause);
      result = await (q as any).returning();
      result = mapOutputData(result);
    } else if (type === 'delete') {
      let q = db.delete(dbTable);
      if (whereClause) q = (q as any).where(whereClause);
      result = await (q as any).returning();
      result = mapOutputData(result);
    } else if (type === 'select') {
      let q = db.select().from(dbTable);
      if (whereClause) q = (q as any).where(whereClause);
      if (order) {
        const orderColKey = getColumnKey(order.col);
        q = (q as any).orderBy(order.ascending ? asc(dbTable[orderColKey]) : desc(dbTable[orderColKey]));
      }
      result = await q;
      result = mapOutputData(result);
      if (single) {
        if (result.length === 0) return res.status(404).json({ error: "Row not found" });
        result = result[0];
      }
    }
    
    res.json({ data: result, error: null });
  } catch (err: any) {
    console.error("REST API error:", err);
    res.status(500).json({ error: err.message, data: null });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
