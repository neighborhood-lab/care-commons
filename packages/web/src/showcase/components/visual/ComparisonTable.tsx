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
    <div className="bg-warm-bgLight rounded-lg shadow-lg overflow-hidden border border-warm-brown/20">
      <div className="bg-gradient-to-r from-warm-rust to-warm-accent p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Showcase vs. Full Demo</h2>
        <p className="text-white/90">
          Understand the differences between this interactive showcase and the full production-ready demo
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-warm-bg border-b border-warm-brown/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-warm-textMuted uppercase tracking-wider">
                Feature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-warm-textMuted uppercase tracking-wider">
                Showcase (This Site)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-warm-textMuted uppercase tracking-wider bg-warm-accent/10">
                Full Demo
              </th>
            </tr>
          </thead>
          <tbody className="bg-warm-bgLight divide-y divide-warm-brown/20">
            {comparisonData.map((category) => (
              <React.Fragment key={category.category}>
                {/* Category Header */}
                <tr className="bg-warm-bg">
                  <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-warm-text">
                    {category.category}
                  </td>
                </tr>

                {/* Category Items */}
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <tr key={item.feature} className="hover:bg-warm-bg/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-warm-brown" />
                          <span className="text-sm font-medium text-warm-text">{item.feature}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-warm-textMuted">
                        {item.showcase}
                      </td>
                      <td className="px-6 py-4 text-sm text-warm-text font-medium bg-warm-accent/5">
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

      <div className="bg-warm-bg p-6 border-t border-warm-brown/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-warm-textMuted">
            Want to try the full demo with database persistence and authentication?
          </p>
          <a
            href="https://care-commons.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-warm-accent text-white rounded-lg hover:bg-warm-accentHover transition-colors font-semibold shadow-md"
          >
            Visit Full Demo →
          </a>
        </div>
      </div>
    </div>
  );
};
