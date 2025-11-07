import React, { useState } from 'react';
import { useNotifications, useMarkAllNotificationsAsRead } from '@/app/hooks/useFamilyNotifications';
import { NotificationList } from './components/NotificationList';
import { NotificationSettings } from './components/NotificationSettings';
import { Button } from '@/core/components';
import { Loader2, Settings, CheckCheck } from 'lucide-react';

// Temporary: In production, this would come from auth context
const FAMILY_MEMBER_ID = 'family-member-1';

export const NotificationsPage: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const { data, isLoading } = useNotifications(FAMILY_MEMBER_ID, 1, 50);
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(FAMILY_MEMBER_ID);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
            <p className="mt-2 text-lg text-gray-600">
              Manage how you receive notifications
            </p>
          </div>
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowSettings(false)}
          >
            Back to Notifications
          </Button>
        </div>

        <NotificationSettings familyMemberId={FAMILY_MEMBER_ID} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-lg text-gray-600">
            Stay updated on important care events
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {data && data.notifications.length > 0 && (
            <Button
              variant="ghost"
              size="md"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="h-5 w-5 mr-2" />
              Mark all as read
            </Button>
          )}
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-5 w-5 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {data && <NotificationList notifications={data.notifications} />}
    </div>
  );
};
