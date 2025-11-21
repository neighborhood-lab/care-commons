/**
 * MobileSimulator Component
 * 
 * Displays a mobile app in a phone simulator frame.
 * Can embed either an iframe (for Expo web) or render content directly.
 * 
 * Usage:
 * ```tsx
 * <MobileSimulator 
 *   src="http://localhost:8081" 
 *   title="Caregiver Mobile App"
 * />
 * ```
 */

import React, { useState } from 'react';

export interface MobileSimulatorProps {
  /** URL to embed (typically Expo web dev server) */
  src?: string;
  /** Title shown above the simulator */
  title?: string;
  /** Device type to simulate */
  device?: 'iphone' | 'android';
  /** Optional children to render instead of iframe */
  children?: React.ReactNode;
  /** Whether to show device chrome (status bar, home indicator) */
  showChrome?: boolean;
  /** Optional className for custom styling */
  className?: string;
  /** Whether simulator is loading */
  isLoading?: boolean;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  src,
  title = 'Mobile App',
  device = 'iphone',
  children,
  showChrome = true,
  className = '',
  isLoading = false,
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Detect localhost connection failures (iframe doesn't fire onError for network issues)
  React.useEffect(() => {
    if (!src) return undefined;

    // If localhost and not loaded after 5 seconds, assume it's not running
    if (src.includes('localhost') || src.includes('127.0.0.1')) {
      const timeout = setTimeout(() => {
        if (!iframeLoaded) {
          setIframeError(true);
        }
      }, 5000);

      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [src, iframeLoaded]);

  // iPhone 14 Pro dimensions (in logical pixels)
  const width = 393;
  const height = 852;

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIframeLoaded(false);
  };

  return (
    <div className={`mobile-simulator ${className}`}>
      {/* Title */}
      {title && (
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {device === 'iphone' ? 'iPhone 14 Pro' : 'Android Device'}
          </p>
        </div>
      )}

      {/* Device Frame */}
      <div 
        className="relative mx-auto bg-black rounded-[3rem] shadow-2xl overflow-hidden"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          padding: showChrome ? '12px' : '0',
        }}
      >
        {/* Device Chrome - Status Bar */}
        {showChrome && (
          <div className="absolute top-0 left-0 right-0 h-12 bg-transparent z-50 flex items-center justify-between px-6 text-white text-xs">
            <div className="flex items-center gap-1">
              <span>9:41</span>
            </div>
            <div className="w-24 h-6 bg-black rounded-full" /> {/* Dynamic Island */}
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M17 10v1.126c.367.095.714.24 1.032.428l.796-.797 1.415 1.415-.797.796c.188.318.333.665.428 1.032H21v2h-1.126c-.095.367-.24.714-.428 1.032l.797.796-1.415 1.415-.796-.797a4.993 4.993 0 01-1.032.428V20h-2v-1.126a4.993 4.993 0 01-1.032-.428l-.796.797-1.415-1.415.797-.796A4.993 4.993 0 0110.126 16H9v-2h1.126c.095-.367.24-.714.428-1.032l-.797-.796 1.415-1.415.796.797A4.993 4.993 0 0113 10.126V9h2v1.126a4.993 4.993 0 011.032.428l.796-.797 1.415 1.415-.797.796c.188.318.333.665.428 1.032H19v-2h-2z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">100%</span>
            </div>
          </div>
        )}

        {/* Screen Content */}
        <div 
          className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden"
          style={{
            height: showChrome ? `${height - 24}px` : `${height}px`,
          }}
        >
          {/* Loading State */}
          {(isLoading || (!iframeLoaded && src && !iframeError)) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4" />
                <p className="text-sm text-gray-600">Loading mobile app...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {iframeError && src && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10 p-4">
              <div className="text-center max-w-xs">
                <div className="text-5xl mb-4">📱</div>
                <h4 className="text-base font-semibold text-gray-900 mb-2">
                  Mobile Dev Server Not Running
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  To view the live mobile app, start the dev server:
                </p>
                <code className="block bg-gray-800 text-white px-3 py-2 rounded text-xs mb-3 font-mono">
                  cd packages/mobile<br/>npm run web
                </code>
                <p className="text-xs text-gray-500">
                  Trying to connect to:<br/>
                  <span className="font-mono text-gray-700">{src}</span>
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          {children ? (
            <div className="w-full h-full overflow-auto">
              {children}
            </div>
          ) : src ? (
            <iframe
              src={src}
              className="w-full h-full border-0"
              title={title}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-popups"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center p-6">
                <div className="text-4xl mb-4">📱</div>
                <p className="text-sm text-gray-600">
                  No content to display
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Device Chrome - Home Indicator */}
        {showChrome && device === 'iphone' && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-32 h-1 bg-white rounded-full opacity-50" />
          </div>
        )}
      </div>

      {/* Instructions */}
      {src && !iframeError && (
        <div className="text-center mt-4 text-xs text-gray-500">
          <p>Interactive mobile app simulator</p>
          <p className="mt-1">Connected to: <span className="font-mono">{src}</span></p>
        </div>
      )}
    </div>
  );
};
