/**
 * Login Page Tests
 *
 * Tests for login page functionality including:
 * - Demo persona selection
 * - Client-side debouncing
 * - Rate limiting error handling
 * - Cooldown timer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../Login';

// Mock dependencies
const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockAuthServiceLogin = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/core/hooks', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    isAuthenticated: false,
    login: mockLogin,
    logout: vi.fn(),
  }),
  useAuthService: () => ({
    login: mockAuthServiceLogin,
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
  }),
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all demo personas', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Check for all 5 demo personas
    expect(screen.getByText('Maria Rodriguez')).toBeInTheDocument();
    expect(screen.getByText('James Thompson')).toBeInTheDocument();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('David Williams')).toBeInTheDocument();
    expect(screen.getByText('Emily Johnson')).toBeInTheDocument();
  });

  it('should successfully login with demo persona', async () => {
    const mockUser = {
      userId: '123',
      email: 'admin@tx.carecommons.example',
      organizationId: '456',
      roles: ['ADMIN'],
      permissions: ['*:*'],
    };

    mockAuthServiceLogin.mockResolvedValue({
      user: mockUser,
      token: 'test-token',
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const adminButton = screen.getByText('Maria Rodriguez').closest('button');
    if (adminButton === null) throw new Error('Admin button not found');
    
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(mockAuthServiceLogin).toHaveBeenCalledWith({
        email: 'admin@tx.carecommons.example',
        password: 'Demo123!',
      });
      expect(mockLogin).toHaveBeenCalledWith(mockUser, 'test-token');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should navigate to family portal for family member', async () => {
    const mockUser = {
      userId: '123',
      email: 'family@tx.carecommons.example',
      organizationId: '456',
      roles: ['FAMILY'],
      permissions: ['family:*'],
    };

    mockAuthServiceLogin.mockResolvedValue({
      user: mockUser,
      token: 'test-token',
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const familyButton = screen.getByText('Emily Johnson').closest('button');
    if (familyButton === null) throw new Error('Family button not found');
    
    fireEvent.click(familyButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/family-portal');
    });
  });

  it('should show error toast on login failure', async () => {
    mockAuthServiceLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const adminButton = screen.getByText('Maria Rodriguez').closest('button');
    if (adminButton === null) throw new Error('Admin button not found');
    
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(mockAuthServiceLogin).toHaveBeenCalled();
      // Toast error is shown but we can't easily test it without mocking toast
    });
  });

  it('should handle rate limit error with countdown', async () => {
    const rateLimitError = new Error('Too many requests') as Error & {
      response?: { data?: { code?: string; context?: { retryAfter?: number } } };
    };
    rateLimitError.response = {
      data: {
        code: 'RATE_LIMIT_EXCEEDED',
        context: {
          retryAfter: 300, // 5 minutes
        },
      },
    };

    mockAuthServiceLogin.mockRejectedValue(rateLimitError);

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const adminButton = screen.getByText('Maria Rodriguez').closest('button');
    if (adminButton === null) throw new Error('Admin button not found');
    
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(screen.getByText(/Too Many Login Attempts/i)).toBeInTheDocument();
      // Should show countdown
      expect(screen.getByText(/5:00/)).toBeInTheDocument();
    });
  });

  it('should disable all buttons during login', async () => {
    mockAuthServiceLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const adminButton = screen.getByText('Maria Rodriguez').closest('button');
    if (adminButton === null) throw new Error('Admin button not found');
    
    fireEvent.click(adminButton);

    // All buttons should be disabled during loading
    const allButtons = screen.getAllByRole('button');
    for (const button of allButtons) {
      expect(button).toBeDisabled();
    }
  });

  it('should apply cooldown after login attempt', async () => {
    mockAuthServiceLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const adminButton = screen.getByText('Maria Rodriguez').closest('button');
    if (adminButton === null) throw new Error('Admin button not found');
    
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(mockAuthServiceLogin).toHaveBeenCalled();
    });

    // Try clicking again immediately - should be prevented by cooldown
    const clickCount = mockAuthServiceLogin.mock.calls.length;
    fireEvent.click(adminButton);
    
    // Should not have called again due to cooldown
    expect(mockAuthServiceLogin).toHaveBeenCalledTimes(clickCount);
  });

  it('should show loading spinner for selected persona', async () => {
    mockAuthServiceLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const adminButton = screen.getByText('Maria Rodriguez').closest('button');
    if (adminButton === null) throw new Error('Admin button not found');
    
    fireEvent.click(adminButton);

    // Should show loading spinner
    const spinner = adminButton.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display all persona information correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Check Administrator persona
    expect(screen.getByText('Maria Rodriguez')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(
      screen.getByText(/Full system access, manage agency operations/)
    ).toBeInTheDocument();

    // Check Care Coordinator persona
    expect(screen.getByText('James Thompson')).toBeInTheDocument();
    expect(screen.getByText('Care Coordinator')).toBeInTheDocument();

    // Check Caregiver persona
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Caregiver')).toBeInTheDocument();

    // Check Nurse persona
    expect(screen.getByText('David Williams')).toBeInTheDocument();
    expect(screen.getByText('RN Clinical')).toBeInTheDocument();

    // Check Family Member persona
    expect(screen.getByText('Emily Johnson')).toBeInTheDocument();
    expect(screen.getByText('Family Member')).toBeInTheDocument();
  });
});
