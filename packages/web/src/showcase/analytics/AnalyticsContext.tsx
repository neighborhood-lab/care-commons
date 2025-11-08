/**
 * Analytics Context
 *
 * Privacy-first analytics for tracking showcase usage
 * No personal data collection, GDPR/CCPA compliant
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface AnalyticsEvent {
  event: string;
  category: string;
  label?: string;
  value?: number;
  timestamp: number;
}

interface AnalyticsContextValue {
  trackPageView: (page: string) => void;
  trackEvent: (category: string, action: string, label?: string, value?: number) => void;
  trackTourStart: (tourId: string) => void;
  trackTourComplete: (tourId: string, duration: number) => void;
  trackScenarioStart: (scenarioId: string) => void;
  trackScenarioComplete: (scenarioId: string, duration: number) => void;
  trackRoleSwitch: (fromRole: string | undefined, toRole: string) => void;
  trackVideoPlay: (videoId: string) => void;
  trackVideoComplete: (videoId: string, duration: number) => void;
  getAnalyticsSummary: () => AnalyticsSummary;
  clearAnalytics: () => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

interface AnalyticsSummary {
  totalEvents: number;
  pageViews: { [page: string]: number };
  toursStarted: number;
  toursCompleted: number;
  scenariosStarted: number;
  scenariosCompleted: number;
  roleSwitches: number;
  videosPlayed: number;
  videosCompleted: number;
  sessionDuration: number;
}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

const STORAGE_KEY = 'care-commons-analytics';
const CONSENT_KEY = 'care-commons-analytics-consent';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [sessionStart] = useState(() => Date.now());
  const [isEnabled, setIsEnabled] = useState(() => {
    // Check for user consent
    if (typeof window === 'undefined') return false;
    const consent = window.localStorage.getItem(CONSENT_KEY);
    return consent === 'true';
  });

  // Load events from storage on mount
  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AnalyticsEvent[];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEvents(parsed);
      }
    } catch (error) {
       
      console.error('Failed to load analytics:', error);
    }
  }, [isEnabled]);

  // Save events to storage whenever they change
  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }, [events, isEnabled]);

  const trackEvent = useCallback(
    (category: string, action: string, label?: string, value?: number) => {
      if (!isEnabled) return;

      const event: AnalyticsEvent = {
        event: action,
        category,
        label,
        value,
        timestamp: Date.now(),
      };

      setEvents(prev => [...prev, event]);

      // Also send to external analytics if configured
      if (typeof window !== 'undefined') {
        const globalWindow = window as typeof window & { gtag?: (event: string, action: string, params: Record<string, unknown>) => void };
        if (globalWindow.gtag) {
          globalWindow.gtag('event', action, {
            event_category: category,
            event_label: label,
            value,
          });
        }
      }
    },
    [isEnabled]
  );

  const trackPageView = useCallback(
    (page: string) => {
      trackEvent('Navigation', 'page_view', page);
    },
    [trackEvent]
  );

  const trackTourStart = useCallback(
    (tourId: string) => {
      trackEvent('Tour', 'tour_start', tourId);
    },
    [trackEvent]
  );

  const trackTourComplete = useCallback(
    (tourId: string, duration: number) => {
      trackEvent('Tour', 'tour_complete', tourId, duration);
    },
    [trackEvent]
  );

  const trackScenarioStart = useCallback(
    (scenarioId: string) => {
      trackEvent('Scenario', 'scenario_start', scenarioId);
    },
    [trackEvent]
  );

  const trackScenarioComplete = useCallback(
    (scenarioId: string, duration: number) => {
      trackEvent('Scenario', 'scenario_complete', scenarioId, duration);
    },
    [trackEvent]
  );

  const trackRoleSwitch = useCallback(
    (fromRole: string | undefined, toRole: string) => {
      trackEvent('Role', 'role_switch', `${fromRole || 'none'} -> ${toRole}`);
    },
    [trackEvent]
  );

  const trackVideoPlay = useCallback(
    (videoId: string) => {
      trackEvent('Video', 'video_play', videoId);
    },
    [trackEvent]
  );

  const trackVideoComplete = useCallback(
    (videoId: string, duration: number) => {
      trackEvent('Video', 'video_complete', videoId, duration);
    },
    [trackEvent]
  );

  const getAnalyticsSummary = useCallback((): AnalyticsSummary => {
    const pageViews: { [page: string]: number } = {};
    let toursStarted = 0;
    let toursCompleted = 0;
    let scenariosStarted = 0;
    let scenariosCompleted = 0;
    let roleSwitches = 0;
    let videosPlayed = 0;
    let videosCompleted = 0;

    for (const event of events) {
      if (event.category === 'Navigation' && event.event === 'page_view' && event.label) {
        pageViews[event.label] = (pageViews[event.label] || 0) + 1;
      } else if (event.category === 'Tour') {
        if (event.event === 'tour_start') toursStarted++;
        if (event.event === 'tour_complete') toursCompleted++;
      } else if (event.category === 'Scenario') {
        if (event.event === 'scenario_start') scenariosStarted++;
        if (event.event === 'scenario_complete') scenariosCompleted++;
      } else if (event.category === 'Role' && event.event === 'role_switch') {
        roleSwitches++;
      } else if (event.category === 'Video') {
        if (event.event === 'video_play') videosPlayed++;
        if (event.event === 'video_complete') videosCompleted++;
      }
    }

    return {
      totalEvents: events.length,
      pageViews,
      toursStarted,
      toursCompleted,
      scenariosStarted,
      scenariosCompleted,
      roleSwitches,
      videosPlayed,
      videosCompleted,
      sessionDuration: Date.now() - sessionStart,
    };
  }, [events, sessionStart]);

  const clearAnalytics = useCallback(() => {
    setEvents([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleSetEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CONSENT_KEY, enabled.toString());
    }
    if (!enabled) {
      // Clear analytics when disabled
      setEvents([]);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  return (
    <AnalyticsContext.Provider
      value={{
        trackPageView,
        trackEvent,
        trackTourStart,
        trackTourComplete,
        trackScenarioStart,
        trackScenarioComplete,
        trackRoleSwitch,
        trackVideoPlay,
        trackVideoComplete,
        getAnalyticsSummary,
        clearAnalytics,
        isEnabled,
        setEnabled: handleSetEnabled,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};
