/**
 * Plausible Analytics Integration
 *
 * Privacy-friendly, lightweight analytics (<1KB)
 * - No cookies
 * - GDPR compliant
 * - Self-hostable
 *
 * Configuration via environment variables:
 * - VITE_PLAUSIBLE_DOMAIN: Your domain (e.g., "folk.care")
 * - VITE_PLAUSIBLE_API_HOST: Optional custom Plausible instance (default: https://plausible.io)
 */

export function initializePlausible(): void {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  const apiHost = import.meta.env.VITE_PLAUSIBLE_API_HOST || 'https://plausible.io';

  // Skip if no domain configured
  if (!domain) {
    console.log('[Plausible] Skipping analytics - VITE_PLAUSIBLE_DOMAIN not set');
    return;
  }

  // Skip in development unless explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_PLAUSIBLE_ENABLED_IN_DEV) {
    console.log('[Plausible] Skipping analytics in development mode');
    return;
  }

  try {
    // Create and inject Plausible script
    const script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = domain;
    script.dataset.api = `${apiHost}/api/event`;
    script.src = `${apiHost}/js/script.js`;

    // Add script to document head
    document.head.appendChild(script);

    console.log(`[Plausible] Analytics initialized for domain: ${domain}`);
  } catch (error) {
    console.error('[Plausible] Failed to initialize analytics:', error);
  }
}

/**
 * Track custom event
 * @param eventName - Name of the event (e.g., "signup", "download")
 * @param props - Optional event properties
 */
export function trackEvent(eventName: string, props?: Record<string, string | number>): void {
  if (typeof window === 'undefined') return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plausible = (window as any).plausible;

  if (plausible) {
    plausible(eventName, { props });
  }
}
