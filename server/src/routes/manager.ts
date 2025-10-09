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

// Get manager dashboard data
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Get pending vendors
    const pendingVendors = await prisma.vendor.findMany({
      where: { status: 'PENDING' },
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get recent appointments
    const recentAppointments = await prisma.booking.findMany({
      include: {
        customer: {
          include: { user: true }
        },
        vendor: true,
        items: {
          include: { service: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Calculate stats
    const totalVendors = await prisma.vendor.count();
    const activeVendors = await prisma.vendor.count({ where: { status: 'APPROVED' } });
    const pendingVendorApplications = await prisma.vendor.count({ where: { status: 'PENDING' } });
    
    const totalAppointments = await prisma.booking.count();
    const pendingAppointments = await prisma.booking.count({ where: { status: 'PENDING' } });
    const completedAppointments = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    
    const totalRevenue = await prisma.booking.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { total: true }
    });

    const monthlyRevenue = await prisma.booking.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { total: true }
    });

    const stats = {
      pendingVendorApplications,
      totalActiveVendors: activeVendors,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      totalRevenue: totalRevenue._sum.total || 0,
      monthlyRevenue: monthlyRevenue._sum.total || 0
    };

    res.json({
      stats,
      pendingVendors,
      recentAppointments
    });
  } catch (error) {
    console.error('Error fetching manager dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get pending vendors
router.get('/vendors/pending', protect, async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { status: 'PENDING' },
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ vendors });
  } catch (error) {
    console.error('Error fetching pending vendors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all vendors
router.get('/vendors/all', protect, async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        user: true,
        bookings: {
          where: { status: 'COMPLETED' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats for each vendor
    const vendorsWithStats = vendors.map(vendor => ({
      ...vendor,
      stats: {
        totalBookings: vendor.bookings.length,
        completedBookings: vendor.bookings.length,
        totalRevenue: vendor.bookings.reduce((sum, booking) => sum + booking.total, 0),
        averageRating: 4.5, // Mock data
        totalReviews: Math.floor(vendor.bookings.length * 0.8) // Mock data
      }
    }));

    res.json({ vendors: vendorsWithStats });
  } catch (error) {
    console.error('Error fetching all vendors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Approve vendor
router.patch('/vendors/:vendorId/approve', protect, async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: 'APPROVED',
        isVerified: true
      }
    });

    res.json({ message: 'Vendor approved successfully', vendor });
  } catch (error) {
    console.error('Error approving vendor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reject vendor
router.patch('/vendors/:vendorId/reject', protect, async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: 'REJECTED'
      }
    });

    res.json({ message: 'Vendor rejected successfully', vendor });
  } catch (error) {
    console.error('Error rejecting vendor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all appointments
router.get('/appointments', protect, async (req, res) => {
  try {
    const { status, serviceType, limit = 50 } = req.query;

    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (serviceType && serviceType !== 'all') {
      whereClause.serviceType = serviceType;
    }

    const appointments = await prisma.booking.findMany({
      where: whereClause,
      include: {
        customer: {
          include: { user: true }
        },
        vendor: true,
        items: {
          include: { service: true }
        }
      },
      orderBy: { scheduledDate: 'desc' },
      take: parseInt(limit as string)
    });

    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update appointment status
router.patch('/appointments/:appointmentId/status', protect, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    const appointment = await prisma.booking.update({
      where: { id: appointmentId },
      data: { status }
    });

    res.json({ message: 'Appointment status updated successfully', appointment });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get reports data
router.get('/reports', protect, async (req, res) => {
  try {
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

    // Get vendor stats
    const totalVendors = await prisma.vendor.count();
    const activeVendors = await prisma.vendor.count({ where: { status: 'APPROVED' } });
    const pendingVendors = await prisma.vendor.count({ where: { status: 'PENDING' } });

    // Get appointment stats
    const totalAppointments = await prisma.booking.count();
    const completedAppointments = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const pendingAppointments = await prisma.booking.count({ where: { status: 'PENDING' } });

    // Get revenue stats
    const totalRevenue = await prisma.booking.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { total: true }
    });

    const monthlyRevenue = await prisma.booking.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      _sum: { total: true }
    });

    // Get customer count
    const totalCustomers = await prisma.customer.count();

    const stats = {
      totalVendors,
      activeVendors,
      pendingVendors,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      totalRevenue: totalRevenue._sum.total || 0,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
      averageRating: 4.6, // Mock data
      totalCustomers
    };

    // Get vendor performance data
    const vendors = await prisma.vendor.findMany({
      where: { status: 'APPROVED' },
      include: {
        bookings: {
          where: { status: 'COMPLETED' }
        }
      }
    });

    const vendorPerformance = vendors.map(vendor => ({
      id: vendor.id,
      shopName: vendor.shopName,
      businessType: vendor.businessType,
      totalBookings: vendor.bookings.length,
      completedBookings: vendor.bookings.length,
      totalRevenue: vendor.bookings.reduce((sum, booking) => sum + booking.total, 0),
      averageRating: 4.5, // Mock data
      totalReviews: Math.floor(vendor.bookings.length * 0.8) // Mock data
    })).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);

    // Mock monthly data for chart
    const monthlyData = [
      { month: 'Jan', vendors: Math.floor(totalVendors * 0.6), appointments: Math.floor(totalAppointments * 0.3), revenue: Math.floor((totalRevenue._sum.total || 0) * 0.2) },
      { month: 'Feb', vendors: Math.floor(totalVendors * 0.7), appointments: Math.floor(totalAppointments * 0.35), revenue: Math.floor((totalRevenue._sum.total || 0) * 0.25) },
      { month: 'Mar', vendors: Math.floor(totalVendors * 0.75), appointments: Math.floor(totalAppointments * 0.3), revenue: Math.floor((totalRevenue._sum.total || 0) * 0.23) },
      { month: 'Apr', vendors: Math.floor(totalVendors * 0.8), appointments: Math.floor(totalAppointments * 0.35), revenue: Math.floor((totalRevenue._sum.total || 0) * 0.26) },
      { month: 'May', vendors: Math.floor(totalVendors * 0.85), appointments: Math.floor(totalAppointments * 0.37), revenue: Math.floor((totalRevenue._sum.total || 0) * 0.27) },
      { month: 'Jun', vendors: totalVendors, appointments: totalAppointments, revenue: totalRevenue._sum.total || 0 }
    ];

    res.json({
      stats,
      vendorPerformance,
      monthlyData
    });
  } catch (error) {
    console.error('Error fetching reports data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;
