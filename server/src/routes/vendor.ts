import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to protect routes (simplified for demo)
const protect = (req: any, res: any, next: any) => {
  // In a real app, you'd verify JWT token here
  // For demo, we'll just check if user ID is provided
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Get vendor profile
router.get('/:vendorId/profile', protect, async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        user: true,
        services: true,
        bookings: {
          include: {
            customer: {
              include: { user: true }
            },
            items: {
              include: { service: true }
            }
          }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Calculate stats
    const totalBookings = vendor.bookings.length;
    const completedBookings = vendor.bookings.filter(b => b.status === 'COMPLETED').length;
    const totalRevenue = vendor.bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + b.total, 0);

    const profile = {
      ...vendor,
      stats: {
        totalBookings,
        completedBookings,
        totalRevenue,
        averageRating: 4.8, // Mock data
        totalReviews: 127 // Mock data
      }
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update vendor profile
router.put('/:vendorId/profile', protect, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const updateData = req.body;

    // Update user data
    if (updateData.firstName || updateData.lastName || updateData.email || updateData.phone) {
      await prisma.user.update({
        where: { id: vendorId },
        data: {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          email: updateData.email,
          phone: updateData.phone
        }
      });
    }

    // Update vendor data
    const vendorUpdateData: any = {};
    if (updateData.shopName) vendorUpdateData.shopName = updateData.shopName;
    if (updateData.description) vendorUpdateData.description = updateData.description;
    if (updateData.address) vendorUpdateData.address = updateData.address;
    if (updateData.city) vendorUpdateData.city = updateData.city;
    if (updateData.state) vendorUpdateData.state = updateData.state;
    if (updateData.zipCode) vendorUpdateData.zipCode = updateData.zipCode;
    if (updateData.businessType) vendorUpdateData.businessType = updateData.businessType;
    if (updateData.yearsInBusiness) vendorUpdateData.yearsInBusiness = updateData.yearsInBusiness;
    if (updateData.numberOfEmployees) vendorUpdateData.numberOfEmployees = updateData.numberOfEmployees;

    if (Object.keys(vendorUpdateData).length > 0) {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: vendorUpdateData
      });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get vendor services
router.get('/:vendorId/services', protect, async (req, res) => {
  try {
    const { vendorId } = req.params;

    const services = await prisma.service.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ services });
  } catch (error) {
    console.error('Error fetching vendor services:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new service
router.post('/:vendorId/services', protect, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { name, description, price, duration, category } = req.body;

    const service = await prisma.service.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        duration: parseInt(duration),
        category,
        vendorId,
        isActive: true
      }
    });

    res.status(201).json({ service });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update service
router.put('/:vendorId/services/:serviceId', protect, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { name, description, price, duration, category, isActive } = req.body;

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name,
        description,
        price: parseFloat(price),
        duration: parseInt(duration),
        category,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.json({ service });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete service
router.delete('/:vendorId/services/:serviceId', protect, async (req, res) => {
  try {
    const { serviceId } = req.params;

    await prisma.service.delete({
      where: { id: serviceId }
    });

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get vendor appointments
router.get('/:vendorId/appointments', protect, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status, limit = 50 } = req.query;

    const whereClause: any = {
      vendorId
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const appointments = await prisma.booking.findMany({
      where: whereClause,
      include: {
        customer: {
          include: { user: true }
        },
        items: {
          include: { service: true }
        }
      },
      orderBy: { scheduledDate: 'desc' },
      take: parseInt(limit as string)
    });

    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching vendor appointments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get vendor revenue stats
router.get('/:vendorId/revenue', protect, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { range = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get completed bookings in date range
    const bookings = await prisma.booking.findMany({
      where: {
        vendorId,
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        items: {
          include: { service: true }
        }
      }
    });

    // Calculate stats
    const totalRevenue = bookings.reduce((sum, b) => sum + b.total, 0);
    const totalBookings = bookings.length;
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Get all-time stats for comparison
    const allTimeBookings = await prisma.booking.findMany({
      where: {
        vendorId,
        status: 'COMPLETED'
      }
    });

    const allTimeRevenue = allTimeBookings.reduce((sum, b) => sum + b.total, 0);
    const previousPeriodRevenue = allTimeRevenue - totalRevenue;
    const revenueGrowth = previousPeriodRevenue > 0 
      ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;

    // Get top services
    const serviceStats = new Map();
    bookings.forEach(booking => {
      booking.items.forEach(item => {
        const serviceName = item.service.name;
        if (serviceStats.has(serviceName)) {
          const current = serviceStats.get(serviceName);
          serviceStats.set(serviceName, {
            revenue: current.revenue + (item.service.price * item.quantity),
            bookings: current.bookings + 1
          });
        } else {
          serviceStats.set(serviceName, {
            revenue: item.service.price * item.quantity,
            bookings: 1
          });
        }
      });
    });

    const topServices = Array.from(serviceStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Mock monthly data for chart
    const monthlyData = [
      { month: 'Jan', revenue: 2800, bookings: 32 },
      { month: 'Feb', revenue: 3100, bookings: 35 },
      { month: 'Mar', revenue: 2900, bookings: 33 },
      { month: 'Apr', revenue: 3200, bookings: 36 },
      { month: 'May', revenue: 3400, bookings: 38 },
      { month: 'Jun', revenue: totalRevenue, bookings: totalBookings }
    ];

    // Mock recent transactions
    const recentTransactions = bookings.slice(0, 10).map(booking => ({
      id: booking.id,
      customer: `${booking.customer.user.firstName} ${booking.customer.user.lastName}`,
      service: booking.items[0]?.service.name || 'Multiple Services',
      amount: booking.total,
      date: booking.createdAt.toISOString().split('T')[0],
      status: booking.status.toLowerCase()
    }));

    const stats = {
      totalRevenue: allTimeRevenue,
      monthlyRevenue: totalRevenue,
      weeklyRevenue: range === 'week' ? totalRevenue : 850, // Mock
      totalBookings: allTimeBookings.length,
      completedBookings: totalBookings,
      averageBookingValue,
      revenueGrowth,
      topServices,
      monthlyData,
      recentTransactions
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching vendor revenue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get vendor dashboard stats
router.get('/:vendorId/dashboard', protect, async (req, res) => {
  try {
    const { vendorId } = req.params;

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: { vendorId },
      include: {
        customer: {
          include: { user: true }
        },
        items: {
          include: { service: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get services
    const services = await prisma.service.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      take: 4
    });

    // Calculate stats
    const allBookings = await prisma.booking.findMany({
      where: { vendorId }
    });

    const newBookings = allBookings.filter(b => b.status === 'PENDING').length;
    const completedServices = allBookings.filter(b => b.status === 'COMPLETED').length;
    const monthlyRevenue = allBookings
      .filter(b => b.status === 'COMPLETED' && 
        new Date(b.createdAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      .reduce((sum, b) => sum + b.total, 0);
    const totalServices = services.length;
    const pendingBookings = allBookings.filter(b => b.status === 'PENDING').length;
    const totalCustomers = new Set(allBookings.map(b => b.customerId)).size;

    const stats = {
      newBookings,
      completedServices,
      monthlyRevenue,
      totalServices,
      pendingBookings,
      totalCustomers,
      averageRating: 4.8, // Mock data
      totalReviews: 127 // Mock data
    };

    res.json({
      stats,
      recentAppointments: recentBookings,
      services
    });
  } catch (error) {
    console.error('Error fetching vendor dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;