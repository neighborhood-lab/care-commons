import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Target, Clock, AlertTriangle } from 'lucide-react';
import { Card, StatusBadge } from '@/core/components';
import { formatDate } from '@/core/utils';
import type { CarePlan } from '../types';

export interface CarePlanCardProps {
  carePlan: CarePlan;
  compact?: boolean;
}

export const CarePlanCard: React.FC<CarePlanCardProps> = ({ carePlan, compact = false }) => {
  const [now] = useState(() => Date.now());

  const isExpiringSoon =
    carePlan.expirationDate &&
    new Date(carePlan.expirationDate) <= new Date(now + 30 * 24 * 60 * 60 * 1000);

  const isOverdue = carePlan.reviewDate && new Date(carePlan.reviewDate) < new Date(now);

  return (
    <Link to={`/care-plans/${carePlan.id}`}>
      <Card padding="md" hover className="h-full">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{carePlan.name}</h3>
            <p className="text-sm text-gray-600">{carePlan.planNumber}</p>
            <p className="text-xs text-gray-500 mt-1">{carePlan.planType.replace(/_/g, ' ')}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={carePlan.status} />
            {isExpiringSoon && (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                Expires Soon
              </div>
            )}
            {isOverdue && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                Review Overdue
              </div>
            )}
          </div>
        </div>

        {!compact && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              Client ID: {carePlan.clientId}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Target className="h-4 w-4" />
              {carePlan.goals.length} Goals, {carePlan.interventions.length} Interventions
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              Effective: {formatDate(carePlan.effectiveDate)}
            </div>

            {carePlan.expirationDate && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                Expires: {formatDate(carePlan.expirationDate)}
              </div>
            )}

            {carePlan.estimatedHoursPerWeek && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                {carePlan.estimatedHoursPerWeek} hrs/week
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Priority:</span>
              <span
                className={`text-xs font-medium ${
                  carePlan.priority === 'URGENT'
                    ? 'text-red-600'
                    : carePlan.priority === 'HIGH'
                      ? 'text-orange-600'
                      : carePlan.priority === 'MEDIUM'
                        ? 'text-yellow-600'
                        : 'text-gray-600'
                }`}
              >
                {carePlan.priority}
              </span>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
};
