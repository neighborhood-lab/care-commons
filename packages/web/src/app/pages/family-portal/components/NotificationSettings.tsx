import React from 'react';
import { Card } from '@/core/components';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/app/hooks/useFamilyNotifications';
import { Loader2, Save, Check } from 'lucide-react';

interface NotificationSettingsProps {
  familyMemberId: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ familyMemberId }) => {
  const { data: preferences, isLoading } = useNotificationPreferences(familyMemberId);
  const updatePreferences = useUpdateNotificationPreferences();
  const [localPreferences, setLocalPreferences] = React.useState(preferences);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleSave = async () => {
    if (localPreferences) {
      await updatePreferences.mutateAsync({
        familyMemberId,
        preferences: localPreferences,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (isLoading || !localPreferences) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-gray-900">Email Notifications</div>
              <div className="text-sm text-gray-600">Receive notifications via email</div>
            </div>
            <input
              type="checkbox"
              checked={localPreferences.emailEnabled}
              onChange={(e) => setLocalPreferences({ ...localPreferences, emailEnabled: e.target.checked })}
              className="h-5 w-5 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-gray-900">SMS Notifications</div>
              <div className="text-sm text-gray-600">Receive notifications via text message</div>
            </div>
            <input
              type="checkbox"
              checked={localPreferences.smsEnabled}
              onChange={(e) => setLocalPreferences({ ...localPreferences, smsEnabled: e.target.checked })}
              className="h-5 w-5 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-gray-900">Push Notifications</div>
              <div className="text-sm text-gray-600">Receive notifications in browser</div>
            </div>
            <input
              type="checkbox"
              checked={localPreferences.pushEnabled}
              onChange={(e) => setLocalPreferences({ ...localPreferences, pushEnabled: e.target.checked })}
              className="h-5 w-5 text-blue-600 rounded"
            />
          </label>
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Types</h3>
        <div className="space-y-4">
          {[
            { key: 'visitReminders', label: 'Visit Reminders', description: 'Get reminders before scheduled visits' },
            { key: 'visitCompletedUpdates', label: 'Visit Completed', description: 'Be notified when visits are completed' },
            { key: 'careplanUpdates', label: 'Care Plan Updates', description: 'Receive updates about care plan changes' },
            { key: 'incidentAlerts', label: 'Incident Alerts', description: 'Get alerts about important incidents' },
            { key: 'appointmentReminders', label: 'Appointment Reminders', description: 'Reminders for medical appointments' },
            { key: 'messageNotifications', label: 'New Messages', description: 'Be notified of new messages from care team' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-gray-900">{item.label}</div>
                <div className="text-sm text-gray-600">{item.description}</div>
              </div>
              <input
                type="checkbox"
                checked={localPreferences[item.key as keyof typeof localPreferences] as boolean}
                onChange={(e) => setLocalPreferences({ ...localPreferences, [item.key]: e.target.checked })}
                className="h-5 w-5 text-blue-600 rounded"
              />
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={updatePreferences.isPending}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {updatePreferences.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : saveSuccess ? (
            <>
              <Check className="h-5 w-5" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
