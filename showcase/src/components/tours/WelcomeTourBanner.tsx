import { useState, useEffect } from 'react';
import { X, Compass, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WelcomeTourBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const hasDismissed = localStorage.getItem('welcome-tour-banner-dismissed');
    const hasCompletedAnyTour = Object.keys(localStorage).some(key => 
      key.startsWith('tour-completed-')
    );

    // Show banner if not dismissed and no tours completed
    if (!hasDismissed && !hasCompletedAnyTour) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('welcome-tour-banner-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg overflow-hidden mb-8">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      <div className="relative px-6 py-5">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          aria-label="Dismiss welcome banner"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex items-start gap-4 pr-8">
          <div className="flex-shrink-0 mt-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-3">
              <Compass className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white mb-2">
              Welcome to Care Commons! 👋
            </h3>
            <p className="text-blue-100 mb-4 max-w-2xl">
              New to the platform? Take an interactive guided tour to learn how Care Commons 
              helps home healthcare agencies manage clients, caregivers, compliance, and more.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Link
                to="/tours"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                <Play className="h-4 w-4" />
                Start Interactive Tour
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
              >
                Explore on My Own
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
