/**
 * Mobile Demo Page - Web Demo
 * 
 * Showcases the Care Commons mobile app for caregivers within the main web demo.
 * Accessible to coordinators and admins to understand mobile capabilities.
 */

import React, { useState } from 'react';
import { MobileSimulator } from '@care-commons/shared-components';
import { 
  Smartphone, 
  MapPin, 
  Clock, 
  Camera, 
  WifiOff,
  Shield,
  Activity,
  CheckCircle,
  Info,
} from 'lucide-react';

export const MobileDemoPage: React.FC = () => {
  const [mobileServerUrl] = useState('http://localhost:8081');

  const features = [
    {
      icon: Clock,
      title: 'EVV Clock In/Out',
      description: 'GPS-verified time tracking with state-specific compliance',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: WifiOff,
      title: 'Offline-First',
      description: 'Works without internet. Auto-syncs when connection returns.',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: MapPin,
      title: 'Geofencing',
      description: 'Automatic location verification with state tolerances',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      icon: Camera,
      title: 'Photo Verification',
      description: 'Client signature capture and photo documentation',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      icon: Shield,
      title: 'HIPAA Compliant',
      description: 'Encrypted data storage with biometric app lock',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      icon: Activity,
      title: 'Real-Time Sync',
      description: 'Optimistic updates with conflict resolution',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-2">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Caregiver Mobile App
            </h1>
            <p className="text-gray-600 text-sm mt-0.5">
              Offline-first EVV compliance with real-time sync
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-600">React Native</div>
            <div className="text-xs text-gray-600 mt-0.5">Cross-platform</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-lg font-bold text-green-600">Expo SDK 54</div>
            <div className="text-xs text-gray-600 mt-0.5">Latest stable</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-600">WatermelonDB</div>
            <div className="text-xs text-gray-600 mt-0.5">Offline storage</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-lg font-bold text-orange-600">50+ States</div>
            <div className="text-xs text-gray-600 mt-0.5">EVV compliant</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Features & Info */}
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Mobile App for Field Caregivers
                  </h3>
                  <p className="text-sm text-gray-700">
                    This is the actual React Native mobile app running in your browser via Expo Web.
                    Caregivers use this on iOS and Android devices for clock in/out, visit documentation,
                    and EVV compliance.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Key Features
              </h2>
              <div className="grid gap-3">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`${feature.bg} rounded-lg p-2`}>
                          <Icon className={`h-5 w-5 ${feature.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                Technology Stack
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="font-medium text-gray-900 mb-1">Frontend</div>
                  <ul className="space-y-0.5 text-gray-600">
                    <li>• React Native 0.81</li>
                    <li>• Expo SDK 54</li>
                    <li>• React Navigation 7</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">Data Layer</div>
                  <ul className="space-y-0.5 text-gray-600">
                    <li>• WatermelonDB</li>
                    <li>• React Query</li>
                    <li>• Zustand</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">Device APIs</div>
                  <ul className="space-y-0.5 text-gray-600">
                    <li>• Expo Location</li>
                    <li>• Expo Camera</li>
                    <li>• Biometric Auth</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">Compliance</div>
                  <ul className="space-y-0.5 text-gray-600">
                    <li>• 21st Century Cures</li>
                    <li>• State EVV Rules</li>
                    <li>• HIPAA Security</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Available Screens */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Available Screens
              </h2>
              <div className="space-y-2">
                {[
                  { name: 'Today\'s Visits', desc: 'Dashboard with upcoming visits and alerts' },
                  { name: 'Clock In/Out', desc: 'GPS-verified EVV time tracking' },
                  { name: 'Visit Documentation', desc: 'Notes, tasks, and client signatures' },
                  { name: 'Schedule', desc: 'Full schedule with navigation' },
                ].map((screen) => (
                  <div key={screen.name} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {screen.name}
                        </h3>
                        <p className="text-xs text-gray-600">{screen.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Mobile Simulator */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <MobileSimulator
              src={mobileServerUrl}
              title="Live Mobile App"
              device="iphone"
              showChrome={true}
            />

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    Development Note
                  </h4>
                  <p className="text-xs text-gray-700 mb-2">
                    To see the live mobile app, start the mobile dev server:
                  </p>
                  <code className="block bg-gray-800 text-white px-2 py-1 rounded text-xs font-mono">
                    cd packages/mobile && npm run web
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
