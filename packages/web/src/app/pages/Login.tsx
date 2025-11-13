import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useAuthService } from '@/core/hooks';
import { Button } from '@/core/components';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';

// All 50 US states
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
] as const;

// Role definitions with brief explanations
const ROLES = [
  {
    value: 'ADMIN',
    label: 'Administrator',
    description: 'Full system access, manage agency operations',
    icon: '👨‍💼',
  },
  {
    value: 'COORDINATOR',
    label: 'Care Coordinator',
    description: 'Schedule visits, assign caregivers, manage care plans',
    icon: '📋',
  },
  {
    value: 'CAREGIVER',
    label: 'Caregiver',
    description: 'Clock in/out, document visits, view assignments',
    icon: '🤝',
  },
  {
    value: 'FAMILY',
    label: 'Family Member',
    description: 'View care updates, message caregivers, track visits',
    icon: '👨‍👩‍👧',
  },
  {
    value: 'NURSE',
    label: 'Nurse/Clinical',
    description: 'Clinical assessments, medication management, oversight',
    icon: '⚕️',
  },
] as const;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const authService = useAuthService();
  const [isLoading, setIsLoading] = useState(false);
  
  // Demo flow state
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auto-populated credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Generate credentials when state and role are selected
  useEffect(() => {
    if (selectedState !== '' && selectedRole !== '') {
      const stateCode = selectedState.toLowerCase();
      const roleCode = selectedRole.toLowerCase();
      
      // Email format: {role}@{state}.carecommons.example
      const generatedEmail = `${roleCode}@${stateCode}.carecommons.example`;
      
      // Password format: Demo{STATE}{ROLE}123!
      const generatedPassword = `Demo${selectedState}${selectedRole}123!`;
      
      setEmail(generatedEmail);
      setPassword(generatedPassword);
    }
  }, [selectedState, selectedRole]);

  // Filter states based on search query
  const filteredStates = US_STATES.filter((state) =>
    state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    state.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogin = async () => {
    if (email === '' || password === '') {
      toast.error('Please select a state and role');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      login(response.user, response.token);
      const stateName = US_STATES.find((s) => s.code === selectedState)?.name ?? selectedState;
      const roleName = ROLES.find((r) => r.value === selectedRole)?.label ?? selectedRole;
      toast.success(`Welcome! Viewing ${stateName} as ${roleName}`);

      // Route based on user role
      if (response.user.roles.includes('FAMILY')) {
        navigate('/family-portal');
      } else {
        navigate('/');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = selectedState !== '' && selectedRole !== '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600">
            Care Commons
          </h1>
          <p className="mt-2 text-lg text-gray-700">
            Interactive Demo for All 50 States
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Experience state-specific compliance, EVV requirements, and workflows
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">State-Specific Demo Accounts</h3>
              <p className="mt-1 text-xs text-blue-700">
                Each state has unique regulations for home healthcare. We've created demo accounts for all 50 states and every role 
                so you can explore state-specific compliance requirements, EVV mandates, background checks, and workflows. 
                Your credentials will be automatically generated based on your selections.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-lg p-8 space-y-8">
          {/* Step 1: State Selection */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${selectedState !== '' ? 'bg-green-500' : 'bg-primary-500'} text-white font-semibold`}>
                {selectedState !== '' ? <Check className="h-5 w-5" /> : '1'}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Select Your State
              </h3>
            </div>
            
            {/* Search input */}
            <input
              type="text"
              placeholder="Search states..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />

            {/* State grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
              {filteredStates.map((state) => (
                <button
                  key={state.code}
                  type="button"
                  onClick={() => setSelectedState(state.code)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedState === state.code
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {state.code}
                </button>
              ))}
            </div>
            {selectedState !== '' && (
              <p className="mt-2 text-sm text-green-600 font-medium">
                ✓ Selected: {US_STATES.find((s) => s.code === selectedState)?.name}
              </p>
            )}
          </div>

          {/* Step 2: Role Selection */}
          <div className={selectedState === '' ? 'opacity-50 pointer-events-none' : ''}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${selectedRole !== '' ? 'bg-green-500' : 'bg-primary-500'} text-white font-semibold`}>
                {selectedRole !== '' ? <Check className="h-5 w-5" /> : '2'}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Choose Your Role
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  disabled={selectedState === ''}
                  className={`p-4 text-left rounded-lg border-2 transition-all ${
                    selectedRole === role.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{role.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {role.label}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {role.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Auto-populated Credentials */}
          <div className={!canProceed ? 'opacity-50 pointer-events-none' : ''}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white font-semibold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Review & Sign In
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed font-mono"
                />
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleLogin}
                isLoading={isLoading}
                disabled={!canProceed}
                className="w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign In to Demo'}
              </Button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              This is a demonstration environment with sample data.{' '}
              <a 
                href="https://neighborhood-lab.github.io/care-commons/" 
                className="text-primary-600 hover:text-primary-700 underline"
                target="_blank" 
                rel="noopener noreferrer"
              >
                View Interactive Showcase
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
