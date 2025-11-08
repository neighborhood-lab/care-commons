/**
 * Cookie Consent Banner
 *
 * GDPR/CCPA compliant cookie consent banner
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { useAnalytics } from './AnalyticsContext';

const CONSENT_KEY = 'care-commons-analytics-consent';
const CONSENT_DATE_KEY = 'care-commons-analytics-consent-date';

export const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window === 'undefined') return false;

    const consent = window.localStorage.getItem(CONSENT_KEY);
    const consentDate = window.localStorage.getItem(CONSENT_DATE_KEY);

    // Show banner if no consent or consent is older than 1 year
    if (!consent || !consentDate) {
      return true;
    }

    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    if (parseInt(consentDate) < oneYearAgo) {
      return true;
    }

    return false;
  });
  const { setEnabled } = useAnalytics();

  const handleAccept = () => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(CONSENT_KEY, 'true');
    window.localStorage.setItem(CONSENT_DATE_KEY, Date.now().toString());
    setEnabled(true);
    setShowBanner(false);
  };

  const handleDecline = () => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(CONSENT_KEY, 'false');
    window.localStorage.setItem(CONSENT_DATE_KEY, Date.now().toString());
    setEnabled(false);
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-2xl border border-gray-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Cookie className="w-8 h-8 text-blue-600" />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Privacy & Analytics
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    We use privacy-first analytics to understand how people use the Care Commons
                    showcase. This helps us improve the platform. We do not collect any personal
                    information, and all data stays anonymous. You can opt out at any time.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleAccept}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Accept Analytics
                    </button>
                    <button
                      onClick={handleDecline}
                      className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Decline
                    </button>
                    <a
                      href="https://docs.care-commons.org/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 text-blue-600 hover:text-blue-800 transition-colors font-medium text-center"
                    >
                      Privacy Policy
                    </a>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    What we track: Page views, feature exploration, tour completion rates, and role
                    switching patterns. What we don&apos;t track: Personal information, IP addresses,
                    or any identifying data.
                  </p>
                </div>

                <button
                  onClick={handleDecline}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
