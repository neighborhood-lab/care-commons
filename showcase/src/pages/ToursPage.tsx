import { TourLauncher } from '../components/tours/TourLauncher';
import { TourOverview } from '../components/tours/TourOverview';
import {
  Users,
  Calendar,
  Smartphone,
  Home,
  BarChart3,
  ClipboardList,
  FileText,
  Zap,
  DollarSign,
  Sparkles
} from 'lucide-react';
import { ShowcaseLayout } from '../components/ShowcaseLayout';

export function ToursPage() {
  return (
    <ShowcaseLayout
      title="Interactive Tours"
      description="Learn how Care Commons works through guided, interactive tours for each role and module."
    >
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 rounded-lg p-3">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Experience Care Commons Through Interactive Guides
              </h2>
              <p className="text-gray-700 mb-4">
                Our interactive tours walk you through real workflows using actual demo data. 
                Each tour highlights key features, explains regulatory compliance considerations, 
                and demonstrates how different roles use the platform. Complete all tours to 
                become a Care Commons expert!
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2 text-blue-700">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Click-through demonstrations</span>
                </div>
                <div className="flex items-center gap-2 text-blue-700">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Real demo data included</span>
                </div>
                <div className="flex items-center gap-2 text-blue-700">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Track your progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tour Progress Overview */}
        <TourOverview />
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            For Coordinators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TourLauncher
              tourId="coordinator-overview"
              title="Dashboard Overview"
              description="Learn to navigate the coordinator dashboard and understand key metrics."
              duration="4 minutes"
              icon={<BarChart3 className="w-6 h-6" />}
            />
            <TourLauncher
              tourId="create-visit"
              title="Create & Schedule Visits"
              description="Step-by-step guide to creating visits and using Smart Match."
              duration="5 minutes"
              icon={<Calendar className="w-6 h-6" />}
            />
            <TourLauncher
              tourId="client-management"
              title="Client Management"
              description="Manage client profiles, demographics, and medical information."
              duration="3 minutes"
              icon={<Users className="w-6 h-6" />}
            />
            <TourLauncher
              tourId="care-plan"
              title="Care Plans & Tasks"
              description="Create personalized care plans with goals and task scheduling."
              duration="4 minutes"
              icon={<ClipboardList className="w-6 h-6" />}
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
              description="Learn the full visit workflow from check-in to check-out with EVV."
              duration="6 minutes"
              icon={<Smartphone className="w-6 h-6" />}
            />
            <TourLauncher
              tourId="shift-matching"
              title="Find Open Shifts"
              description="Browse and accept open shifts that match your skills and availability."
              duration="3 minutes"
              icon={<Zap className="w-6 h-6" />}
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
              description="Discover how to stay connected with your loved one's care in real-time."
              duration="5 minutes"
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
              description="Understand agency-wide metrics, compliance, and reporting capabilities."
              duration="6 minutes"
              icon={<Users className="w-6 h-6" />}
            />
            <TourLauncher
              tourId="billing"
              title="Billing & Invoicing"
              description="Process EVV-based billing and manage invoices for all payer sources."
              duration="4 minutes"
              icon={<FileText className="w-6 h-6" />}
            />
            <TourLauncher
              tourId="payroll"
              title="Payroll Processing"
              description="Review timesheets and process payroll from verified EVV records."
              duration="4 minutes"
              icon={<DollarSign className="w-6 h-6" />}
            />
          </div>
        </section>

        <div className="mt-12 space-y-4">
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 Tour Tips
            </h3>
            <ul className="text-blue-800 text-sm space-y-2">
              <li>• Tours highlight specific elements on the page - follow the highlighted areas</li>
              <li>• You can pause or exit any tour at any time using the controls</li>
              <li>• Tours work best on the actual feature pages - navigate to the module first</li>
              <li>• Some tours require specific demo data to be loaded</li>
            </ul>
          </div>

          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">
              🎯 Learning Path Recommendation
            </h3>
            <ol className="text-green-800 text-sm space-y-2 list-decimal list-inside">
              <li>Start with "Dashboard Overview" to understand the layout</li>
              <li>Try "Client Management" to see how data is organized</li>
              <li>Follow "Care Plans & Tasks" to understand workflows</li>
              <li>Experience "Complete a Visit" from a caregiver's perspective</li>
              <li>Explore "Admin Dashboard" for the executive view</li>
            </ol>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
}
