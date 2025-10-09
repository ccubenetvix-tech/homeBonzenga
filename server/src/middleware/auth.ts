import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = auth.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const payload = auth.verifyToken(token);
    
    if (payload.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Handle static admin and manager users
    if (payload.userId === 'admin-static-id' && payload.role === 'ADMIN') {
      req.user = {
        id: 'admin-static-id',
        email: 'admin@homebonzenga.com',
        role: 'ADMIN'
      };
    } else if (payload.userId === 'manager-static-id' && payload.role === 'MANAGER') {
      req.user = {
        id: 'manager-static-id',
        email: 'manager@homebonzenga.com',
        role: 'MANAGER'
      };
    } else {
      // Verify user still exists and is active for database users
      const user = await prisma.user.findFirst({
        where: {
          id: payload.userId,
          status: 'ACTIVE'
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };
    }

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Export aliases for the customer routes
export const requireAuth = authenticate;
export const requireRole = authorize;