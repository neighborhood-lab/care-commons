/**
 * Family Login Page
 *
 * Simplified authentication for family members (email + secure code)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const FamilyLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [secureCode, setSecureCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // In production, this would call an API to send a secure code via email/SMS
      // For now, we'll simulate this
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Move to code entry step
      setStep('code');
    } catch (_err) {
      setError('Failed to send secure code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // In production, this would verify the code with the backend
      // For now, we'll simulate authentication
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock authentication - set family member ID in session
      // In production, this would come from the API response
      sessionStorage.setItem('familyMemberId', 'demo-family-member-id');
      sessionStorage.setItem('clientId', 'demo-client-id');

      // Redirect to dashboard
      void navigate('/family-portal');
    } catch (_err) {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Family Portal</h1>
          <p className="mt-2 text-gray-600">
            Secure access to your loved one's care information
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome! Let's get you signed in
                </h2>
                <p className="text-sm text-gray-600">
                  Enter your email to receive a secure access code
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your.email@example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : 'Send Secure Code'}
              </button>

              <p className="text-center text-xs text-gray-500">
                🔒 Your data is protected with bank-level security
              </p>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Check your email
                </h2>
                <p className="text-sm text-gray-600">
                  We sent a secure code to <strong>{email}</strong>
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</div>
              )}

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Secure Access Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={secureCode}
                  onChange={(e) => setSecureCode(e.target.value)}
                  required
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-mono tracking-wider focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || secureCode.length !== 6}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setSecureCode('');
                  setError('');
                }}
                className="w-full text-sm text-blue-600 hover:underline"
              >
                ← Use a different email
              </button>

              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-medium mb-1">Didn't receive the code?</p>
                <ul className="text-xs space-y-1 ml-4 list-disc">
                  <li>Check your spam/junk folder</li>
                  <li>Wait a few minutes for delivery</li>
                  <li>Click "Use a different email" to try again</li>
                </ul>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <a href="tel:1-800-CARE" className="text-blue-600 hover:underline">
              Call 1-800-CARE
            </a>
          </p>
          <p className="mt-2">
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            {' • '}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
