/**
 * Notifications Page
 *
 * All notifications with settings
 */

import React, { useState } from 'react';
import { useUnreadNotifications, useFamilyMemberProfile } from '../hooks';
import { NotificationList, NotificationSettings } from '../components';

export const NotificationsPage: React.FC = () => {
  const familyMemberId = sessionStorage.getItem('familyMemberId') || null;
  const [showSettings, setShowSettings] = useState(false);

  const { data: notifications, isLoading } = useUnreadNotifications(familyMemberId);
  const { data: profile } = useFamilyMemberProfile(familyMemberId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-gray-600">
            Stay updated on important care events and activities
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          {showSettings ? 'Hide Settings' : 'Settings'}
        </button>
      </div>

      {/* Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notifications List */}
        <div className="lg:col-span-2">
          <NotificationList notifications={notifications || []} loading={isLoading} />
        </div>

        {/* Settings Sidebar */}
        {showSettings && profile && (
          <div className="lg:col-span-1">
            <NotificationSettings
              familyMemberId={familyMemberId!}
              currentPreferences={profile.notificationPreferences}
            />
          </div>
        )}
      </div>

      {/* Info Banner */}
      {!showSettings && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> Click the Settings button above to customize which
            notifications you receive and how often.
          </p>
        </div>
      )}
    </div>
  );
};
