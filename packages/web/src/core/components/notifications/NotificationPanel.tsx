/**
 * NotificationPanel Component
 *
 * Dropdown panel displaying list of notifications with actions
 */

import { useEffect, useRef } from 'react';
import { X, CheckCheck, Loader2 } from 'lucide-react';
import { useNotifications, useMarkAllAsRead } from '../../hooks/notifications';
import { NotificationItem } from './NotificationItem';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: notificationsData, isLoading } = useNotifications({ page: 1, limit: 20 });
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } = useMarkAllAsRead();

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }

    return undefined;
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const notifications = notificationsData?.items || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 z-50 w-96 rounded-lg border border-gray-200 bg-white shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({unreadCount} unread)
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              title="Mark all as read"
            >
              {isMarkingAllAsRead ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              <span>Mark all read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close notifications"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
