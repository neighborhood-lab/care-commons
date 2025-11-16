/**
 * Authentication Context Middleware Tests
 *
 * Tests for auth-context middleware, especially organization_id handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authContextMiddleware, requireAuth } from '../auth-context.js';
import type { Request, Response, NextFunction } from 'express';

describe('authContextMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextMock: NextFunction;

  beforeEach(() => {
    mockRequest = {
      header: vi.fn(),
    };
    mockResponse = {};
    nextMock = vi.fn();
  });

  it('should handle valid organization_id', () => {
    const mockHeader = vi.fn()
      .mockReturnValueOnce('user-123')
      .mockReturnValueOnce('550e8400-e29b-41d4-a716-446655440000')
      .mockReturnValueOnce('branch-123')
      .mockReturnValueOnce('COORDINATOR')
      .mockReturnValueOnce('visits:read,visits:write');

    mockRequest.header = mockHeader;

    authContextMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextMock
    );

    expect(mockRequest.userContext).toBeDefined();
    expect(mockRequest.userContext?.organizationId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(nextMock).toHaveBeenCalled();
  });

  it('should convert empty string organization_id to undefined', () => {
    const mockHeader = vi.fn()
      .mockReturnValueOnce('user-123')
      .mockReturnValueOnce('')
      .mockReturnValueOnce()
      .mockReturnValueOnce('COORDINATOR')
      .mockReturnValueOnce('');

    mockRequest.header = mockHeader;

    authContextMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextMock
    );

    expect(mockRequest.userContext).toBeDefined();
    expect(mockRequest.userContext?.organizationId).toBeUndefined();
    expect(nextMock).toHaveBeenCalled();
  });

  it('should convert whitespace organization_id to undefined', () => {
    const mockHeader = vi.fn()
      .mockReturnValueOnce('user-123')
      .mockReturnValueOnce('   ')
      .mockReturnValueOnce()
      .mockReturnValueOnce('COORDINATOR')
      .mockReturnValueOnce('');

    mockRequest.header = mockHeader;

    authContextMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextMock
    );

    expect(mockRequest.userContext).toBeDefined();
    expect(mockRequest.userContext?.organizationId).toBeUndefined();
    expect(nextMock).toHaveBeenCalled();
  });

  it('should trim organization_id whitespace', () => {
    const mockHeader = vi.fn()
      .mockReturnValueOnce('user-123')
      .mockReturnValueOnce('  550e8400-e29b-41d4-a716-446655440000  ')
      .mockReturnValueOnce()
      .mockReturnValueOnce('COORDINATOR')
      .mockReturnValueOnce('');

    mockRequest.header = mockHeader;

    authContextMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextMock
    );

    expect(mockRequest.userContext).toBeDefined();
    expect(mockRequest.userContext?.organizationId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(nextMock).toHaveBeenCalled();
  });

  it('should handle missing organization_id header', () => {
    const mockHeader = vi.fn()
      .mockReturnValueOnce('user-123')
      .mockReturnValueOnce()
      .mockReturnValueOnce()
      .mockReturnValueOnce('COORDINATOR')
      .mockReturnValueOnce('');

    mockRequest.header = mockHeader;

    authContextMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextMock
    );

    expect(mockRequest.userContext).toBeDefined();
    expect(mockRequest.userContext?.organizationId).toBeUndefined();
    expect(nextMock).toHaveBeenCalled();
  });
});

describe('requireAuth', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let nextMock: NextFunction;

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnThis();
    mockRequest = {};
    mockResponse = {
      json: mockJson as any,
      status: mockStatus as any,
    };
    nextMock = vi.fn();
  });

  it('should allow request with valid user context', () => {
    mockRequest.userContext = {
      userId: 'user-123',
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      branchIds: [],
      roles: ['COORDINATOR'],
      permissions: [],
    };

    requireAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextMock
    );

    expect(nextMock).toHaveBeenCalled();
    expect(mockStatus).not.toHaveBeenCalled();
  });

  it('should return 401 when userContext is missing', () => {
    requireAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextMock
    );

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: 'Authentication required',
    });
    expect(nextMock).not.toHaveBeenCalled();
  });

  it('should return 401 when userId is undefined', () => {
    mockRequest.userContext = {
      userId: undefined as any,
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      branchIds: [],
      roles: ['COORDINATOR'],
      permissions: [],
    };

    requireAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextMock
    );

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: 'Authentication required',
    });
    expect(nextMock).not.toHaveBeenCalled();
  });
});
