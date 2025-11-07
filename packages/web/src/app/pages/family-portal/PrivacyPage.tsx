import React from 'react';
import { Card } from '@/core/components';
import { Shield } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-lg text-gray-600">
          Your privacy and security are our top priorities
        </p>
      </div>

      <Card padding="lg">
        <div className="prose prose-blue max-w-none">
          <h2>Information We Collect</h2>
          <p>
            We collect information necessary to provide quality care coordination and communication
            between family members and care teams. This includes:
          </p>
          <ul>
            <li>Contact information (email, phone number)</li>
            <li>Care-related activities and updates</li>
            <li>Messages exchanged with care coordinators</li>
            <li>Visit schedules and completion status</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>
            Your information is used exclusively for:
          </p>
          <ul>
            <li>Providing updates about your loved one's care</li>
            <li>Facilitating communication with the care team</li>
            <li>Scheduling and coordinating care visits</li>
            <li>Ensuring regulatory compliance</li>
          </ul>

          <h2>Data Security</h2>
          <p>
            We implement industry-standard security measures including:
          </p>
          <ul>
            <li>Encrypted data transmission (SSL/TLS)</li>
            <li>Secure authentication</li>
            <li>Regular security audits</li>
            <li>HIPAA-compliant data handling</li>
          </ul>

          <h2>Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul>
            <li>Access your personal information</li>
            <li>Request corrections to your data</li>
            <li>Manage notification preferences</li>
            <li>Request account deletion</li>
          </ul>

          <h2>Contact Us</h2>
          <p>
            If you have questions about this privacy policy or your data, please contact your
            care coordinator or email us at privacy@carecommons.com
          </p>
        </div>
      </Card>

      <div className="text-center text-sm text-gray-500">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};
