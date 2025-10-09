import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Middleware to protect routes (simplified for demo)
const protect = (req: any, res: any, next: any) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Create new booking
router.post('/', protect, async (req, res) => {
  try {
    const {
      customerId,
      vendorId,
      services,
      products,
      scheduledDate,
      scheduledTime,
      address,
      notes,
      total
    } = req.body;

    // Validate required fields
    if (!customerId || !vendorId || !services || !scheduledDate || !scheduledTime || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        customerId,
        vendorId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        address,
        notes,
        total: parseFloat(total),
        status: 'PENDING',
        items: {
          create: services.map((service: any) => ({
            serviceId: service.id,
            quantity: service.quantity || 1,
            price: service.price
          }))
        }
      },
      include: {
        vendor: {
          include: {
            user: true
          }
        },
        customer: true,
        items: {
          include: {
            service: true
          }
        }
      }
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: parseFloat(total),
        status: 'PENDING',
        method: 'ONLINE'
      }
    });

    res.status(201).json({ 
      message: 'Booking created successfully',
      booking 
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's bookings
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 10, offset = 0 } = req.query;

    const where: any = { customerId: userId };

    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        vendor: {
          include: {
            user: true
          }
        },
        items: {
          include: {
            service: true
          }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(String(limit)),
      skip: parseInt(String(offset))
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get booking by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vendor: {
          include: {
            user: true
          }
        },
        customer: true,
        items: {
          include: {
            service: true
          }
        },
        payments: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update booking status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        vendor: {
          include: {
            user: true
          }
        },
        customer: true,
        items: {
          include: {
            service: true
          }
        }
      }
    });

    res.json({ booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel booking
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        // You might want to add a cancellation reason field
      },
      include: {
        vendor: {
          include: {
            user: true
          }
        },
        customer: true,
        items: {
          include: {
            service: true
          }
        }
      }
    });

    res.json({ booking, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get booking statistics for user
router.get('/user/:userId/stats', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    const [activeBookings, completedBookings, pendingPayments, totalBookings] = await Promise.all([
      prisma.booking.count({
        where: { 
          customerId: userId, 
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } 
        }
      }),
      prisma.booking.count({
        where: { 
          customerId: userId, 
          status: 'COMPLETED' 
        }
      }),
      prisma.payment.count({
        where: { 
          userId, 
          status: 'PENDING' 
        }
      }),
      prisma.booking.count({
        where: { customerId: userId }
      })
    ]);

    res.json({
      activeBookings,
      completedBookings,
      pendingPayments,
      totalBookings
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
