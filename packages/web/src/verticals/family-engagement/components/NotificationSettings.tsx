/**
 * Notification Settings Component
 *
 * Manage notification preferences
 */

import React, { useState } from 'react';
import type { NotificationPreferences } from '@care-commons/family-engagement';
import { useUpdateNotificationPreferences } from '../hooks';

interface NotificationSettingsProps {
  familyMemberId: string;
  currentPreferences: NotificationPreferences;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  familyMemberId,
  currentPreferences,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(currentPreferences);
  const updatePreferences = useUpdateNotificationPreferences(familyMemberId);

  const handleSave = () => {
    updatePreferences.mutate(preferences, {
      onSuccess: () => {
        alert('Notification preferences updated successfully!');
      },
      onError: (error) => {
        alert('Failed to update preferences. Please try again.');
        console.error(error);
      },
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>

      {/* Channels */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Notification Channels</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.emailEnabled}
              onChange={(e) =>
                setPreferences({ ...preferences, emailEnabled: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Email notifications</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.smsEnabled}
              onChange={(e) => setPreferences({ ...preferences, smsEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">SMS text messages</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.pushEnabled}
              onChange={(e) => setPreferences({ ...preferences, pushEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Push notifications (mobile app)</span>
          </label>
        </div>
      </div>

      {/* Notification Types */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">What to notify me about</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.visitReminders}
              onChange={(e) =>
                setPreferences({ ...preferences, visitReminders: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Visit reminders</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.visitCompletedUpdates}
              onChange={(e) =>
                setPreferences({ ...preferences, visitCompletedUpdates: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Visit completion updates</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.careplanUpdates}
              onChange={(e) =>
                setPreferences({ ...preferences, careplanUpdates: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Care plan updates</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.incidentAlerts}
              onChange={(e) =>
                setPreferences({ ...preferences, incidentAlerts: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Incident alerts (important)</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.appointmentReminders}
              onChange={(e) =>
                setPreferences({ ...preferences, appointmentReminders: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Appointment reminders</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.messageNotifications}
              onChange={(e) =>
                setPreferences({ ...preferences, messageNotifications: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">New messages</span>
          </label>
        </div>
      </div>

      {/* Digest Frequency */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Delivery frequency</h3>
        <select
          value={preferences.digestFrequency}
          onChange={(e) =>
            setPreferences({
              ...preferences,
              digestFrequency: e.target.value as NotificationPreferences['digestFrequency'],
            })
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="IMMEDIATE">Send immediately</option>
          <option value="DAILY">Daily digest</option>
          <option value="WEEKLY">Weekly digest</option>
          <option value="NONE">No notifications</option>
        </select>
      </div>

      {/* Quiet Hours */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quiet hours (optional)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">From</label>
            <input
              type="time"
              value={preferences.quietHoursStart || ''}
              onChange={(e) =>
                setPreferences({ ...preferences, quietHoursStart: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">To</label>
            <input
              type="time"
              value={preferences.quietHoursEnd || ''}
              onChange={(e) => setPreferences({ ...preferences, quietHoursEnd: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          During quiet hours, you'll only receive urgent notifications
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={updatePreferences.isPending}
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
};
