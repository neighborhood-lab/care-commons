import { TourLauncher } from '../components/tours/TourLauncher';
import {
  Users,
  Calendar,
  Smartphone,
  Home,
  BarChart3
} from 'lucide-react';

export function ToursPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Interactive Tours
      </h1>
      <p className="text-gray-600 mb-8">
        Learn how Care Commons works through guided, interactive tours for each role.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            For Coordinators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TourLauncher
              tourId="coordinator-overview"
              title="Dashboard Overview"
              description="Learn to navigate the coordinator dashboard and understand key metrics."
              duration="3 minutes"
              icon={<BarChart3 className="w-6 h-6" />}
            />
            <TourLauncher
              tourId="create-visit"
              title="Create & Schedule Visits"
              description="Step-by-step guide to creating visits and using Smart Match."
              duration="4 minutes"
              icon={<Calendar className="w-6 h-6" />}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            For Caregivers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TourLauncher
              tourId="caregiver-workflow"
              title="Complete a Visit"
              description="Learn the full visit workflow from check-in to check-out."
              duration="5 minutes"
              icon={<Smartphone className="w-6 h-6" />}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            For Family Members
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TourLauncher
              tourId="family-portal"
              title="Family Portal Tour"
              description="Discover how to stay connected with your loved one's care."
              duration="3 minutes"
              icon={<Home className="w-6 h-6" />}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            For Administrators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TourLauncher
              tourId="admin-dashboard"
              title="Admin Dashboard"
              description="Understand agency-wide metrics and reporting capabilities."
              duration="4 minutes"
              icon={<Users className="w-6 h-6" />}
            />
          </div>
        </section>
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          Need help?
        </h3>
        <p className="text-blue-800 text-sm">
          Tours can be restarted at any time. Click the "?" icon in the top navigation to access tours from anywhere in the showcase.
        </p>
      </div>
    </div>
  );
}
