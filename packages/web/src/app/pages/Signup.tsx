import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/hooks';
import toast from 'react-hot-toast';

// US States for dropdown
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
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
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'VI', name: 'U.S. Virgin Islands' },
  { code: 'GU', name: 'Guam' },
];

interface SignupFormData {
  // Step 1: Organization
  organizationName: string;
  stateCode: string;
  organizationPhone: string;
  // Step 2: Admin User
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Step 3: Password
  password: string;
  confirmPassword: string;
}

const INITIAL_FORM_DATA: SignupFormData = {
  organizationName: '',
  stateCode: '',
  organizationPhone: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});

  const totalSteps = 3;

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof SignupFormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.organizationName.trim()) {
        newErrors.organizationName = 'Organization name is required';
      } else if (formData.organizationName.trim().length < 2) {
        newErrors.organizationName = 'Organization name must be at least 2 characters';
      }

      if (!formData.stateCode) {
        newErrors.stateCode = 'Please select your state';
      }

      if (formData.organizationPhone && !/^\d{10}$/.test(formData.organizationPhone.replace(/\D/g, ''))) {
        newErrors.organizationPhone = 'Please enter a valid 10-digit phone number';
      }
    }

    if (currentStep === 2) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }

      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    if (currentStep === 3) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!"#$%&()*,.:<>?@^{|}])/.test(formData.password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(step)) {
      return;
    }

    setIsLoading(true);

    try {
      // Format phone numbers (remove non-digits)
      const cleanOrgPhone = formData.organizationPhone.replace(/\D/g, '');
      const cleanAdminPhone = formData.phone.replace(/\D/g, '');

      // Call the correct signup API endpoint
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName: formData.organizationName.trim(),
          organizationEmail: formData.email, // Use admin email as org email
          organizationPhone: cleanOrgPhone || undefined,
          stateCode: formData.stateCode,
          adminFirstName: formData.firstName.trim(),
          adminLastName: formData.lastName.trim(),
          adminEmail: formData.email,
          adminPassword: formData.password,
          adminPhone: cleanAdminPhone || undefined,
          planName: 'STARTER', // Default to starter plan (14-day trial)
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message ?? responseData.error ?? 'Signup failed');
      }

      const { data } = responseData;

      // Auto-login after successful signup
      if (data.user && data.tokens?.accessToken) {
        login(data.user, data.tokens.accessToken);
      }

      toast.success(
        `Welcome to Folk! Check your email (${formData.email}) to verify your account.`,
        { duration: 6000 }
      );

      // Navigate to onboarding wizard or dashboard
      navigate('/onboarding');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof SignupFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formatted = formatPhoneNumber(value);
    setFormData((prev) => ({ ...prev, [name]: formatted }));
    if (errors[name as keyof SignupFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-colors ${
              s < step
                ? 'bg-green-600 text-white'
                : s === step
                ? 'bg-green-600 text-white ring-4 ring-green-200'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {s < step ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              s
            )}
          </div>
          {s < 3 && (
            <div
              className={`w-12 h-1 ${s < step ? 'bg-green-600' : 'bg-gray-200'}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Organization Details</h2>
      <p className="text-sm text-gray-600 mb-6">Tell us about your home health agency</p>

      {/* Organization Name */}
      <div className="mb-4">
        <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
          Organization Name *
        </label>
        <input
          id="organizationName"
          name="organizationName"
          type="text"
          value={formData.organizationName}
          onChange={handleChange}
          className={`w-full px-4 py-3 border ${
            errors.organizationName ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          placeholder="e.g., Sunshine Home Health"
        />
        {errors.organizationName && (
          <p className="mt-1 text-sm text-red-600">{errors.organizationName}</p>
        )}
      </div>

      {/* State Selection */}
      <div className="mb-4">
        <label htmlFor="stateCode" className="block text-sm font-medium text-gray-700 mb-1">
          State *
        </label>
        <select
          id="stateCode"
          name="stateCode"
          value={formData.stateCode}
          onChange={handleChange}
          className={`w-full px-4 py-3 border ${
            errors.stateCode ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white`}
        >
          <option value="">Select your state</option>
          {US_STATES.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
        {errors.stateCode && (
          <p className="mt-1 text-sm text-red-600">{errors.stateCode}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Your state determines regulatory requirements and EVV settings
        </p>
      </div>

      {/* Organization Phone */}
      <div className="mb-4">
        <label htmlFor="organizationPhone" className="block text-sm font-medium text-gray-700 mb-1">
          Organization Phone
        </label>
        <input
          id="organizationPhone"
          name="organizationPhone"
          type="tel"
          value={formData.organizationPhone}
          onChange={handlePhoneChange}
          className={`w-full px-4 py-3 border ${
            errors.organizationPhone ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          placeholder="(555) 555-5555"
        />
        {errors.organizationPhone && (
          <p className="mt-1 text-sm text-red-600">{errors.organizationPhone}</p>
        )}
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Administrator Account</h2>
      <p className="text-sm text-gray-600 mb-6">Create your admin login credentials</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full px-4 py-3 border ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            placeholder="John"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full px-4 py-3 border ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            placeholder="Smith"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-3 border ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          placeholder="you@example.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div className="mb-4">
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handlePhoneChange}
          className={`w-full px-4 py-3 border ${
            errors.phone ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          placeholder="(555) 555-5555"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Set Your Password</h2>
      <p className="text-sm text-gray-600 mb-6">Create a secure password for your account</p>

      {/* Password */}
      <div className="mb-4">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password *
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          className={`w-full px-4 py-3 border ${
            errors.password ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          placeholder="At least 8 characters"
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        <div className="mt-2 space-y-1">
          <p className={`text-xs ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
            {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
          </p>
          <p className={`text-xs ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
            {/[A-Z]/.test(formData.password) ? '✓' : '○'} Contains uppercase letter
          </p>
          <p className={`text-xs ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
            {/[a-z]/.test(formData.password) ? '✓' : '○'} Contains lowercase letter
          </p>
          <p className={`text-xs ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
            {/\d/.test(formData.password) ? '✓' : '○'} Contains a number
          </p>
          <p className={`text-xs ${/[!"#$%&()*,.:<>?@^{|}]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
            {/[!"#$%&()*,.:<>?@^{|}]/.test(formData.password) ? '✓' : '○'} Contains special character (!@#$%...)
          </p>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="mb-4">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password *
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`w-full px-4 py-3 border ${
            errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          placeholder="Re-enter your password"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Trial info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-green-800">14-Day Free Trial</h3>
            <p className="text-sm text-green-700 mt-1">
              Start with our Starter plan. No credit card required.
              Full access to all features during your trial.
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-semibold text-green-700 bg-green-100 rounded-full border-2 border-green-300">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
            CREATE ACCOUNT
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Your Agency</h1>
          <p className="text-gray-600">Set up Folk in under 5 minutes</p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form Card */}
        <div className="bg-white shadow-2xl rounded-2xl p-8">
          <form onSubmit={step === totalSteps ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-lg hover:shadow-xl ${
                  isLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Account...
                  </>
                ) : step === totalSteps ? (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                    Create Account
                  </>
                ) : (
                  <>
                    Continue
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-semibold text-green-600 hover:text-green-700 underline"
              >
                Sign in
              </button>
            </p>
            <p className="text-center text-xs text-gray-500 mt-4">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Try Demo Link */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            ← Back to Demo
          </button>
        </div>
      </div>
    </div>
  );
};
