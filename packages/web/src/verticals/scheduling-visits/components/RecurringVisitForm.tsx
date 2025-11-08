/**
 * Recurring Visit Form Component
 *
 * Form for creating recurring visits with holiday filtering
 */

import React, { useState } from 'react';
import { Card } from '@/core/components';
import { HolidayPreview } from './HolidayPreview';

interface RecurringVisitFormProps {
  onSubmit: (data: RecurringVisitFormData) => void;
  initialData?: Partial<RecurringVisitFormData>;
}

export interface RecurringVisitFormData {
  clientId: string;
  serviceTypeId: string;
  branchId: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  daysOfWeek?: string[];
  skipHolidays: boolean;
}

export const RecurringVisitForm: React.FC<RecurringVisitFormProps> = ({
  onSubmit,
  initialData,
}) => {
  const [skipHolidays, setSkipHolidays] = useState(initialData?.skipHolidays ?? true);
  const [startDate, setStartDate] = useState<Date | null>(initialData?.startDate ?? null);
  const [endDate, setEndDate] = useState<Date | null>(initialData?.endDate ?? null);
  const [branchId, setBranchId] = useState(initialData?.branchId ?? '');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: RecurringVisitFormData = {
      clientId: formData.get('clientId') as string,
      serviceTypeId: formData.get('serviceTypeId') as string,
      branchId: formData.get('branchId') as string,
      startDate: new Date(formData.get('startDate') as string),
      endDate: new Date(formData.get('endDate') as string),
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      frequency: formData.get('frequency') as RecurringVisitFormData['frequency'],
      skipHolidays,
    };

    onSubmit(data);
  };

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              name="clientId"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select client...</option>
              {/* Options would be populated dynamically */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Type
            </label>
            <select
              name="serviceTypeId"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select service type...</option>
              {/* Options would be populated dynamically */}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              name="branchId"
              required
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select branch...</option>
              {/* Options would be populated dynamically */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              name="frequency"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BIWEEKLY">Bi-weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              required
              onChange={(e) => setStartDate(e.target.valueAsDate)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              required
              onChange={(e) => setEndDate(e.target.valueAsDate)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              name="startTime"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              name="endTime"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Holiday Filtering */}
        <div className="border-t pt-6">
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={skipHolidays}
              onChange={(e) => setSkipHolidays(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Skip holidays when scheduling visits
            </span>
          </label>

          {skipHolidays && startDate && endDate && branchId && (
            <div className="ml-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Holidays that will be skipped:
              </p>
              <HolidayPreview
                startDate={startDate}
                endDate={endDate}
                branchId={branchId}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Generate Visits
          </button>
        </div>
      </form>
    </Card>
  );
};
