// Load configuration first
require('../config.js');

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// JWT utilities
const generateTokens = (user: any) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  const accessToken = jwt.sign(payload, secret, { expiresIn });
  const refreshToken = jwt.sign(payload, secret, { expiresIn: refreshExpiresIn });

  return { accessToken, refreshToken };
};

const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12);
};

const comparePassword = async (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Handle static admin and manager credentials
    if (email === 'admin@homebonzenga.com' && password === 'Admin@123') {
      const adminUser = {
        id: 'admin-static-id',
        email: 'admin@homebonzenga.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        phone: null,
        avatar: null,
        fcmToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const tokens = generateTokens(adminUser);
      console.log(`Admin logged in: ${adminUser.email}`);

      return res.json({
        user: adminUser,
        ...tokens
      });
    }

    if (email === 'manager@homebonzenga.com' && password === 'Manager@123') {
      const managerUser = {
        id: 'manager-static-id',
        email: 'manager@homebonzenga.com',
        firstName: 'Manager',
        lastName: 'User',
        role: 'MANAGER',
        status: 'ACTIVE',
        phone: null,
        avatar: null,
        fcmToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const tokens = generateTokens(managerUser);
      console.log(`Manager logged in: ${managerUser.email}`);

      return res.json({
        user: managerUser,
        ...tokens
      });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        vendor: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    console.log(`User logged in: ${user.email}`);

    res.json({
      user: userWithoutPassword,
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        role: role || 'CUSTOMER',
        status: 'ACTIVE',
        password: hashedPassword
      },
      include: {
        vendor: true
      }
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    console.log(`User registered: ${user.email}`);

    res.status(201).json({
      user: userWithoutPassword,
      ...tokens
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import routes
import dashboardRoutes from './routes/dashboard';
import vendorRoutes from './routes/vendors';
import bookingRoutes from './routes/bookings';
import vendorApiRoutes from './routes/vendor';
import authRoutes from './routes/auth';
import managerRoutes from './routes/manager';
import adminRoutes from './routes/admin';

// Use routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/vendor', vendorApiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Auth server running with database' });
});

// Initialize database
async function initializeDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Create database tables if they don't exist
    await prisma.$executeRaw`PRAGMA foreign_keys = ON;`;
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Start server
app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
  console.log(`📝 Demo accounts available:`);
  console.log(`   Admin: admin@homebonzenga.com / Admin@123`);
  console.log(`   Manager: manager@homebonzenga.com / Manager@123`);
});

export default app;