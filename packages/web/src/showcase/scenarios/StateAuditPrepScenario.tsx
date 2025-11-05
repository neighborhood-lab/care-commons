/**
 * State Audit Preparation Scenario
 *
 * Prepare documentation for a Texas HHSC compliance audit
 */

import React from 'react';
import { Shield, FileText, CheckCircle, AlertTriangle, Download, Search } from 'lucide-react';
import { Scenario } from '../types';
import { NarrationBox } from './components/NarrationBox';
import { ActionButtons } from './components/ActionButtons';

// Step Components

const AuditNotification: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="Friday afternoon, you receive an email from Texas Health and Human Services Commission (HHSC) requesting a compliance audit for Q4. You have 72 hours to prepare comprehensive documentation."
      time="Friday, 3:30 PM"
      role="Administrator"
    />

    <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-900 mb-2">🚨 State Audit Request</h3>
          <div className="space-y-1 text-red-800">
            <p><strong>Agency:</strong> Texas Health and Human Services Commission</p>
            <p><strong>Audit Period:</strong> Q4 2024 (Oct 1 - Dec 31)</p>
            <p><strong>Deadline:</strong> Monday 11:59 PM (72 hours)</p>
            <p><strong>Type:</strong> EVV Compliance & Provider Credentialing</p>
            <p><strong>Focus Areas:</strong> Six-element EVV, VMUR procedures, credential verification</p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
      <h4 className="font-semibold text-yellow-900 mb-2">📋 Required Documentation</h4>
      <ul className="space-y-1 text-sm text-yellow-800">
        <li>□ EVV compliance report (must be 100% for Q4)</li>
        <li>□ All caregiver credentials and certifications</li>
        <li>□ Client service authorizations with valid dates</li>
        <li>□ Complete visit documentation for sample clients</li>
        <li>□ VMUR logs with approval chain</li>
        <li>□ HIPAA audit trail for data access</li>
        <li>□ Background check verification for all staff</li>
        <li>□ Training records and competency assessments</li>
      </ul>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-semibold text-blue-900 mb-2">⏱️ Preparation Timeline</h4>
      <div className="space-y-2 text-sm text-blue-800">
        <div className="flex justify-between">
          <span>Phase 1: EVV Compliance Report</span>
          <span className="font-semibold">30 mins</span>
        </div>
        <div className="flex justify-between">
          <span>Phase 2: Credential Verification</span>
          <span className="font-semibold">45 mins</span>
        </div>
        <div className="flex justify-between">
          <span>Phase 3: Service Authorization Audit</span>
          <span className="font-semibold">30 mins</span>
        </div>
        <div className="flex justify-between">
          <span>Phase 4: Documentation Package</span>
          <span className="font-semibold">45 mins</span>
        </div>
        <div className="flex justify-between border-t border-blue-300 pt-2 font-bold">
          <span>Total Estimated Time</span>
          <span>2.5 hours</span>
        </div>
      </div>
    </div>

    <ActionButtons actions={['Start EVV Compliance Report', 'Review Audit Requirements', 'Contact Legal Team']} />
  </div>
);

const EVVComplianceReport: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="You pull the Q4 EVV compliance report. Texas requires 100% compliance with all six EVV elements for every billable visit."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="h-6 w-6 text-green-600" />
        <h3 className="text-lg font-bold text-gray-900">Q4 2024 EVV Compliance Report</h3>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-700 mb-1">100.0%</div>
          <div className="text-sm text-green-800">EVV Compliance Rate</div>
          <div className="text-xs text-green-600 mt-1">1,437 of 1,437 visits</div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-700 mb-1">1,437</div>
          <div className="text-sm text-blue-800">Total Billable Visits</div>
          <div className="text-xs text-blue-600 mt-1">October - December</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-purple-700 mb-1">18</div>
          <div className="text-sm text-purple-800">VMURs Submitted</div>
          <div className="text-xs text-purple-600 mt-1">All approved by HHSC</div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <h4 className="font-semibold text-gray-900">Six-Element Breakdown</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">1. Type of Service</div>
              <div className="text-xs text-gray-500">Personal Care, Homemaker, etc.</div>
            </div>
            <span className="text-green-700 font-bold">1,437/1,437 ✓</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">2. Individual Receiving Service</div>
              <div className="text-xs text-gray-500">Client Medicaid ID verification</div>
            </div>
            <span className="text-green-700 font-bold">1,437/1,437 ✓</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">3. Date of Service</div>
              <div className="text-xs text-gray-500">YYYY-MM-DD format</div>
            </div>
            <span className="text-green-700 font-bold">1,437/1,437 ✓</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">4. Location of Service</div>
              <div className="text-xs text-gray-500">GPS coordinates ≤100m accuracy</div>
            </div>
            <span className="text-green-700 font-bold">1,437/1,437 ✓</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">5. Time In/Time Out</div>
              <div className="text-xs text-gray-500">Clock in/out timestamps</div>
            </div>
            <span className="text-green-700 font-bold">1,437/1,437 ✓</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">6. Service Provider</div>
              <div className="text-xs text-gray-500">Caregiver NPI/employee ID</div>
            </div>
            <span className="text-green-700 font-bold">1,437/1,437 ✓</span>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-3">VMUR (Visit Modification/Update Request) Summary</h4>
        <div className="space-y-2 text-sm text-purple-800">
          <div className="flex justify-between">
            <span>Total VMURs submitted to HHSC:</span>
            <span className="font-bold">18</span>
          </div>
          <div className="flex justify-between">
            <span>VMURs approved:</span>
            <span className="font-bold text-green-700">18 (100%)</span>
          </div>
          <div className="flex justify-between">
            <span>VMURs pending:</span>
            <span className="font-bold">0</span>
          </div>
          <div className="flex justify-between">
            <span>VMURs denied:</span>
            <span className="font-bold">0</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-purple-300">
            <span>Average approval time:</span>
            <span className="font-bold">2.3 days</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800 font-medium flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          ✓ EVV compliance report meets all Texas HHSC requirements for Q4 audit
        </p>
      </div>
    </div>

    <ActionButtons actions={['Verify Caregiver Credentials', 'Export Compliance Report']} />
  </div>
);

const CredentialVerification: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="You audit all caregiver credentials to ensure certifications, background checks, and training records are current and properly documented."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Caregiver Credential Audit</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700 mb-1">20/20</div>
          <div className="text-sm text-green-800">Active Caregivers</div>
          <div className="text-xs text-green-600 mt-1">All credentials current</div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700 mb-1">100%</div>
          <div className="text-sm text-blue-800">Compliance Rate</div>
          <div className="text-xs text-blue-600 mt-1">No expired credentials</div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <h4 className="font-semibold text-gray-900">Credential Checklist</h4>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 font-semibold">Requirement</th>
                <th className="text-center p-3 font-semibold">Compliant</th>
                <th className="text-center p-3 font-semibold">Expiring Soon</th>
                <th className="text-center p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="p-3">Background Check (FBI + State)</td>
                <td className="text-center p-3 font-bold text-green-700">20/20</td>
                <td className="text-center p-3">0</td>
                <td className="text-center p-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    ✓ Pass
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3">Texas Employee Misconduct Registry</td>
                <td className="text-center p-3 font-bold text-green-700">20/20</td>
                <td className="text-center p-3">0</td>
                <td className="text-center p-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    ✓ Clear
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3">TB Test (Annual)</td>
                <td className="text-center p-3 font-bold text-green-700">20/20</td>
                <td className="text-center p-3 text-yellow-700">3</td>
                <td className="text-center p-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    ✓ Current
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3">CPR/First Aid Certification</td>
                <td className="text-center p-3 font-bold text-green-700">20/20</td>
                <td className="text-center p-3 text-yellow-700">2</td>
                <td className="text-center p-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    ✓ Valid
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3">HIPAA Training (Annual)</td>
                <td className="text-center p-3 font-bold text-green-700">20/20</td>
                <td className="text-center p-3">0</td>
                <td className="text-center p-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    ✓ Complete
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3">Infection Control Training</td>
                <td className="text-center p-3 font-bold text-green-700">20/20</td>
                <td className="text-center p-3">0</td>
                <td className="text-center p-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    ✓ Complete
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3">Orientation & Competency Check</td>
                <td className="text-center p-3 font-bold text-green-700">20/20</td>
                <td className="text-center p-3">0</td>
                <td className="text-center p-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    ✓ Pass
                  </span>
                </td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className="p-3">TOTAL COMPLIANCE</td>
                <td className="text-center p-3 text-green-700">140/140</td>
                <td className="text-center p-3 text-yellow-700">5</td>
                <td className="text-center p-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    ✓ 100%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Expiration Alerts (Next 60 Days)
        </h4>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li>• 3 caregivers - TB test expires in 45-60 days (renewal scheduled)</li>
          <li>• 2 caregivers - CPR certification expires in 30-45 days (renewal scheduled)</li>
          <li>• All renewals scheduled - no compliance risk</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800 font-medium flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          ✓ All caregiver credentials verified and compliant for audit period
        </p>
      </div>
    </div>

    <ActionButtons actions={['Audit Service Authorizations', 'Generate Credential Report']} />
  </div>
);

const ServiceAuthorizationAudit: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="You verify that all clients have valid service authorizations for the entire audit period with no gaps in coverage."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">Service Authorization Verification</h3>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-700 mb-1">35</div>
          <div className="text-sm text-purple-800">Active Clients (Q4)</div>
          <div className="text-xs text-purple-600 mt-1">All authorizations valid</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700 mb-1">100%</div>
          <div className="text-sm text-green-800">Authorization Coverage</div>
          <div className="text-xs text-green-600 mt-1">No gaps detected</div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700 mb-1">1,437</div>
          <div className="text-sm text-blue-800">Authorized Visits</div>
          <div className="text-xs text-blue-600 mt-1">All within limits</div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <h4 className="font-semibold text-gray-900">Authorization Compliance Checks</h4>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">Valid authorization for audit period</div>
              <div className="text-xs text-gray-500">Oct 1 - Dec 31, 2024</div>
            </div>
            <span className="text-green-700 font-bold">35/35 ✓</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">Service hours within approved limits</div>
              <div className="text-xs text-gray-500">No overages without amendments</div>
            </div>
            <span className="text-green-700 font-bold">35/35 ✓</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">Service codes match authorization</div>
              <div className="text-xs text-gray-500">Personal Care, Homemaker, etc.</div>
            </div>
            <span className="text-green-700 font-bold">1,437/1,437 ✓</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">Authorization renewals documented</div>
              <div className="text-xs text-gray-500">Annual reassessments completed</div>
            </div>
            <span className="text-green-700 font-bold">12/12 ✓</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">Physician orders on file</div>
              <div className="text-xs text-gray-500">Required for all service changes</div>
            </div>
            <span className="text-green-700 font-bold">35/35 ✓</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">Sample Client Authorization Review</h4>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold">Margaret Thompson</div>
                <div className="text-xs text-gray-600">Medicaid ID: TX-4492837461</div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                ✓ Valid
              </span>
            </div>
            <div className="text-sm space-y-1 text-gray-700">
              <div className="flex justify-between">
                <span>Authorization Period:</span>
                <span className="font-semibold">07/01/24 - 06/30/25</span>
              </div>
              <div className="flex justify-between">
                <span>Approved Hours (weekly):</span>
                <span className="font-semibold">20 hrs</span>
              </div>
              <div className="flex justify-between">
                <span>Q4 Actual (weekly avg):</span>
                <span className="font-semibold">18.5 hrs</span>
              </div>
              <div className="flex justify-between">
                <span>Service Type:</span>
                <span className="font-semibold">Personal Care</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold">William Chen</div>
                <div className="text-xs text-gray-600">Medicaid ID: TX-7738291046</div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                ✓ Valid
              </span>
            </div>
            <div className="text-sm space-y-1 text-gray-700">
              <div className="flex justify-between">
                <span>Authorization Period:</span>
                <span className="font-semibold">09/15/24 - 09/14/25</span>
              </div>
              <div className="flex justify-between">
                <span>Approved Hours (weekly):</span>
                <span className="font-semibold">30 hrs</span>
              </div>
              <div className="flex justify-between">
                <span>Q4 Actual (weekly avg):</span>
                <span className="font-semibold">28.2 hrs</span>
              </div>
              <div className="flex justify-between">
                <span>Service Type:</span>
                <span className="font-semibold">Personal Care + Homemaker</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800 font-medium flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          ✓ All service authorizations verified - no gaps or overages detected
        </p>
      </div>
    </div>

    <ActionButtons actions={['Prepare Final Documentation Package', 'Review Audit Trail']} />
  </div>
);

const DocumentationPackage: React.FC = () => (
  <div className="space-y-6">
    <NarrationBox
      text="You compile the comprehensive documentation package for submission to Texas HHSC, including all reports, audit trails, and supporting evidence."
    />

    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Download className="h-6 w-6 text-green-600" />
        <h3 className="text-lg font-bold text-gray-900">Audit Documentation Package</h3>
      </div>

      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
          <h4 className="font-semibold text-gray-900 mb-3">📦 Package Contents</h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-sm">EVV_Compliance_Q4_2024.pdf</div>
                  <div className="text-xs text-gray-500">100% compliance - 1,437 visits verified</div>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-sm">Caregiver_Credentials_Audit.xlsx</div>
                  <div className="text-xs text-gray-500">20 caregivers - all credentials current</div>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium text-sm">Service_Authorizations_Q4.pdf</div>
                  <div className="text-xs text-gray-500">35 clients - 100% valid coverage</div>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-medium text-sm">VMUR_Log_Q4_2024.csv</div>
                  <div className="text-xs text-gray-500">18 VMURs - all HHSC approved</div>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-indigo-600" />
                <div>
                  <div className="font-medium text-sm">HIPAA_Audit_Trail_Q4.pdf</div>
                  <div className="text-xs text-gray-500">Complete access logs with timestamps</div>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-sm">Background_Checks_Verification.pdf</div>
                  <div className="text-xs text-gray-500">FBI + State + EMR clearance for all staff</div>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-sm">Training_Records_Q4.xlsx</div>
                  <div className="text-xs text-gray-500">HIPAA, infection control, competency checks</div>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-sm">Sample_Visit_Documentation.pdf</div>
                  <div className="text-xs text-gray-500">10 randomly selected complete visit records</div>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium text-sm">Agency_Policies_Procedures.pdf</div>
                  <div className="text-xs text-gray-500">EVV policy, VMUR workflow, compliance protocols</div>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium text-sm">Executive_Summary.pdf</div>
                  <div className="text-xs text-gray-500">Cover letter with key findings summary</div>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-3">✓ Audit Readiness Summary</h4>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>EVV Compliance: 100%</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Credential Compliance: 100%</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Service Auth Coverage: 100%</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>VMUR Approval Rate: 100%</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Background Checks: Current</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Training Records: Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>HIPAA Audit Trail: Available</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Documentation: Comprehensive</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📤 Submission Details</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p><strong>Portal:</strong> Texas HHSC Provider Portal</p>
            <p><strong>Deadline:</strong> Monday 11:59 PM (48 hours remaining)</p>
            <p><strong>Package Size:</strong> 42.7 MB (compressed)</p>
            <p><strong>Format:</strong> Secure encrypted ZIP file</p>
            <p><strong>Confirmation:</strong> Email receipt with tracking number</p>
          </div>
        </div>
      </div>
    </div>

    <ActionButtons actions={['Submit to HHSC Portal', 'Preview Documentation', 'Complete Scenario']} />
  </div>
);

const CompletionScreen: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-8 text-white text-center">
      <CheckCircle className="h-16 w-16 mx-auto mb-4" />
      <h2 className="text-3xl font-bold mb-2">Audit Documentation Complete!</h2>
      <p className="text-lg text-green-100">
        Ready for Texas HHSC submission
      </p>
    </div>

    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">What You Accomplished</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">EVV Compliance Verification</h4>
            <p className="text-sm text-gray-600">
              Confirmed 100% EVV compliance across 1,437 visits for Q4 2024
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Credential Audit</h4>
            <p className="text-sm text-gray-600">
              Verified all 20 caregiver credentials with 100% compliance across 7 requirements
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Service Authorization Review</h4>
            <p className="text-sm text-gray-600">
              Validated 35 client authorizations with no gaps or overages
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Comprehensive Documentation</h4>
            <p className="text-sm text-gray-600">
              Compiled 10-document package with complete audit trail and supporting evidence
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Regulatory Compliance</h4>
            <p className="text-sm text-gray-600">
              Demonstrated full compliance with Texas HHSC requirements and audit readiness
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h4 className="font-semibold text-purple-900 mb-2">📊 Audit Preparation Metrics</h4>
        <div className="grid grid-cols-2 gap-3 text-sm text-purple-800">
          <div>
            <div className="font-bold">2.5 hrs</div>
            <div>Time to prepare</div>
          </div>
          <div>
            <div className="font-bold">10 docs</div>
            <div>In final package</div>
          </div>
          <div>
            <div className="font-bold">100%</div>
            <div>Compliance rate</div>
          </div>
          <div>
            <div className="font-bold">48 hrs</div>
            <div>Before deadline</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Scenario Definition

export const stateAuditPrepScenario: Scenario = {
  id: 'state-audit-preparation',
  title: '🛡️ State Audit Preparation',
  description: 'Prepare comprehensive documentation for Texas HHSC compliance audit',
  category: 'compliance',
  role: 'admin',
  estimatedTime: 15,
  difficulty: 'advanced',
  tags: ['Compliance', 'Audit', 'EVV', 'Credentials', 'HHSC', 'Texas'],
  steps: [
    {
      id: 'notification',
      component: <AuditNotification />,
      narration: 'You receive an audit request from Texas HHSC...',
      actions: ['Start EVV Compliance Report', 'Review Audit Requirements', 'Contact Legal Team'],
      nextOnAction: 'Start EVV Compliance Report',
    },
    {
      id: 'evv-report',
      component: <EVVComplianceReport />,
      narration: 'Pull the Q4 EVV compliance report...',
      actions: ['Verify Caregiver Credentials', 'Export Compliance Report'],
      nextOnAction: 'Verify Caregiver Credentials',
    },
    {
      id: 'credentials',
      component: <CredentialVerification />,
      narration: 'Audit all caregiver credentials...',
      actions: ['Audit Service Authorizations', 'Generate Credential Report'],
      nextOnAction: 'Audit Service Authorizations',
    },
    {
      id: 'authorizations',
      component: <ServiceAuthorizationAudit />,
      narration: 'Verify all service authorizations...',
      actions: ['Prepare Final Documentation Package', 'Review Audit Trail'],
      nextOnAction: 'Prepare Final Documentation Package',
    },
    {
      id: 'documentation',
      component: <DocumentationPackage />,
      narration: 'Compile the comprehensive documentation package...',
      actions: ['Submit to HHSC Portal', 'Preview Documentation', 'Complete Scenario'],
      nextOnAction: 'Complete Scenario',
    },
    {
      id: 'completion',
      component: <CompletionScreen />,
      narration: 'Audit documentation complete!',
      actions: [],
    },
  ],
};
