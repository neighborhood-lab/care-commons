import React from 'react';
import { Link } from 'react-router-dom';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import { useRole, type UserRole, rolePersonas } from '../contexts/RoleContext';
import {
  Users,
  ClipboardList,
  CheckSquare,
  UserCheck,
  Calendar,
  FileText,
  Database,
  Laptop,
  Zap,
  ArrowRight,
  User,
  Heart,
  Briefcase,
  Shield,
  LayoutDashboard,
} from 'lucide-react';

const features = [
  {
    name: 'Client Demographics',
    description: 'Comprehensive client profiles with contact info, medical details, and emergency contacts.',
    icon: Users,
    href: '/clients',
    color: 'bg-blue-500',
  },
  {
    name: 'Care Plans',
    description: 'Create and manage personalized care plans with goals, assessments, and compliance tracking.',
    icon: ClipboardList,
    href: '/care-plans',
    color: 'bg-purple-500',
  },
  {
    name: 'Task Management',
    description: 'Schedule, track, and complete care tasks with EVV integration and digital signatures.',
    icon: CheckSquare,
    href: '/tasks',
    color: 'bg-green-500',
  },
  {
    name: 'Caregiver Management',
    description: 'Manage caregiver profiles, certifications, specializations, and availability.',
    icon: UserCheck,
    href: '/caregivers',
    color: 'bg-orange-500',
  },
  {
    name: 'Shift Matching',
    description: 'Smart shift matching system connecting caregivers with client needs.',
    icon: Calendar,
    href: '/shifts',
    color: 'bg-pink-500',
  },
  {
    name: 'Billing & Invoicing',
    description: 'Generate invoices, track payments, and manage billing workflows.',
    icon: FileText,
    href: '/billing',
    color: 'bg-indigo-500',
  },
];

const differences = [
  {
    feature: 'Data Persistence',
    showcase: 'Browser localStorage',
    fullDemo: 'PostgreSQL + Neon',
    icon: Database,
  },
  {
    feature: 'Deployment',
    showcase: 'GitHub Pages (static)',
    fullDemo: 'Vercel (SSR + API)',
    icon: Laptop,
  },
  {
    feature: 'API Layer',
    showcase: 'Mock provider (in-browser)',
    fullDemo: 'REST API + Serverless',
    icon: Zap,
  },
];

const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  patient: User,
  family: Heart,
  caregiver: Users,
  coordinator: Briefcase,
  admin: Shield,
};

const roleColors: Record<UserRole, string> = {
  patient: 'bg-blue-500',
  family: 'bg-pink-500',
  caregiver: 'bg-green-500',
  coordinator: 'bg-purple-500',
  admin: 'bg-gray-800',
};

export const LandingPage: React.FC = () => {
  const { setRole } = useRole();

  const handleRoleSelect = (role: UserRole) => {
    setRole(role);
  };

  return (
    <ShowcaseLayout>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
          Care Commons Showcase
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Experience the complete care coordination platform from multiple perspectives.
          All data runs locally in your browser - no backend required.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            View Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="https://care-commons.vercel.app/login"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border-2 border-blue-600 px-6 py-3 text-base font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Visit Full Demo
          </a>
        </div>
      </div>

      {/* Multi-Role Experience Section */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Experience From Different Perspectives
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Switch between roles to see how different users interact with the system.
            Click a persona to view their personalized dashboard.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(rolePersonas) as UserRole[]).map((role) => {
            const persona = rolePersonas[role];
            const Icon = roleIcons[role];
            return (
              <Link
                key={role}
                to="/dashboard"
                onClick={() => handleRoleSelect(role)}
                className="group bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`${roleColors[role]} rounded-lg p-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {persona.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {persona.description}
                    </p>
                    <div className="space-y-1">
                      {persona.primaryFeatures.slice(0, 3).map((feature, idx) => (
                        <p key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                          {feature}
                        </p>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Capabilities</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.name}
                to={feature.href}
                className="group relative bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`${feature.color} rounded-lg p-2`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">{feature.description}</p>
                <div className="absolute top-6 right-6 text-gray-400 group-hover:text-blue-600 transition-colors">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Showcase vs Full Demo */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Showcase vs. Full Demo
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Showcase (This Site)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Demo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {differences.map((row) => {
                const Icon = row.icon;
                return (
                  <tr key={row.feature}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {row.feature}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{row.showcase}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-blue-600 font-medium">{row.fullDemo}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This showcase runs entirely in your browser with no backend.
            Changes you make are saved to localStorage and will persist across page reloads.
            The full demo includes authentication, real-time sync, and production-grade infrastructure.
          </p>
        </div>
      </div>
    </ShowcaseLayout>
  );
};
