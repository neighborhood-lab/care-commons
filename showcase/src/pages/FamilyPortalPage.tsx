import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  MessageCircle,
  Calendar,
  Heart,
  Send,
  Clock,
  CheckCircle,
  Bell,
  FileText,
  Phone,
  MapPin,
  ChevronRight,
  Star,
  Activity,
  ClipboardList,
  User,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Sun,
  CloudRain,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

// Mock data
const messages = [
  {
    id: 1,
    from: 'Sarah M. (Caregiver)',
    avatar: 'SM',
    message: 'Good morning! Mom had a great breakfast today and we went for a short walk in the garden.',
    time: '9:15 AM',
    unread: true,
  },
  {
    id: 2,
    from: 'Care Coordinator',
    avatar: 'CC',
    message: 'Reminder: Dr. Johnson appointment scheduled for Thursday at 2:00 PM. Transportation has been arranged.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 3,
    from: 'Maria G. (Caregiver)',
    avatar: 'MG',
    message: 'Afternoon visit completed. All medications administered on schedule. Blood pressure: 128/82.',
    time: 'Yesterday',
    unread: false,
  },
];

const upcomingVisits = [
  {
    id: 1,
    caregiver: 'Sarah M.',
    type: 'Personal Care',
    date: 'Today',
    time: '2:00 PM - 4:00 PM',
    status: 'confirmed',
  },
  {
    id: 2,
    caregiver: 'James K.',
    type: 'Skilled Nursing',
    date: 'Tomorrow',
    time: '10:00 AM - 11:00 AM',
    status: 'confirmed',
  },
  {
    id: 3,
    caregiver: 'Sarah M.',
    type: 'Personal Care',
    date: 'Wed, Nov 6',
    time: '2:00 PM - 4:00 PM',
    status: 'pending',
  },
];

const carePlanTasks = [
  { id: 1, task: 'Morning medication (Metformin)', completed: true, time: '8:00 AM' },
  { id: 2, task: 'Blood pressure check', completed: true, time: '9:00 AM' },
  { id: 3, task: 'Physical therapy exercises', completed: true, time: '10:30 AM' },
  { id: 4, task: 'Lunch preparation', completed: false, time: '12:00 PM' },
  { id: 5, task: 'Afternoon medication', completed: false, time: '2:00 PM' },
  { id: 6, task: 'Evening walk', completed: false, time: '4:00 PM' },
];

const notifications = [
  { id: 1, type: 'visit', message: 'Sarah M. clocked in for afternoon visit', time: '2 min ago' },
  { id: 2, type: 'task', message: 'Blood pressure check completed: 128/82', time: '1 hour ago' },
  { id: 3, type: 'message', message: 'New message from Care Coordinator', time: '3 hours ago' },
];

// Recent visits awaiting feedback
const recentVisitsForFeedback = [
  {
    id: 1,
    caregiver: 'Sarah M.',
    avatar: 'SM',
    type: 'Personal Care',
    date: 'Yesterday',
    time: '2:00 PM - 4:00 PM',
    feedback: null as 'positive' | 'negative' | null,
  },
  {
    id: 2,
    caregiver: 'Maria G.',
    avatar: 'MG',
    type: 'Skilled Nursing',
    date: 'Nov 2',
    time: '10:00 AM - 11:00 AM',
    feedback: null as 'positive' | 'negative' | null,
  },
];

// Wellness check-in history
const wellnessHistory = [
  { date: 'Yesterday', status: 'great' as const, note: '' },
  { date: 'Nov 2', status: 'good' as const, note: '' },
  { date: 'Nov 1', status: 'good' as const, note: 'Felt a bit tired' },
  { date: 'Oct 31', status: 'okay' as const, note: 'Had some trouble sleeping' },
  { date: 'Oct 30', status: 'great' as const, note: '' },
];

type WellnessStatus = 'great' | 'good' | 'okay' | 'need-help';

export const FamilyPortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'schedule' | 'careplan'>('overview');
  const [messageText, setMessageText] = useState('');
  const [visitFeedback, setVisitFeedback] = useState<Record<number, { rating: 'positive' | 'negative'; submitted: boolean }>>({});
  const [feedbackComment, setFeedbackComment] = useState<Record<number, string>>({});
  const [showThankYou, setShowThankYou] = useState<number | null>(null);
  const thankYouTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wellness check-in state
  const [todayCheckin, setTodayCheckin] = useState<WellnessStatus | null>(null);
  const [checkinNote, setCheckinNote] = useState('');
  const [checkinSubmitted, setCheckinSubmitted] = useState(false);
  const [showCheckinHistory, setShowCheckinHistory] = useState(false);

  const completedTasks = carePlanTasks.filter(t => t.completed).length;
  const totalTasks = carePlanTasks.length;

  // Memoize pending feedback count to avoid recalculating on every render
  const pendingFeedbackCount = useMemo(
    () => recentVisitsForFeedback.filter(v => !visitFeedback[v.id]?.submitted).length,
    [visitFeedback]
  );

  // Cleanup timeout on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (thankYouTimeoutRef.current) {
        clearTimeout(thankYouTimeoutRef.current);
      }
    };
  }, []);

  const handleFeedback = (visitId: number, rating: 'positive' | 'negative') => {
    setVisitFeedback(prev => ({
      ...prev,
      [visitId]: { rating, submitted: false }
    }));
  };

  const submitFeedback = (visitId: number) => {
    setVisitFeedback(prev => ({
      ...prev,
      [visitId]: { ...prev[visitId], submitted: true }
    }));
    setShowThankYou(visitId);
    // Clear any existing timeout before setting a new one
    if (thankYouTimeoutRef.current) {
      clearTimeout(thankYouTimeoutRef.current);
    }
    thankYouTimeoutRef.current = setTimeout(() => setShowThankYou(null), 3000);
  };

  const submitWellnessCheckin = () => {
    if (todayCheckin) {
      setCheckinSubmitted(true);
    }
  };

  const getWellnessStatusConfig = (status: WellnessStatus) => {
    switch (status) {
      case 'great':
        return { icon: Sparkles, color: 'text-green-600', bg: 'bg-green-100', label: 'Great' };
      case 'good':
        return { icon: Sun, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Good' };
      case 'okay':
        return { icon: CloudRain, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Okay' };
      case 'need-help':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', label: 'Need Help' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Family Engagement Portal</h1>
              <p className="mt-2 text-gray-600">Keep families connected and informed</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Dorothy Chen&apos;s Family</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-4 border-b border-gray-200 -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'messages', label: 'Messages', icon: MessageCircle },
              { id: 'schedule', label: 'Schedule', icon: Calendar },
              { id: 'careplan', label: 'Care Plan', icon: ClipboardList },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Families</p>
                <p className="text-2xl font-bold text-gray-900">128</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messages Today</p>
                <p className="text-2xl font-bold text-gray-900">45</p>
                <p className="text-xs text-green-600 mt-1">3 unread</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Visits</p>
                <p className="text-2xl font-bold text-gray-900">87</p>
                <p className="text-xs text-blue-600 mt-1">Next: Today 2pm</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">4.8/5</p>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-3 h-3 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-400'}`} />
                  ))}
                </div>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Notifications */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6" data-tour="activity-feed">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        notif.type === 'visit' ? 'bg-blue-100' :
                        notif.type === 'task' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        {notif.type === 'visit' ? <MapPin className="w-4 h-4 text-blue-600" /> :
                         notif.type === 'task' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                         <MessageCircle className="w-4 h-4 text-purple-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visit Feedback Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6" data-tour="visit-feedback">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">How Was Your Visit?</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {pendingFeedbackCount} awaiting feedback
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Your feedback helps us ensure quality care. Just tap thumbs up or down!
                </p>
                <div className="space-y-4">
                  {recentVisitsForFeedback.map((visit) => {
                    const feedback = visitFeedback[visit.id];
                    const isSubmitted = feedback?.submitted;
                    const isThankYou = showThankYou === visit.id;

                    if (isSubmitted && !isThankYou) return null;

                    return (
                      <div key={visit.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        {isThankYou ? (
                          <div className="flex items-center justify-center gap-2 py-4 text-green-600">
                            <Smile className="w-6 h-6" />
                            <span className="font-medium">Thank you for your feedback!</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm">
                                {visit.avatar}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{visit.caregiver}</p>
                                <p className="text-sm text-gray-600">{visit.type} • {visit.date}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3" role="group" aria-label="Rate this visit">
                              <button
                                onClick={() => handleFeedback(visit.id, 'positive')}
                                aria-label={`Rate visit with ${visit.caregiver} as great`}
                                aria-pressed={feedback?.rating === 'positive'}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                                  feedback?.rating === 'positive'
                                    ? 'bg-green-50 border-green-500 text-green-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                                }`}
                              >
                                <ThumbsUp className={`w-5 h-5 ${feedback?.rating === 'positive' ? 'fill-green-500' : ''}`} />
                                <span className="font-medium">Great!</span>
                              </button>
                              <button
                                onClick={() => handleFeedback(visit.id, 'negative')}
                                aria-label={`Rate visit with ${visit.caregiver} as could be better`}
                                aria-pressed={feedback?.rating === 'negative'}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                                  feedback?.rating === 'negative'
                                    ? 'bg-red-50 border-red-500 text-red-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50'
                                }`}
                              >
                                <ThumbsDown className={`w-5 h-5 ${feedback?.rating === 'negative' ? 'fill-red-500' : ''}`} />
                                <span className="font-medium">Could be better</span>
                              </button>
                            </div>

                            {feedback?.rating && (
                              <div className="mt-3 space-y-2">
                                <textarea
                                  placeholder={feedback.rating === 'positive'
                                    ? "What did you appreciate? (optional)"
                                    : "What could be improved? (optional)"
                                  }
                                  value={feedbackComment[visit.id] || ''}
                                  onChange={(e) => setFeedbackComment(prev => ({
                                    ...prev,
                                    [visit.id]: e.target.value
                                  }))}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                  rows={2}
                                />
                                <button
                                  onClick={() => submitFeedback(visit.id)}
                                  className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                  Submit Feedback
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {recentVisitsForFeedback.every(v => visitFeedback[v.id]?.submitted) && !showThankYou && (
                    <div className="text-center py-6 text-gray-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p className="font-medium">All caught up!</p>
                      <p className="text-sm">No visits awaiting feedback</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Today's Care Plan Progress */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6" data-tour="care-plan">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Care Plan</h3>
                  <span className="text-sm text-gray-500">{completedTasks}/{totalTasks} completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                  ></div>
                </div>
                <div className="space-y-3">
                  {carePlanTasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        task.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300'
                      }`}>
                        {task.completed && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {task.task}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">{task.time}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View full care plan <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Next Visit */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6" data-tour="upcoming-visits">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Visit</h3>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-medium">
                      SM
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Sarah M.</p>
                      <p className="text-sm text-gray-600">Personal Care</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Today</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>2:00 PM - 4:00 PM</span>
                    </div>
                  </div>
                  <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Contact Caregiver
                  </button>
                </div>
              </div>

              {/* Daily Wellness Check-in */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6" data-tour="wellness-checkin">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Daily Check-in</h3>
                  {!checkinSubmitted && (
                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      Today
                    </span>
                  )}
                </div>

                {checkinSubmitted ? (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="font-medium text-gray-900">Check-in Complete!</p>
                    <p className="text-sm text-gray-600 mt-1">
                      You reported feeling {todayCheckin && getWellnessStatusConfig(todayCheckin)?.label.toLowerCase()}
                    </p>
                    <button
                      onClick={() => setShowCheckinHistory(!showCheckinHistory)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showCheckinHistory ? 'Hide history' : 'View history'}
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">How is Dorothy feeling today?</p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {(['great', 'good', 'okay', 'need-help'] as WellnessStatus[]).map((status) => {
                        const config = getWellnessStatusConfig(status);
                        const Icon = config.icon;
                        return (
                          <button
                            key={status}
                            onClick={() => setTodayCheckin(status)}
                            aria-label={`Rate wellness as ${config.label}`}
                            aria-pressed={todayCheckin === status}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                              todayCheckin === status
                                ? `${config.bg} border-current ${config.color}`
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{config.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {todayCheckin && (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Any notes? (optional)"
                          value={checkinNote}
                          onChange={(e) => setCheckinNote(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                        />
                        <button
                          onClick={submitWellnessCheckin}
                          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                            todayCheckin === 'need-help'
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {todayCheckin === 'need-help' ? 'Submit & Alert Care Team' : 'Submit Check-in'}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Check-in History */}
                {showCheckinHistory && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Check-ins</h4>
                    <div className="space-y-2">
                      {wellnessHistory.slice(0, 5).map((entry, index) => {
                        const config = getWellnessStatusConfig(entry.status);
                        const Icon = config.icon;
                        return (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <div className={`p-1.5 rounded-full ${config.bg}`}>
                              <Icon className={`w-3 h-3 ${config.color}`} />
                            </div>
                            <span className="text-gray-600 flex-1">{entry.date}</span>
                            <span className={`font-medium ${config.color}`}>{config.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6" data-tour="messaging">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Send Message</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">Request Schedule Change</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">View Billing</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Phone className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-gray-900">Emergency Contact</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {messages.map((msg) => (
                <div key={msg.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${msg.unread ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-200 text-gray-700 w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm">
                      {msg.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{msg.from}</p>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">{msg.message}</p>
                    </div>
                    {msg.unread && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Visits</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingVisits.map((visit) => (
                <div key={visit.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 text-blue-700 w-12 h-12 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs font-medium">{visit.date.split(',')[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{visit.caregiver}</p>
                        <p className="text-sm text-gray-600">{visit.type}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {visit.time}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      visit.status === 'confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {visit.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'careplan' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Care Plan Tasks</h3>
              <div className="text-sm text-gray-500">
                {completedTasks}/{totalTasks} tasks completed today
              </div>
            </div>
            <div className="space-y-4">
              {carePlanTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    task.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {task.completed && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {task.task}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">{task.time}</span>
                  {task.completed && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Completed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
          <h3 className="font-semibold text-gray-900 mb-4">Family Portal Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Real-time Updates</h4>
                <p className="text-sm text-gray-600">Instant notifications when caregivers clock in/out</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Secure Messaging</h4>
                <p className="text-sm text-gray-600">HIPAA-compliant communication with care team</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <ClipboardList className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Care Plan Visibility</h4>
                <p className="text-sm text-gray-600">Track daily tasks and care progress</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Simple Feedback</h4>
                <p className="text-sm text-gray-600">Quick thumbs up/down after each visit</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Sun className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Wellness Check-ins</h4>
                <p className="text-sm text-gray-600">Daily status updates with optional alerts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
