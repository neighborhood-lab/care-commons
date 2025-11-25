import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/hooks';
import toast from 'react-hot-toast';

/**
 * Onboarding Wizard for new agencies
 * 
 * This is a guided setup flow that helps new agencies configure their
 * Care Commons instance after signup. The goal is to get agencies from
 * signup to first real visit in under 24 hours.
 */

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  estimatedMinutes: number;
  isComplete: boolean;
  isOptional?: boolean;
}

const CheckIcon = () => (
  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedStep, setExpandedStep] = useState<string | null>('verify-email');

  // Initial onboarding steps - these would be populated from API in real implementation
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'verify-email',
      title: 'Verify Your Email',
      description: 'Confirm your email address to secure your account',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      estimatedMinutes: 1,
      isComplete: false,
    },
    {
      id: 'add-services',
      title: 'Configure Services',
      description: 'Set up the service types your agency offers',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      estimatedMinutes: 5,
      isComplete: false,
    },
    {
      id: 'add-payors',
      title: 'Add Payors',
      description: 'Configure Medicaid, Medicare, and private pay sources',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      estimatedMinutes: 10,
      isComplete: false,
    },
    {
      id: 'evv-setup',
      title: 'EVV Configuration',
      description: 'Connect to your state EVV aggregator for compliance',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      estimatedMinutes: 15,
      isComplete: false,
    },
    {
      id: 'add-caregiver',
      title: 'Add Your First Caregiver',
      description: 'Invite a caregiver to test the mobile app',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      estimatedMinutes: 5,
      isComplete: false,
    },
    {
      id: 'add-client',
      title: 'Add Your First Client',
      description: 'Create a client record to test the system',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      estimatedMinutes: 10,
      isComplete: false,
    },
    {
      id: 'schedule-visit',
      title: 'Schedule a Test Visit',
      description: 'Create your first visit to test the complete workflow',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      estimatedMinutes: 5,
      isComplete: false,
    },
    {
      id: 'invite-team',
      title: 'Invite Your Team',
      description: 'Add other administrators and coordinators',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      estimatedMinutes: 5,
      isComplete: false,
      isOptional: true,
    },
  ]);

  const completedSteps = steps.filter((s) => s.isComplete).length;
  const totalSteps = steps.filter((s) => !s.isOptional).length;
  const progress = Math.round((completedSteps / totalSteps) * 100);

  const handleStepClick = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const handleMarkComplete = (stepId: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, isComplete: true } : step
      )
    );
    
    // Find next incomplete step
    const currentIndex = steps.findIndex((s) => s.id === stepId);
    const nextStep = steps.slice(currentIndex + 1).find((s) => !s.isComplete);
    if (nextStep) {
      setExpandedStep(nextStep.id);
    }
    
    toast.success('Step completed!');
  };

  const handleSkipOnboarding = () => {
    navigate('/dashboard');
  };

  const handleCompleteOnboarding = () => {
    toast.success('Congratulations! Your agency is ready to go live.');
    navigate('/dashboard');
  };

  const renderStepContent = (step: OnboardingStep) => {
    switch (step.id) {
      case 'verify-email':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              We sent a verification email to <strong>{user?.email}</strong>.
              Click the link in the email to verify your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => toast.success('Verification email resent!')}
                className="px-4 py-2 text-sm font-medium text-green-600 border border-green-600 rounded-lg hover:bg-green-50"
              >
                Resend Email
              </button>
              <button
                onClick={() => handleMarkComplete(step.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                I&apos;ve Verified My Email
              </button>
            </div>
          </div>
        );
      
      case 'add-services':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Configure the types of home health services your agency provides.
              Common services include Personal Care, Skilled Nursing, and Companion Care.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigate('/settings/services');
                  handleMarkComplete(step.id);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Configure Services
              </button>
              <button
                onClick={() => handleMarkComplete(step.id)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip for Now
              </button>
            </div>
          </div>
        );
      
      case 'add-payors':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Set up your payer sources to track billing and reimbursement.
              Most agencies work with Medicaid, Medicare, and private pay clients.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigate('/billing/payors');
                  handleMarkComplete(step.id);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Add Payors
              </button>
              <button
                onClick={() => handleMarkComplete(step.id)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip for Now
              </button>
            </div>
          </div>
        );
      
      case 'evv-setup':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Electronic Visit Verification (EVV) is required for Medicaid-funded services.
              Connect to your state&apos;s EVV aggregator to submit visit data automatically.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Based on your state selection, we&apos;ve pre-configured settings for your state&apos;s EVV requirements.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigate('/settings/evv');
                  handleMarkComplete(step.id);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Configure EVV
              </button>
              <button
                onClick={() => handleMarkComplete(step.id)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip for Now
              </button>
            </div>
          </div>
        );
      
      case 'add-caregiver':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Add a caregiver to test the mobile app experience. You can invite yourself
              as a test caregiver using a different email address.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigate('/caregivers/new');
                  handleMarkComplete(step.id);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Add Caregiver
              </button>
              <button
                onClick={() => handleMarkComplete(step.id)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip for Now
              </button>
            </div>
          </div>
        );
      
      case 'add-client':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Create a client record to test scheduling and documentation.
              You can use test data or add a real client.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigate('/clients/new');
                  handleMarkComplete(step.id);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Add Client
              </button>
              <button
                onClick={() => handleMarkComplete(step.id)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip for Now
              </button>
            </div>
          </div>
        );
      
      case 'schedule-visit':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Schedule a test visit to see the complete workflow from scheduling
              through EVV clock-in/out and documentation.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigate('/schedule');
                  handleMarkComplete(step.id);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Schedule Visit
              </button>
              <button
                onClick={() => handleMarkComplete(step.id)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip for Now
              </button>
            </div>
          </div>
        );
      
      case 'invite-team':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Invite other team members to help manage your agency.
              You can assign different roles like Coordinator, Scheduler, or Billing.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigate('/settings/team');
                  handleMarkComplete(step.id);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Invite Team
              </button>
              <button
                onClick={() => handleMarkComplete(step.id)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip for Now
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome to Care Commons</h1>
              <p className="text-gray-600 mt-1">Let&apos;s get your agency set up</p>
            </div>
            <button
              onClick={handleSkipOnboarding}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Skip setup, go to dashboard
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">
                {completedSteps} of {totalSteps} steps complete
              </span>
              <span className="text-gray-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`bg-white rounded-xl shadow-sm border ${
                step.isComplete
                  ? 'border-green-200'
                  : expandedStep === step.id
                  ? 'border-green-500 ring-2 ring-green-200'
                  : 'border-gray-200'
              }`}
            >
              <button
                onClick={() => handleStepClick(step.id)}
                className="w-full px-6 py-4 flex items-center gap-4 text-left"
              >
                {/* Step number or check */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    step.isComplete
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {step.isComplete ? <CheckIcon /> : step.icon}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-semibold ${
                        step.isComplete ? 'text-green-700' : 'text-gray-900'
                      }`}
                    >
                      {step.title}
                    </h3>
                    {step.isOptional && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                        Optional
                      </span>
                    )}
                    {step.isComplete && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        Complete
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                </div>

                {/* Time estimate */}
                <div className="flex-shrink-0 text-sm text-gray-400">
                  ~{step.estimatedMinutes} min
                </div>

                {/* Expand icon */}
                <svg
                  className={`flex-shrink-0 w-5 h-5 text-gray-400 transition-transform ${
                    expandedStep === step.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded content */}
              {expandedStep === step.id && !step.isComplete && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                  {renderStepContent(step)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Complete button */}
        {completedSteps >= totalSteps && (
          <div className="mt-8 text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-green-800">You&apos;re All Set!</h2>
              </div>
              <p className="text-green-700">
                Your agency is configured and ready to start serving clients.
              </p>
            </div>
            <button
              onClick={handleCompleteOnboarding}
              className="px-8 py-3 text-lg font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-lg hover:shadow-xl transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
