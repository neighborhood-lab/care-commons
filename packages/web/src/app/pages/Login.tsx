import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useAuthService } from '@/core/hooks';
import { getDashboardRoute } from '@/core/utils';
import toast from 'react-hot-toast';

// 5 Demo Personas (all Texas-based)
const DEMO_PERSONAS = [
  {
    email: 'admin@tx.carecommons.example',
    password: 'Demo123!',
    name: 'Maria Rodriguez',
    role: 'Administrator',
    description: 'Full system access, manage agency operations',
    icon: '👨‍💼',
    color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
  },
  {
    email: 'coordinator@tx.carecommons.example',
    password: 'Demo123!',
    name: 'James Thompson',
    role: 'Care Coordinator',
    description: 'Schedule visits, assign caregivers, manage care plans',
    icon: '📋',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
  },
  {
    email: 'caregiver@tx.carecommons.example',
    password: 'Demo123!',
    name: 'Sarah Chen',
    role: 'Caregiver',
    description: 'Clock in/out, document visits, view assignments',
    icon: '🤝',
    color: 'bg-green-50 border-green-200 hover:border-green-400',
  },
  {
    email: 'nurse@tx.carecommons.example',
    password: 'Demo123!',
    name: 'David Williams',
    role: 'RN Clinical',
    description: 'Clinical assessments, medication management, oversight',
    icon: '⚕️',
    color: 'bg-teal-50 border-teal-200 hover:border-teal-400',
  },
  {
    email: 'family@tx.carecommons.example',
    password: 'Demo123!',
    name: 'Emily Johnson',
    role: 'Family Member',
    description: 'View care updates, message caregivers, track visits (daughter of Margaret Johnson)',
    icon: '👨‍👩‍👧',
    color: 'bg-pink-50 border-pink-200 hover:border-pink-400',
  },
] as const;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const authService = useAuthService();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState<number | null>(null);

  // Cooldown timer effect
  React.useEffect((): void | (() => void) => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  // Rate limit countdown effect
  React.useEffect((): void | (() => void) => {
    if (rateLimitRetryAfter !== null && rateLimitRetryAfter > 0) {
      const timer = setTimeout(() => {
        setRateLimitRetryAfter(rateLimitRetryAfter - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (rateLimitRetryAfter === 0) {
      setRateLimitRetryAfter(null);
    }
  }, [rateLimitRetryAfter]);

  const handleLogin = async (personaIndex: number) => {
    const persona = DEMO_PERSONAS[personaIndex];
    if (!persona) return;

    // Prevent multiple rapid clicks (client-side debouncing)
    if (isLoading || cooldownSeconds > 0) {
      return;
    }

    // Prevent login if rate limited
    if (rateLimitRetryAfter !== null && rateLimitRetryAfter > 0) {
      toast.error(`Please wait ${rateLimitRetryAfter} seconds before trying again.`);
      return;
    }
    
    setSelectedPersona(personaIndex);
    setIsLoading(true);
    setCooldownSeconds(2); // 2 second cooldown between attempts

    try {
      const response = await authService.login({
        email: persona.email,
        password: persona.password,
      });
      login(response.user, response.token);
      toast.success(`Welcome, ${persona.name}!`);

      // Route based on user role using centralized routing logic
      const dashboardRoute = getDashboardRoute(response.user.roles);
      navigate(dashboardRoute);
    } catch (error: unknown) {
      // Enhanced error handling for rate limiting
      if (error instanceof Error) {
        const errorObj = error as { message: string; response?: { data?: { code?: string; context?: { retryAfter?: number } } } };
        
        if (errorObj.response?.data?.code === 'RATE_LIMIT_EXCEEDED') {
          const retryAfter = errorObj.response.data.context?.retryAfter || 300;
          setRateLimitRetryAfter(retryAfter);
          const minutes = Math.ceil(retryAfter / 60);
          toast.error(`Too many login attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`, {
            duration: 6000,
          });
        } else {
          toast.error(errorObj.message || 'Login failed. Please check your credentials.');
        }
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
      setSelectedPersona(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
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
              <h3 className="text-base font-semibold text-blue-900">Demo Accounts</h3>
              <p className="mt-1 text-sm text-blue-700">
                Choose a persona to explore the platform.
              </p>
            </div>
          </div>
        </div>

        {/* Persona Cards */}
        <div className="bg-white shadow-2xl rounded-2xl p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Choose Your Demo Account
          </h2>

          {/* Rate limit warning banner */}
          {rateLimitRetryAfter !== null && rateLimitRetryAfter > 0 && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-red-900">Too Many Login Attempts</h3>
                  <p className="mt-1 text-sm text-red-700">
                    Please wait <span className="font-mono font-bold">{Math.floor(rateLimitRetryAfter / 60)}:{String(rateLimitRetryAfter % 60).padStart(2, '0')}</span> before trying again.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_PERSONAS.map((persona, index) => {
              const isDisabled = isLoading || cooldownSeconds > 0 || (rateLimitRetryAfter !== null && rateLimitRetryAfter > 0);
              const isThisPersonaLoading = isLoading && selectedPersona === index;
              
              return (
                <button
                  key={persona.email}
                  type="button"
                  onClick={() => handleLogin(index)}
                  disabled={isDisabled}
                  className={`p-6 text-left rounded-lg border-2 transition-all ${
                    persona.color
                  } ${
                    isDisabled && !isThisPersonaLoading ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isThisPersonaLoading ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <span className="text-4xl">{persona.icon}</span>
                      {isThisPersonaLoading && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        {persona.name}
                      </div>
                      <div className="text-sm font-semibold text-gray-600 mt-1">
                        {persona.role}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed">
                      {persona.description}
                    </div>
                    <div className="mt-2 pt-3 border-t border-gray-200">
                      <div className="text-xs font-mono text-gray-500 truncate">
                        {persona.email}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center space-y-3">
              <p className="text-xs text-gray-500">
                This is a demonstration environment with sample data from Texas.{' '}
                <a
                  href="https://neighborhood-lab.github.io/care-commons/"
                  className="text-primary-600 hover:text-primary-700 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Interactive Showcase
                </a>
              </p>
              <p className="text-xs text-gray-400">
                💡 Try different personas to see different views and permissions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
