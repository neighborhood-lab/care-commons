/**
 * Mobile Demo Page
 * 
 * Showcases the Care Commons mobile app for caregivers.
 * Displays the simulated mobile interface with feature overview.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import { 
  Smartphone, 
  MapPin, 
  Clock, 
  Camera, 
  WifiOff,
  Shield,
  Activity,
  Bell,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Calendar,
  CheckSquare,
  User,
  Home,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export const MobileDemoPage: React.FC = () => {
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

            {/* Right Column - Mobile Preview */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              {/* Simulated Phone Frame */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Mobile App Preview</h3>
                <p className="text-sm text-gray-500 mt-1">iPhone 14 Pro</p>
              </div>

              <div 
                className="relative mx-auto bg-black rounded-[3rem] shadow-2xl overflow-hidden"
                style={{ width: '393px', height: '852px', padding: '12px' }}
              >
                {/* Device Chrome - Status Bar */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-transparent z-50 flex items-center justify-between px-6 text-white text-xs">
                  <span>9:41</span>
                  <div className="w-24 h-6 bg-black rounded-full" />
                  <span>100%</span>
                </div>

                {/* Screen Content */}
                <div className="relative w-full h-full bg-gray-50 rounded-[2.5rem] overflow-hidden">
                  {/* App Header */}
                  <div className="bg-white border-b border-gray-200 px-4 py-3 pt-12">
                    <h1 className="text-lg font-semibold text-gray-900 text-center">Home</h1>
                  </div>

                  {/* App Content */}
                  <div className="p-4 space-y-4 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
                    {/* Welcome Section */}
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
                      <h2 className="text-2xl font-bold mb-2">Welcome, Sarah!</h2>
                      <p className="text-purple-100 text-sm">Tuesday, November 5, 2025</p>
                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4" />
                        <span>You're doing great this week!</span>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                        <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-xl font-bold text-gray-900">4</div>
                        <div className="text-xs text-gray-600">Today</div>
                      </div>
                      <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                        <div className="bg-purple-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">
                          <CheckSquare className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-xl font-bold text-gray-900">12</div>
                        <div className="text-xs text-gray-600">Tasks</div>
                      </div>
                      <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                        <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-xl font-bold text-gray-900">28</div>
                        <div className="text-xs text-gray-600">Hours</div>
                      </div>
                    </div>

                    {/* Alert */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-900">
                          Complete medication training by end of week
                        </p>
                      </div>
                    </div>

                    {/* Next Visit */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Next Visit</h3>
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm">Dorothy Chen</h4>
                          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">
                            Upcoming
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>2:00 PM - 3:00 PM</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>123 Main St, Austin, TX</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Navigation */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2">
                    <div className="flex justify-around items-center">
                      <div className="flex flex-col items-center gap-1 px-4 py-2 text-purple-600">
                        <Home className="h-5 w-5" />
                        <span className="text-xs font-medium">Home</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500">
                        <Calendar className="h-5 w-5" />
                        <span className="text-xs font-medium">Visits</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500">
                        <CheckSquare className="h-5 w-5" />
                        <span className="text-xs font-medium">Tasks</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500">
                        <User className="h-5 w-5" />
                        <span className="text-xs font-medium">Profile</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Device Chrome - Home Indicator */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-32 h-1 bg-white rounded-full opacity-50" />
                </div>
              </div>

              <div className="text-center mt-4 text-xs text-gray-500">
                <p>Static preview of the caregiver mobile app</p>
              </div>

              {/* CTA to Interactive Demo */}
              <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Bell className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Try the Interactive Demo
                    </h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Experience the full mobile app with navigation, forms, and interactive features.
                    </p>
                    <Link
                      to="/mobile"
                      className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                      Open Mobile Demo
                      <ExternalLink className="h-4 w-4" />
                    </Link>
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
