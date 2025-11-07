import { Play, Clock } from 'lucide-react';

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
    description: 'Overview of Care Commons and key features for new users',
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
    title: 'Mobile App for Caregivers',
    duration: '10:15',
    thumbnail: '/videos/thumbnails/mobile-app.jpg',
    url: '/videos/mobile-app.mp4',
    description: 'Complete guide to the caregiver mobile app workflow',
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
    title: 'Admin Dashboard and Reporting',
    duration: '12:30',
    thumbnail: '/videos/thumbnails/admin-dashboard.jpg',
    url: '/videos/admin-dashboard.mp4',
    description: 'Understanding agency-wide metrics and generating reports',
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
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Video Walkthroughs
      </h1>
      <p className="text-gray-600 mb-8">
        Watch detailed video guides to learn how to use Care Commons effectively.
      </p>

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

      <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">
          Note
        </h3>
        <p className="text-gray-700 text-sm">
          These are placeholder video demonstrations. In a production environment,
          actual video content would be hosted and embedded here. Videos would cover
          all major features and workflows for each user role.
        </p>
      </div>
    </div>
  );
}
