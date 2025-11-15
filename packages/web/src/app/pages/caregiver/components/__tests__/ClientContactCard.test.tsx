import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientContactCard } from '../ClientContactCard';
import type { ClientContactInfo } from '../ClientContactCard';

// Mock hooks
vi.mock('@/core/hooks', () => ({
  useIsMobile: () => false,
}));

describe('ClientContactCard', () => {
  const mockContact: ClientContactInfo = {
    clientName: 'John Smith',
    clientPhone: '(512) 555-0101',
    clientEmail: 'john.smith@example.com',
    address: '123 Main St, Austin, TX 78701',
    emergencyContacts: [
      {
        name: 'Jane Smith',
        relationship: 'Daughter',
        phone: '(512) 555-0102',
      },
      {
        name: 'Bob Johnson',
        relationship: 'Son',
        phone: '(512) 555-0103',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render client name', () => {
    render(<ClientContactCard contact={mockContact} />);

    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('should render phone number', () => {
    render(<ClientContactCard contact={mockContact} />);

    expect(screen.getByText('(512) 555-0101')).toBeInTheDocument();
  });

  it('should render email address', () => {
    render(<ClientContactCard contact={mockContact} />);

    expect(screen.getByText('john.smith@example.com')).toBeInTheDocument();
  });

  it('should render address', () => {
    render(<ClientContactCard contact={mockContact} />);

    expect(screen.getByText('123 Main St, Austin, TX 78701')).toBeInTheDocument();
  });

  it('should have tap-to-call button with correct href', () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    render(<ClientContactCard contact={mockContact} />);

    const phoneButton = screen.getByText('(512) 555-0101').closest('button');
    expect(phoneButton).toBeInTheDocument();

    if (phoneButton) {
      fireEvent.click(phoneButton);
      expect(window.location.href).toBe('tel:+15125550101');
    }

    window.location = originalLocation;
  });

  it('should have tap-to-email button with correct href', () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    render(<ClientContactCard contact={mockContact} />);

    const emailButton = screen.getByText('john.smith@example.com').closest('button');
    expect(emailButton).toBeInTheDocument();

    if (emailButton) {
      fireEvent.click(emailButton);
      expect(window.location.href).toBe('mailto:john.smith@example.com');
    }

    window.location = originalLocation;
  });

  it('should open maps on address click', () => {
    const originalOpen = window.open;
    window.open = vi.fn();

    render(<ClientContactCard contact={mockContact} />);

    const addressButton = screen.getByText('123 Main St, Austin, TX 78701').closest('button');
    expect(addressButton).toBeInTheDocument();

    if (addressButton) {
      fireEvent.click(addressButton);
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('maps.google.com'),
        '_blank',
        'noopener,noreferrer'
      );
    }

    window.open = originalOpen;
  });

  it('should not show emergency contacts by default', () => {
    render(<ClientContactCard contact={mockContact} />);

    expect(screen.queryByText('Emergency Contacts')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('should show emergency contacts when showEmergencyContacts is true', () => {
    render(<ClientContactCard contact={mockContact} showEmergencyContacts={true} />);

    expect(screen.getByText('Emergency Contacts')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Daughter')).toBeInTheDocument();
    expect(screen.getByText('(512) 555-0102')).toBeInTheDocument();
  });

  it('should show all emergency contacts', () => {
    render(<ClientContactCard contact={mockContact} showEmergencyContacts={true} />);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('should handle tap-to-call for emergency contacts', () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    render(<ClientContactCard contact={mockContact} showEmergencyContacts={true} />);

    const emergencyButton = screen.getByText('Jane Smith').closest('button');
    expect(emergencyButton).toBeInTheDocument();

    if (emergencyButton) {
      fireEvent.click(emergencyButton);
      expect(window.location.href).toBe('tel:+15125550102');
    }

    window.location = originalLocation;
  });

  it('should render without phone number', () => {
    const contactWithoutPhone = {
      ...mockContact,
      clientPhone: undefined,
    };

    render(<ClientContactCard contact={contactWithoutPhone} />);

    expect(screen.queryByText('TAP TO CALL')).not.toBeInTheDocument();
  });

  it('should render without email', () => {
    const contactWithoutEmail = {
      ...mockContact,
      clientEmail: undefined,
    };

    render(<ClientContactCard contact={contactWithoutEmail} />);

    expect(screen.queryByText('Email')).not.toBeInTheDocument();
  });

  it('should render without emergency contacts', () => {
    const contactWithoutEmergency = {
      ...mockContact,
      emergencyContacts: undefined,
    };

    render(<ClientContactCard contact={contactWithoutEmergency} showEmergencyContacts={true} />);

    expect(screen.queryByText('Emergency Contacts')).not.toBeInTheDocument();
  });

  it('should render with empty emergency contacts array', () => {
    const contactWithEmptyEmergency = {
      ...mockContact,
      emergencyContacts: [],
    };

    render(<ClientContactCard contact={contactWithEmptyEmergency} showEmergencyContacts={true} />);

    expect(screen.queryByText('Emergency Contacts')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ClientContactCard contact={mockContact} className="custom-class" />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('should show TAP TO CALL label on phone button', () => {
    render(<ClientContactCard contact={mockContact} />);

    expect(screen.getByText('TAP TO CALL')).toBeInTheDocument();
  });

  it('should show Phone label', () => {
    render(<ClientContactCard contact={mockContact} />);

    expect(screen.getByText('Phone')).toBeInTheDocument();
  });

  it('should show Email label', () => {
    render(<ClientContactCard contact={mockContact} />);

    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should show Address label', () => {
    render(<ClientContactCard contact={mockContact} />);

    expect(screen.getByText('Address')).toBeInTheDocument();
  });

  it('should format phone number correctly for tel protocol', () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    render(<ClientContactCard contact={mockContact} />);

    const phoneButton = screen.getByText('(512) 555-0101').closest('button');

    if (phoneButton) {
      fireEvent.click(phoneButton);
      // Should remove all non-digit characters and add +1
      expect(window.location.href).toBe('tel:+15125550101');
    }

    window.location = originalLocation;
  });

  it('should handle address with special characters', () => {
    const originalOpen = window.open;
    window.open = vi.fn();

    const contactWithSpecialAddress = {
      ...mockContact,
      address: '123 Main St, Apt #5, Austin, TX 78701',
    };

    render(<ClientContactCard contact={contactWithSpecialAddress} />);

    const addressButton = screen.getByText('123 Main St, Apt #5, Austin, TX 78701').closest('button');

    if (addressButton) {
      fireEvent.click(addressButton);
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('123 Main St, Apt #5, Austin, TX 78701')),
        '_blank',
        'noopener,noreferrer'
      );
    }

    window.open = originalOpen;
  });

  it('should use mobile styles when isMobile is true', () => {
    vi.mocked(require('@/core/hooks').useIsMobile).mockReturnValue(true);

    render(<ClientContactCard contact={mockContact} />);

    // Component should render without errors on mobile
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('should show relationship for emergency contacts', () => {
    render(<ClientContactCard contact={mockContact} showEmergencyContacts={true} />);

    expect(screen.getByText('Daughter')).toBeInTheDocument();
    expect(screen.getByText('Son')).toBeInTheDocument();
  });
});
