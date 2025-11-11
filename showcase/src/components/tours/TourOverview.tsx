import { useState, useEffect } from 'react';
import { Award, BookOpen, Clock, TrendingUp } from 'lucide-react';

const ALL_TOUR_IDS = [
  'coordinator-overview',
  'create-visit',
  'caregiver-workflow',
  'family-portal',
  'admin-dashboard',
  'client-management',
  'care-plan',
  'billing',
  'shift-matching',
  'payroll'
];

export function TourOverview() {
  const [completedCount, setCompletedCount] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    // Count completed tours
    const completed = ALL_TOUR_IDS.filter(tourId => 
      localStorage.getItem(`tour-completed-${tourId}`) === 'true'
    ).length;
    
    setCompletedCount(completed);
    
    // Calculate total time spent (estimated)
    setTotalMinutes(completed * 5); // Average 5 minutes per tour
  }, []);

  const totalTours = ALL_TOUR_IDS.length;
  const completionPercentage = Math.round((completedCount / totalTours) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-2xl font-bold text-blue-900">{totalTours}</p>
            <p className="text-sm text-blue-700">Available Tours</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Award className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-2xl font-bold text-green-900">{completedCount}</p>
            <p className="text-sm text-green-700">Tours Completed</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-2xl font-bold text-purple-900">{completionPercentage}%</p>
            <p className="text-sm text-purple-700">Progress</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-2xl font-bold text-amber-900">{totalMinutes}m</p>
            <p className="text-sm text-amber-700">Time Invested</p>
          </div>
        </div>
      </div>
    </div>
  );
}
