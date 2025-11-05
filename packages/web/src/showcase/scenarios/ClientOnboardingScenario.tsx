/**
 * New Client Onboarding Scenario
 *
 * Walk through the complete client intake and setup process
 */

import React from 'react';
import { UserPlus, FileCheck, CheckCircle, Shield } from 'lucide-react';
import { Scenario } from '../types';
import { NarrationBox } from './components/NarrationBox';
import { ActionButtons } from './components/ActionButtons';

// Step Components

const NewReferralIntro: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="A new client referral arrived overnight from Texas Health and Human Services. You need to complete the full onboarding workflow to get the client set up for services."
      time="9:00 AM"
      role="Administrator"
    />

    <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-blue-900 mb-2">📥 New Referral Received</h3>
          <div className="space-y-1 text-blue-800">
            <p><strong>Client:</strong> Robert Martinez</p>
            <p><strong>Age:</strong> 76</p>
            <p><strong>Medicaid ID:</strong> TX-8847291635</p>
            <p><strong>Services Needed:</strong> Personal Care (20 hrs/week)</p>
            <p><strong>Start Date:</strong> ASAP</p>
            <p><strong>Referral Source:</strong> Texas HHS Managed Care</p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
      <h4 className="font-semibold text-yellow-900 mb-2">⏱️ Onboarding Checklist (est. 20 minutes)</h4>
      <ul className="space-y-1 text-sm text-yellow-800">
        <li>□ Create client record with demographics</li>
        <li>□ Verify Medicaid eligibility</li>
        <li>□ Create initial care plan</li>
        <li>□ Assign care coordinator</li>
        <li>□ Schedule assessment visit</li>
        <li>□ Configure EVV requirements</li>
        <li>□ Generate service authorization</li>
      </ul>
    </div>

    <ActionButtons actions={['Begin Client Registration', 'Review Referral Details', 'Assign to Coordinator']} />
  </div>
);

const ClientRegistration: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="You create a new client record in the system. The form collects essential demographics and Medicaid information required for EVV compliance."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileCheck className="h-6 w-6 text-green-600" />
        <h3 className="text-lg font-bold text-gray-900">Client Registration Form</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value="Robert Martinez"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
            <input
              type="text"
              value="03/15/1948"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medicaid ID *</label>
            <input
              type="text"
              value="TX-8847291635"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <input
              type="text"
              value="1847 Oak Street, Austin, TX 78701"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              type="text"
              value="(512) 555-0198"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact *</label>
            <input
              type="text"
              value="Maria Martinez (Daughter) - (512) 555-0199"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          ✓ Client record created successfully (Client ID: CLT-2024-1847)
        </p>
      </div>
    </div>

    <ActionButtons actions={['Verify Medicaid Eligibility', 'Skip Verification', 'Save and Continue Later']} />
  </div>
);

const MedicaidVerification: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="The system automatically verifies Medicaid eligibility through the Texas EVV aggregator (HHAeXchange). This ensures the client is eligible for services before you proceed."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Medicaid Eligibility Verification</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Checking eligibility...</span>
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
          <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 w-full animate-pulse"></div>
          </div>
        </div>

        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-2">✓ Eligibility Confirmed</h4>
              <div className="space-y-1 text-sm text-green-800">
                <p><strong>Status:</strong> Active</p>
                <p><strong>Plan:</strong> Texas Medicaid STAR+PLUS</p>
                <p><strong>Managed Care Org:</strong> Superior HealthPlan</p>
                <p><strong>Authorized Services:</strong> Personal Care, Homemaker</p>
                <p><strong>Monthly Hour Cap:</strong> 80 hours</p>
                <p><strong>Valid Through:</strong> 12/31/2024</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-2">Service Authorization Details</h4>
          <div className="space-y-1 text-sm text-purple-800">
            <p><strong>Auth Number:</strong> TX-SA-2024-8847</p>
            <p><strong>Service Code:</strong> T1019 (Personal Care)</p>
            <p><strong>Approved Units:</strong> 320 units (15-min increments)</p>
            <p><strong>Weekly Limit:</strong> 20 hours</p>
            <p><strong>Requires EVV:</strong> Yes (all six elements)</p>
          </div>
        </div>
      </div>
    </div>

    <ActionButtons actions={['Create Initial Care Plan', 'Configure EVV Settings', 'Assign Coordinator']} />
  </div>
);

const CarePlanCreation: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="You create an initial care plan based on the referral information. This will be refined during the RN assessment visit scheduled for next week."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileCheck className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">Initial Care Plan</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Primary Goals</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Maintain independent living at home</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Assist with activities of daily living (ADLs)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Medication reminder assistance</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Light housekeeping and meal preparation</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Scheduled Services</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Frequency:</strong> Monday-Friday, 2 hours per day</p>
            <p><strong>Preferred Time:</strong> 10:00 AM - 12:00 PM</p>
            <p><strong>Total Weekly:</strong> 10 hours (within 20-hour authorization)</p>
            <p><strong>Services:</strong> Personal care, meal prep, light housekeeping</p>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">⏱️ Next Steps</h4>
          <ul className="space-y-1 text-sm text-yellow-800">
            <li>✓ RN assessment visit scheduled for 11/12/2024</li>
            <li>✓ Caregiver matching in progress</li>
            <li>✓ Service start date: 11/15/2024</li>
          </ul>
        </div>
      </div>
    </div>

    <ActionButtons actions={['Assign Care Coordinator', 'Schedule Assessment', 'Configure EVV']} />
  </div>
);

const CoordinatorAssignment: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="You assign a care coordinator who will be Robert's primary point of contact. Sarah Kim has capacity and experience with similar clients."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <UserPlus className="h-6 w-6 text-green-600" />
        <h3 className="text-lg font-bold text-gray-900">Care Coordinator Assignment</h3>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            SK
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-900">Sarah Kim</h4>
            <p className="text-sm text-gray-600 mb-3">Care Coordinator</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Current Caseload:</span>
                <span className="ml-2 font-semibold">23 clients</span>
              </div>
              <div>
                <span className="text-gray-600">Avg Rating:</span>
                <span className="ml-2 font-semibold">4.9/5.0</span>
              </div>
              <div>
                <span className="text-gray-600">Experience:</span>
                <span className="ml-2 font-semibold">5 years</span>
              </div>
              <div>
                <span className="text-gray-600">Specialties:</span>
                <span className="ml-2 font-semibold">Senior care</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          ✓ Sarah Kim assigned as primary coordinator. Notification sent.
        </p>
      </div>
    </div>

    <ActionButtons actions={['Schedule Assessment Visit', 'Configure EVV Requirements', 'Complete Onboarding']} />
  </div>
);

const EVVConfiguration: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="You configure EVV requirements for Robert's services. Texas requires strict compliance with all six EVV elements including GPS verification."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">EVV Configuration</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Texas EVV Requirements</h4>
          <div className="space-y-2">
            {[
              { label: 'Type of Service', value: 'T1019 - Personal Care', icon: '✓' },
              { label: 'Individual Receiving Service', value: 'Robert Martinez (CLT-2024-1847)', icon: '✓' },
              { label: 'Date of Service', value: 'Auto-captured from mobile device', icon: '✓' },
              { label: 'Location of Service', value: '1847 Oak Street, Austin, TX', icon: '✓' },
              { label: 'Time In/Time Out', value: 'GPS-verified clock in/out required', icon: '✓' },
              { label: 'Service Provider', value: 'Caregiver ID auto-captured', icon: '✓' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-green-600 font-bold">{item.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-blue-900">{item.label}:</span>
                  <span className="ml-2 text-blue-700">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-2">Geofence Settings</h4>
          <div className="space-y-1 text-sm text-purple-800">
            <p><strong>Geofence Radius:</strong> 100 meters (Texas requirement)</p>
            <p><strong>GPS Accuracy Required:</strong> ±50 meters</p>
            <p><strong>Grace Period:</strong> 10 minutes before/after scheduled time</p>
            <p><strong>Aggregator:</strong> HHAeXchange (mandatory for Texas)</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">✓ Configuration Complete</h4>
          <ul className="space-y-1 text-sm text-green-800">
            <li>✓ EVV requirements configured</li>
            <li>✓ Geofence created at service address</li>
            <li>✓ Aggregator connection verified</li>
            <li>✓ Mobile app permissions configured</li>
          </ul>
        </div>
      </div>
    </div>

    <ActionButtons actions={['Complete Onboarding']} />
  </div>
);

const CompletionScreen: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-8 text-white text-center">
      <CheckCircle className="h-16 w-16 mx-auto mb-4" />
      <h2 className="text-3xl font-bold mb-2">Client Onboarding Complete!</h2>
      <p className="text-lg text-green-100">
        Robert Martinez is ready to receive services
      </p>
    </div>

    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Onboarding Summary</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Client Record Created</h4>
              <p className="text-sm text-gray-600">ID: CLT-2024-1847</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Medicaid Verified</h4>
              <p className="text-sm text-gray-600">Active through 12/31/2024</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Care Plan Created</h4>
              <p className="text-sm text-gray-600">20 hrs/week personal care</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Coordinator Assigned</h4>
              <p className="text-sm text-gray-600">Sarah Kim</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Assessment Scheduled</h4>
              <p className="text-sm text-gray-600">RN visit on 11/12/2024</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">EVV Configured</h4>
              <p className="text-sm text-gray-600">Texas compliance ready</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Sarah Kim will contact Robert within 24 hours</li>
          <li>• Caregiver matching and scheduling in progress</li>
          <li>• RN will complete comprehensive assessment on 11/12</li>
          <li>• Services scheduled to start on 11/15/2024</li>
        </ul>
      </div>
    </div>
  </div>
);

// Scenario Definition

export const clientOnboardingScenario: Scenario = {
  id: 'client-onboarding',
  title: '📋 New Client Onboarding',
  description: 'Complete the full client intake and setup process from referral to service-ready',
  category: 'operations',
  role: 'admin',
  estimatedTime: 12,
  difficulty: 'beginner',
  tags: ['Onboarding', 'Medicaid', 'Care Planning', 'EVV Setup'],
  steps: [
    {
      id: 'new-referral',
      component: <NewReferralIntro />,
      narration: 'A new client referral arrived overnight...',
      actions: ['Begin Client Registration', 'Review Referral Details', 'Assign to Coordinator'],
      nextOnAction: 'Begin Client Registration',
    },
    {
      id: 'registration',
      component: <ClientRegistration />,
      narration: 'You create a new client record...',
      actions: ['Verify Medicaid Eligibility', 'Skip Verification', 'Save and Continue Later'],
      nextOnAction: 'Verify Medicaid Eligibility',
    },
    {
      id: 'medicaid-verification',
      component: <MedicaidVerification />,
      narration: 'The system verifies Medicaid eligibility...',
      actions: ['Create Initial Care Plan', 'Configure EVV Settings', 'Assign Coordinator'],
      nextOnAction: 'Create Initial Care Plan',
    },
    {
      id: 'care-plan',
      component: <CarePlanCreation />,
      narration: 'You create an initial care plan...',
      actions: ['Assign Care Coordinator', 'Schedule Assessment', 'Configure EVV'],
      nextOnAction: 'Assign Care Coordinator',
    },
    {
      id: 'coordinator-assignment',
      component: <CoordinatorAssignment />,
      narration: 'You assign a care coordinator...',
      actions: ['Schedule Assessment Visit', 'Configure EVV Requirements', 'Complete Onboarding'],
      nextOnAction: 'Configure EVV Requirements',
    },
    {
      id: 'evv-config',
      component: <EVVConfiguration />,
      narration: 'You configure EVV requirements...',
      actions: ['Complete Onboarding'],
    },
    {
      id: 'completion',
      component: <CompletionScreen />,
      narration: 'Onboarding complete!',
      actions: [],
    },
  ],
};
