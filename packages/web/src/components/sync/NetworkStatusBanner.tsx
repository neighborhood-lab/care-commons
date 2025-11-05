/**
 * Network Status Banner Component
 * 
 * Displays a prominent banner when the user goes offline.
 * Reassures users that their work is being saved locally and will sync
 * when connectivity returns.
 * 
 * This is critical for building trust in offline-first functionality.
 */

import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        // Hide "reconnected" message after 5 seconds
        setTimeout(() => setShowReconnected(false), 5000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // Don't show banner if online and not showing reconnected message
  if (isOnline && !showReconnected) {
    return null;
  }

  // Show reconnected message
  if (showReconnected) {
    return (
      <div className="bg-green-50 border-b border-green-200 px-4 py-3">
        <div className="flex items-center justify-center gap-3 max-w-7xl mx-auto">
          <Wifi className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              Back online
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              Your data is now syncing with the server
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show offline message
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="flex items-center justify-center gap-3 max-w-7xl mx-auto">
        <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900">
            You&apos;re offline
          </p>
          <p className="text-xs text-amber-800 mt-0.5">
            Your changes are being saved locally and will sync when you reconnect
          </p>
        </div>
      </div>
    </div>
  );
}
