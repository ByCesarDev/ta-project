import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AuthenticatedRequest, AuthenticatedUser, UserRole, UserStatus } from '../types/index.js';

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected Bearer <token>.',
    });
    return;
  }

  const token = authHeader.split(' ')[1]?.trim();

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Bearer token is missing.',
    });
    return;
  }

  try {
    // Validate JWT via Supabase GoTrue Auth
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !userData?.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: authError?.message || 'Invalid or expired authentication token.',
      });
      return;
    }

    const userId = userData.user.id;

    // Fetch user role and status from public.user_roles
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role, status')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleError) {
      res.status(500).json({
        error: 'InternalServerError',
        message: `Failed to retrieve user authorization details: ${roleError.message}`,
      });
      return;
    }

    const role: UserRole = roleData?.role || 'user';
    const status: UserStatus = roleData?.status || 'active';

    if (status !== 'active') {
      res.status(403).json({
        error: 'Forbidden',
        message: `Account is ${status}. Access denied.`,
      });
      return;
    }

    // Attach authenticated user to request context
    const user: AuthenticatedUser = {
      id: userId,
      email: userData.user.email,
      role,
      status,
      username: userData.user.user_metadata?.username,
    };

    req.user = user;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown auth error';
    res.status(500).json({
      error: 'InternalServerError',
      message: `Authentication verification failed: ${message}`,
    });
  }
};

/**
 * Middleware: Requires any authenticated active user
 */
export const requireAuth = [authenticateUser];

/**
 * Middleware: Requires active user with 'moderator' or 'admin' role
 */
export const requireModeratorOrAdmin = [
  authenticateUser,
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !['moderator', 'admin'].includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Elevated privileges required: moderator or admin role needed.',
      });
      return;
    }
    next();
  },
];

/**
 * Middleware: Requires active user with 'admin' role
 */
export const requireAdmin = [
  authenticateUser,
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Administrator privilege required.',
      });
      return;
    }
    next();
  },
];
