/**
 * State Compliance Map Component
 *
 * Visual display of multi-state support and compliance
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Check, AlertCircle } from 'lucide-react';

interface StateInfo {
  code: string;
  name: string;
  status: 'fully-supported' | 'partial' | 'planned';
  aggregator: string;
  geofence: string;
  gracePeriod: string;
  specialRequirements: string[];
  region: 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west';
}

const featuredStates: StateInfo[] = [
  {
    code: 'TX',
    name: 'Texas',
    status: 'fully-supported',
    aggregator: 'HHAeXchange (mandatory)',
    geofence: '100m ± GPS accuracy',
    gracePeriod: '10 minutes',
    specialRequirements: [
      'VMUR required for corrections',
      'Employee Misconduct Registry check',
      'Six EVV elements mandatory',
    ],
    region: 'southwest',
  },
  {
    code: 'FL',
    name: 'Florida',
    status: 'fully-supported',
    aggregator: 'Multi-aggregator support',
    geofence: '150m ± GPS accuracy',
    gracePeriod: '15 minutes',
    specialRequirements: [
      'Level 2 background screening',
      'RN supervision within 60 days',
      'EVV exemptions allowed',
    ],
    region: 'southeast',
  },
  {
    code: 'CA',
    name: 'California',
    status: 'fully-supported',
    aggregator: 'CalAIM EVV system',
    geofence: '1 mile radius',
    gracePeriod: '20 minutes',
    specialRequirements: [
      'Consumer-directed services support',
      'Mileage reimbursement tracking',
      'Bilingual caregiver matching',
    ],
    region: 'west',
  },
  {
    code: 'NY',
    name: 'New York',
    status: 'fully-supported',
    aggregator: 'Santrax (eMedNY)',
    geofence: '500 feet',
    gracePeriod: '10 minutes',
    specialRequirements: [
      'CDPAP program support',
      'Union wage compliance',
      'Training hour tracking',
    ],
    region: 'northeast',
  },
];

const regionColors = {
  northeast: 'bg-blue-500',
  southeast: 'bg-green-500',
  midwest: 'bg-yellow-500',
  southwest: 'bg-orange-500',
  west: 'bg-purple-500',
};

const statusIcons = {
  'fully-supported': <Check className="h-5 w-5 text-green-600" />,
  'partial': <AlertCircle className="h-5 w-5 text-yellow-600" />,
  'planned': <AlertCircle className="h-5 w-5 text-gray-400" />,
};

export const StateComplianceMap: React.FC = () => {
  const [selectedState, setSelectedState] = useState<StateInfo | null>(featuredStates[0]!);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Multi-State Compliance Support
        </h2>
        <p className="text-blue-100">
          Pre-configured rules for all 50 states with automatic aggregator submission
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* State Grid/List */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Featured States
          </h3>
          <div className="space-y-3">
            {featuredStates.map((state, index) => (
              <motion.button
                key={state.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedState(state)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedState?.code === state.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${regionColors[state.region]}`} />
                    <span className="font-bold text-gray-900">{state.name}</span>
                    <span className="text-sm text-gray-500">({state.code})</span>
                  </div>
                  {statusIcons[state.status]}
                </div>
                <div className="text-sm text-gray-600">
                  {state.aggregator}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">48</div>
              <div className="text-sm text-green-700">Fully Supported</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">2</div>
              <div className="text-sm text-blue-700">In Development</div>
            </div>
          </div>
        </div>

        {/* State Details */}
        <div>
          {selectedState && (
            <motion.div
              key={selectedState.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedState.name}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">EVV Aggregator</h4>
                    <p className="text-gray-900">{selectedState.aggregator}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Geofence Requirements</h4>
                    <p className="text-gray-900">{selectedState.geofence}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Grace Period</h4>
                    <p className="text-gray-900">{selectedState.gracePeriod}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Special Requirements
                </h4>
                <ul className="space-y-2">
                  {selectedState.specialRequirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">Fully configured and tested</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Pre-configured compliance rules • Automatic updates • State-specific workflows
          </p>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {Object.entries(regionColors).map(([region, color]) => (
                <div
                  key={region}
                  className={`w-8 h-8 rounded-full ${color} border-2 border-white`}
                  title={region}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">5 regions covered</span>
          </div>
        </div>
      </div>
    </div>
  );
};
