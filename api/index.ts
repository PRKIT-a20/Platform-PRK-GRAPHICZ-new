import express from 'express';
import cors from 'cors';
import { db } from '../src/db/index.js';
import { 
  users, 
  packages, 
  services, 
  package_services, 
  subscriptions, 
  invoices, 
  invoice_items, 
  payments, 
  contact_submissions, 
  requests, 
  projects, 
  project_tasks, 
  content_planner, 
  activity_logs, 
  brand_folders, 
  brand_files, 
  proofing_galleries, 
  proofing_items, 
  proofing_versions, 
  conversations, 
  messages, 
  notifications,
  strategy_boards,
  wiki_articles
} from '../src/db/schema.js';
import { eq, desc, and, or, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const app = express();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://prkgraphicz.vercel.app'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Helper Functions & Middlewares ---

function isPasswordStrong(password: string): boolean {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

function requireRole(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of these roles: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}

async function logActivity(userId: number | null, action: string, module: string, description?: string) {
  try {
    await db.insert(activity_logs).values({
      user_id: userId,
      action,
      module,
      description: description || null
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

async function createNotification(userId: number, type: string, title: string, message: string) {
  try {
    await db.insert(notifications).values({
      user_id: userId,
      type,
      title,
      message,
      is_read: false
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

// --- 1. Authentication & Self-service ---

app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();

    if (!isPasswordStrong(password)) {
      return res.status(400).json({ error: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.' });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail)
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.insert(users).values({
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name,
      role: 'client',
      subscription_status: 'free',
      is_verified: false
    }).returning();
    
    const userToReturn = { ...newUser[0] };
    delete (userToReturn as any).password_hash;
    
    const token = jwt.sign(
      { id: userToReturn.id, email: userToReturn.email, role: userToReturn.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    await logActivity(userToReturn.id, 'register', 'users', `User registered successfully as ${userToReturn.role}`);
    
    res.json({ data: { token, user: userToReturn } });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ error: 'Failed to register user: ' + (error.message || String(error)) });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail)
    });

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    const userToReturn = { ...user };
    delete (userToReturn as any).password_hash;

    await logActivity(user.id, 'login', 'users', 'User logged in successfully');
    
    res.json({ data: { token, user: userToReturn } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/sync-user', authenticateToken, async (req: any, res: any) => {
  try {
    const { email, full_name, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const normalizedEmail = email.trim().toLowerCase();
    
    let user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail)
    });
    
    const isSuperAdmin = req.user?.role === 'super_admin';
    
    if (!user) {
      const assignedRole = (isSuperAdmin && role) ? role : 'client';
      
      const newUser = await db.insert(users).values({
        email: normalizedEmail,
        full_name,
        role: assignedRole,
        subscription_status: 'free',
        is_verified: false
      }).returning();
      user = newUser[0];
    } else {
      if (!isSuperAdmin && normalizedEmail !== req.user.email.trim().toLowerCase()) {
        return res.status(403).json({ error: 'Forbidden: You can only update your own user record' });
      }

      const updateData: any = {
        full_name: full_name || user.full_name
      };
      if (isSuperAdmin && role) {
        updateData.role = role;
      }
      
      const updated = await db.update(users).set(updateData).where(eq(users.id, user.id)).returning();
      user = updated[0];
    }
    const userToReturn = { ...user };
    delete (userToReturn as any).password_hash;
    
    res.json({ data: userToReturn });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

app.post('/api/change-password', authenticateToken, async (req: any, res: any) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({ error: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character.' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, Number(userId))
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.password_hash) {
      return res.status(400).json({ error: 'Invalid current password configuration' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.update(users).set({ password_hash: passwordHash }).where(eq(users.id, Number(userId)));
    await logActivity(userId, 'change_password', 'users', 'Password changed successfully');

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    console.error("Change password error:", error);
    res.status(500).json({ error: 'Failed to change password: ' + (error.message || String(error)) });
  }
});

app.get('/api/me', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id)
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userToReturn = { ...user };
    delete (userToReturn as any).password_hash;
    res.json({ data: userToReturn });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// --- 2. Users Management & Role Control ---

app.get('/api/users', authenticateToken, async (req: any, res: any) => {
  try {
    const isSuperAdmin = req.user.email === 'prkgraphicz@gmail.com';
    const isClient = req.user.role === 'client' && !isSuperAdmin;
    if (isClient) {
      return res.status(403).json({ error: 'Forbidden: Clients cannot query users database' });
    }

    let data;
    if (req.user.role === 'designer') {
      // Designers can only query list of clients
      data = await db.query.users.findMany({
        where: eq(users.role, 'client'),
        orderBy: desc(users.created_at)
      });
    } else {
      // Admins/Super Admins see all users
      data = await db.query.users.findMany({
        orderBy: desc(users.created_at)
      });
    }

    const sanitizedData = data.map(u => {
      const { password_hash, ...rest } = u;
      return rest;
    });

    res.json({ data: sanitizedData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const targetUserId = Number(req.params.id);
    const requestingUserRole = req.user.role;

    // Normal clients can only edit themselves
    if (requestingUserRole === 'client' && targetUserId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own profile' });
    }

    // Designers can only edit themselves
    if (requestingUserRole === 'designer' && targetUserId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Designers can only edit their own profile' });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId)
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Admins cannot edit Super Admin accounts
    if (existingUser.role === 'super_admin' && requestingUserRole !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Only Super Admins can modify Super Admin accounts' });
    }

    const payload: any = {};
    if (req.body.full_name !== undefined) payload.full_name = req.body.full_name;

    // Role-based privilege escalation prevention
    if (req.body.role !== undefined || req.body.subscription_status !== undefined || req.body.is_verified !== undefined) {
      if (requestingUserRole !== 'super_admin') {
        return res.status(403).json({ 
          error: 'Forbidden: Only Super Admin can change user roles, subscription status, or verification state' 
        });
      }
      if (req.body.role !== undefined) payload.role = req.body.role;
      if (req.body.subscription_status !== undefined) payload.subscription_status = req.body.subscription_status;
      if (req.body.is_verified !== undefined) payload.is_verified = req.body.is_verified;
    }

    const updated = await db.update(users).set(payload).where(eq(users.id, targetUserId)).returning();
    const userToReturn = { ...updated[0] };
    delete (userToReturn as any).password_hash;

    await logActivity(
      req.user.id, 
      'update_user', 
      'users', 
      `User ${targetUserId} updated by ${req.user.email} (${requestingUserRole})`
    );

    res.json({ data: userToReturn });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// --- 3. Requests (Clients isolate requests, Admin/Super Admin can access all) ---

// --- Contact Submissions ---

app.get('/api/contact_submissions', authenticateToken, async (req: any, res: any) => {
  try {
    const isSuperAdmin = req.user.email === 'prkgraphicz@gmail.com';
    if (req.user.role !== 'admin' && !isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const data = await db.query.contact_submissions.findMany({
      orderBy: desc(contact_submissions.created_at)
    });
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact submissions' });
  }
});

app.post('/api/contact_submissions', async (req, res) => {
  try {
    const { first_name, last_name, email, message, phone } = req.body;
    const data = await db.insert(contact_submissions).values({
      first_name,
      last_name,
      email,
      message: phone ? `${message}\n\nPhone: ${phone}` : message,
      status: 'unread'
    }).returning();
    res.json({ data: data[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

app.get('/api/requests', authenticateToken, async (req: any, res: any) => {
  try {
    let data;
    if (req.user.role === 'client') {
      data = await db.query.requests.findMany({
        where: eq(requests.user_id, req.user.id),
        orderBy: desc(requests.created_at)
      });
    } else {
      data = await db.query.requests.findMany({
        orderBy: desc(requests.created_at)
      });
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

app.post('/api/requests', authenticateToken, async (req: any, res: any) => {
  try {
    let targetUserId = Number(req.user.id);
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      if (req.body.user_id) targetUserId = Number(req.body.user_id);
    }

    const payload = { 
      ...req.body, 
      user_id: targetUserId,
      status: req.body.status || 'pending'
    };
    
    const newRow = await db.insert(requests).values(payload).returning();

    await logActivity(req.user.id, 'create_request', 'requests', `New request "${payload.title}" created for client ID ${targetUserId}`);
    
    // Notify admin
    const adminUsers = await db.query.users.findMany({
      where: or(eq(users.role, 'admin'), eq(users.role, 'super_admin'))
    });
    for (const admin of adminUsers) {
      await createNotification(
        admin.id, 
        'request', 
        'New Request Submitted', 
        `Client submitted a new request: ${payload.title}`
      );
    }

    res.json({ data: newRow });
  } catch (error: any) {
    console.error("POST /api/requests error:", error);
    res.status(500).json({ error: 'Failed to insert request', details: error.message || String(error) });
  }
});

app.put('/api/requests/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await db.query.requests.findFirst({
      where: eq(requests.id, req.params.id)
    });

    if (!existing) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (req.user.role === 'client' && existing.user_id !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden: You cannot modify another client\'s request' });
    }

    const updatedRow = await db.update(requests).set(req.body).where(eq(requests.id, req.params.id)).returning();
    
    await logActivity(req.user.id, 'update_request', 'requests', `Request ID ${req.params.id} updated`);
    
    // Create notifications on status change
    if (req.body.status && req.body.status !== existing.status) {
      const clientIntId = Number(existing.user_id);
      if (!isNaN(clientIntId)) {
        await createNotification(
          clientIntId, 
          'request', 
          'Request Status Updated', 
          `Your request "${existing.title}" is now "${req.body.status}".`
        );
      }
    }

    res.json({ data: updatedRow[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update request' });
  }
});

app.delete('/api/requests/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await db.query.requests.findFirst({
      where: eq(requests.id, req.params.id)
    });

    if (!existing) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const isClient = req.user.role === 'client';
    if (isClient) {
      if (existing.user_id !== Number(req.user.id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (existing.status !== 'pending') {
        return res.status(400).json({ error: 'Forbidden: You can only delete requests while in pending status' });
      }
    } else if (req.user.role === 'designer') {
      return res.status(403).json({ error: 'Forbidden: Designers cannot delete requests' });
    }

    await db.delete(requests).where(eq(requests.id, req.params.id));
    await logActivity(req.user.id, 'delete_request', 'requests', `Request ID ${req.params.id} deleted`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// --- 4. Projects (Clients see owned, designers see assigned, admins see all) ---

app.get('/api/projects', authenticateToken, async (req: any, res: any) => {
  try {
    let data;
    if (req.user.role === 'client') {
      data = await db.query.projects.findMany({
        where: eq(projects.client_id, req.user.id),
        orderBy: desc(projects.created_at)
      });
    } else if (req.user.role === 'designer') {
      data = await db.query.projects.findMany({
        where: eq(projects.designer_id, req.user.id),
        orderBy: desc(projects.created_at)
      });
    } else {
      data = await db.query.projects.findMany({
        orderBy: desc(projects.created_at)
      });
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', authenticateToken, requireRole(['admin', 'super_admin']), async (req: any, res: any) => {
  try {
    const payload = {
      ...req.body,
      status: req.body.status || 'briefing'
    };
    const newRow = await db.insert(projects).values(payload).returning();
    
    await logActivity(req.user.id, 'create_project', 'projects', `Project "${payload.name}" created`);
    
    // Notify Client
    if (payload.client_id) {
      await createNotification(
        payload.client_id, 
        'project', 
        'New Project Started', 
        `A new project "${payload.name}" has been kicked off for you!`
      );
    }
    // Notify Designer
    if (payload.designer_id) {
      await createNotification(
        payload.designer_id, 
        'project', 
        'Project Assigned', 
        `You have been assigned to project "${payload.name}".`
      );
    }

    res.json({ data: newRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id)
    });

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isDesigner = req.user.role === 'designer';

    if (!isAdmin && !isDesigner) {
      return res.status(403).json({ error: 'Forbidden: Clients cannot modify projects directly' });
    }

    if (isDesigner) {
      if (existing.designer_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You can only edit projects assigned to you' });
      }
      
      // Designer can only update status or description
      const payload: any = {};
      if (req.body.status !== undefined) payload.status = req.body.status;
      if (req.body.description !== undefined) payload.description = req.body.description;
      
      const updated = await db.update(projects).set(payload).where(eq(projects.id, req.params.id)).returning();
      return res.json({ data: updated[0] });
    }

    // Admin has full control
    const updatedRow = await db.update(projects).set(req.body).where(eq(projects.id, req.params.id)).returning();
    
    await logActivity(req.user.id, 'update_project', 'projects', `Project ${req.params.id} updated`);

    if (req.body.status && req.body.status !== existing.status && existing.client_id) {
      await createNotification(
        existing.client_id, 
        'project', 
        'Project Status Updated', 
        `Your project "${existing.name}" status changed to "${req.body.status}".`
      );
    }

    res.json({ data: updatedRow[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: any, res: any) => {
  try {
    await db.delete(projects).where(eq(projects.id, req.params.id));
    await logActivity(req.user.id, 'delete_project', 'projects', `Project ${req.params.id} deleted`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// --- 5. Project Tasks (Designers & Clients check project assignment) ---

app.get('/api/project_tasks', authenticateToken, async (req: any, res: any) => {
  try {
    const projectId = req.query.project_id;
    if (!projectId) {
      return res.status(400).json({ error: 'project_id query param is required' });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, String(projectId))
    });

    if (!project) {
      return res.status(404).json({ error: 'Associated project not found' });
    }

    // Role checks
    if (req.user.role === 'client' && project.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission for this project\'s tasks' });
    }
    if (req.user.role === 'designer' && project.designer_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to this project' });
    }

    const data = await db.query.project_tasks.findMany({
      where: eq(project_tasks.project_id, String(projectId)),
      orderBy: desc(project_tasks.created_at)
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project tasks' });
  }
});

app.post('/api/project_tasks', authenticateToken, async (req: any, res: any) => {
  try {
    const projectId = req.body.project_id;
    if (!projectId) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, String(projectId))
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isDesigner = req.user.role === 'designer' && project.designer_id === req.user.id;

    if (!isAdmin && !isDesigner) {
      return res.status(403).json({ error: 'Forbidden: Only assigned designers or admins can create tasks' });
    }

    const payload = {
      ...req.body,
      status: req.body.status || 'todo'
    };

    const newRow = await db.insert(project_tasks).values(payload).returning();
    
    // Notify assignee
    if (payload.assigned_user_id) {
      await createNotification(
        payload.assigned_user_id,
        'task',
        'New Task Assigned',
        `You have been assigned to task: ${payload.title}`
      );
    }

    res.json({ data: newRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project task' });
  }
});

app.put('/api/project_tasks/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const task = await db.query.project_tasks.findFirst({
      where: eq(project_tasks.id, req.params.id)
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, task.project_id)
    });

    if (!project) {
      return res.status(404).json({ error: 'Associated project not found' });
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isDesigner = req.user.role === 'designer' && project.designer_id === req.user.id;
    const isClient = req.user.role === 'client' && project.client_id === req.user.id;

    if (!isAdmin && !isDesigner && !isClient) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this task' });
    }

    let payload: any = {};
    if (isClient) {
      // Clients cannot change anything about tasks
      return res.status(403).json({ error: 'Forbidden: Clients cannot modify tasks' });
    } else {
      payload = req.body;
    }

    const updated = await db.update(project_tasks).set(payload).where(eq(project_tasks.id, req.params.id)).returning();
    res.json({ data: updated[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/project_tasks/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const task = await db.query.project_tasks.findFirst({
      where: eq(project_tasks.id, req.params.id)
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, task.project_id)
    });

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isDesigner = req.user.role === 'designer' && project && project.designer_id === req.user.id;

    if (!isAdmin && !isDesigner) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.delete(project_tasks).where(eq(project_tasks.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// --- 6. Content Planner (Strict Client Isolation) ---

app.get('/api/content_planner/:userId', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = Number(req.params.userId);
    const authUserId = req.user.id;
    const isClient = req.user.role === 'client';

    // If client, force fetch only their own items
    const targetUserId = isClient ? authUserId : userId;

    if (req.user.role === 'designer') {
      const projectsCount = await db.query.projects.findMany({
        where: and(eq(projects.designer_id, req.user.id), eq(projects.client_id, targetUserId))
      });
      if (projectsCount.length === 0) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this client\'s content planner' });
      }
    }

    const data = await db.select({
      id: content_planner.id,
      user_id: content_planner.user_id,
      client_id: content_planner.client_id,
      project_id: content_planner.project_id,
      post_date: content_planner.post_date,
      content_pillar: content_planner.content_pillar,
      boost: content_planner.boost,
      concept: content_planner.concept,
      text_on_design: content_planner.text_on_design,
      design_description: content_planner.design_description,
      caption: content_planner.caption,
      notice: content_planner.notice,
      scheduled_date: content_planner.scheduled_date,
      title: content_planner.title,
      content_type: content_planner.content_type,
      description: content_planner.description,
      status: content_planner.status,
      created_at: content_planner.created_at,
      client_name: users.full_name,
      client_email: users.email
    })
    .from(content_planner)
    .leftJoin(users, eq(content_planner.client_id, users.id))
    .where(eq(content_planner.client_id, targetUserId))
    .orderBy(desc(content_planner.created_at));

    res.json({ data });
  } catch (error: any) {
    console.error("Fetch content planner error:", error);
    res.status(500).json({ error: 'Failed to fetch content planner: ' + error.message });
  }
});

app.post('/api/content_planner', authenticateToken, async (req: any, res: any) => {
  try {
    const isClient = req.user.role === 'client';
    let clientId = req.body.client_id ? Number(req.body.client_id) : undefined;
    
    if (isClient) {
      clientId = req.user.id;
    } else if (!clientId && req.body.user_id) {
      clientId = Number(req.body.user_id);
    }

    if (!clientId) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    if (req.user.role === 'designer') {
      const projectsCount = await db.query.projects.findMany({
        where: and(eq(projects.designer_id, req.user.id), eq(projects.client_id, clientId))
      });
      if (projectsCount.length === 0) {
        return res.status(403).json({ error: 'Forbidden: You are not assigned to a project for this client' });
      }
    }

    const payload = {
      user_id: String(req.user.id),
      client_id: clientId,
      project_id: req.body.project_id || null,
      post_date: req.body.post_date || null,
      content_pillar: req.body.content_pillar || null,
      boost: req.body.boost || null,
      concept: req.body.concept || null,
      text_on_design: req.body.text_on_design || null,
      design_description: req.body.design_description || null,
      caption: req.body.caption || null,
      notice: req.body.notice || null,
      scheduled_date: req.body.scheduled_date || null,
      title: req.body.title || null,
      content_type: req.body.content_type || null,
      description: req.body.description || null,
      status: req.body.status || 'pending',
    };

    const newRow = await db.insert(content_planner).values(payload).returning();
    
    const joinedRow = await db.select({
      id: content_planner.id,
      user_id: content_planner.user_id,
      client_id: content_planner.client_id,
      project_id: content_planner.project_id,
      post_date: content_planner.post_date,
      content_pillar: content_planner.content_pillar,
      boost: content_planner.boost,
      concept: content_planner.concept,
      text_on_design: content_planner.text_on_design,
      design_description: content_planner.design_description,
      caption: content_planner.caption,
      notice: content_planner.notice,
      scheduled_date: content_planner.scheduled_date,
      title: content_planner.title,
      content_type: content_planner.content_type,
      description: content_planner.description,
      status: content_planner.status,
      created_at: content_planner.created_at,
      client_name: users.full_name,
      client_email: users.email
    })
    .from(content_planner)
    .leftJoin(users, eq(content_planner.client_id, users.id))
    .where(eq(content_planner.id, newRow[0].id));

    res.json({ data: joinedRow });
  } catch (error: any) {
    console.error("Create content planner error:", error);
    res.status(500).json({ error: 'Failed to insert: ' + error.message });
  }
});

app.put('/api/content_planner/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const isClient = req.user.role === 'client';
    const rowId = req.params.id;

    const existing = await db.query.content_planner.findFirst({
      where: eq(content_planner.id, rowId)
    });

    if (!existing) {
      return res.status(404).json({ error: 'Content planner item not found' });
    }

    if (isClient && existing.client_id !== req.user.id && existing.user_id !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update this item' });
    }

    if (req.user.role === 'designer') {
      const projectsCount = await db.query.projects.findMany({
        where: and(eq(projects.designer_id, req.user.id), eq(projects.client_id, existing.client_id!))
      });
      if (projectsCount.length === 0) {
        return res.status(403).json({ error: 'Forbidden: You are not assigned to a project for this client' });
      }
    }

    const updatePayload: any = {};
    const allowedFields = [
      'project_id',
      'post_date',
      'content_pillar',
      'boost',
      'concept',
      'text_on_design',
      'design_description',
      'caption',
      'notice',
      'scheduled_date',
      'title',
      'content_type',
      'description',
      'status'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updatePayload[field] = req.body[field];
      }
    }

    if (!isClient && req.body.client_id !== undefined) {
      updatePayload.client_id = Number(req.body.client_id);
    }

    await db.update(content_planner)
      .set(updatePayload)
      .where(eq(content_planner.id, rowId));

    const joinedRow = await db.select({
      id: content_planner.id,
      user_id: content_planner.user_id,
      client_id: content_planner.client_id,
      project_id: content_planner.project_id,
      post_date: content_planner.post_date,
      content_pillar: content_planner.content_pillar,
      boost: content_planner.boost,
      concept: content_planner.concept,
      text_on_design: content_planner.text_on_design,
      design_description: content_planner.design_description,
      caption: content_planner.caption,
      notice: content_planner.notice,
      scheduled_date: content_planner.scheduled_date,
      title: content_planner.title,
      content_type: content_planner.content_type,
      description: content_planner.description,
      status: content_planner.status,
      created_at: content_planner.created_at,
      client_name: users.full_name,
      client_email: users.email
    })
    .from(content_planner)
    .leftJoin(users, eq(content_planner.client_id, users.id))
    .where(eq(content_planner.id, rowId));

    res.json({ data: joinedRow });
  } catch (error: any) {
    console.error("Update content planner error:", error);
    res.status(500).json({ error: 'Failed to update: ' + error.message });
  }
});

app.delete('/api/content_planner/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const isClient = req.user.role === 'client';
    const rowId = req.params.id;

    const existing = await db.query.content_planner.findFirst({
      where: eq(content_planner.id, rowId)
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (isClient && existing.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user.role === 'designer') {
      const projectsCount = await db.query.projects.findMany({
        where: and(eq(projects.designer_id, req.user.id), eq(projects.client_id, existing.client_id!))
      });
      if (projectsCount.length === 0) {
        return res.status(403).json({ error: 'Forbidden: You are not assigned to a project for this client' });
      }
    }

    await db.delete(content_planner).where(eq(content_planner.id, rowId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete: ' + error.message });
  }
});

// --- 7. Proofing Galleries, Items & Versions ---

app.get('/api/proofing_galleries', authenticateToken, async (req: any, res: any) => {
  try {
    let data: any[] = [];
    if (req.user.role === 'client') {
      data = await db.query.proofing_galleries.findMany({
        where: eq(proofing_galleries.client_id, req.user.id),
        orderBy: desc(proofing_galleries.created_at)
      });
    } else if (req.user.role === 'designer') {
      // Designers see galleries for their assigned projects
      const designerProjects = await db.query.projects.findMany({
        where: eq(projects.designer_id, req.user.id)
      });
      const projectIds = designerProjects.map(p => p.id);
      
      if (projectIds.length === 0) {
        data = [];
      } else {
        data = await db.select()
          .from(proofing_galleries)
          .where(or(...projectIds.map(id => eq(proofing_galleries.project_id, id))));
      }
    } else {
      // Admins
      data = await db.query.proofing_galleries.findMany({
        orderBy: desc(proofing_galleries.created_at)
      });
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proofing galleries' });
  }
});

app.post('/api/proofing_galleries', authenticateToken, async (req: any, res: any) => {
  try {
    const isClient = req.user.role === 'client';
    if (isClient) {
      return res.status(403).json({ error: 'Forbidden: Clients cannot create proofing galleries' });
    }

    // If designer, verify they are assigned to the project
    if (req.user.role === 'designer') {
      if (!req.body.project_id) {
        return res.status(400).json({ error: 'project_id is required' });
      }
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, req.body.project_id)
      });
      if (!project || project.designer_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You cannot create a gallery for an unassigned project' });
      }
    }

    const payload = {
      ...req.body,
      status: req.body.status || 'pending_review'
    };

    const newRow = await db.insert(proofing_galleries).values(payload).returning();
    
    await logActivity(req.user.id, 'create_gallery', 'proofing', `Proofing Gallery "${payload.title}" created`);
    
    await createNotification(
      payload.client_id,
      'proofing',
      'New Proofing Gallery Uploaded',
      `A new proofing gallery "${payload.title}" is ready for your review!`
    );

    res.json({ data: newRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create gallery' });
  }
});

app.put('/api/proofing_galleries/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const gallery = await db.query.proofing_galleries.findFirst({
      where: eq(proofing_galleries.id, req.params.id)
    });

    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    const isClient = req.user.role === 'client';
    if (isClient) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user.role === 'designer') {
      if (!gallery.project_id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, gallery.project_id)
      });
      if (!project || project.designer_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const updated = await db.update(proofing_galleries).set(req.body).where(eq(proofing_galleries.id, req.params.id)).returning();
    res.json({ data: updated[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update gallery' });
  }
});

app.delete('/api/proofing_galleries/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const gallery = await db.query.proofing_galleries.findFirst({
      where: eq(proofing_galleries.id, req.params.id)
    });

    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    if (req.user.role === 'client') return res.status(403).json({ error: 'Forbidden' });

    if (req.user.role === 'designer') {
      if (!gallery.project_id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, gallery.project_id)
      });
      if (!project || project.designer_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    await db.delete(proofing_galleries).where(eq(proofing_galleries.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete gallery' });
  }
});

app.get('/api/proofing_items', authenticateToken, async (req: any, res: any) => {
  try {
    const galleryId = req.query.gallery_id;
    if (!galleryId) return res.status(400).json({ error: 'gallery_id is required' });

    const gallery = await db.query.proofing_galleries.findFirst({
      where: eq(proofing_galleries.id, String(galleryId))
    });

    if (!gallery) return res.status(404).json({ error: 'Gallery not found' });

    // Permissions check
    if (req.user.role === 'client' && gallery.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role === 'designer') {
      if (!gallery.project_id) return res.status(403).json({ error: 'Forbidden' });
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, gallery.project_id)
      });
      if (!project || project.designer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    }

    const data = await db.query.proofing_items.findMany({
      where: eq(proofing_items.gallery_id, String(galleryId)),
      orderBy: desc(proofing_items.created_at)
    });
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/proofing_items', authenticateToken, async (req: any, res: any) => {
  try {
    const { gallery_id } = req.body;
    const gallery = await db.query.proofing_galleries.findFirst({
      where: eq(proofing_galleries.id, gallery_id)
    });

    if (!gallery) return res.status(404).json({ error: 'Gallery not found' });

    if (req.user.role === 'client') return res.status(403).json({ error: 'Forbidden' });
    if (req.user.role === 'designer') {
      if (!gallery.project_id) return res.status(403).json({ error: 'Forbidden' });
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, gallery.project_id)
      });
      if (!project || project.designer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    }

    const payload = {
      ...req.body,
      status: req.body.status || 'pending'
    };
    const newRow = await db.insert(proofing_items).values(payload).returning();
    res.json({ data: newRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.put('/api/proofing_items/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const item = await db.query.proofing_items.findFirst({
      where: eq(proofing_items.id, req.params.id)
    });

    if (!item) return res.status(404).json({ error: 'Item not found' });

    const gallery = await db.query.proofing_galleries.findFirst({
      where: eq(proofing_galleries.id, item.gallery_id)
    });

    if (!gallery) return res.status(404).json({ error: 'Gallery not found' });

    const isClient = req.user.role === 'client';
    const isDesigner = req.user.role === 'designer';

    if (isClient) {
      if (gallery.client_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      
      // Client can ONLY change client_selected, status, and favorite_count
      const payload: any = {};
      if (req.body.client_selected !== undefined) payload.client_selected = req.body.client_selected;
      if (req.body.favorite_count !== undefined) payload.favorite_count = req.body.favorite_count;
      if (req.body.status !== undefined) {
        payload.status = req.body.status; // approved, rejected
        payload.approved_by = req.user.id;
        payload.approved_at = new Date();
      }

      const updated = await db.update(proofing_items).set(payload).where(eq(proofing_items.id, req.params.id)).returning();
      
      await logActivity(
        req.user.id, 
        'client_review_proofing', 
        'proofing', 
        `Proofing Item ${req.params.id} marked as ${payload.status || 'reviewed'}`
      );

      // Notify Designer
      if (gallery.project_id) {
        const proj = await db.query.projects.findFirst({ where: eq(projects.id, gallery.project_id) });
        if (proj && proj.designer_id) {
          await createNotification(
            proj.designer_id,
            'proofing',
            'Proofing Reviewed by Client',
            `Client marked a design proof as ${payload.status || 'selected'}.`
          );
        }
      }

      return res.json({ data: updated[0] });
    }

    if (isDesigner) {
      if (!gallery.project_id) return res.status(403).json({ error: 'Forbidden' });
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, gallery.project_id)
      });
      if (!project || project.designer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedRow = await db.update(proofing_items).set(req.body).where(eq(proofing_items.id, req.params.id)).returning();
    res.json({ data: updatedRow[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/proofing_items/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const item = await db.query.proofing_items.findFirst({
      where: eq(proofing_items.id, req.params.id)
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const gallery = await db.query.proofing_galleries.findFirst({
      where: eq(proofing_galleries.id, item.gallery_id)
    });

    if (req.user.role === 'client') return res.status(403).json({ error: 'Forbidden' });
    if (req.user.role === 'designer') {
      if (!gallery || !gallery.project_id) return res.status(403).json({ error: 'Forbidden' });
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, gallery.project_id)
      });
      if (!project || project.designer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    }

    await db.delete(proofing_items).where(eq(proofing_items.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.get('/api/proofing_versions', authenticateToken, async (req: any, res: any) => {
  try {
    const itemId = req.query.proofing_item_id;
    if (!itemId) return res.status(400).json({ error: 'proofing_item_id is required' });

    const item = await db.query.proofing_items.findFirst({
      where: eq(proofing_items.id, String(itemId))
    });
    if (!item) return res.status(404).json({ error: 'Proofing item not found' });

    const gallery = await db.query.proofing_galleries.findFirst({
      where: eq(proofing_galleries.id, item.gallery_id)
    });
    if (!gallery) return res.status(404).json({ error: 'Gallery not found' });

    if (req.user.role === 'client' && gallery.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role === 'designer') {
      if (!gallery.project_id) return res.status(403).json({ error: 'Forbidden' });
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, gallery.project_id)
      });
      if (!project || project.designer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    }

    const data = await db.query.proofing_versions.findMany({
      where: eq(proofing_versions.proofing_item_id, String(itemId)),
      orderBy: desc(proofing_versions.version_number)
    });
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

app.post('/api/proofing_versions', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role === 'client') return res.status(403).json({ error: 'Forbidden' });
    
    const itemId = req.body.proofing_item_id;
    if (!itemId) return res.status(400).json({ error: 'proofing_item_id is required' });

    const item = await db.query.proofing_items.findFirst({
      where: eq(proofing_items.id, String(itemId))
    });
    if (!item) return res.status(404).json({ error: 'Proofing item not found' });

    const gallery = await db.query.proofing_galleries.findFirst({
      where: eq(proofing_galleries.id, item.gallery_id)
    });
    if (!gallery) return res.status(404).json({ error: 'Gallery not found' });

    if (req.user.role === 'designer') {
      if (!gallery.project_id) return res.status(403).json({ error: 'Forbidden' });
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, gallery.project_id)
      });
      if (!project || project.designer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    }

    const payload = {
      ...req.body,
      uploaded_by: req.user.id
    };
    const newRow = await db.insert(proofing_versions).values(payload).returning();
    res.json({ data: newRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload version' });
  }
});

// --- 8. Brand Vault (Granular visibility of brand_files for client vs designer vs admin) ---

app.get('/api/brand_folders', authenticateToken, async (req: any, res: any) => {
  try {
    let data: any[] = [];
    if (req.user.role === 'client') {
      data = await db.query.brand_folders.findMany({
        where: eq(brand_folders.client_id, req.user.id)
      });
    } else if (req.user.role === 'designer') {
      // Designers see folders for clients they share a project with
      const designerProjects = await db.query.projects.findMany({
        where: eq(projects.designer_id, req.user.id)
      });
      const clientIds = Array.from(new Set(designerProjects.map(p => p.client_id).filter(Boolean))) as number[];
      
      if (clientIds.length === 0) {
        data = [];
      } else {
        data = await db.select()
          .from(brand_folders)
          .where(or(...clientIds.map(id => eq(brand_folders.client_id, id))));
      }
    } else {
      data = await db.query.brand_folders.findMany();
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

app.post('/api/brand_folders', authenticateToken, async (req: any, res: any) => {
  try {
    let targetClientId = req.user.id;
    if (req.user.role !== 'client') {
      if (!req.body.client_id) return res.status(400).json({ error: 'client_id is required' });
      targetClientId = Number(req.body.client_id);
    }

    if (req.user.role === 'designer') {
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.designer_id, req.user.id), eq(projects.client_id, targetClientId))
      });
      if (!project) return res.status(403).json({ error: 'Forbidden: You are not assigned to this client' });
    }

    const payload = {
      name: req.body.name,
      client_id: targetClientId,
      parent_id: req.body.parent_id || null
    };

    const newRow = await db.insert(brand_folders).values(payload).returning();
    res.json({ data: newRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

app.put('/api/brand_folders/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const folder = await db.query.brand_folders.findFirst({
      where: eq(brand_folders.id, req.params.id)
    });
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    if (req.user.role === 'client' && folder.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user.role === 'designer') {
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.designer_id, req.user.id), eq(projects.client_id, folder.client_id))
      });
      if (!project) return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await db.update(brand_folders).set(req.body).where(eq(brand_folders.id, req.params.id)).returning();
    res.json({ data: updated[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

app.delete('/api/brand_folders/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const folder = await db.query.brand_folders.findFirst({
      where: eq(brand_folders.id, req.params.id)
    });
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    if (req.user.role === 'client' && folder.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user.role === 'designer') {
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.designer_id, req.user.id), eq(projects.client_id, folder.client_id))
      });
      if (!project) return res.status(403).json({ error: 'Forbidden' });
    }

    await db.delete(brand_folders).where(eq(brand_folders.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

app.get('/api/brand_files', authenticateToken, async (req: any, res: any) => {
  try {
    const folderId = req.query.folder_id;
    if (!folderId) return res.status(400).json({ error: 'folder_id is required' });

    const folder = await db.query.brand_folders.findFirst({
      where: eq(brand_folders.id, String(folderId))
    });

    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    // Enforce folder access rules
    if (req.user.role === 'client' && folder.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user.role === 'designer') {
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.designer_id, req.user.id), eq(projects.client_id, folder.client_id))
      });
      if (!project) return res.status(403).json({ error: 'Forbidden' });
    }

    let filesList;
    if (req.user.role === 'client') {
      // Clients can only see files with 'client' visibility
      filesList = await db.query.brand_files.findMany({
        where: and(
          eq(brand_files.folder_id, String(folderId)),
          eq(brand_files.visibility, 'client')
        ),
        orderBy: desc(brand_files.created_at)
      });
    } else if (req.user.role === 'designer') {
      // Designers can see 'client' and 'designer' visibility
      filesList = await db.query.brand_files.findMany({
        where: and(
          eq(brand_files.folder_id, String(folderId)),
          or(eq(brand_files.visibility, 'client'), eq(brand_files.visibility, 'designer'))
        ),
        orderBy: desc(brand_files.created_at)
      });
    } else {
      // Admins see everything
      filesList = await db.query.brand_files.findMany({
        where: eq(brand_files.folder_id, String(folderId)),
        orderBy: desc(brand_files.created_at)
      });
    }

    res.json({ data: filesList });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brand files' });
  }
});

app.post('/api/brand_files', authenticateToken, async (req: any, res: any) => {
  try {
    const { folder_id, visibility } = req.body;
    const folder = await db.query.brand_folders.findFirst({
      where: eq(brand_folders.id, folder_id)
    });

    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    if (req.user.role === 'designer') {
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.designer_id, req.user.id), eq(projects.client_id, folder.client_id))
      });
      if (!project) return res.status(403).json({ error: 'Forbidden' });
    }

    const isClient = req.user.role === 'client';
    if (isClient) {
      if (folder.client_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      // Force client visibility for client uploads
      req.body.visibility = 'client';
    }

    const payload = {
      ...req.body,
      visibility: req.body.visibility || 'client'
    };

    const newRow = await db.insert(brand_files).values(payload).returning();
    res.json({ data: newRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload brand file' });
  }
});

app.delete('/api/brand_files/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const file = await db.query.brand_files.findFirst({
      where: eq(brand_files.id, req.params.id)
    });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const folder = await db.query.brand_folders.findFirst({
      where: eq(brand_folders.id, file.folder_id)
    });

    if (req.user.role === 'client' && folder && folder.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user.role === 'designer' && folder) {
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.designer_id, req.user.id), eq(projects.client_id, folder.client_id))
      });
      if (!project) return res.status(403).json({ error: 'Forbidden' });
    }

    await db.delete(brand_files).where(eq(brand_files.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// --- 9. Conversations & Messages ---

app.get('/api/conversations', authenticateToken, async (req: any, res: any) => {
  try {
    let data;
    if (req.user.role === 'client') {
      data = await db.query.conversations.findMany({
        where: eq(conversations.client_id, req.user.id),
        orderBy: desc(conversations.created_at)
      });
    } else if (req.user.role === 'designer') {
      data = await db.query.conversations.findMany({
        where: or(
          eq(conversations.partner_id, req.user.id),
          // or conversations tied to project assigned to them
          // can join on projects
        ),
        orderBy: desc(conversations.created_at)
      });
    } else {
      data = await db.query.conversations.findMany({
        orderBy: desc(conversations.created_at)
      });
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.post('/api/conversations', authenticateToken, async (req: any, res: any) => {
  try {
    const targetClientId = req.user.role === 'client' ? req.user.id : Number(req.body.client_id);
    
    if (req.user.role === 'designer') {
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.designer_id, req.user.id), eq(projects.client_id, targetClientId))
      });
      if (!project) return res.status(403).json({ error: 'Forbidden: You are not assigned to this client' });
    }

    const payload = {
      ...req.body,
      client_id: targetClientId
    };
    const newRow = await db.insert(conversations).values(payload).returning();
    res.json({ data: newRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.get('/api/messages', authenticateToken, async (req: any, res: any) => {
  try {
    const conversationId = req.query.conversation_id;
    if (!conversationId) return res.status(400).json({ error: 'conversation_id is required' });

    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, String(conversationId))
    });

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Validate membership
    if (req.user.role === 'client' && conversation.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role === 'designer' && conversation.partner_id !== req.user.id) {
      // unless tied to assigned project
      if (conversation.project_id) {
        const proj = await db.query.projects.findFirst({ where: eq(projects.id, conversation.project_id) });
        if (!proj || proj.designer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      } else {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const data = await db.query.messages.findMany({
      where: eq(messages.conversation_id, String(conversationId)),
      orderBy: desc(messages.created_at)
    });
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', authenticateToken, async (req: any, res: any) => {
  try {
    const { conversation_id, message_text, file_url } = req.body;
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversation_id)
    });

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Validate membership
    if (req.user.role === 'client' && conversation.client_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (req.user.role === 'designer' && conversation.partner_id !== req.user.id) {
      if (conversation.project_id) {
        const proj = await db.query.projects.findFirst({ where: eq(projects.id, conversation.project_id) });
        if (!proj || proj.designer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      } else {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const payload = {
      conversation_id,
      sender_id: req.user.id,
      message_text,
      file_url: file_url || null
    };

    const newRow = await db.insert(messages).values(payload).returning();
    
    // Create notifications for other recipient
    const otherUserId = req.user.id === conversation.client_id ? conversation.partner_id : conversation.client_id;
    await createNotification(
      otherUserId,
      'message',
      'New Message Received',
      `${req.user.email} sent you a message.`
    );

    res.json({ data: newRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// --- 10. Billing, Invoices, Subscriptions & Payments ---

app.get('/api/subscriptions', authenticateToken, async (req: any, res: any) => {
  try {
    let data;
    if (req.user.role === 'client') {
      data = await db.query.subscriptions.findMany({
        where: eq(subscriptions.client_id, req.user.id)
      });
    } else {
      data = await db.query.subscriptions.findMany();
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

app.get('/api/invoices', authenticateToken, async (req: any, res: any) => {
  try {
    let data;
    if (req.user.role === 'client') {
      data = await db.query.invoices.findMany({
        where: eq(invoices.client_id, req.user.id),
        orderBy: desc(invoices.created_at)
      });
    } else {
      data = await db.query.invoices.findMany({
        orderBy: desc(invoices.created_at)
      });
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

app.post('/api/invoices', authenticateToken, requireRole(['admin', 'super_admin']), async (req: any, res: any) => {
  try {
    const payload = {
      ...req.body,
      status: req.body.status || 'pending',
      due_date: req.body.due_date ? new Date(req.body.due_date) : null
    };
    const newRow = await db.insert(invoices).values(payload).returning();
    
    try {
      await createNotification(
        payload.client_id,
        'billing',
        'New Invoice Received',
        `You received a new invoice of $${(payload.amount / 100).toFixed(2)} USD.`
      );
    } catch (notifErr) {
      console.error("Failed to create notification for invoice:", notifErr);
    }

    res.json({ data: newRow });
  } catch (error: any) {
    console.error("POST /api/invoices error:", error);
    res.status(500).json({ error: 'Failed to create invoice', details: error.message || String(error) });
  }
});

app.put('/api/invoices/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: any, res: any) => {
  try {
    const payload = { ...req.body };
    if (payload.due_date) {
      payload.due_date = new Date(payload.due_date);
    }
    const updated = await db.update(invoices).set(payload).where(eq(invoices.id, req.params.id)).returning();
    res.json({ data: updated[0] });
  } catch (error: any) {
    console.error("PUT /api/invoices error:", error);
    res.status(500).json({ error: 'Failed to update invoice', details: error.message || String(error) });
  }
});

app.post('/api/payments', authenticateToken, async (req: any, res: any) => {
  try {
    const { invoice_id, amount, payment_method, transaction_id } = req.body;
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoice_id)
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (req.user.role === 'client' && invoice.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const payload = {
      invoice_id,
      amount,
      payment_method: payment_method || 'credit_card',
      status: 'completed',
      transaction_id: transaction_id || `sim_${Math.random().toString(36).substring(7)}`
    };

    const newPayment = await db.insert(payments).values(payload).returning();

    // Calculate cumulative paid amount for the invoice (including the new payment)
    const allPayments = await db.query.payments.findMany({
      where: and(
        eq(payments.invoice_id, invoice_id),
        eq(payments.status, 'completed')
      )
    });
    const cumulativePaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    const isPaid = cumulativePaid >= invoice.amount;
    const newInvoiceStatus = isPaid ? 'paid' : 'partially_paid';

    // Update invoice status based on cumulative payments
    await db.update(invoices).set({ status: newInvoiceStatus }).where(eq(invoices.id, invoice_id));
    
    await logActivity(req.user.id, 'register_payment', 'billing', `Payment processed successfully for invoice ${invoice_id}`);
    
    res.json({ data: newPayment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register payment' });
  }
});

// --- 11. Packages & Services (Mutations restricted to SUPER ADMIN only) ---

app.get('/api/packages', async (req, res) => {
  try {
    const data = await db.query.packages.findMany();
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

app.post('/api/packages', authenticateToken, requireRole(['super_admin']), async (req: any, res: any) => {
  try {
    const newRow = await db.insert(packages).values(req.body).returning();
    await logActivity(req.user.id, 'create_package', 'billing', `Package "${req.body.name}" created by super admin`);
    res.json({ data: newRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create package' });
  }
});

app.put('/api/packages/:id', authenticateToken, requireRole(['super_admin']), async (req: any, res: any) => {
  try {
    const updated = await db.update(packages).set(req.body).where(eq(packages.id, Number(req.params.id))).returning();
    res.json({ data: updated[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update package' });
  }
});

app.delete('/api/packages/:id', authenticateToken, requireRole(['super_admin']), async (req: any, res: any) => {
  try {
    await db.delete(packages).where(eq(packages.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

app.get('/api/services', async (req, res) => {
  try {
    const data = await db.query.services.findMany();
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.get('/api/package_services', async (req, res) => {
  try {
    const data = await db.query.package_services.findMany();
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch package services' });
  }
});

app.post('/api/services', authenticateToken, requireRole(['super_admin']), async (req: any, res: any) => {
  try {
    const newRow = await db.insert(services).values(req.body).returning();
    res.json({ data: newRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// --- 12. Strategy Boards & Wiki Articles ---

app.get('/api/strategy_boards', authenticateToken, async (req: any, res: any) => {
  try {
    let data: any[] = [];
    if (req.user.role === 'client') {
      data = await db.query.strategy_boards.findMany({
        where: eq(strategy_boards.client_id, req.user.id),
        orderBy: desc(strategy_boards.created_at)
      });
    } else if (req.user.role === 'designer') {
      const designerProjects = await db.query.projects.findMany({
        where: eq(projects.designer_id, req.user.id)
      });
      const clientIds = Array.from(new Set(designerProjects.map(p => p.client_id).filter(Boolean))) as number[];
      
      if (clientIds.length === 0) {
        data = [];
      } else {
        data = await db.select()
          .from(strategy_boards)
          .where(or(...clientIds.map(id => eq(strategy_boards.client_id, id))))
          .orderBy(desc(strategy_boards.created_at));
      }
    } else {
      data = await db.query.strategy_boards.findMany({
        orderBy: desc(strategy_boards.created_at)
      });
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch strategy boards' });
  }
});

app.post('/api/strategy_boards', authenticateToken, requireRole(['admin', 'super_admin', 'designer']), async (req: any, res: any) => {
  try {
    if (req.user.role === 'designer') {
      if (!req.body.client_id) return res.status(400).json({ error: 'client_id is required' });
      const targetClientId = Number(req.body.client_id);
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.designer_id, req.user.id), eq(projects.client_id, targetClientId))
      });
      if (!project) return res.status(403).json({ error: 'Forbidden: You are not assigned to this client' });
    }

    const newRow = await db.insert(strategy_boards).values(req.body).returning();
    res.json({ data: newRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create strategy board' });
  }
});

app.put('/api/strategy_boards/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const existing = await db.query.strategy_boards.findFirst({
      where: eq(strategy_boards.id, req.params.id)
    });
    if (!existing) return res.status(404).json({ error: 'Strategy board not found' });

    if (req.user.role === 'client' && existing.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user.role === 'designer') {
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.designer_id, req.user.id), eq(projects.client_id, existing.client_id))
      });
      if (!project) return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await db.update(strategy_boards).set(req.body).where(eq(strategy_boards.id, req.params.id)).returning();
    res.json({ data: updated[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update strategy board' });
  }
});

app.get('/api/wiki_articles', authenticateToken, async (req: any, res: any) => {
  try {
    let data;
    if (req.user.role === 'client') {
      data = await db.query.wiki_articles.findMany({
        where: or(eq(wiki_articles.client_id, req.user.id), isNull(wiki_articles.client_id)),
        orderBy: desc(wiki_articles.created_at)
      });
    } else {
      data = await db.query.wiki_articles.findMany({
        orderBy: desc(wiki_articles.created_at)
      });
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wiki articles' });
  }
});

app.post('/api/wiki_articles', authenticateToken, requireRole(['admin', 'super_admin']), async (req: any, res: any) => {
  try {
    const newRow = await db.insert(wiki_articles).values(req.body).returning();
    res.json({ data: newRow[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create wiki article' });
  }
});

app.put('/api/wiki_articles/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: any, res: any) => {
  try {
    const updated = await db.update(wiki_articles).set(req.body).where(eq(wiki_articles.id, req.params.id)).returning();
    res.json({ data: updated[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update wiki article' });
  }
});

// --- 13. Notifications & Logs ---

app.get('/api/notifications', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await db.query.notifications.findMany({
      where: eq(notifications.user_id, req.user.id),
      orderBy: desc(notifications.created_at)
    });
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req: any, res: any) => {
  try {
    const updated = await db.update(notifications)
      .set({ is_read: true })
      .where(and(eq(notifications.id, req.params.id), eq(notifications.user_id, req.user.id)))
      .returning();
    res.json({ data: updated[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.get('/api/activity_logs', authenticateToken, requireRole(['admin', 'super_admin']), async (req: any, res: any) => {
  try {
    const data = await db.query.activity_logs.findMany({
      orderBy: desc(activity_logs.created_at),
      limit: 200
    });
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Retro-compatible requests lists for invoice tables mapping
app.get('/api/client_invoices', authenticateToken, async (req: any, res: any) => {
  try {
    let data;
    if (req.user.role === 'client') {
      data = await db.query.invoices.findMany({
        where: eq(invoices.client_id, req.user.id),
        orderBy: desc(invoices.created_at)
      });
    } else {
      data = await db.query.invoices.findMany({
        orderBy: desc(invoices.created_at)
      });
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ data: [] });
  }
});

export default app;
