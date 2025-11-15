import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { CheckInPage } from '../CheckInPage';

// Mock hooks
vi.mock('@/core/hooks', () => ({
  useAuth: () => ({ user: { id: 'user-123', name: 'Test User' } }),
  useIsMobile: () => false,
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ visitId: 'visit-123' }),
  };
});

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};

describe('CheckInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });
  });

  it('should render check-in page', () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 10,
        },
      });
    });

    render(
      <BrowserRouter>
        <CheckInPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Check In')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('should display GPS status when loading', () => {
    mockGeolocation.getCurrentPosition.mockImplementation(() => {
      // Don't call success callback - simulate loading
    });

    render(
      <BrowserRouter>
        <CheckInPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Getting location...')).toBeInTheDocument();
  });

  it('should display GPS error when location fails', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 1,
        message: 'User denied geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    });

    render(
      <BrowserRouter>
        <CheckInPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Location error/)).toBeInTheDocument();
    });
  });

  it('should display GPS accuracy when location acquired', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 25,
        },
      });
    });

    render(
      <BrowserRouter>
        <CheckInPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Location acquired \(±25m\)/)).toBeInTheDocument();
    });
  });

  it('should disable check-in button when GPS is unavailable', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 1,
        message: 'User denied geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    });

    render(
      <BrowserRouter>
        <CheckInPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const checkInButton = screen.getByText('Check In to Visit');
      expect(checkInButton).toBeDisabled();
    });
  });

  it('should handle check-in successfully', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 10,
        },
      });
    });

    render(
      <BrowserRouter>
        <CheckInPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Check In to Visit')).toBeEnabled();
    });

    const checkInButton = screen.getByText('Check In to Visit');
    fireEvent.click(checkInButton);

    await waitFor(() => {
      expect(screen.getByText('Visit in Progress')).toBeInTheDocument();
    });
  });

  it('should show check-out button after check-in', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 10,
        },
      });
    });

    render(
      <BrowserRouter>
        <CheckInPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Check In to Visit')).toBeEnabled();
    });

    fireEvent.click(screen.getByText('Check In to Visit'));

    await waitFor(() => {
      expect(screen.getByText('Check Out')).toBeInTheDocument();
    });
  });

  it('should navigate back on check-out', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 10,
        },
      });
    });

    render(
      <BrowserRouter>
        <CheckInPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Check In to Visit')).toBeEnabled();
    });

    fireEvent.click(screen.getByText('Check In to Visit'));

    await waitFor(() => {
      expect(screen.getByText('Check Out')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Check Out'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/caregiver');
    });
  });

  it('should display visit details', () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 10,
        },
      });
    });

    render(
      <BrowserRouter>
        <CheckInPage />
      </BrowserRouter>
    );

    expect(screen.getByText('8:00 AM • 2 hours')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Austin, TX 78701')).toBeInTheDocument();
    expect(screen.getByText('(512) 555-0101')).toBeInTheDocument();
  });

  it('should handle tap-to-call', () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 10,
        },
      });
    });

    render(
      <BrowserRouter>
        <CheckInPage />
      </BrowserRouter>
    );

    const phoneLink = screen.getByText('(512) 555-0101');
    expect(phoneLink).toHaveAttribute('href', 'tel:5125550101');

    window.location = originalLocation;
  });

  it('should handle navigation to directions', () => {
    const originalOpen = window.open;
    window.open = vi.fn();

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 10,
        },
      });
    });

    render(
      <BrowserRouter>
        <CheckInPage />
      </BrowserRouter>
    );

    const directionsButton = screen.getByText('Get Directions');
    fireEvent.click(directionsButton);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('maps.google.com'),
      '_blank',
      'noopener,noreferrer'
    );

    window.open = originalOpen;
  });

  it('should handle geolocation not supported', () => {
    const originalGeolocation = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
    });

    render(
      <BrowserRouter>
        <CheckInPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Location error/)).toBeInTheDocument();

    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      writable: true,
    });
  });
});
