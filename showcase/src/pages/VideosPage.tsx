import { Play, Clock, FileVideo, BookOpen } from 'lucide-react';
import { ShowcaseLayout } from '../components/ShowcaseLayout';

interface Video {
  title: string;
  duration: string;
  thumbnail: string;
  url: string;
  description: string;
  category: string;
}

const videos: Video[] = [
  {
    title: 'Getting Started with Care Commons',
    duration: '5:30',
    thumbnail: '/videos/thumbnails/getting-started.jpg',
    url: '/videos/getting-started.mp4',
    description: 'Overview of the platform and key features for new users',
    category: 'Getting Started'
  },
  {
    title: 'Platform Architecture Overview',
    duration: '7:15',
    thumbnail: '/videos/thumbnails/architecture.jpg',
    url: '/videos/architecture.mp4',
    description: 'Technical overview of the offline-first architecture and sync system',
    category: 'Getting Started'
  },
  {
    title: 'Coordinator Dashboard Walkthrough',
    duration: '8:45',
    thumbnail: '/videos/thumbnails/coordinator-dashboard.jpg',
    url: '/videos/coordinator-dashboard.mp4',
    description: 'Learn to navigate and use the coordinator dashboard effectively',
    category: 'For Coordinators'
  },
  {
    title: 'Creating and Scheduling Visits',
    duration: '6:20',
    thumbnail: '/videos/thumbnails/create-visit.jpg',
    url: '/videos/create-visit.mp4',
    description: 'Step-by-step guide to creating visits and using Smart Match',
    category: 'For Coordinators'
  },
  {
    title: 'Client Management Best Practices',
    duration: '9:30',
    thumbnail: '/videos/thumbnails/client-management.jpg',
    url: '/videos/client-management.mp4',
    description: 'Comprehensive guide to managing client profiles and care plans',
    category: 'For Coordinators'
  },
  {
    title: 'EVV Compliance and Billing',
    duration: '11:45',
    thumbnail: '/videos/thumbnails/evv-billing.jpg',
    url: '/videos/evv-billing.mp4',
    description: 'Understanding EVV requirements and automated billing workflows',
    category: 'For Coordinators'
  },
  {
    title: 'Mobile App for Caregivers',
    duration: '10:15',
    thumbnail: '/videos/thumbnails/mobile-app.jpg',
    url: '/videos/mobile-app.mp4',
    description: 'Complete guide to the caregiver mobile app workflow',
    category: 'For Caregivers'
  },
  {
    title: 'EVV Clock-In/Out Process',
    duration: '5:45',
    thumbnail: '/videos/thumbnails/evv-clockin.jpg',
    url: '/videos/evv-clockin.mp4',
    description: 'How to properly clock in and out with GPS and biometric verification',
    category: 'For Caregivers'
  },
  {
    title: 'Completing Care Tasks',
    duration: '8:20',
    thumbnail: '/videos/thumbnails/care-tasks.jpg',
    url: '/videos/care-tasks.mp4',
    description: 'Document care tasks, add photos, and complete visit checklists',
    category: 'For Caregivers'
  },
  {
    title: 'Working Offline',
    duration: '4:30',
    thumbnail: '/videos/thumbnails/offline-mode.jpg',
    url: '/videos/offline-mode.mp4',
    description: 'How the offline-first mobile app works without internet connection',
    category: 'For Caregivers'
  },
  {
    title: 'Family Portal Features',
    duration: '4:50',
    thumbnail: '/videos/thumbnails/family-portal.jpg',
    url: '/videos/family-portal.mp4',
    description: 'How family members can stay connected with care updates',
    category: 'For Family Members'
  },
  {
    title: 'Understanding Care Reports',
    duration: '6:10',
    thumbnail: '/videos/thumbnails/care-reports.jpg',
    url: '/videos/care-reports.mp4',
    description: 'How to read and interpret care summaries and progress reports',
    category: 'For Family Members'
  },
  {
    title: 'Admin Dashboard and Reporting',
    duration: '12:30',
    thumbnail: '/videos/thumbnails/admin-dashboard.jpg',
    url: '/videos/admin-dashboard.mp4',
    description: 'Understanding agency-wide metrics and generating reports',
    category: 'For Administrators'
  },
  {
    title: 'Multi-State Compliance',
    duration: '14:20',
    thumbnail: '/videos/thumbnails/compliance.jpg',
    url: '/videos/compliance.mp4',
    description: 'Managing operations across multiple states with different regulations',
    category: 'For Administrators'
  },
  {
    title: 'Payroll Processing',
    duration: '9:50',
    thumbnail: '/videos/thumbnails/payroll.jpg',
    url: '/videos/payroll.mp4',
    description: 'Review timesheets and process payroll from EVV records',
    category: 'For Administrators'
  },
  {
    title: 'Analytics and Business Intelligence',
    duration: '10:40',
    thumbnail: '/videos/thumbnails/analytics.jpg',
    url: '/videos/analytics.mp4',
    description: 'Using analytics dashboards to drive business decisions',
    category: 'For Administrators'
  }
];

function VideoCard({ video }: { video: Video }) {
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative bg-gray-200 aspect-video">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {video.duration}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{video.title}</h3>
        <p className="text-sm text-gray-600">{video.description}</p>
      </div>
    </div>
  );
}

export function VideosPage() {
  const categories = Array.from(new Set(videos.map(v => v.category)));

  return (
    <ShowcaseLayout
      title="Video Walkthroughs"
      description="Watch detailed video guides to learn how to use Care Commons effectively."
    >
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileVideo className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">16 Videos</h3>
              <p className="text-sm text-blue-700">
                Covering all major features and workflows
              </p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">2+ Hours</h3>
              <p className="text-sm text-purple-700">
                Of comprehensive training content
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">All Roles</h3>
              <p className="text-sm text-green-700">
                Content for coordinators, caregivers, family, and admins
              </p>
            </div>
          </div>
        </div>
      </div>

      {categories.map(category => (
        <section key={category} className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos
              .filter(video => video.category === category)
              .map(video => (
                <VideoCard key={video.url} video={video} />
              ))}
          </div>
        </section>
      ))}

      <div className="mt-12 space-y-4">
        <div className="p-6 bg-amber-50 rounded-lg border border-amber-200">
          <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            Placeholder Content
          </h3>
          <p className="text-amber-800 text-sm">
            These are placeholder video demonstrations. In a production deployment, actual video 
            walkthroughs would be recorded and hosted (e.g., via YouTube, Vimeo, or self-hosted). 
            Each video would include:
          </p>
          <ul className="mt-2 ml-6 list-disc text-sm text-amber-800 space-y-1">
            <li>Screen recordings with voice-over narration</li>
            <li>Real demonstrations using the showcase demo data</li>
            <li>Step-by-step tutorials for common workflows</li>
            <li>Callouts for important features and compliance considerations</li>
            <li>Closed captions for accessibility</li>
          </ul>
        </div>

        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            💡 Prefer Interactive Learning?
          </h3>
          <p className="text-blue-800 text-sm">
            Try our <a href="/tours" className="underline font-medium">interactive guided tours</a> instead! 
            Tours walk you through the actual interface with step-by-step highlights and explanations.
          </p>
        </div>
      </div>
    </ShowcaseLayout>
  );
}
