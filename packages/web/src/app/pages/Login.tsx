import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useAuthService } from '@/core/hooks';
import toast from 'react-hot-toast';
import { User, Clipboard, ClipboardCheck, Calendar, Users, Stethoscope, Heart } from 'lucide-react';

// Texas-only demo - hardcoded state
const DEMO_STATE = 'TX';

// Role definitions with icons and descriptions
const ROLES = [
  {
    value: 'ADMIN',
    label: 'Administrator',
    description: 'Full system access, manage agency operations',
    Icon: User,
    color: 'from-purple-500 to-purple-600',
    hoverColor: 'hover:from-purple-600 hover:to-purple-700',
  },
  {
    value: 'COORDINATOR',
    label: 'Care Coordinator',
    description: 'Schedule visits, assign caregivers, manage care plans',
    Icon: Calendar,
    color: 'from-blue-500 to-blue-600',
    hoverColor: 'hover:from-blue-600 hover:to-blue-700',
  },
  {
    value: 'CAREGIVER',
    label: 'Caregiver',
    description: 'Clock in/out, document visits, view assignments',
    Icon: Heart,
    color: 'from-green-500 to-green-600',
    hoverColor: 'hover:from-green-600 hover:to-green-700',
  },
  {
    value: 'FAMILY',
    label: 'Family Member',
    description: 'View care updates, message caregivers, track visits',
    Icon: Users,
    color: 'from-orange-500 to-orange-600',
    hoverColor: 'hover:from-orange-600 hover:to-orange-700',
  },
  {
    value: 'NURSE',
    label: 'Nurse/Clinical',
    description: 'Clinical assessments, medication management, oversight',
    Icon: Stethoscope,
    color: 'from-teal-500 to-teal-600',
    hoverColor: 'hover:from-teal-600 hover:to-teal-700',
  },
] as const;

// Custom toast component for credentials with copy button
const CredentialsToast: React.FC<{
  email: string;
  password: string;
  roleName: string;
}> = ({ email, password, roleName }) => {
  const [emailCopied, setEmailCopied] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const copyToClipboard = async (text: string, field: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      if (field === 'email') {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
      } else {
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="font-semibold text-green-900">
        Welcome, {roleName}!
      </div>
      <div className="text-sm text-green-800">
        You can use these credentials for future logins:
      </div>
      <div className="space-y-2 bg-white rounded-md p-3 border border-green-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-600 font-medium">Email</div>
            <div className="text-sm text-gray-900 font-mono truncate">{email}</div>
          </div>
          <button
            onClick={() => copyToClipboard(email, 'email')}
            className="flex-shrink-0 p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Copy email"
          >
            {emailCopied ? (
              <ClipboardCheck className="h-4 w-4 text-green-600" />
            ) : (
              <Clipboard className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-600 font-medium">Password</div>
            <div className="text-sm text-gray-900 font-mono truncate">{password}</div>
          </div>
          <button
            onClick={() => copyToClipboard(password, 'password')}
            className="flex-shrink-0 p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Copy password"
          >
            {passwordCopied ? (
              <ClipboardCheck className="h-4 w-4 text-green-600" />
            ) : (
              <Clipboard className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const authService = useAuthService();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRoleSelect = async (roleValue: string) => {
    if (isLoading) return;

    setSelectedRole(roleValue);
    setIsLoading(true);

    try {
      // Generate credentials for Texas + selected role
      const stateCode = DEMO_STATE.toLowerCase();
      const roleCode = roleValue.toLowerCase();
      const email = `${roleCode}@${stateCode}.carecommons.example`;
      const password = `Demo${DEMO_STATE}${roleValue}123!`;

      // Auto-login
      const response = await authService.login({ email, password });
      login(response.user, response.token);

      // Get role name for display
      const role = ROLES.find((r) => r.value === roleValue);
      const roleName = role?.label ?? roleValue;

      // Show welcome toast with credentials and copy buttons
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-green-50 border-2 border-green-500 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <CredentialsToast
                email={email}
                password={password}
                roleName={roleName}
              />
            </div>
            <div className="flex border-l border-green-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-green-700 hover:text-green-800 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ),
        { duration: 10000 }
      );

      // Route based on user role
      setTimeout(() => {
        if (response.user.roles.includes('FAMILY')) {
          navigate('/family-portal');
        } else {
          navigate('/');
        }
      }, 500);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      setSelectedRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full border-2 border-blue-300">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            TEXAS DEMO
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Care Commons
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience home healthcare management with realistic Texas data
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-blue-900">Quick Demo Access</h3>
              <p className="mt-1 text-sm text-blue-700">
                Select a role below to instantly explore the platform. Credentials will be provided after login for future reference.
              </p>
            </div>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="bg-white shadow-2xl rounded-2xl p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Choose Your Role to Get Started
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLES.map((role) => {
              const isSelected = selectedRole === role.value;
              const isCurrentlyLoading = isLoading && isSelected;

              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleSelect(role.value)}
                  disabled={isLoading}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                    isCurrentlyLoading
                      ? 'border-gray-300 bg-gray-50 cursor-wait'
                      : isSelected
                      ? 'border-primary-600 bg-primary-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-md'
                  } ${isLoading && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {/* Gradient Icon Background */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} text-white mb-4 shadow-md ${!isLoading ? role.hoverColor : ''} transition-all duration-200 ${!isCurrentlyLoading ? 'group-hover:scale-110' : ''}`}>
                    {isCurrentlyLoading ? (
                      <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <role.Icon className="h-7 w-7" />
                    )}
                  </div>

                  {/* Role Info */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {role.label}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {role.description}
                    </p>
                  </div>

                  {/* Loading State */}
                  {isCurrentlyLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-xl">
                      <div className="text-center">
                        <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-sm font-medium text-gray-700">Signing in...</p>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-center text-gray-500">
              This is a demonstration environment with sample data.{' '}
              <a
                href="https://neighborhood-lab.github.io/care-commons/"
                className="text-primary-600 hover:text-primary-700 underline font-medium"
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
