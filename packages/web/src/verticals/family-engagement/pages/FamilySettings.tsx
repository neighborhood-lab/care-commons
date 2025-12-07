/**
 * Family Settings Page
 *
 * Comprehensive settings page for family members to manage their portal
 * preferences, notification settings, and profile information.
 */

import React, { useState } from 'react';
import { useFamilyMemberProfile } from '../hooks';
import { NotificationSettings } from '../components/NotificationSettings';
import type { FamilyMember, FamilyRelationship } from '@folkcare/family-engagement';

// Mock family member ID - in real app would come from auth context
const MOCK_FAMILY_MEMBER_ID = 'fm-demo-001';

export const FamilySettings: React.FC = () => {
  const { data: familyMember, isLoading, error } = useFamilyMemberProfile(MOCK_FAMILY_MEMBER_ID);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'data'>('profile');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error || !familyMember) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Unable to load settings</h2>
          <p className="text-sm text-gray-600">
            {error instanceof Error ? error.message : 'Please try again later'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your profile, notification preferences, and data export options
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Settings">
          <button
            onClick={() => setActiveTab('profile')}
            className={`${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`${
              activeTab === 'data'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
          >
            Data & Privacy
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'profile' && <ProfileTab familyMember={familyMember} />}
        {activeTab === 'notifications' && (
          <NotificationSettings
            familyMemberId={familyMember.id}
            currentPreferences={familyMember.notificationPreferences}
          />
        )}
        {activeTab === 'data' && <DataTab familyMember={familyMember} />}
      </div>
    </div>
  );
};

/**
 * Profile Information Tab
 */
const ProfileTab: React.FC<{ familyMember: FamilyMember }> = ({ familyMember }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: familyMember.firstName,
    lastName: familyMember.lastName,
    email: familyMember.email,
    phoneNumber: familyMember.phoneNumber,
    preferredContactMethod: familyMember.preferredContactMethod,
    relationship: familyMember.relationship,
    relationshipNote: familyMember.relationshipNote || '',
  });

  const handleSave = () => {
    // TODO: Wire up to API
    console.log('Saving profile:', formData);
    alert('Profile update would be saved here (API integration pending)');
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Edit
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-900">{familyMember.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-900">{familyMember.lastName}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          {isEditing ? (
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          ) : (
            <p className="text-sm text-gray-900">{familyMember.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          ) : (
            <p className="text-sm text-gray-900">{familyMember.phoneNumber}</p>
          )}
        </div>

        {/* Preferred Contact Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Contact Method
          </label>
          {isEditing ? (
            <select
              value={formData.preferredContactMethod}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferredContactMethod: e.target.value as FamilyMember['preferredContactMethod'],
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="EMAIL">Email</option>
              <option value="PHONE">Phone Call</option>
              <option value="SMS">Text Message (SMS)</option>
              <option value="PORTAL">Portal Only</option>
            </select>
          ) : (
            <p className="text-sm text-gray-900 capitalize">
              {familyMember.preferredContactMethod.replace('_', ' ').toLowerCase()}
            </p>
          )}
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship to Care Recipient
          </label>
          {isEditing ? (
            <select
              value={formData.relationship}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  relationship: e.target.value as FamilyRelationship,
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="SPOUSE">Spouse</option>
              <option value="PARENT">Parent</option>
              <option value="CHILD">Child</option>
              <option value="SIBLING">Sibling</option>
              <option value="GRANDPARENT">Grandparent</option>
              <option value="GRANDCHILD">Grandchild</option>
              <option value="GUARDIAN">Legal Guardian</option>
              <option value="POWER_OF_ATTORNEY">Power of Attorney</option>
              <option value="HEALTHCARE_PROXY">Healthcare Proxy</option>
              <option value="OTHER">Other</option>
            </select>
          ) : (
            <p className="text-sm text-gray-900 capitalize">
              {familyMember.relationship.replace(/_/g, ' ').toLowerCase()}
            </p>
          )}
        </div>

        {/* Relationship Note */}
        {(isEditing || familyMember.relationshipNote) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship Details (Optional)
            </label>
            {isEditing ? (
              <textarea
                value={formData.relationshipNote}
                onChange={(e) => setFormData({ ...formData, relationshipNote: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Primary caregiver, lives nearby"
              />
            ) : (
              <p className="text-sm text-gray-700">{familyMember.relationshipNote}</p>
            )}
          </div>
        )}

        {/* Access Level (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Portal Access Level</label>
          <p className="text-sm text-gray-900 capitalize">
            {familyMember.portalAccessLevel.replace(/_/g, ' ').toLowerCase()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Contact your care coordinator to change your access level
          </p>
        </div>

        {/* Edit Mode Actions */}
        {isEditing && (
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSave}
              className="flex-1 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setFormData({
                  firstName: familyMember.firstName,
                  lastName: familyMember.lastName,
                  email: familyMember.email,
                  phoneNumber: familyMember.phoneNumber,
                  preferredContactMethod: familyMember.preferredContactMethod,
                  relationship: familyMember.relationship,
                  relationshipNote: familyMember.relationshipNote || '',
                });
                setIsEditing(false);
              }}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Data & Privacy Tab
 */
const DataTab: React.FC<{ familyMember: FamilyMember }> = ({ familyMember }) => {
  const handleExportData = () => {
    alert('Data export functionality will download your data in JSON format');
    console.log('Exporting data for:', familyMember.id);
  };

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Your Data</h2>
        <p className="text-sm text-gray-600 mb-4">
          Download all your portal data, including notification history, messages, and activity logs.
          Data will be provided in JSON format.
        </p>
        <button
          onClick={handleExportData}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Export My Data
        </button>
      </div>

      {/* Privacy Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Security</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Last Login</h3>
            <p className="text-gray-600">
              {familyMember.lastLoginAt
                ? new Date(familyMember.lastLoginAt).toLocaleString()
                : 'Never logged in'}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-1">Portal Status</h3>
            <p className="text-gray-600 capitalize">{familyMember.status.toLowerCase()}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-1">Access Granted</h3>
            <p className="text-gray-600">
              {new Date(familyMember.accessGrantedAt).toLocaleDateString()}
            </p>
          </div>

          {familyMember.accessExpiresAt && (
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Access Expires</h3>
              <p className="text-gray-600">
                {new Date(familyMember.accessExpiresAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Account Actions */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-4">Deactivate Portal Access</h2>
        <p className="text-sm text-red-700 mb-4">
          If you no longer need portal access, you can request deactivation. This action requires
          confirmation from your care coordinator.
        </p>
        <button
          onClick={() =>
            alert('Portal deactivation requires coordinator approval. Please contact your care team.')
          }
          className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
        >
          Request Deactivation
        </button>
      </div>
    </div>
  );
};
