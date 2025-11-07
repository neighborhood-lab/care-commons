import React from 'react';
import { Card } from '@/core/components';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Calendar, AlertTriangle, MessageCircle, FileText, Clock } from 'lucide-react';
import { useMarkNotificationAsRead } from '@/app/hooks/useFamilyNotifications';

interface Notification {
  id: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationListProps {
  notifications: Notification[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  VISIT: <Calendar className="h-5 w-5 text-blue-500" />,
  CARE_PLAN: <FileText className="h-5 w-5 text-purple-500" />,
  INCIDENT: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  APPOINTMENT: <Clock className="h-5 w-5 text-green-500" />,
  MESSAGE: <MessageCircle className="h-5 w-5 text-blue-500" />,
  REMINDER: <Bell className="h-5 w-5 text-gray-500" />,
  SYSTEM: <Bell className="h-5 w-5 text-gray-500" />,
};

export const NotificationList: React.FC<NotificationListProps> = ({ notifications }) => {
  const markAsRead = useMarkNotificationAsRead();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.readAt) {
      markAsRead.mutate(notification.id);
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No notifications to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const icon = categoryIcons[notification.category] || categoryIcons.SYSTEM;
        const isUnread = !notification.readAt;

        return (
          <Card
            key={notification.id}
            padding="md"
            className={`transition-all cursor-pointer hover:shadow-md ${
              isUnread ? 'bg-blue-50 border-blue-200' : ''
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isUnread ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {icon}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className={`text-base font-semibold ${
                    isUnread ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {notification.title}
                    {isUnread && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                        New
                      </span>
                    )}
                  </h3>
                </div>

                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                  {notification.actionUrl && (
                    <a
                      href={notification.actionUrl}
                      className="text-sm text-blue-600 hover:underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {notification.actionLabel || 'View details'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
