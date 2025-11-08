/**
 * Family Dashboard Page
 *
 * Main landing page for family members
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MessageCircle, ClipboardList, Heart } from 'lucide-react';
import { Card } from '@/core/components';

interface WorkflowCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ title, description, icon, to }) => {
  return (
    <Link to={to}>
      <Card 
        padding="lg" 
        className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-300"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <div className="text-primary-600">
              {icon}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </Card>
    </Link>
  );
};

export const FamilyDashboard: React.FC = () => {
  // For demo purposes, hardcode Gertrude Stein's name
  const patientName = 'Gertrude Stein';
  const firstName = 'Gertrude';

  const workflows = [
    {
      title: 'View Care Schedule',
      description: `See upcoming visits and care appointments for ${firstName}`,
      icon: <Calendar className="h-8 w-8" />,
      to: '/family-portal/schedule',
    },
    {
      title: 'Message Care Team',
      description: `Send messages and questions to ${firstName}'s caregivers`,
      icon: <MessageCircle className="h-8 w-8" />,
      to: '/family-portal/messages',
    },
    {
      title: 'Review Care Plan',
      description: `View ${firstName}'s care plan and daily activities`,
      icon: <ClipboardList className="h-8 w-8" />,
      to: '/family-portal/care-plan',
    },
    {
      title: 'Health Updates',
      description: `Access health reports and visit summaries for ${firstName}`,
      icon: <Heart className="h-8 w-8" />,
      to: '/family-portal/health-updates',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome family members of {patientName}
        </h1>
        <p className="text-xl text-gray-700">
          How can we provide exceptional care for {firstName} today?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {workflows.map((workflow) => (
          <WorkflowCard key={workflow.to} {...workflow} />
        ))}
      </div>
    </div>
  );
};
