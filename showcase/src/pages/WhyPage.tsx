import React from 'react';
import { Link } from 'react-router-dom';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import {
  Check,
  X,
  ArrowRight,
  Shield,
  DollarSign,
  Database,
  Code,
  Users,
  Lock,
  Unlock,
  Cloud,
  GitBranch,
  Heart,
  Scale,
  Zap,
  Globe,
  BookOpen,
} from 'lucide-react';

interface ComparisonRow {
  feature: string;
  description: string;
  openSource: string | boolean;
  proprietary: string | boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const comparisonData: ComparisonRow[] = [
  {
    feature: 'Source Code Access',
    description: 'Can you see, audit, and modify the code?',
    openSource: 'Full access - inspect, modify, contribute',
    proprietary: false,
    icon: Code,
  },
  {
    feature: 'Data Ownership',
    description: 'Who owns and controls your agency data?',
    openSource: 'You own it - export anytime, any format',
    proprietary: 'Vendor controls - limited export options',
    icon: Database,
  },
  {
    feature: 'Vendor Lock-In',
    description: 'How hard is it to switch providers?',
    openSource: 'None - take your data and code anywhere',
    proprietary: 'High - years of data trapped in proprietary formats',
    icon: Lock,
  },
  {
    feature: 'Pricing Model',
    description: 'How do you pay for the software?',
    openSource: 'Free self-hosted, or affordable managed hosting',
    proprietary: '$15-50+ per user per month, forever',
    icon: DollarSign,
  },
  {
    feature: 'Customization',
    description: 'Can you adapt the software to your needs?',
    openSource: 'Unlimited - modify any feature',
    proprietary: 'Limited - request features, wait months/years',
    icon: Zap,
  },
  {
    feature: 'Security Auditing',
    description: 'Can you verify the software is secure?',
    openSource: 'Yes - community-reviewed, transparent',
    proprietary: 'Trust the vendor - no independent verification',
    icon: Shield,
  },
  {
    feature: 'Deployment Options',
    description: 'Where can the software run?',
    openSource: 'Anywhere - your servers, any cloud, on-premise',
    proprietary: 'Vendor cloud only',
    icon: Cloud,
  },
  {
    feature: 'Community Support',
    description: 'Who helps when you have questions?',
    openSource: 'Active community + optional paid support',
    proprietary: 'Vendor support (quality varies)',
    icon: Users,
  },
  {
    feature: 'Feature Roadmap',
    description: 'Who decides what gets built?',
    openSource: 'Community-driven, you can contribute',
    proprietary: 'Vendor decides based on largest customers',
    icon: GitBranch,
  },
  {
    feature: 'Longevity',
    description: 'What happens if the company changes?',
    openSource: 'Code lives forever - community can maintain',
    proprietary: 'Acquired? Shutdown? You lose access',
    icon: Heart,
  },
];

const pricingComparison = [
  {
    tier: 'Small Agency (10 caregivers)',
    openSource: '$0 self-hosted or ~$99/mo managed',
    proprietary: '$150-500/month',
    savings: 'Save $50-400/month',
  },
  {
    tier: 'Medium Agency (50 caregivers)',
    openSource: '$0 self-hosted or ~$199/mo managed',
    proprietary: '$750-2,500/month',
    savings: 'Save $550-2,300/month',
  },
  {
    tier: 'Large Agency (200 caregivers)',
    openSource: '$0 self-hosted or ~$499/mo managed',
    proprietary: '$3,000-10,000/month',
    savings: 'Save $2,500-9,500/month',
  },
];

const philosophyPoints = [
  {
    title: 'Against Monopoly',
    description: 'Healthcare software should serve agencies and caregivers, not extract maximum value from them. Open source breaks the cycle of vendor dependence.',
    icon: Scale,
  },
  {
    title: 'Community Owned',
    description: 'Folk belongs to everyone who uses it. Improvements benefit all agencies, not just those who can pay for custom development.',
    icon: Users,
  },
  {
    title: 'Transparent by Design',
    description: 'Every line of code is public. Security researchers, regulators, and agencies can verify exactly how their data is handled.',
    icon: BookOpen,
  },
  {
    title: 'Built for the Field',
    description: 'Designed by people who understand home care - offline-first for caregivers in basements, compliance-aware for coordinators, audit-ready for administrators.',
    icon: Globe,
  },
];

export const WhyPage: React.FC = () => {
  return (
    <ShowcaseLayout>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
          Why Folk Care?
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Open source home care software that puts agencies first.
          No vendor lock-in. No per-user fees. No hidden costs.
        </p>
      </div>

      {/* Philosophy Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Our Philosophy
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {philosophyPoints.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-600 rounded-lg p-3">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {point.title}
                    </h3>
                    <p className="text-gray-600">{point.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Open Source vs. Proprietary
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 bg-green-50">
                    <div className="flex items-center gap-2">
                      <Unlock className="h-4 w-4" />
                      Open Source (Folk)
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 bg-gray-100">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Proprietary Vendors
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comparisonData.map((row) => {
                  const Icon = row.icon;
                  return (
                    <tr key={row.feature} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {row.feature}
                            </div>
                            <div className="text-sm text-gray-500">
                              {row.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 bg-green-50/50">
                        {typeof row.openSource === 'boolean' ? (
                          row.openSource ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )
                        ) : (
                          <div className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-green-800">
                              {row.openSource}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 bg-gray-50/50">
                        {typeof row.proprietary === 'boolean' ? (
                          row.proprietary ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )
                        ) : (
                          <div className="flex items-start gap-2">
                            <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-600">
                              {row.proprietary}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pricing Comparison */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Total Cost of Ownership
        </h2>
        <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
          Proprietary vendors charge per-user monthly fees that add up quickly.
          With Folk, you can self-host for free or use our affordable managed hosting.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {pricingComparison.map((tier) => (
            <div
              key={tier.tier}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {tier.tier}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Folk:</span>
                  <span className="font-semibold text-green-600">
                    {tier.openSource}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Typical Vendor:</span>
                  <span className="font-semibold text-gray-500">
                    {tier.proprietary}
                  </span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">
                      Your Savings:
                    </span>
                    <span className="font-bold text-green-600">
                      {tier.savings}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          * Pricing estimates based on typical industry rates. Actual vendor pricing varies.
        </p>
      </div>

      {/* Migration Section */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 mb-16 border border-amber-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Already Using Another System?
          </h2>
          <p className="text-gray-600 mb-6">
            We're building data migration tools to help you escape vendor lock-in.
            Import your clients, caregivers, and care plans from common formats.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-amber-200">
              CSV Import
            </div>
            <div className="bg-white rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-amber-200">
              Excel Import
            </div>
            <div className="bg-white rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-amber-200">
              OASIS Data
            </div>
            <div className="bg-white rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-amber-200">
              HL7/FHIR
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Take Back Control?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Experience Folk today. Try the interactive demo, explore the code,
          or deploy your own instance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Try the Demo
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="https://github.com/neighborhood-lab/folkcare"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
          >
            <Code className="h-5 w-5" />
            View Source Code
          </a>
        </div>
        <p className="mt-6 text-sm text-blue-200">
          100% open source under MIT license
        </p>
      </div>
    </ShowcaseLayout>
  );
};
