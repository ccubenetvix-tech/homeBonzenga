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

// Get admin dashboard data
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Get comprehensive stats
    const totalUsers = await prisma.user.count();
    const totalVendors = await prisma.vendor.count();
    const totalManagers = await prisma.user.count({ where: { role: 'MANAGER' } });
    
    const pendingApprovals = await prisma.vendor.count({ where: { status: 'PENDING' } });
    
    const totalBookings = await prisma.booking.count();
    const completedBookings = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const atHomeBookings = await prisma.booking.count(); // All bookings are at-home in this schema
    const salonBookings = 0; // No salon bookings in current schema
    
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

    const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const suspendedUsers = await prisma.user.count({ where: { status: 'SUSPENDED' } });
    const activeVendors = await prisma.vendor.count({ where: { status: 'APPROVED' } });
    const pendingVendors = await prisma.vendor.count({ where: { status: 'PENDING' } });

    const stats = {
      totalUsers,
      totalVendors,
      totalManagers,
      pendingApprovals,
      totalRevenue: totalRevenue._sum.total || 0,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
      pendingPayouts: 0, // Mock data
      refundRequests: 0, // Mock data
      activeUsers,
      suspendedUsers,
      activeVendors,
      pendingVendors,
      totalBookings,
      completedBookings,
      atHomeBookings,
      salonBookings,
      totalCommissions: (totalRevenue._sum.total || 0) * 0.15, // 15% commission
      pendingDisputes: 0, // Mock data
      averageRating: 4.6 // Mock data
    };

    // Get recent activity
    const recentActivity = [
      {
        id: '1',
        type: 'user_registration',
        description: 'New user registered',
        timestamp: new Date().toISOString(),
        user: { name: 'John Doe', email: 'john@example.com' }
      },
      {
        id: '2',
        type: 'vendor_approval',
        description: 'Vendor approved by manager',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user: { name: 'Sarah Johnson', email: 'sarah@example.com' }
      }
    ];

    // Get top vendors
    const topVendors = await prisma.vendor.findMany({
      include: {
        bookings: {
          where: { status: 'COMPLETED' }
        }
      },
      take: 5
    });

    const topVendorsWithStats = topVendors.map(vendor => ({
      id: vendor.id,
      shopName: vendor.shopName,
      totalBookings: vendor.bookings.length,
      totalRevenue: vendor.bookings.reduce((sum, booking) => sum + booking.total, 0),
      averageRating: 4.5, // Mock data
      status: vendor.status
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({
      stats,
      recentActivity,
      topVendors: topVendorsWithStats
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all users
router.get('/users', protect, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        bookings: {
          where: { status: 'COMPLETED' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const usersWithStats = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: null, // Not available in current schema
      totalBookings: user.bookings.length,
      totalSpent: user.bookings.reduce((sum: number, booking: any) => sum + booking.total, 0),
      isVerified: true // Default to true since not in schema
    }));

    res.json({ users: usersWithStats });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user status
router.patch('/users/:userId/status', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status }
    });

    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all vendors
router.get('/vendors', protect, async (req, res) => {
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

    const vendorsWithStats = vendors.map(vendor => ({
      id: vendor.id,
      shopName: vendor.shopName,
      description: vendor.description,
      businessType: 'salon', // Default since not in schema
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      zipCode: vendor.zipCode,
      status: vendor.status,
      isVerified: true, // Default since not in schema
      user: vendor.user,
      createdAt: vendor.createdAt,
      approvedAt: vendor.status === 'APPROVED' ? vendor.updatedAt : null,
      stats: {
        totalBookings: vendor.bookings.length,
        completedBookings: vendor.bookings.length,
        totalRevenue: vendor.bookings.reduce((sum: number, booking: any) => sum + booking.total, 0),
        averageRating: 4.5, // Mock data
        totalReviews: Math.floor(vendor.bookings.length * 0.8) // Mock data
      }
    }));

    res.json({ vendors: vendorsWithStats });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update vendor status
router.patch('/vendors/:vendorId/status', protect, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status } = req.body;

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status
      }
    });

    res.json({ message: 'Vendor status updated successfully', vendor });
  } catch (error) {
    console.error('Error updating vendor status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete vendor
router.delete('/vendors/:vendorId', protect, async (req, res) => {
  try {
    const { vendorId } = req.params;

    await prisma.vendor.delete({
      where: { id: vendorId }
    });

    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all managers
router.get('/managers', protect, async (req, res) => {
  try {
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      orderBy: { createdAt: 'desc' }
    });

    // Mock stats for managers
    const managersWithStats = managers.map(manager => ({
      id: manager.id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
      phone: manager.phone,
      status: manager.status,
      createdAt: manager.createdAt,
      lastLoginAt: null, // Not available in current schema
      isVerified: true, // Default since not in schema
      stats: {
        vendorsApproved: Math.floor(Math.random() * 20) + 5,
        vendorsRejected: Math.floor(Math.random() * 5) + 1,
        appointmentsManaged: Math.floor(Math.random() * 100) + 20,
        totalActions: Math.floor(Math.random() * 120) + 30
      }
    }));

    res.json({ managers: managersWithStats });
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update manager status
router.patch('/managers/:managerId/status', protect, async (req, res) => {
  try {
    const { managerId } = req.params;
    const { status } = req.body;

    const manager = await prisma.user.update({
      where: { id: managerId },
      data: { status }
    });

    res.json({ message: 'Manager status updated successfully', manager });
  } catch (error) {
    console.error('Error updating manager status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get financial data
router.get('/financials', protect, async (req, res) => {
  try {
    // Mock commission data
    const commissions = [
      {
        id: '1',
        type: 'GLOBAL',
        percentage: 15,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];

    // Mock payout data
    const payouts = [
      {
        id: '1',
        vendorId: '1',
        vendorName: 'Elegant Beauty Salon',
        amount: 850,
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
        description: 'Weekly payout for completed services'
      }
    ];

    // Mock refund data
    const refunds = [
      {
        id: '1',
        bookingId: 'BK001',
        customerName: 'Emily Davis',
        amount: 120,
        reason: 'Service not as described',
        status: 'PENDING',
        requestedAt: new Date().toISOString()
      }
    ];

    // Mock dispute data
    const disputes = [
      {
        id: '1',
        type: 'CUSTOMER_VS_VENDOR',
        customerName: 'Sarah Johnson',
        vendorName: 'Nail Art Studio',
        amount: 65,
        description: 'Customer claims service was not completed properly',
        status: 'INVESTIGATING',
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      commissions,
      payouts,
      refunds,
      disputes
    });
  } catch (error) {
    console.error('Error fetching financial data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update commission
router.patch('/commissions/:commissionId', protect, async (req, res) => {
  try {
    const { commissionId } = req.params;
    const { percentage } = req.body;

    // Mock update
    res.json({ message: 'Commission updated successfully' });
  } catch (error) {
    console.error('Error updating commission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update payout status
router.patch('/payouts/:payoutId/status', protect, async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { status } = req.body;

    // Mock update
    res.json({ message: 'Payout status updated successfully' });
  } catch (error) {
    console.error('Error updating payout status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update refund status
router.patch('/refunds/:refundId/status', protect, async (req, res) => {
  try {
    const { refundId } = req.params;
    const { status } = req.body;

    // Mock update
    res.json({ message: 'Refund status updated successfully' });
  } catch (error) {
    console.error('Error updating refund status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update dispute status
router.patch('/disputes/:disputeId/status', protect, async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { status } = req.body;

    // Mock update
    res.json({ message: 'Dispute status updated successfully' });
  } catch (error) {
    console.error('Error updating dispute status:', error);
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

    // Get comprehensive stats
    const totalUsers = await prisma.user.count();
    const totalVendors = await prisma.vendor.count();
    const totalManagers = await prisma.user.count({ where: { role: 'MANAGER' } });
    const totalBookings = await prisma.booking.count();
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

    const atHomeBookings = await prisma.booking.count(); // All bookings are at-home in this schema
    const salonBookings = 0; // No salon bookings in current schema
    const completedBookings = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const cancelledBookings = await prisma.booking.count({ where: { status: 'CANCELLED' } });
    const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const suspendedUsers = await prisma.user.count({ where: { status: 'SUSPENDED' } });
    const activeVendors = await prisma.vendor.count({ where: { status: 'APPROVED' } });
    const pendingVendors = await prisma.vendor.count({ where: { status: 'PENDING' } });
    const pendingApprovals = await prisma.vendor.count({ where: { status: 'PENDING' } });

    const reportData = {
      totalUsers,
      totalVendors,
      totalManagers,
      totalBookings,
      totalRevenue: totalRevenue._sum.total || 0,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
      atHomeBookings,
      salonBookings,
      averageRating: 4.6,
      pendingApprovals,
      activeUsers,
      suspendedUsers,
      activeVendors,
      pendingVendors,
      completedBookings,
      cancelledBookings
    };

    // Mock monthly trends
    const monthlyTrends = [
      { month: 'Jan', users: Math.floor(totalUsers * 0.3), vendors: Math.floor(totalVendors * 0.3), bookings: Math.floor(totalBookings * 0.2), revenue: Math.floor((totalRevenue._sum.total || 0) * 0.15) },
      { month: 'Feb', users: Math.floor(totalUsers * 0.4), vendors: Math.floor(totalVendors * 0.4), bookings: Math.floor(totalBookings * 0.25), revenue: Math.floor((totalRevenue._sum.total || 0) * 0.18) },
      { month: 'Mar', users: Math.floor(totalUsers * 0.5), vendors: Math.floor(totalVendors * 0.5), bookings: Math.floor(totalBookings * 0.3), revenue: Math.floor((totalRevenue._sum.total || 0) * 0.2) },
      { month: 'Apr', users: Math.floor(totalUsers * 0.6), vendors: Math.floor(totalVendors * 0.6), bookings: Math.floor(totalBookings * 0.35), revenue: Math.floor((totalRevenue._sum.total || 0) * 0.22) },
      { month: 'May', users: Math.floor(totalUsers * 0.7), vendors: Math.floor(totalVendors * 0.7), bookings: Math.floor(totalBookings * 0.4), revenue: Math.floor((totalRevenue._sum.total || 0) * 0.25) },
      { month: 'Jun', users: totalUsers, vendors: totalVendors, bookings: totalBookings, revenue: totalRevenue._sum.total || 0 }
    ];

    // Get top vendors
    const vendors = await prisma.vendor.findMany({
      include: {
        bookings: {
          where: { status: 'COMPLETED' }
        }
      }
    });

    const topVendors = vendors.map(vendor => ({
      id: vendor.id,
      shopName: vendor.shopName,
      businessType: 'salon', // Default since not in schema
      totalBookings: vendor.bookings.length,
      totalRevenue: vendor.bookings.reduce((sum: number, booking: any) => sum + booking.total, 0),
      averageRating: 4.5, // Mock data
      status: vendor.status
    })).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);

    // Mock booking breakdown
    const bookingBreakdown = [
      { category: 'Hair Styling', count: Math.floor(totalBookings * 0.26), percentage: 26, revenue: Math.floor((totalRevenue._sum.total || 0) * 0.23) },
      { category: 'Facial Treatments', count: Math.floor(totalBookings * 0.22), percentage: 22, revenue: Math.floor((totalRevenue._sum.total || 0) * 0.21) },
      { category: 'Nail Care', count: Math.floor(totalBookings * 0.19), percentage: 19, revenue: Math.floor((totalRevenue._sum.total || 0) * 0.11) },
      { category: 'Makeup', count: Math.floor(totalBookings * 0.16), percentage: 16, revenue: Math.floor((totalRevenue._sum.total || 0) * 0.17) },
      { category: 'Massage', count: Math.floor(totalBookings * 0.13), percentage: 13, revenue: Math.floor((totalRevenue._sum.total || 0) * 0.15) },
      { category: 'Other', count: Math.floor(totalBookings * 0.04), percentage: 4, revenue: Math.floor((totalRevenue._sum.total || 0) * 0.13) }
    ];

    res.json({
      reportData,
      monthlyTrends,
      topVendors,
      bookingBreakdown
    });
  } catch (error) {
    console.error('Error fetching reports data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get settings
router.get('/settings', protect, async (req, res) => {
  try {
    // Mock settings data
    const settings = {
      platformName: 'Home Bonzenga',
      platformDescription: 'Premium Beauty Services Platform',
      supportEmail: 'support@homebonzenga.com',
      supportPhone: '+243 123 456 789',
      platformAddress: 'Kinshasa, DR Congo',
      timezone: 'Africa/Kinshasa',
      defaultCommissionRate: 15,
      minimumPayoutAmount: 50,
      maximumPayoutAmount: 10000,
      payoutProcessingDays: 7,
      allowUserRegistration: true,
      requireEmailVerification: true,
      allowVendorRegistration: true,
      requireVendorApproval: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      maintenanceMode: false,
      debugMode: false,
      autoBackup: true,
      backupFrequency: 'daily'
    };

    res.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update settings
router.put('/settings', protect, async (req, res) => {
  try {
    const { settings } = req.body;

    // Mock update
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;