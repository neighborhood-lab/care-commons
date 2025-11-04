import React, { useState } from 'react';
import { Card, Button } from '@/core/components';
import { Settings, Save, RotateCcw, CheckCircle2 } from 'lucide-react';

type StateCode = 'TX' | 'FL' | 'OH' | 'PA' | 'GA' | 'NC' | 'AZ';

interface StateConfig {
  state: StateCode;
  enabled: boolean;
  geofenceTolerance: number; // meters
  gracePeriodMinutes: number; // minutes
  aggregator: string;
  requiredDocuments: string[];
  gpsAccuracyThreshold: number; // meters
}

const DEFAULT_STATE_CONFIGS: Record<StateCode, StateConfig> = {
  TX: {
    state: 'TX',
    enabled: true,
    geofenceTolerance: 100,
    gracePeriodMinutes: 10,
    aggregator: 'HHAEEXCHANGE',
    requiredDocuments: ['EVV_6_ELEMENTS', 'GPS_COORDINATES', 'TASK_VERIFICATION'],
    gpsAccuracyThreshold: 100,
  },
  FL: {
    state: 'FL',
    enabled: true,
    geofenceTolerance: 150,
    gracePeriodMinutes: 15,
    aggregator: 'NETSMART_TELLUS',
    requiredDocuments: ['EVV_6_ELEMENTS', 'GPS_COORDINATES'],
    gpsAccuracyThreshold: 150,
  },
  OH: {
    state: 'OH',
    enabled: false,
    geofenceTolerance: 120,
    gracePeriodMinutes: 12,
    aggregator: 'SANDATA',
    requiredDocuments: ['EVV_6_ELEMENTS', 'GPS_COORDINATES'],
    gpsAccuracyThreshold: 120,
  },
  PA: {
    state: 'PA',
    enabled: false,
    geofenceTolerance: 125,
    gracePeriodMinutes: 10,
    aggregator: 'HHAEEXCHANGE',
    requiredDocuments: ['EVV_6_ELEMENTS', 'GPS_COORDINATES'],
    gpsAccuracyThreshold: 110,
  },
  GA: {
    state: 'GA',
    enabled: false,
    geofenceTolerance: 150,
    gracePeriodMinutes: 15,
    aggregator: 'SANDATA',
    requiredDocuments: ['EVV_6_ELEMENTS'],
    gpsAccuracyThreshold: 150,
  },
  NC: {
    state: 'NC',
    enabled: false,
    geofenceTolerance: 140,
    gracePeriodMinutes: 12,
    aggregator: 'NETSMART_TELLUS',
    requiredDocuments: ['EVV_6_ELEMENTS', 'GPS_COORDINATES'],
    gpsAccuracyThreshold: 130,
  },
  AZ: {
    state: 'AZ',
    enabled: false,
    geofenceTolerance: 130,
    gracePeriodMinutes: 15,
    aggregator: 'HHAEEXCHANGE',
    requiredDocuments: ['EVV_6_ELEMENTS', 'GPS_COORDINATES'],
    gpsAccuracyThreshold: 120,
  },
};

const AGGREGATOR_OPTIONS = [
  { value: 'HHAEEXCHANGE', label: 'HHAeXchange' },
  { value: 'SANDATA', label: 'Sandata' },
  { value: 'NETSMART_TELLUS', label: 'Netsmart Tellus' },
  { value: 'ICONNECT', label: 'iConnect' },
];

const DOCUMENT_OPTIONS = [
  { value: 'EVV_6_ELEMENTS', label: 'EVV 6 Required Elements' },
  { value: 'GPS_COORDINATES', label: 'GPS Coordinates' },
  { value: 'TASK_VERIFICATION', label: 'Task Verification' },
  { value: 'CLIENT_SIGNATURE', label: 'Client Signature' },
  { value: 'PHOTO_VERIFICATION', label: 'Photo Verification' },
];

export const StateConfigPanel: React.FC = () => {
  const [selectedState, setSelectedState] = useState<StateCode>('TX');
  const [configs, setConfigs] = useState<Record<StateCode, StateConfig>>(
    DEFAULT_STATE_CONFIGS
  );
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const currentConfig = configs[selectedState];

  const updateConfig = <K extends keyof StateConfig>(
    field: K,
    value: StateConfig[K]
  ) => {
    setConfigs({
      ...configs,
      [selectedState]: {
        ...currentConfig,
        [field]: value,
      },
    });
    setUnsavedChanges(true);
  };

  const handleSave = () => {
    // In production, this would call an API to save the configuration
    console.log('Saving state configurations:', configs);
    setUnsavedChanges(false);
  };

  const handleReset = () => {
    setConfigs(DEFAULT_STATE_CONFIGS);
    setUnsavedChanges(false);
  };

  const states: Array<{ code: StateCode; name: string }> = [
    { code: 'TX', name: 'Texas' },
    { code: 'FL', name: 'Florida' },
    { code: 'OH', name: 'Ohio' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'GA', name: 'Georgia' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'AZ', name: 'Arizona' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Save/Reset Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            State-Specific EVV Configuration
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure geofencing, grace periods, aggregators, and compliance rules per state
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!unsavedChanges}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!unsavedChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {unsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            You have unsaved changes. Click "Save Changes" to persist your configuration.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* State Selector Sidebar */}
        <div className="lg:col-span-1">
          <Card padding="sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 px-2">
              Select State
            </h3>
            <div className="space-y-1">
              {states.map((state) => (
                <button
                  key={state.code}
                  onClick={() => setSelectedState(state.code)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium
                    transition-colors
                    ${
                      selectedState === state.code
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <span>{state.name}</span>
                  <div className="flex items-center gap-2">
                    {configs[state.code].enabled && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    <span className="text-xs text-gray-500">{state.code}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Configuration Form */}
        <div className="lg:col-span-3">
          <Card padding="md">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="h-6 w-6 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {states.find((s) => s.code === selectedState)?.name} Configuration
                </h3>
                <p className="text-sm text-gray-600">
                  State-specific EVV compliance settings
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Enable/Disable State */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Enable {selectedState} Operations
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Allow EVV operations and compliance tracking for this state
                  </p>
                </div>
                <button
                  onClick={() => updateConfig('enabled', !currentConfig.enabled)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full
                    transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    ${currentConfig.enabled ? 'bg-primary-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${currentConfig.enabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              {/* Geofence Tolerance */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Geofence Tolerance (meters)
                </label>
                <input
                  type="number"
                  min={50}
                  max={300}
                  step={10}
                  value={currentConfig.geofenceTolerance}
                  onChange={(e) =>
                    updateConfig('geofenceTolerance', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Maximum acceptable distance from client location for GPS verification
                </p>
              </div>

              {/* Grace Period */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Clock-In Grace Period (minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={30}
                  step={5}
                  value={currentConfig.gracePeriodMinutes}
                  onChange={(e) =>
                    updateConfig('gracePeriodMinutes', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  How early caregivers can clock in before scheduled visit start time
                </p>
              </div>

              {/* GPS Accuracy Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  GPS Accuracy Threshold (meters)
                </label>
                <input
                  type="number"
                  min={50}
                  max={200}
                  step={10}
                  value={currentConfig.gpsAccuracyThreshold}
                  onChange={(e) =>
                    updateConfig('gpsAccuracyThreshold', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Minimum GPS accuracy required for location verification
                </p>
              </div>

              {/* Aggregator Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  EVV Aggregator
                </label>
                <select
                  value={currentConfig.aggregator}
                  onChange={(e) => updateConfig('aggregator', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  {AGGREGATOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  State-mandated or preferred EVV aggregator system
                </p>
              </div>

              {/* Required Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Required Documentation
                </label>
                <div className="space-y-2">
                  {DOCUMENT_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentConfig.requiredDocuments.includes(option.value)}
                        onChange={(e) => {
                          const newDocs = e.target.checked
                            ? [...currentConfig.requiredDocuments, option.value]
                            : currentConfig.requiredDocuments.filter(
                                (d) => d !== option.value
                              );
                          updateConfig('requiredDocuments', newDocs);
                        }}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Documentation required for compliance verification
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
