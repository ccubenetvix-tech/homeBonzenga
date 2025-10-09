import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Register vendor
router.post('/register-vendor', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      shopName,
      description,
      address,
      city,
      state,
      zipCode,
      businessType,
      yearsInBusiness,
      numberOfEmployees,
      servicesOffered,
      operatingHours
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        role: 'VENDOR'
      }
    });

    // Create vendor profile
    const vendor = await prisma.vendor.create({
      data: {
        id: user.id,
        shopName,
        description,
        address,
        city,
        state,
        zipCode,
        businessType,
        yearsInBusiness,
        numberOfEmployees,
        servicesOffered,
        operatingHours: JSON.stringify(operatingHours),
        status: 'PENDING',
        isVerified: false
      }
    });

    res.status(201).json({
      message: 'Vendor registration successful',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      vendor: {
        id: vendor.id,
        shopName: vendor.shopName,
        status: vendor.status
      }
    });
  } catch (error) {
    console.error('Error registering vendor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register customer
router.post('/register-customer', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        role: 'CUSTOMER'
      }
    });

    // Create customer profile
    const customer = await prisma.customer.create({
      data: {
        id: user.id,
        preferences: JSON.stringify({}),
        isActive: true
      }
    });

    res.status(201).json({
      message: 'Customer registration successful',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      customer: {
        id: customer.id,
        isActive: customer.isActive
      }
    });
  } catch (error) {
    console.error('Error registering customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;