/**
 * Mobile-optimized check-in/out page for caregivers
 *
 * Features:
 * - Large touch targets (min 44px)
 * - GPS location tracking and indicator
 * - Quick task checklist
 * - Prominent check-in/out buttons
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIsMobile } from '@/core/hooks';
import { Card, Button } from '@/core/components';
import {
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  Navigation,
  Phone,
  Loader,
  XCircle,
} from 'lucide-react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

export const CheckInPage: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: true,
    error: null,
  });

  // Mock visit data - would come from API
  const visit = {
    id: visitId,
    clientName: 'John Smith',
    clientPhone: '(512) 555-0101',
    visitType: 'Personal Care',
    scheduledTime: '8:00 AM',
    duration: '2 hours',
    address: '123 Main St, Austin, TX 78701',
    tasks: [
      { id: '1', name: 'Morning routine assistance', completed: false },
      { id: '2', name: 'Medication reminder', completed: false },
      { id: '3', name: 'Light housekeeping', completed: false },
    ],
  };

  // Get GPS location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            loading: false,
            error: null,
          });
        },
        (error) => {
          setLocation({
            latitude: null,
            longitude: null,
            accuracy: null,
            loading: false,
            error: error.message,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocation({
        latitude: null,
        longitude: null,
        accuracy: null,
        loading: false,
        error: 'Geolocation is not supported',
      });
    }
  }, []);

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsCheckedIn(true);
      setCheckInTime(new Date());
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async (): Promise<void> => {
    setIsCheckingIn(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate('/caregiver');
    } catch (error) {
      console.error('Check-out failed:', error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Use visitId to prevent unused warning - will be used with API integration
  const _visitId = visitId;

  const getGPSStatusIcon = () => {
    if (location.loading) {
      return <Loader className="h-5 w-5 text-blue-600 animate-spin" />;
    }
    if (location.error || !location.latitude) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  const getGPSStatusText = () => {
    if (location.loading) {
      return 'Getting location...';
    }
    if (location.error) {
      return `Location error: ${location.error}`;
    }
    if (!location.latitude) {
      return 'Location unavailable';
    }
    const accuracy = location.accuracy ? Math.round(location.accuracy) : 0;
    return `Location acquired (±${accuracy}m)`;
  };

  const getGPSStatusColor = () => {
    if (location.loading) return 'bg-blue-50 border-blue-200';
    if (location.error || !location.latitude) return 'bg-red-50 border-red-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <div className={`space-y-${isMobile ? '4' : '6'} ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className={isMobile ? 'sticky top-0 bg-white z-10 pb-4 border-b border-gray-200' : ''}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
              {isCheckedIn ? 'Visit in Progress' : 'Check In'}
            </h1>
            <p className="text-gray-600 mt-1">{visit.clientName}</p>
          </div>
          {isCheckedIn && checkInTime && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Checked in at</p>
              <p className="text-lg font-semibold text-gray-900">
                {checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* GPS Status */}
      <Card padding="md" className={`border-2 ${getGPSStatusColor()}`}>
        <div className="flex items-center gap-3">
          {getGPSStatusIcon()}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">GPS Status</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{getGPSStatusText()}</p>
          </div>
        </div>
      </Card>

      {/* Visit Details */}
      <Card padding="md">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Visit Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">
                  {visit.scheduledTime} • {visit.duration}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-gray-700">{visit.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <a
                  href={`tel:${visit.clientPhone.replace(/\D/g, '')}`}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {visit.clientPhone}
                </a>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={() =>
                window.open(
                  `https://maps.google.com/?q=${encodeURIComponent(visit.address)}`,
                  '_blank',
                  'noopener,noreferrer'
                )
              }
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              <Navigation className="h-4 w-4" />
              Get Directions
            </button>
          </div>
        </div>
      </Card>

      {/* Tasks Checklist - Only show when checked in */}
      {isCheckedIn && (
        <Card padding="md">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Tasks</h3>
            <div className="space-y-3">
              {visit.tasks.map((task) => (
                <label
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                    task.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${isMobile ? 'min-h-[44px]' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => {
                      // Handle task completion
                      task.completed = !task.completed;
                    }}
                    className={`mt-0.5 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'} rounded border-gray-300 text-primary-600 focus:ring-primary-500`}
                  />
                  <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Check In/Out Button */}
      <div className={isMobile ? 'fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200' : ''}>
        {!isCheckedIn ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleCheckIn}
            disabled={isCheckingIn || location.loading || !location.latitude}
            isLoading={isCheckingIn}
            className={`w-full ${isMobile ? 'min-h-[56px] text-lg' : 'min-h-[48px]'} font-semibold`}
          >
            <CheckCircle className="h-6 w-6" />
            {isCheckingIn ? 'Checking In...' : 'Check In to Visit'}
          </Button>
        ) : (
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCheckOut}
              disabled={isCheckingIn}
              isLoading={isCheckingIn}
              className={`w-full ${isMobile ? 'min-h-[56px] text-lg' : 'min-h-[48px]'} font-semibold`}
            >
              <CheckCircle className="h-6 w-6" />
              {isCheckingIn ? 'Checking Out...' : 'Check Out'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(`/caregiver/notes/${visitId}`)}
              className={`w-full ${isMobile ? 'min-h-[44px]' : ''}`}
            >
              Add Notes
            </Button>
          </div>
        )}
        {location.loading && (
          <p className="text-sm text-gray-600 text-center mt-2">
            Waiting for GPS location...
          </p>
        )}
        {location.error && (
          <p className="text-sm text-red-600 text-center mt-2">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            GPS required for check-in
          </p>
        )}
      </div>
    </div>
  );
};
