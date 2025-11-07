import React from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  MessageCircle,
  Upload,
  Target,
  Clock,
} from 'lucide-react';
import { Card } from '@/core/components';
import { formatDistanceToNow } from 'date-fns';

interface ActivityCardProps {
  activity: {
    id: string;
    activityType: string;
    title: string;
    description: string;
    summary?: string;
    performedByName?: string;
    occurredAt: string;
    iconType?: string;
  };
  onClick?: () => void;
}

const activityIcons: Record<string, React.ReactNode> = {
  VISIT_SCHEDULED: <Calendar className="h-5 w-5 text-blue-500" />,
  VISIT_STARTED: <Clock className="h-5 w-5 text-green-500" />,
  VISIT_COMPLETED: <CheckCircle className="h-5 w-5 text-green-500" />,
  VISIT_CANCELLED: <XCircle className="h-5 w-5 text-red-500" />,
  CARE_PLAN_UPDATED: <FileText className="h-5 w-5 text-purple-500" />,
  GOAL_ACHIEVED: <Target className="h-5 w-5 text-green-500" />,
  TASK_COMPLETED: <CheckCircle className="h-5 w-5 text-blue-500" />,
  NOTE_ADDED: <FileText className="h-5 w-5 text-gray-500" />,
  INCIDENT_REPORTED: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  MESSAGE_RECEIVED: <MessageCircle className="h-5 w-5 text-blue-500" />,
  DOCUMENT_UPLOADED: <Upload className="h-5 w-5 text-indigo-500" />,
};

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onClick }) => {
  const icon = activityIcons[activity.activityType] || (
    <Calendar className="h-5 w-5 text-gray-500" />
  );

  const timeAgo = formatDistanceToNow(new Date(activity.occurredAt), { addSuffix: true });

  return (
    <Card
      padding="md"
      className={`transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">{activity.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
              {activity.summary && (
                <p className="mt-2 text-sm text-gray-500 italic">{activity.summary}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center text-xs text-gray-500 space-x-4">
            <span>{timeAgo}</span>
            {activity.performedByName && (
              <>
                <span>·</span>
                <span>By {activity.performedByName}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
