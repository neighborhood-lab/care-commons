/**
 * Security Settings Page
 *
 * Security settings including password change and session management.
 */

import { SettingsCard, PasswordChangeForm } from '../components';

export const SecuritySettings = () => {
  return (
    <div className="space-y-6">
      <SettingsCard
        title="Change Password"
        description="Update your password to keep your account secure"
      >
        <PasswordChangeForm />
      </SettingsCard>

      <SettingsCard
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
      >
        <div className="text-sm text-gray-500">
          <p>Two-factor authentication is not yet configured.</p>
          <p className="mt-2">
            Coming soon: Enable 2FA to add an additional security layer to your
            account.
          </p>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Active Sessions"
        description="Manage your active sessions and sign out from other devices"
      >
        <div className="text-sm text-gray-500">
          <p>Session management is not yet available.</p>
          <p className="mt-2">
            Coming soon: View and manage all active sessions across your
            devices.
          </p>
        </div>
      </SettingsCard>
    </div>
  );
};
