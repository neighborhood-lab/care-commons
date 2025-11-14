/**
 * State Selector Component
 * 
 * Allows users to switch between different states to see
 * how compliance rules and regulations vary.
 */

import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface StateInfo {
  code: string;
  name: string;
  evvAggregator: string;
  strictness: 'STRICT' | 'MODERATE' | 'LENIENT';
  geofenceRadius: number;
  gracePeriod: number;
  backgroundCheckCycle: string;
}

const SUPPORTED_STATES: StateInfo[] = [
  {
    code: 'TX',
    name: 'Texas',
    evvAggregator: 'HHAeXchange (Mandatory)',
    strictness: 'STRICT',
    geofenceRadius: 150,
    gracePeriod: 10,
    backgroundCheckCycle: '2 years',
  },
  {
    code: 'FL',
    name: 'Florida',
    evvAggregator: 'Multi-aggregator',
    strictness: 'LENIENT',
    geofenceRadius: 200,
    gracePeriod: 15,
    backgroundCheckCycle: '5 years',
  },
  {
    code: 'OH',
    name: 'Ohio',
    evvAggregator: 'Sandata (Free)',
    strictness: 'MODERATE',
    geofenceRadius: 175,
    gracePeriod: 15,
    backgroundCheckCycle: '5 years',
  },
  {
    code: 'GA',
    name: 'Georgia',
    evvAggregator: 'Tellus',
    strictness: 'LENIENT',
    geofenceRadius: 200,
    gracePeriod: 15,
    backgroundCheckCycle: '5 years',
  },
  {
    code: 'PA',
    name: 'Pennsylvania',
    evvAggregator: 'Sandata (Free)',
    strictness: 'MODERATE',
    geofenceRadius: 175,
    gracePeriod: 15,
    backgroundCheckCycle: '5 years',
  },
  {
    code: 'AZ',
    name: 'Arizona',
    evvAggregator: 'Sandata (Free)',
    strictness: 'MODERATE',
    geofenceRadius: 175,
    gracePeriod: 15,
    backgroundCheckCycle: '5 years',
  },
  {
    code: 'NC',
    name: 'North Carolina',
    evvAggregator: 'Sandata (Free)',
    strictness: 'MODERATE',
    geofenceRadius: 175,
    gracePeriod: 15,
    backgroundCheckCycle: '5 years',
  },
];

interface StateSelectorProps {
  currentState?: string;
  onStateChange?: (state: StateInfo) => void;
}

export function StateSelector({ currentState = 'TX', onStateChange }: StateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState(
    SUPPORTED_STATES.find(s => s.code === currentState) || SUPPORTED_STATES[0]
  );

  const handleStateSelect = (state: StateInfo) => {
    setSelectedState(state);
    setIsOpen(false);
    setSearchQuery(''); // Reset search when selecting a state
    if (onStateChange) {
      onStateChange(state);
    }
  };

  // Filter states based on search query
  const filteredStates = SUPPORTED_STATES.filter((state) => {
    const query = searchQuery.toLowerCase();
    return (
      state.name.toLowerCase().includes(query) ||
      state.code.toLowerCase().includes(query) ||
      state.evvAggregator.toLowerCase().includes(query)
    );
  });

  const getStrictnessColor = (strictness: string) => {
    switch (strictness) {
      case 'STRICT':
        return 'text-red-600 bg-red-50';
      case 'MODERATE':
        return 'text-yellow-600 bg-yellow-50';
      case 'LENIENT':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      {/* Selected State Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
            {selectedState.code}
          </div>
          <span className="font-medium text-gray-900">{selectedState.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery(''); // Reset search when closing dropdown
            }}
          />
          <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-[600px] overflow-y-auto">
            <div className="p-2">
              {/* Search Input */}
              <div className="px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search states..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {filteredStates.length} State{filteredStates.length !== 1 ? 's' : ''} {searchQuery ? 'Found' : 'Supported'}
              </div>
              {filteredStates.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-gray-500">
                  No states found matching "{searchQuery}"
                </div>
              ) : (
                filteredStates.map((state) => (
                <button
                  key={state.code}
                  onClick={() => handleStateSelect(state)}
                  className={`w-full text-left px-3 py-3 rounded-md hover:bg-gray-50 transition-colors ${
                    selectedState.code === state.code ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-bold">
                        {state.code}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{state.name}</div>
                        <div className="text-xs text-gray-500">{state.evvAggregator}</div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStrictnessColor(
                        state.strictness
                      )}`}
                    >
                      {state.strictness}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Geofence:</span>{' '}
                      <span className="font-medium text-gray-900">{state.geofenceRadius}m</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Grace:</span>{' '}
                      <span className="font-medium text-gray-900">{state.gracePeriod}min</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Background:</span>{' '}
                      <span className="font-medium text-gray-900">{state.backgroundCheckCycle}</span>
                    </div>
                  </div>
                </button>
                ))
              )}
            </div>
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 rounded-b-lg">
              <p className="text-xs text-gray-600">
                <strong>Multi-State Support:</strong> Care Commons supports operations across all 50 US states
                with state-specific compliance rules, EVV aggregators, and regulatory requirements.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Current State Info Card */}
      <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Current State: {selectedState.name}</h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStrictnessColor(
              selectedState.strictness
            )}`}
          >
            {selectedState.strictness} Compliance
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">EVV Aggregator:</span>
            <span className="font-medium text-gray-900">{selectedState.evvAggregator}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Geofence Radius:</span>
            <span className="font-medium text-gray-900">{selectedState.geofenceRadius} meters</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Clock-in Grace Period:</span>
            <span className="font-medium text-gray-900">{selectedState.gracePeriod} minutes</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Background Check Cycle:</span>
            <span className="font-medium text-gray-900">Every {selectedState.backgroundCheckCycle}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
