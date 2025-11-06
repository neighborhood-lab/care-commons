/**
 * Settings Layout Page
 *
 * Main settings page with tab navigation and nested routes.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { SettingsTabs } from '../components';
import { AccountSettings } from './AccountSettings';
import { PreferencesSettings } from './PreferencesSettings';
import { SecuritySettings } from './SecuritySettings';

export const SettingsLayout = () => {
  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <SettingsTabs />

        <div className="mt-8">
          <Routes>
            <Route path="/" element={<Navigate to="account" replace />} />
            <Route path="account" element={<AccountSettings />} />
            <Route path="preferences" element={<PreferencesSettings />} />
            <Route path="security" element={<SecuritySettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};
