import React from 'react';
import { Link } from 'react-router-dom';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import {
  ArrowRight,
  Monitor,
  Smartphone,
} from 'lucide-react';

export const LandingPage: React.FC = () => {

  return (
    <ShowcaseLayout>
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-3">
          Care Commons
        </h1>
        <p className="text-lg text-gray-600">
          Care coordination platform
        </p>
      </div>

      {/* Experience Selection */}
      <div className="mb-20">
        <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
          {/* Desktop/Web Experience */}
          <Link
            to="/dashboard"
            className="group bg-white rounded-lg border border-gray-200 p-8 hover:border-blue-600 hover:shadow-md transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-600 rounded-lg p-3 mb-4">
                <Monitor className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Web
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Full platform
              </p>
              <div className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                Enter
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          {/* Mobile App Experience */}
          <Link
            to="/mobile"
            className="group bg-white rounded-lg border border-gray-200 p-8 hover:border-blue-600 hover:shadow-md transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-600 rounded-lg p-3 mb-4">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Mobile
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Caregiver app
              </p>
              <div className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                Enter
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>

    </ShowcaseLayout>
  );
};
