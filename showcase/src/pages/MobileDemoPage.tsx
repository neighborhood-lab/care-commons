/**
 * Mobile Demo Page
 * 
 * Showcases the Care Commons mobile app for caregivers.
 * Embeds the actual React Native mobile app running via Expo Web.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MobileSimulator } from '@care-commons/shared-components';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import { 
  Smartphone, 
  MapPin, 
  Clock, 
  Camera, 
  Wifi, 
  WifiOff,
  Shield,
  Activity,
  Bell,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';

export const MobileDemoPage: React.FC = () => {
  const [mobileServerUrl, setMobileServerUrl] = useState('http://localhost:8081');
  const [isCustomUrl, setIsCustomUrl] = useState(false);

  const features = [
    {
      icon: Clock,
      title: 'EVV Clock In/Out',
      description: 'GPS-verified time tracking with state-specific compliance (TX, FL, etc.)',
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
      description: 'Automatic location verification with configurable tolerances',
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

  const screens = [
    {
      name: 'Today\'s Visits',
      description: 'Caregiver dashboard with upcoming visits and alerts',
      path: '/dashboard',
    },
    {
      name: 'Clock In/Out',
      description: 'GPS-verified EVV time tracking',
      path: '/clock-in',
    },
    {
      name: 'Visit Schedule',
      description: 'Full schedule with navigation and client details',
      path: '/visits',
    },
  ];

  return (
    <ShowcaseLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link 
              to="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-3">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Caregiver Mobile App
                </h1>
                <p className="text-gray-600 mt-1">
                  Offline-first EVV compliance with real-time sync
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">React Native</div>
                <div className="text-sm text-gray-600 mt-1">Cross-platform</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">Expo SDK 54</div>
                <div className="text-sm text-gray-600 mt-1">Latest stable</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">WatermelonDB</div>
                <div className="text-sm text-gray-600 mt-1">Offline storage</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">50+ States</div>
                <div className="text-sm text-gray-600 mt-1">EVV compliant</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column - Features & Info */}
            <div className="space-y-8">
              {/* Features Grid */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Key Features
                </h2>
                <div className="grid gap-4">
                  {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={feature.title}
                        className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`${feature.bg} rounded-lg p-3`}>
                            <Icon className={`h-6 w-6 ${feature.color}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {feature.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Screens */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Available Screens
                </h2>
                <div className="space-y-3">
                  {screens.map((screen) => (
                    <div
                      key={screen.name}
                      className="bg-white rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {screen.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {screen.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connection Settings */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-blue-600" />
                  Connection Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Server URL
                    </label>
                    {isCustomUrl ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={mobileServerUrl}
                          onChange={(e) => setMobileServerUrl(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="http://localhost:8081"
                        />
                        <button
                          onClick={() => setIsCustomUrl(false)}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                        <code className="text-sm text-gray-700">
                          {mobileServerUrl}
                        </code>
                        <button
                          onClick={() => setIsCustomUrl(true)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>To start the mobile dev server:</strong>
                    </p>
                    <code className="block bg-gray-800 text-white px-3 py-2 rounded text-xs font-mono">
                      cd packages/mobile && npm run web
                    </code>
                  </div>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Technology Stack
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">Frontend</div>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      <li>• React Native 0.81</li>
                      <li>• React 19</li>
                      <li>• Expo SDK 54</li>
                      <li>• React Navigation 7</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Data Layer</div>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      <li>• WatermelonDB</li>
                      <li>• React Query</li>
                      <li>• Zustand</li>
                      <li>• Zod validation</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Device APIs</div>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      <li>• Expo Location</li>
                      <li>• Expo Camera</li>
                      <li>• Expo SecureStore</li>
                      <li>• Biometric Auth</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Observability</div>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      <li>• Sentry (errors)</li>
                      <li>• Analytics events</li>
                      <li>• Performance traces</li>
                      <li>• Crash reporting</li>
                    </ul>
                  </div>
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

              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Bell className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Interactive Demo
                    </h4>
                    <p className="text-sm text-gray-700">
                      This is the actual mobile app running in your browser. 
                      Any changes you make to the mobile code will appear here instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
};
