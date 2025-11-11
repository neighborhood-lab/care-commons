/**
 * State Demo Page - Showcases Multi-State Support
 */

import { useState } from 'react';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import { StateSelector } from '../components/StateSelector';
import { MapPin, Clock, Shield, FileCheck } from 'lucide-react';

interface StateInfo {
  code: string;
  name: string;
  evvAggregator: string;
  strictness: 'STRICT' | 'MODERATE' | 'LENIENT';
  geofenceRadius: number;
  gracePeriod: number;
  backgroundCheckCycle: string;
}

export function StateDemoPage() {
  const [selectedState, setSelectedState] = useState<StateInfo | null>(null);

  return (
    <ShowcaseLayout
      title="Multi-State Compliance Demo"
      description="See how Care Commons adapts to each state's unique regulations, EVV requirements, and compliance rules."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* State Selector */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a State</h2>
          <StateSelector
            currentState="TX"
            onStateChange={(state) => setSelectedState(state)}
          />
        </div>

        {/* State-Specific Features */}
        {selectedState && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedState.name}-Specific Features
              </h2>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Geofencing</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedState.name} requires {selectedState.geofenceRadius}m radius verification for EVV compliance.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(selectedState.geofenceRadius / 200) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {selectedState.geofenceRadius}m
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <Clock className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Grace Period</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Caregivers can clock in up to {selectedState.gracePeriod} minutes early or late.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium">
                      -{selectedState.gracePeriod} min
                    </span>
                    <span className="text-gray-500">to</span>
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium">
                      +{selectedState.gracePeriod} min
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Background Checks</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedState.name} requires background check renewal every {selectedState.backgroundCheckCycle}.
                  </p>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded font-medium ${
                      selectedState.backgroundCheckCycle === '2 years'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {selectedState.backgroundCheckCycle} cycle
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileCheck className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">EVV Aggregator</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedState.evvAggregator}
                  </p>
                  <div className="text-xs text-gray-500">
                    {selectedState.evvAggregator.includes('Mandatory') && (
                      <span className="px-2 py-1 bg-red-50 text-red-700 rounded font-medium">
                        State Mandated
                      </span>
                    )}
                    {selectedState.evvAggregator.includes('Free') && (
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium">
                        Free to Providers
                      </span>
                    )}
                    {selectedState.evvAggregator.includes('Multi') && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">
                        Multiple Options
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">State Comparison</h2>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Strictness
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Geofence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grace Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EVV Aggregator
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { code: 'TX', name: 'Texas', strictness: 'STRICT', geofence: '150m', grace: '10 min', aggregator: 'HHAeXchange' },
                  { code: 'FL', name: 'Florida', strictness: 'LENIENT', geofence: '200m', grace: '15 min', aggregator: 'Multi' },
                  { code: 'OH', name: 'Ohio', strictness: 'MODERATE', geofence: '175m', grace: '15 min', aggregator: 'Sandata (Free)' },
                  { code: 'GA', name: 'Georgia', strictness: 'LENIENT', geofence: '200m', grace: '15 min', aggregator: 'Tellus' },
                  { code: 'PA', name: 'Pennsylvania', strictness: 'MODERATE', geofence: '175m', grace: '15 min', aggregator: 'Sandata (Free)' },
                  { code: 'AZ', name: 'Arizona', strictness: 'MODERATE', geofence: '175m', grace: '15 min', aggregator: 'Sandata (Free)' },
                  { code: 'NC', name: 'N. Carolina', strictness: 'MODERATE', geofence: '175m', grace: '15 min', aggregator: 'Sandata (Free)' },
                ].map((state) => (
                  <tr key={state.code} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-bold mr-3">
                          {state.code}
                        </div>
                        <span className="font-medium text-gray-900">{state.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        state.strictness === 'STRICT' ? 'bg-red-100 text-red-800' :
                        state.strictness === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {state.strictness}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {state.geofence}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {state.grace}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {state.aggregator}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">7 States Supported</h3>
          <p className="text-sm text-blue-800">
            TX, FL, OH, GA, PA, AZ, NC with full compliance validation and state-specific rules.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-2">Automatic Compliance</h3>
          <p className="text-sm text-green-800">
            System automatically applies correct rules based on client location and organization state.
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-purple-900 mb-2">Multi-Aggregator Ready</h3>
          <p className="text-sm text-purple-800">
            Supports HHAeXchange, Sandata, Tellus, and other EVV aggregators per state requirements.
          </p>
        </div>
      </div>
    </ShowcaseLayout>
  );
}
