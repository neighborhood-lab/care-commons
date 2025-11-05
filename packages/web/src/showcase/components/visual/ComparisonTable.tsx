/**
 * Feature Comparison Table
 *
 * Compares showcase vs. full demo features
 */

import React from 'react';
import {
  Server,
  Database,
  Lock,
  RefreshCw,
  Users,
  HardDrive,
  MapPin,
  Smartphone,
  Zap,
  Compass,
  CheckCircle,
  X,
  Check,
} from 'lucide-react';

interface ComparisonItem {
  feature: string;
  showcase: string | React.ReactNode;
  fullDemo: string | React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

interface ComparisonCategory {
  category: string;
  items: ComparisonItem[];
}

const comparisonData: ComparisonCategory[] = [
  {
    category: 'Infrastructure',
    items: [
      {
        feature: 'Hosting',
        showcase: 'GitHub Pages (Static)',
        fullDemo: 'Vercel (SSR + API)',
        icon: Server,
      },
      {
        feature: 'Data Storage',
        showcase: 'Browser localStorage',
        fullDemo: 'PostgreSQL + Neon',
        icon: Database,
      },
      {
        feature: 'Authentication',
        showcase: 'None (open access)',
        fullDemo: 'JWT with refresh tokens',
        icon: Lock,
      },
      {
        feature: 'Real-time Sync',
        showcase: <X className="h-5 w-5 text-red-500" />,
        fullDemo: <Check className="h-5 w-5 text-green-500" />,
        icon: RefreshCw,
      },
    ],
  },
  {
    category: 'Features',
    items: [
      {
        feature: 'Role Switching',
        showcase: '✓ Instant',
        fullDemo: '✓ Full auth required',
        icon: Users,
      },
      {
        feature: 'Data Persistence',
        showcase: 'Browser only',
        fullDemo: 'Database + backup',
        icon: HardDrive,
      },
      {
        feature: 'EVV Compliance',
        showcase: 'UI simulation',
        fullDemo: 'Full GPS + validation',
        icon: MapPin,
      },
      {
        feature: 'Mobile App',
        showcase: 'Simulated UI',
        fullDemo: 'Native React Native',
        icon: Smartphone,
      },
    ],
  },
  {
    category: 'Use Cases',
    items: [
      {
        feature: 'Quick Demo',
        showcase: <><Check className="h-5 w-5 text-green-500 inline" /> Perfect</>,
        fullDemo: 'Requires signup',
        icon: Zap,
      },
      {
        feature: 'Feature Exploration',
        showcase: <><Check className="h-5 w-5 text-green-500 inline" /> Excellent</>,
        fullDemo: <><Check className="h-5 w-5 text-green-500 inline" /> Full access</>,
        icon: Compass,
      },
      {
        feature: 'Production Use',
        showcase: <><X className="h-5 w-5 text-red-500 inline" /> Demo only</>,
        fullDemo: <><Check className="h-5 w-5 text-green-500 inline" /> Production-ready</>,
        icon: CheckCircle,
      },
      {
        feature: 'Team Collaboration',
        showcase: <><X className="h-5 w-5 text-red-500 inline" /> Local only</>,
        fullDemo: <><Check className="h-5 w-5 text-green-500 inline" /> Multi-user</>,
        icon: Users,
      },
    ],
  },
];

export const ComparisonTable: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Showcase vs. Full Demo</h2>
        <p className="text-purple-100">
          Understand the differences between this interactive showcase and the full production-ready demo
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Showcase (This Site)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                Full Demo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comparisonData.map((category) => (
              <React.Fragment key={category.category}>
                {/* Category Header */}
                <tr className="bg-gray-100">
                  <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-gray-900">
                    {category.category}
                  </td>
                </tr>

                {/* Category Items */}
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <tr key={item.feature} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{item.feature}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.showcase}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium bg-blue-50">
                        {item.fullDemo}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 p-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Want to try the full demo with database persistence and authentication?
          </p>
          <a
            href="https://care-commons.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Visit Full Demo →
          </a>
        </div>
      </div>
    </div>
  );
};
