import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateUser, requireModeratorOrAdmin, requireAdmin } from '../src/middlewares/jwtAuthGuard.js';
import { AuthenticatedRequest } from '../src/types/index.js';
import { Response } from 'express';
import { supabaseAdmin } from '../src/config/supabaseAdmin.js';


describe('JWT Auth Guard & RBAC Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let nextFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFn = vi.fn();
  });

  it('should return 401 when Authorization header is missing', async () => {
    await authenticateUser(mockReq as AuthenticatedRequest, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unauthorized',
      })
    );
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should return 401 when token does not start with Bearer', async () => {
    mockReq.headers = { authorization: 'Basic 12345' };

    await authenticateUser(mockReq as AuthenticatedRequest, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should return 403 when user account is suspended', async () => {
    mockReq.headers = { authorization: 'Bearer valid-token' };

    vi.spyOn(supabaseAdmin.auth, 'getUser').mockResolvedValueOnce({
      data: { user: { id: 'user-suspended-uuid', email: 'banned@test.com', user_metadata: {} } as any },
      error: null,
    });

    vi.spyOn(supabaseAdmin, 'from').mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { role: 'user', status: 'suspended' },
            error: null,
          }),
        }),
      }),
    } as any);

    await authenticateUser(mockReq as AuthenticatedRequest, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should succeed and attach user when active user token is provided', async () => {
    mockReq.headers = { authorization: 'Bearer valid-active-token' };

    vi.spyOn(supabaseAdmin.auth, 'getUser').mockResolvedValueOnce({
      data: { user: { id: 'user-active-uuid', email: 'admin@totalanime.com', user_metadata: { username: 'admin' } } as any },
      error: null,
    });

    vi.spyOn(supabaseAdmin, 'from').mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { role: 'admin', status: 'active' },
            error: null,
          }),
        }),
      }),
    } as any);

    await authenticateUser(mockReq as AuthenticatedRequest, mockRes as Response, nextFn);

    expect(nextFn).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user?.role).toBe('admin');
    expect(mockReq.user?.status).toBe('active');
  });

  it('should reject non-admin users in requireAdmin middleware', () => {
    const rbacMiddleware = requireAdmin[1];
    mockReq.user = {
      id: 'uuid-mod',
      role: 'moderator',
      status: 'active',
    };

    rbacMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should allow moderator in requireModeratorOrAdmin middleware', () => {
    const rbacMiddleware = requireModeratorOrAdmin[1];
    mockReq.user = {
      id: 'uuid-mod',
      role: 'moderator',
      status: 'active',
    };

    rbacMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, nextFn);

    expect(nextFn).toHaveBeenCalled();
  });
});
