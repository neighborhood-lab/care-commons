import { Link } from 'react-router-dom';
import { Play, Users, Calendar, Smartphone, BarChart3, CheckCircle2 } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
  action: string;
  actionLink: string;
  icon: React.ComponentType<{ className?: string }>;
  estimated: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Take the Dashboard Tour',
    description: 'Get familiar with the coordinator dashboard and understand key metrics.',
    action: 'Start Dashboard Tour',
    actionLink: '/tours',
    icon: Play,
    estimated: '4 min'
  },
  {
    number: 2,
    title: 'Explore Client Management',
    description: 'Browse the demo client profiles to see realistic demographic data across TX, FL, and OH.',
    action: 'View Clients',
    actionLink: '/clients',
    icon: Users,
    estimated: '5 min'
  },
  {
    number: 3,
    title: 'Review the Scheduling System',
    description: 'See how visits are scheduled, matched with caregivers, and tracked with EVV compliance.',
    action: 'View Schedule',
    actionLink: '/scheduling',
    icon: Calendar,
    estimated: '6 min'
  },
  {
    number: 4,
    title: 'Try the Mobile Experience',
    description: 'Experience the caregiver mobile app with clock-in/out, task completion, and offline capabilities.',
    action: 'Open Mobile View',
    actionLink: '/mobile',
    icon: Smartphone,
    estimated: '7 min'
  },
  {
    number: 5,
    title: 'Check Admin Analytics',
    description: 'View agency-wide metrics, compliance tracking, and financial performance dashboards.',
    action: 'View Analytics',
    actionLink: '/analytics',
    icon: BarChart3,
    estimated: '5 min'
  }
];

export function QuickStartGuide() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
        <h3 className="text-xl font-bold text-white">Quick Start Guide</h3>
        <p className="text-purple-100 text-sm mt-1">
          New to Care Commons? Follow these steps to explore the platform (27 minutes total)
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = false; // Could track this in localStorage

            return (
              <div
                key={step.number}
                className={`relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                  isCompleted
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                {/* Step Number / Checkmark */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  isCompleted
                    ? 'bg-green-600 text-white'
                    : 'bg-purple-600 text-white'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>

                {/* Icon */}
                <div className={`flex-shrink-0 mt-0.5 ${
                  isCompleted ? 'text-green-600' : 'text-purple-600'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                  <div className="flex items-center gap-3">
                    <Link
                      to={step.actionLink}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        isCompleted
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {step.action}
                    </Link>
                    <span className="text-xs text-gray-500">{step.estimated}</span>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-14 w-0.5 h-8 bg-gray-200" />
                )}
              </div>
            );
          })}
        </div>

        {/* Completion Message */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Pro tip:</strong> After completing these steps, switch between different roles 
            using the role selector to see how each user type experiences the platform. Try Patient, 
            Family Member, Caregiver, Coordinator, and Admin views!
          </p>
        </div>
      </div>
    </div>
  );
}
