/**
 * Video Walkthroughs Page
 *
 * Displays video tutorials for each vertical and role
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, User, Tag } from 'lucide-react';
import { VideoPlayer } from '../components/video/VideoPlayer';

interface VideoWalkthrough {
  id: string;
  title: string;
  description: string;
  vertical: string;
  role: string;
  duration: number; // in minutes
  thumbnail: string;
  videoSrc: string;
  captionsSrc?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Placeholder videos - replace with actual video URLs when available
const videoWalkthroughs: VideoWalkthrough[] = [
  {
    id: 'client-demographics-admin',
    title: 'Client Demographics Management',
    description: 'Learn how to manage client profiles, demographics, and documentation as an administrator',
    vertical: 'Client Demographics',
    role: 'Administrator',
    duration: 8,
    thumbnail: '/videos/thumbnails/client-demographics.jpg',
    videoSrc: '/videos/client-demographics-admin.mp4',
    tags: ['clients', 'demographics', 'admin'],
    difficulty: 'beginner',
  },
  {
    id: 'care-plans-coordinator',
    title: 'Creating and Managing Care Plans',
    description: 'Step-by-step guide to creating comprehensive care plans and assigning tasks to caregivers',
    vertical: 'Care Plans',
    role: 'Care Coordinator',
    duration: 10,
    thumbnail: '/videos/thumbnails/care-plans.jpg',
    videoSrc: '/videos/care-plans-coordinator.mp4',
    tags: ['care-plans', 'tasks', 'coordinator'],
    difficulty: 'intermediate',
  },
  {
    id: 'evv-caregiver',
    title: 'Mobile EVV: Clock In and Out',
    description: 'Complete guide to using the mobile app for electronic visit verification',
    vertical: 'Time Tracking & EVV',
    role: 'Caregiver',
    duration: 7,
    thumbnail: '/videos/thumbnails/evv.jpg',
    videoSrc: '/videos/evv-caregiver.mp4',
    tags: ['evv', 'mobile', 'caregiver'],
    difficulty: 'beginner',
  },
  {
    id: 'billing-admin',
    title: 'Billing and Invoicing',
    description: 'Generate invoices, track payments, and manage billing cycles',
    vertical: 'Billing & Invoicing',
    role: 'Administrator',
    duration: 12,
    thumbnail: '/videos/thumbnails/billing.jpg',
    videoSrc: '/videos/billing-admin.mp4',
    tags: ['billing', 'invoicing', 'admin'],
    difficulty: 'advanced',
  },
  {
    id: 'payroll-admin',
    title: 'Payroll Processing',
    description: 'Run payroll, review timesheets, and manage caregiver compensation',
    vertical: 'Payroll Processing',
    role: 'Administrator',
    duration: 9,
    thumbnail: '/videos/thumbnails/payroll.jpg',
    videoSrc: '/videos/payroll-admin.mp4',
    tags: ['payroll', 'timesheets', 'admin'],
    difficulty: 'intermediate',
  },
  {
    id: 'shift-matching-coordinator',
    title: 'Shift Matching and Scheduling',
    description: 'Match caregivers to open shifts and manage the scheduling workflow',
    vertical: 'Shift Matching',
    role: 'Care Coordinator',
    duration: 8,
    thumbnail: '/videos/thumbnails/shift-matching.jpg',
    videoSrc: '/videos/shift-matching-coordinator.mp4',
    tags: ['scheduling', 'shifts', 'coordinator'],
    difficulty: 'intermediate',
  },
  {
    id: 'family-portal-patient',
    title: 'Family Portal Overview',
    description: 'View care plans, communicate with caregivers, and track visits',
    vertical: 'Family Engagement',
    role: 'Patient/Family',
    duration: 6,
    thumbnail: '/videos/thumbnails/family-portal.jpg',
    videoSrc: '/videos/family-portal-patient.mp4',
    tags: ['family', 'portal', 'patient'],
    difficulty: 'beginner',
  },
];

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

export const VideoWalkthroughsPage: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoWalkthrough | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterVertical, setFilterVertical] = useState<string>('all');

  const filteredVideos = videoWalkthroughs.filter(video => {
    if (filterRole !== 'all' && video.role !== filterRole) return false;
    if (filterVertical !== 'all' && video.vertical !== filterVertical) return false;
    return true;
  });

  const roles = ['all', ...new Set(videoWalkthroughs.map(v => v.role))];
  const verticals = ['all', ...new Set(videoWalkthroughs.map(v => v.vertical))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Video Walkthroughs
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Watch step-by-step tutorials for each feature and role. Learn at your own pace with our comprehensive video guides.
          </p>
        </motion.div>

        {/* Video Player Modal */}
        {selectedVideo && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-5xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedVideo.title}</h2>
                    <p className="text-gray-600 mt-1">{selectedVideo.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                <VideoPlayer
                  src={selectedVideo.videoSrc}
                  poster={selectedVideo.thumbnail}
                  title={selectedVideo.title}
                  description={selectedVideo.description}
                  captions={selectedVideo.captionsSrc}
                  className="w-full aspect-video"
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Role
              </label>
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role === 'all' ? 'All Roles' : role}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Vertical
              </label>
              <select
                value={filterVertical}
                onChange={e => setFilterVertical(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {verticals.map(vertical => (
                  <option key={vertical} value={vertical}>
                    {vertical === 'all' ? 'All Verticals' : vertical}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setSelectedVideo(video)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-purple-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-8 h-8 text-blue-600 ml-1" />
                  </div>
                </div>
                {/* Placeholder for thumbnail - replace with actual image when available */}
                <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {video.duration} min
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{video.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{video.description}</p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    <User className="w-3 h-3" />
                    {video.role}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs capitalize ${difficultyColors[video.difficulty]}`}>
                    {video.difficulty}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {video.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredVideos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-600 text-lg">No videos found matching your filters.</p>
          </motion.div>
        )}

        {/* Production Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg"
        >
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Production Note</h3>
          <p className="text-yellow-800">
            Video walkthroughs are currently placeholders. Follow the video production guide in{' '}
            <code className="bg-yellow-100 px-2 py-1 rounded">docs/VIDEO_PRODUCTION_GUIDE.md</code>{' '}
            to create the actual video content. Once videos are recorded and uploaded, replace the{' '}
            <code className="bg-yellow-100 px-2 py-1 rounded">videoSrc</code> and{' '}
            <code className="bg-yellow-100 px-2 py-1 rounded">thumbnail</code> paths in{' '}
            <code className="bg-yellow-100 px-2 py-1 rounded">VideoWalkthroughsPage.tsx</code>.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
