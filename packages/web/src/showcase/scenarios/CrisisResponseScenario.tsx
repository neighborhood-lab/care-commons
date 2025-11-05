/**
 * Crisis Response: Client Fall Alert Scenario
 *
 * A time-sensitive scenario demonstrating emergency response protocols
 */

import React from 'react';
import { AlertTriangle, Phone, FileText, UserPlus, CheckCircle } from 'lucide-react';
import { Scenario } from '../types';
import { NarrationBox } from './components/NarrationBox';
import { ActionButtons } from './components/ActionButtons';

// Step Components

const AlertNotification: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="At 2:30 PM, you receive an urgent alert from your mobile app. Your caregiver Emily Rodriguez has reported that Margaret Thompson, age 82, has fallen at home."
      time="2:30 PM"
      role="Care Coordinator (Sarah Kim)"
    />

    <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-900 mb-2">🚨 URGENT ALERT</h3>
          <div className="space-y-1 text-red-800">
            <p><strong>Client:</strong> Margaret Thompson (82)</p>
            <p><strong>Incident:</strong> Fall at home</p>
            <p><strong>Reported by:</strong> Emily Rodriguez (Caregiver)</p>
            <p><strong>Time:</strong> 2:27 PM</p>
            <p><strong>Status:</strong> Client conscious, appears shaken</p>
          </div>
        </div>
      </div>
    </div>

    <ActionButtons actions={['View Incident Report', 'Call 911 Immediately', 'Contact Family First']} />
  </div>
);

const IncidentReportView: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="You open the incident report filed by Emily. She reports that Margaret slipped in the bathroom while Emily was helping her prepare lunch. Margaret did not lose consciousness but appears shaken."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Incident Report #IR-2024-089</h3>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Incident Details</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <p><strong>Time:</strong> 2:27 PM</p>
            <p><strong>Location:</strong> Client bathroom</p>
            <p><strong>Activity:</strong> Client was walking to kitchen, slipped on wet floor</p>
            <p><strong>Injuries observed:</strong> Small bruise on left hip, no bleeding</p>
            <p><strong>Client condition:</strong> Conscious, alert, able to stand with assistance</p>
            <p><strong>Action taken:</strong> Helped client to chair, applied ice pack, monitoring vitals</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Emily's Notes</h4>
          <div className="bg-blue-50 rounded-lg p-4 text-sm italic text-gray-700">
            "Margaret seems okay but frightened. She doesn't want to go to the hospital. Vitals are normal: BP 130/82, pulse 78. I'm staying with her and watching for any changes. She says her hip hurts but she can move it."
          </div>
        </div>
      </div>
    </div>

    <ActionButtons actions={['Contact Emergency Contact', 'Schedule Urgent RN Assessment', 'Continue Monitoring Only']} />
  </div>
);

const ContactFamily: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="Agency protocol requires immediate family notification for any fall incident. You pull up Margaret's emergency contact information and prepare to call her daughter Sarah."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Phone className="h-6 w-6 text-green-600" />
        <h3 className="text-lg font-bold text-gray-900">Emergency Contact</h3>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <p><strong>Name:</strong> Sarah Thompson (Daughter)</p>
        <p><strong>Relationship:</strong> Primary Emergency Contact</p>
        <p><strong>Phone:</strong> (512) 555-0147</p>
        <p><strong>Availability:</strong> 24/7</p>
        <p><strong>Notes:</strong> Medical POA, prefers text updates for non-emergencies</p>
      </div>

      <div className="mt-4 p-4 bg-green-50 rounded-lg">
        <p className="text-sm text-green-800">
          ✓ You call Sarah and inform her of the fall. She appreciates the quick notification and asks to be kept updated. She'll check in with her mother this evening.
        </p>
      </div>
    </div>

    <ActionButtons actions={['Schedule RN Assessment Visit', 'Update Care Plan', 'Document in System']} />
  </div>
);

const ScheduleRNAssessment: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="You coordinate an urgent RN assessment visit. Your agency policy requires a registered nurse to evaluate any client who has experienced a fall within 24 hours."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <UserPlus className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">RN Assessment Scheduled</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-2">Visit Details</h4>
          <div className="space-y-2 text-sm">
            <p><strong>RN:</strong> Jennifer Martinez, RN BSN</p>
            <p><strong>Scheduled:</strong> Today at 4:30 PM (2 hours from now)</p>
            <p><strong>Duration:</strong> 60 minutes</p>
            <p><strong>Purpose:</strong> Post-fall assessment, vitals check, injury evaluation</p>
            <p><strong>Status:</strong> ✓ Confirmed</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Assessment Checklist</h4>
          <ul className="space-y-1 text-sm">
            <li>✓ Vital signs monitoring</li>
            <li>✓ Injury assessment and documentation</li>
            <li>✓ Mobility and gait evaluation</li>
            <li>✓ Home safety assessment</li>
            <li>✓ Fall risk evaluation</li>
            <li>✓ Medication review</li>
          </ul>
        </div>
      </div>
    </div>

    <ActionButtons actions={['Update Care Plan with Fall Interventions', 'File Compliance Report', 'Notify Supervisor']} />
  </div>
);

const UpdateCarePlan: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="Based on this incident, you update Margaret's care plan to include fall prevention interventions. These changes will be reviewed by the RN during the assessment visit."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Care Plan Updates</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">⚠️ New Fall Risk Interventions</h4>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>• Install grab bars in bathroom (coordinate with family)</li>
            <li>• Remove bathroom throw rug (trip hazard)</li>
            <li>• Increase visit frequency: 2x daily check-ins for next 7 days</li>
            <li>• Mobility assistance: require walker use for all transfers</li>
            <li>• Physical therapy referral for gait training</li>
            <li>• Occupational therapy for home safety evaluation</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">✓ Documentation Complete</h4>
          <ul className="space-y-1 text-sm text-green-800">
            <li>✓ Incident report filed</li>
            <li>✓ Family notified</li>
            <li>✓ RN assessment scheduled</li>
            <li>✓ Care plan updated</li>
            <li>✓ Supervisor notified</li>
            <li>✓ 24-hour follow-up scheduled</li>
          </ul>
        </div>
      </div>
    </div>

    <ActionButtons actions={['Complete Scenario']} />
  </div>
);

const CompletionScreen: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-8 text-white text-center">
      <CheckCircle className="h-16 w-16 mx-auto mb-4" />
      <h2 className="text-3xl font-bold mb-2">Scenario Complete!</h2>
      <p className="text-lg text-green-100">
        You successfully managed the crisis response
      </p>
    </div>

    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">What You Demonstrated</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Quick Response</h4>
            <p className="text-sm text-gray-600">
              Immediately reviewed incident report and assessed client condition
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Family Communication</h4>
            <p className="text-sm text-gray-600">
              Promptly notified emergency contact per agency protocol
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Clinical Coordination</h4>
            <p className="text-sm text-gray-600">
              Arranged urgent RN assessment within required 24-hour timeframe
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Preventive Action</h4>
            <p className="text-sm text-gray-600">
              Updated care plan with fall prevention interventions
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Compliance Documentation</h4>
            <p className="text-sm text-gray-600">
              Properly documented all actions for regulatory compliance
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Scenario Definition

export const crisisResponseScenario: Scenario = {
  id: 'crisis-response-fall',
  title: '🚨 Crisis Response: Client Fall Alert',
  description: 'Respond to an urgent fall incident and coordinate emergency care',
  category: 'emergency',
  role: 'coordinator',
  estimatedTime: 8,
  difficulty: 'intermediate',
  tags: ['Emergency', 'Fall Response', 'Family Communication', 'RN Coordination'],
  steps: [
    {
      id: 'alert-received',
      component: <AlertNotification />,
      narration: 'At 2:30 PM, you receive an urgent alert...',
      actions: ['View Incident Report', 'Call 911 Immediately', 'Contact Family First'],
      nextOnAction: 'View Incident Report',
    },
    {
      id: 'incident-review',
      component: <IncidentReportView />,
      narration: "Emily's report indicates Margaret slipped in the bathroom...",
      actions: ['Contact Emergency Contact', 'Schedule Urgent RN Assessment', 'Continue Monitoring Only'],
      nextOnAction: 'Contact Emergency Contact',
    },
    {
      id: 'contact-family',
      component: <ContactFamily />,
      narration: 'Protocol requires immediate family notification...',
      actions: ['Schedule RN Assessment Visit', 'Update Care Plan', 'Document in System'],
      nextOnAction: 'Schedule RN Assessment Visit',
    },
    {
      id: 'schedule-rn',
      component: <ScheduleRNAssessment />,
      narration: 'You coordinate an urgent RN assessment visit...',
      actions: ['Update Care Plan with Fall Interventions', 'File Compliance Report', 'Notify Supervisor'],
      nextOnAction: 'Update Care Plan with Fall Interventions',
    },
    {
      id: 'update-care-plan',
      component: <UpdateCarePlan />,
      narration: 'You update the care plan with fall prevention interventions...',
      actions: ['Complete Scenario'],
    },
    {
      id: 'completion',
      component: <CompletionScreen />,
      narration: 'Scenario complete!',
      actions: [],
    },
  ],
};
