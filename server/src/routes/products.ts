import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();
const prisma = new PrismaClient();

// ==================== PUBLIC PRODUCTS/SERVICES ====================

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const vendorId = req.query.vendorId as string;
    const search = req.query.search as string;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    
    if (category) where.categoryId = category;
    if (vendorId) where.vendorId = vendorId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (minPrice !== undefined) where.price = { gte: minPrice };
    if (maxPrice !== undefined) {
      if (where.price) {
        where.price.lte = maxPrice;
      } else {
        where.price = { lte: maxPrice };
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            shopName: true,
            address: true,
            rating: true,
            totalReviews: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        media: {
          where: { type: 'IMAGE' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.product.count({ where });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// Get product details (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id, isActive: true },
      include: {
        vendor: {
          select: {
            id: true,
            shopName: true,
            description: true,
            address: true,
            phone: true,
            email: true,
            rating: true,
            totalReviews: true,
            workingHours: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        media: {
          orderBy: { createdAt: 'asc' }
        },
        reviews: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
});

// Get product categories (public)
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await prisma.serviceCategoryModel.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// ==================== VENDOR PRODUCT MANAGEMENT ====================

// Get vendor products
router.get('/vendor/my-products', requireAuth, requireRole(['VENDOR']), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: any = { vendorId: req.user.vendorId };
    if (category) where.categoryId = category;
    if (status) where.isActive = status === 'active';

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        media: {
          where: { type: 'IMAGE' },
          take: 1
        },
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.product.count({ where });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor products' });
  }
});

// Create new product
router.post('/', requireAuth, requireRole(['VENDOR']), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      categoryId,
      stock,
      isActive = true,
      media
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !categoryId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId,
        stock: stock ? parseInt(stock) : 0,
        isActive,
        vendorId: req.user.vendorId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Add media if provided
    if (media && media.length > 0) {
      await prisma.media.createMany({
        data: media.map((item: any) => ({
          productId: product.id,
          type: item.type || 'IMAGE',
          url: item.url,
          alt: item.alt || name
        }))
      });
    }

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', requireAuth, requireRole(['VENDOR']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      categoryId,
      stock,
      isActive
    } = req.body;

    // Verify product belongs to vendor
    const existingProduct = await prisma.product.findFirst({
      where: { id, vendorId: req.user.vendorId }
    });

    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        categoryId,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        isActive
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', requireAuth, requireRole(['VENDOR']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify product belongs to vendor
    const product = await prisma.product.findFirst({
      where: { id, vendorId: req.user.vendorId }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Soft delete by setting isActive to false
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// ==================== ADMIN PRODUCT MANAGEMENT ====================

// Get all products (Admin only)
router.get('/admin/all', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const category = req.query.category as string;
    const vendorId = req.query.vendorId as string;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) where.categoryId = category;
    if (vendorId) where.vendorId = vendorId;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const products = await prisma.product.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            shopName: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.product.count({ where });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// Update product status (Admin only)
router.patch('/admin/:id/status', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            shopName: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update product status
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { isActive }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: isActive ? 'PRODUCT_ACTIVATED' : 'PRODUCT_DEACTIVATED',
        entityType: 'PRODUCT',
        entityId: id,
        userId: req.user.id,
        details: JSON.stringify({
          productName: product.name,
          vendorName: product.vendor.shopName,
          reason: reason || 'Admin action',
          previousStatus: !isActive,
          newStatus: isActive
        })
      }
    });

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ success: false, message: 'Failed to update product status' });
  }
});

// ==================== PRODUCT MEDIA ====================

// Add media to product
router.post('/:id/media', requireAuth, requireRole(['VENDOR']), async (req, res) => {
  try {
    const { id } = req.params;
    const { media } = req.body;

    // Verify product belongs to vendor
    const product = await prisma.product.findFirst({
      where: { id, vendorId: req.user.vendorId }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Add media
    const addedMedia = await prisma.media.createMany({
      data: media.map((item: any) => ({
        productId: id,
        type: item.type || 'IMAGE',
        url: item.url,
        alt: item.alt || product.name
      }))
    });

    res.status(201).json({
      success: true,
      data: { addedMedia }
    });
  } catch (error) {
    console.error('Error adding media:', error);
    res.status(500).json({ success: false, message: 'Failed to add media' });
  }
});

// Remove media from product
router.delete('/:id/media/:mediaId', requireAuth, requireRole(['VENDOR']), async (req, res) => {
  try {
    const { id, mediaId } = req.params;

    // Verify product belongs to vendor
    const product = await prisma.product.findFirst({
      where: { id, vendorId: req.user.vendorId }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Remove media
    await prisma.media.delete({
      where: { id: mediaId, productId: id }
    });

    res.json({
      success: true,
      message: 'Media removed successfully'
    });
  } catch (error) {
    console.error('Error removing media:', error);
    res.status(500).json({ success: false, message: 'Failed to remove media' });
  }
});

// ==================== PRODUCT REVIEWS ====================

// Get product reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const reviews = await prisma.review.findMany({
      where: { productId: id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.review.count({ where: { productId: id } });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

// Add product review
router.post('/:id/reviews', requireAuth, requireRole(['CUSTOMER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Check if customer has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: { productId: id, customerId: req.user.id }
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId: id,
        customerId: req.user.id,
        rating: parseInt(rating),
        comment
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Update product rating
    const productReviews = await prisma.review.findMany({
      where: { productId: id },
      select: { rating: true }
    });

    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;

    await prisma.product.update({
      where: { id },
      data: {
        rating: avgRating,
        totalReviews: productReviews.length
      }
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ success: false, message: 'Failed to add review' });
  }
});

export default router;
