/**
 * Tests for ProtectedRoute components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, FamilyProtectedRoute, PublicRoute } from '../ProtectedRoute';
import * as hooks from '../../hooks';
import type { User } from '../../types/auth';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useAuth: vi.fn(),
  usePermissions: vi.fn(),
}));

describe('ProtectedRoute', () => {
  const mockUser: User = {
    id: '1',
    organizationId: 'org-1',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['COORDINATOR'],
    permissions: ['clients:read', 'visits:read', 'schedules:create'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login if not authenticated', async () => {
    vi.mocked(hooks.useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(hooks.usePermissions).mockReturnValue({
      can: vi.fn(() => false),
      canAny: vi.fn(() => false),
      canAll: vi.fn(() => false),
      hasRole: vi.fn(() => false),
      hasAnyRole: vi.fn(() => false),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children if authenticated and no permission required', () => {
    vi.mocked(hooks.useAuth).mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(hooks.usePermissions).mockReturnValue({
      can: vi.fn(() => true),
      canAny: vi.fn(() => true),
      canAll: vi.fn(() => true),
      hasRole: vi.fn(() => true),
      hasAnyRole: vi.fn(() => true),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render children if authenticated and has required permission', () => {
    const canMock = vi.fn((permission: string) => permission === 'clients:read');

    vi.mocked(hooks.useAuth).mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(hooks.usePermissions).mockReturnValue({
      can: canMock,
      canAny: vi.fn(() => true),
      canAll: vi.fn(() => true),
      hasRole: vi.fn(() => true),
      hasAnyRole: vi.fn(() => true),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute permission="clients:read">
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(canMock).toHaveBeenCalledWith('clients:read');
  });
});

describe('FamilyProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login if not authenticated', async () => {
    vi.mocked(hooks.useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/family']}>
        <Routes>
          <Route
            path="/family"
            element={
              <FamilyProtectedRoute>
                <div>Family Content</div>
              </FamilyProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Family Content')).not.toBeInTheDocument();
  });

  it('should render children for FAMILY role', () => {
    const familyUser: User = {
      id: '1',
      organizationId: 'org-1',
      email: 'family@example.com',
      name: 'Family Member',
      roles: ['FAMILY'],
      permissions: [],
    };

    vi.mocked(hooks.useAuth).mockReturnValue({
      isAuthenticated: true,
      user: familyUser,
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <FamilyProtectedRoute>
          <div>Family Content</div>
        </FamilyProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Family Content')).toBeInTheDocument();
  });

  it('should render children for CLIENT role', () => {
    const clientUser: User = {
      id: '1',
      organizationId: 'org-1',
      email: 'client@example.com',
      name: 'Client',
      roles: ['CLIENT'],
      permissions: [],
    };

    vi.mocked(hooks.useAuth).mockReturnValue({
      isAuthenticated: true,
      user: clientUser,
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <FamilyProtectedRoute>
          <div>Family Content</div>
        </FamilyProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Family Content')).toBeInTheDocument();
  });
});

describe('PublicRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children if not authenticated', () => {
    vi.mocked(hooks.useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PublicRoute>
          <div>Public Content</div>
        </PublicRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Public Content')).toBeInTheDocument();
  });
});
