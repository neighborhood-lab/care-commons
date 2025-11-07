import React, { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useUnreadNotifications, useMarkNotificationAsRead } from '@/app/hooks/useFamilyNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface NotificationBellProps {
  familyMemberId: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ familyMemberId }) => {
  const { data: notifications } = useUnreadNotifications(familyMemberId);
  const markAsRead = useMarkNotificationAsRead();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications?.length || 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = (notificationId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    markAsRead.mutate(notificationId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <Link
              to="/family-portal/notifications"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              View all
            </Link>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No new notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-gray-50 transition-colors relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                        title="Mark as read"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                    {notification.actionUrl && (
                      <Link
                        to={notification.actionUrl}
                        className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                        onClick={() => {
                          setIsOpen(false);
                          handleMarkAsRead(notification.id, {} as React.MouseEvent);
                        }}
                      >
                        {notification.actionLabel || 'View details'}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications && notifications.length > 5 && (
            <div className="p-4 border-t border-gray-200 text-center">
              <Link
                to="/family-portal/notifications"
                className="text-sm text-blue-600 hover:underline font-medium"
                onClick={() => setIsOpen(false)}
              >
                View {notifications.length - 5} more notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
