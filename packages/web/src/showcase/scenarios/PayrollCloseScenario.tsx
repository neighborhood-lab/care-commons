/**
 * Monthly Payroll Close Scenario
 *
 * Walk through the end-of-month payroll closing process
 */

import React from 'react';
import { DollarSign, Clock, AlertTriangle, CheckCircle, FileText, Download } from 'lucide-react';
import { Scenario } from '../types';
import { NarrationBox } from './components/NarrationBox';
import { ActionButtons } from './components/ActionButtons';

// Step Components

const PayrollIntro: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="It's the last day of the month and time to close payroll for your 20 caregivers who completed 480 visits this month. You need to review time entries, approve overtime, and process payments."
      time="Last day of month, 2:00 PM"
      role="Administrator"
    />

    <div className="bg-purple-50 border-2 border-purple-500 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-purple-900 mb-2">💰 Month-End Payroll</h3>
          <div className="space-y-1 text-purple-800">
            <p><strong>Period:</strong> November 1-30, 2024</p>
            <p><strong>Caregivers:</strong> 20 active employees</p>
            <p><strong>Total Visits:</strong> 480 completed</p>
            <p><strong>Total Hours:</strong> 1,847.5 hours</p>
            <p><strong>Estimated Gross:</strong> $31,407.50</p>
            <p><strong>Compliance Rate:</strong> 99.2% EVV</p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
      <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Outstanding Items</h4>
      <ul className="space-y-1 text-sm text-yellow-800">
        <li>• 3 time entry exceptions pending review</li>
        <li>• 5 caregivers with overtime hours requiring approval</li>
        <li>• 4 visits with EVV compliance issues (0.8%)</li>
        <li>• 2 manual adjustments for PTO</li>
      </ul>
    </div>

    <ActionButtons actions={['Review Time Exceptions', 'View Payroll Summary', 'Export to QuickBooks']} />
  </div>
);

const ReviewExceptions: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="You review the 3 outstanding time entry exceptions that need approval before payroll can be finalized."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-orange-600" />
        <h3 className="text-lg font-bold text-gray-900">Time Entry Exceptions</h3>
      </div>

      <div className="space-y-4">
        {/* Exception 1 */}
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Emily Rodriguez - Nov 15</h4>
              <p className="text-sm text-gray-600">Visit to Margaret Thompson</p>
            </div>
            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
              Late Clock-Out
            </span>
          </div>
          <div className="text-sm space-y-1">
            <p><strong>Scheduled:</strong> 2:00 PM - 4:00 PM (2.0 hrs)</p>
            <p><strong>Actual:</strong> 2:03 PM - 4:47 PM (2.73 hrs)</p>
            <p><strong>Reason:</strong> Client fall incident required extended care</p>
            <p className="text-green-700">✓ Supervisor approved overtime</p>
          </div>
        </div>

        {/* Exception 2 */}
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Marcus Johnson - Nov 22</h4>
              <p className="text-sm text-gray-600">Visit to William Chen</p>
            </div>
            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
              GPS Exception
            </span>
          </div>
          <div className="text-sm space-y-1">
            <p><strong>Scheduled:</strong> 10:00 AM - 12:00 PM (2.0 hrs)</p>
            <p><strong>Actual:</strong> 10:01 AM - 12:02 PM (2.02 hrs)</p>
            <p><strong>Issue:</strong> GPS accuracy 175m (requires ≤100m for TX)</p>
            <p className="text-blue-700">ℹ️ VMUR submitted and approved by state</p>
          </div>
        </div>

        {/* Exception 3 */}
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Sarah Williams - Nov 28</h4>
              <p className="text-sm text-gray-600">Personal Time Off</p>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
              PTO Request
            </span>
          </div>
          <div className="text-sm space-y-1">
            <p><strong>PTO Hours:</strong> 8.0 hours</p>
            <p><strong>Remaining Balance:</strong> 24 hours</p>
            <p><strong>Rate:</strong> $17.00/hr (regular pay rate)</p>
            <p className="text-green-700">✓ Approved by HR</p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <p className="text-green-800 font-medium">
        ✓ All exceptions reviewed and approved. Ready to proceed with overtime approval.
      </p>
    </div>

    <ActionButtons actions={['Review Overtime Hours', 'Skip to Payroll Summary']} />
  </div>
);

const ApproveOvertime: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="Five caregivers worked overtime this month. You review each case to ensure it's properly documented and approved."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Overtime Approval</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 font-semibold">Caregiver</th>
              <th className="text-right p-3 font-semibold">Regular Hrs</th>
              <th className="text-right p-3 font-semibold">OT Hrs</th>
              <th className="text-right p-3 font-semibold">Rate</th>
              <th className="text-right p-3 font-semibold">OT Pay</th>
              <th className="text-left p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="p-3">Emily Rodriguez</td>
              <td className="text-right p-3">160.0</td>
              <td className="text-right p-3 font-bold text-orange-600">12.5</td>
              <td className="text-right p-3">$17.00</td>
              <td className="text-right p-3 font-bold">$318.75</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                  ✓ Approved
                </span>
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="p-3">Marcus Johnson</td>
              <td className="text-right p-3">160.0</td>
              <td className="text-right p-3 font-bold text-orange-600">8.0</td>
              <td className="text-right p-3">$16.50</td>
              <td className="text-right p-3 font-bold">$198.00</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                  ✓ Approved
                </span>
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="p-3">Jennifer Martinez</td>
              <td className="text-right p-3">160.0</td>
              <td className="text-right p-3 font-bold text-orange-600">6.5</td>
              <td className="text-right p-3">$18.00</td>
              <td className="text-right p-3 font-bold">$175.50</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                  ✓ Approved
                </span>
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="p-3">Lisa Chen</td>
              <td className="text-right p-3">160.0</td>
              <td className="text-right p-3 font-bold text-orange-600">5.0</td>
              <td className="text-right p-3">$17.50</td>
              <td className="text-right p-3 font-bold">$131.25</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                  ✓ Approved
                </span>
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="p-3">David Kim</td>
              <td className="text-right p-3">160.0</td>
              <td className="text-right p-3 font-bold text-orange-600">4.25</td>
              <td className="text-right p-3">$16.00</td>
              <td className="text-right p-3 font-bold">$102.00</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                  ✓ Approved
                </span>
              </td>
            </tr>
            <tr className="bg-gray-50 font-bold">
              <td className="p-3">TOTAL OVERTIME</td>
              <td className="text-right p-3">-</td>
              <td className="text-right p-3 text-orange-600">36.25</td>
              <td className="text-right p-3">-</td>
              <td className="text-right p-3 text-green-700">$925.50</td>
              <td className="p-3">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-semibold text-blue-900 mb-2">💡 Overtime Analysis</h4>
      <ul className="space-y-1 text-sm text-blue-800">
        <li>• All overtime properly documented with supervisor approval</li>
        <li>• Average OT per caregiver: 7.25 hours (within acceptable range)</li>
        <li>• OT represents 1.96% of total hours (well below 5% target)</li>
        <li>• No Fair Labor Standards Act (FLSA) violations detected</li>
      </ul>
    </div>

    <ActionButtons actions={['Verify EVV Compliance', 'Generate Payroll Report']} />
  </div>
);

const EVVCompliance: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="Before finalizing payroll, you verify that EVV compliance is at 100%. The state requires all six EVV elements for every billable visit."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="h-6 w-6 text-green-600" />
        <h3 className="text-lg font-bold text-gray-900">EVV Compliance Report</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-700 mb-1">99.2%</div>
          <div className="text-sm text-green-800">Overall Compliance Rate</div>
          <div className="text-xs text-green-600 mt-1">476 of 480 visits compliant</div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-orange-700 mb-1">4</div>
          <div className="text-sm text-orange-800">Visits with Exceptions</div>
          <div className="text-xs text-orange-600 mt-1">All have approved VMURs</div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Six-Element Verification</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm">1. Type of Service</span>
            <span className="text-green-700 font-bold">480/480 ✓</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm">2. Individual Receiving Service</span>
            <span className="text-green-700 font-bold">480/480 ✓</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm">3. Date of Service</span>
            <span className="text-green-700 font-bold">480/480 ✓</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm">4. Location of Service (GPS)</span>
            <span className="text-orange-700 font-bold">476/480 ⚠</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm">5. Time In/Time Out</span>
            <span className="text-green-700 font-bold">480/480 ✓</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm">6. Service Provider (Caregiver)</span>
            <span className="text-green-700 font-bold">480/480 ✓</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800 font-medium">
          ✓ All 4 GPS exceptions have state-approved VMURs on file and are eligible for payment
        </p>
      </div>
    </div>

    <ActionButtons actions={['Generate Final Payroll Report', 'Review Export Settings']} />
  </div>
);

const GenerateReport: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="You generate the final payroll report and prepare to export to your accounting system."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Download className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">Payroll Summary - November 2024</h3>
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-700 mb-1">20</div>
            <div className="text-sm text-purple-800">Active Caregivers</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-700 mb-1">1,847.5</div>
            <div className="text-sm text-blue-800">Total Hours</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700 mb-1">$31,407.50</div>
            <div className="text-sm text-green-800">Gross Payroll</div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Payroll Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span>Regular Hours (1,811.25 hrs @ avg $16.85/hr)</span>
              <span className="font-bold">$30,519.56</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span>Overtime Hours (36.25 hrs @ time-and-a-half)</span>
              <span className="font-bold">$925.50</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span>PTO Pay (8.0 hrs @ $17.00/hr)</span>
              <span className="font-bold">$136.00</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span>Bonuses & Incentives</span>
              <span className="font-bold">$0.00</span>
            </div>
            <div className="flex justify-between p-3 bg-purple-100 rounded font-bold border-t-2 border-purple-300">
              <span>TOTAL GROSS PAY</span>
              <span className="text-purple-700">$31,581.06</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📊 Export Options</h4>
          <div className="space-y-2 text-sm">
            <button className="w-full text-left px-3 py-2 bg-white hover:bg-blue-50 border border-blue-200 rounded flex items-center justify-between group">
              <span>QuickBooks Desktop (.IIF)</span>
              <Download className="h-4 w-4 text-blue-600 group-hover:translate-y-1 transition-transform" />
            </button>
            <button className="w-full text-left px-3 py-2 bg-white hover:bg-blue-50 border border-blue-200 rounded flex items-center justify-between group">
              <span>QuickBooks Online (Direct Sync)</span>
              <Download className="h-4 w-4 text-blue-600 group-hover:translate-y-1 transition-transform" />
            </button>
            <button className="w-full text-left px-3 py-2 bg-white hover:bg-blue-50 border border-blue-200 rounded flex items-center justify-between group">
              <span>ADP Payroll (.CSV)</span>
              <Download className="h-4 w-4 text-blue-600 group-hover:translate-y-1 transition-transform" />
            </button>
            <button className="w-full text-left px-3 py-2 bg-white hover:bg-blue-50 border border-blue-200 rounded flex items-center justify-between group">
              <span>Generic CSV Export</span>
              <Download className="h-4 w-4 text-blue-600 group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <ActionButtons actions={['Export to QuickBooks', 'Notify Caregivers', 'Complete Scenario']} />
  </div>
);

const CompletionScreen: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-8 text-white text-center">
      <CheckCircle className="h-16 w-16 mx-auto mb-4" />
      <h2 className="text-3xl font-bold mb-2">Payroll Closed Successfully!</h2>
      <p className="text-lg text-purple-100">
        Month-end payroll process complete
      </p>
    </div>

    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">What You Accomplished</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Exception Resolution</h4>
            <p className="text-sm text-gray-600">
              Reviewed and approved 3 time entry exceptions with proper documentation
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Overtime Management</h4>
            <p className="text-sm text-gray-600">
              Verified and approved 36.25 overtime hours across 5 caregivers
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">EVV Compliance Validation</h4>
            <p className="text-sm text-gray-600">
              Confirmed 99.2% compliance rate with all exceptions properly documented
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Payroll Report Generation</h4>
            <p className="text-sm text-gray-600">
              Generated final report and prepared export for accounting system
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Financial Accuracy</h4>
            <p className="text-sm text-gray-600">
              Processed $31,581.06 in gross payroll with zero errors
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h4 className="font-semibold text-purple-900 mb-2">📈 Key Metrics</h4>
        <div className="grid grid-cols-2 gap-3 text-sm text-purple-800">
          <div>
            <div className="font-bold">1.96%</div>
            <div>Overtime rate</div>
          </div>
          <div>
            <div className="font-bold">99.2%</div>
            <div>EVV compliance</div>
          </div>
          <div>
            <div className="font-bold">$1,579.05</div>
            <div>Avg pay per caregiver</div>
          </div>
          <div>
            <div className="font-bold">92.4 hrs</div>
            <div>Avg hours per caregiver</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Scenario Definition

export const payrollCloseScenario: Scenario = {
  id: 'monthly-payroll-close',
  title: '💰 Monthly Payroll Close',
  description: 'Process month-end payroll for 20 caregivers covering 480 visits',
  category: 'financial',
  role: 'admin',
  estimatedTime: 12,
  difficulty: 'intermediate',
  tags: ['Payroll', 'Finance', 'EVV', 'Compliance', 'Overtime'],
  steps: [
    {
      id: 'intro',
      component: <PayrollIntro />,
      narration: "It's the last day of the month and time to close payroll...",
      actions: ['Review Time Exceptions', 'View Payroll Summary', 'Export to QuickBooks'],
      nextOnAction: 'Review Time Exceptions',
    },
    {
      id: 'exceptions',
      component: <ReviewExceptions />,
      narration: 'Review the 3 outstanding time entry exceptions...',
      actions: ['Review Overtime Hours', 'Skip to Payroll Summary'],
      nextOnAction: 'Review Overtime Hours',
    },
    {
      id: 'overtime',
      component: <ApproveOvertime />,
      narration: 'Five caregivers worked overtime this month...',
      actions: ['Verify EVV Compliance', 'Generate Payroll Report'],
      nextOnAction: 'Verify EVV Compliance',
    },
    {
      id: 'evv-compliance',
      component: <EVVCompliance />,
      narration: 'Verify that EVV compliance is at 100%...',
      actions: ['Generate Final Payroll Report', 'Review Export Settings'],
      nextOnAction: 'Generate Final Payroll Report',
    },
    {
      id: 'generate-report',
      component: <GenerateReport />,
      narration: 'Generate the final payroll report and prepare export...',
      actions: ['Export to QuickBooks', 'Notify Caregivers', 'Complete Scenario'],
      nextOnAction: 'Complete Scenario',
    },
    {
      id: 'completion',
      component: <CompletionScreen />,
      narration: 'Payroll closed successfully!',
      actions: [],
    },
  ],
};
