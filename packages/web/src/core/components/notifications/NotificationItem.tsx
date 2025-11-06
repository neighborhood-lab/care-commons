/**
 * NotificationItem Component
 *
 * Individual notification display with actions
 */

import { Info, CheckCircle, AlertTriangle, XCircle, Trash2, ExternalLink } from 'lucide-react';
import { Notification, NotificationType } from '../../types/notification';
import { useMarkAsRead, useDeleteNotification } from '../../hooks/notifications';

interface NotificationItemProps {
  notification: Notification;
}

const iconMap: Record<NotificationType, React.ReactNode> = {
  info: <Info className="h-5 w-5 text-blue-500" />,
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
};

const bgColorMap: Record<NotificationType, string> = {
  info: 'bg-blue-50',
  success: 'bg-green-50',
  warning: 'bg-yellow-50',
  error: 'bg-red-50',
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // If there's an action URL, navigate to it
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notification.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div
      className={`relative p-4 transition-colors hover:bg-gray-50 ${
        !notification.isRead ? 'bg-blue-50/30' : ''
      } ${notification.actionUrl ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-600" />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 rounded-lg p-2 ${bgColorMap[notification.type]}`}>
          {iconMap[notification.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-900 text-sm">{notification.title}</h3>
            <button
              onClick={handleDelete}
              className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              aria-label="Delete notification"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{notification.message}</p>

          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <time dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>
            {notification.actionUrl && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-blue-600">
                  View details
                  <ExternalLink className="h-3 w-3" />
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
