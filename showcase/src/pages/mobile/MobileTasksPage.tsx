import React, { useState } from 'react';
import { MobileLayout } from '../../components/MobileLayout';
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  User,
  FileText,
  Pill,
  Heart,
  Home,
  Utensils,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  clientName: string;
  time: string;
  type: 'medication' | 'personal-care' | 'meal' | 'vital-signs' | 'documentation' | 'housekeeping';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  notes?: string;
}

export const MobileTasksPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Administer morning medications',
      clientName: 'Dorothy Chen',
      time: '2:00 PM',
      type: 'medication',
      priority: 'high',
      completed: false,
    },
    {
      id: '2',
      title: 'Assist with bathing',
      clientName: 'Dorothy Chen',
      time: '2:15 PM',
      type: 'personal-care',
      priority: 'high',
      completed: false,
    },
    {
      id: '3',
      title: 'Check vital signs',
      clientName: 'Robert Martinez',
      time: '4:00 PM',
      type: 'vital-signs',
      priority: 'medium',
      completed: false,
    },
    {
      id: '4',
      title: 'Prepare dinner',
      clientName: 'Robert Martinez',
      time: '4:30 PM',
      type: 'meal',
      priority: 'medium',
      completed: false,
    },
    {
      id: '5',
      title: 'Light housekeeping',
      clientName: 'Margaret Thompson',
      time: '6:00 PM',
      type: 'housekeeping',
      priority: 'low',
      completed: false,
    },
    {
      id: '6',
      title: 'Daily progress notes',
      clientName: 'James Wilson',
      time: '11:00 AM',
      type: 'documentation',
      priority: 'high',
      completed: true,
      notes: 'Client in good spirits, completed all activities',
    },
  ]);

  const getTaskIcon = (type: Task['type']) => {
    switch (type) {
      case 'medication':
        return <Pill className="h-5 w-5" />;
      case 'personal-care':
        return <User className="h-5 w-5" />;
      case 'meal':
        return <Utensils className="h-5 w-5" />;
      case 'vital-signs':
        return <Heart className="h-5 w-5" />;
      case 'documentation':
        return <FileText className="h-5 w-5" />;
      case 'housekeeping':
        return <Home className="h-5 w-5" />;
    }
  };

  const getTaskColor = (type: Task['type']) => {
    switch (type) {
      case 'medication':
        return 'bg-red-100 text-red-700';
      case 'personal-care':
        return 'bg-blue-100 text-blue-700';
      case 'meal':
        return 'bg-orange-100 text-orange-700';
      case 'vital-signs':
        return 'bg-pink-100 text-pink-700';
      case 'documentation':
        return 'bg-purple-100 text-purple-700';
      case 'housekeeping':
        return 'bg-green-100 text-green-700';
    }
  };

  const getPriorityIndicator = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return (
          <span className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="h-3 w-3" />
            High Priority
          </span>
        );
      case 'medium':
        return <span className="text-xs text-yellow-600">Medium Priority</span>;
      case 'low':
        return <span className="text-xs text-gray-500">Low Priority</span>;
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <MobileLayout title="My Tasks">
      <div className="p-4 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
          {[
            { key: 'pending', label: `Pending (${pendingCount})` },
            { key: 'completed', label: `Completed (${completedCount})` },
            { key: 'all', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Today's Progress</span>
            <span className="text-sm font-bold text-purple-600">
              {completedCount} / {tasks.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-600 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{
                width: `${(completedCount / tasks.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">
                {filter === 'pending' ? 'All tasks completed!' : 'No tasks found'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                  task.completed
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-100'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="mt-1 flex-shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400 hover:text-purple-600 transition-colors" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <div
                          className={`${getTaskColor(
                            task.type
                          )} p-2 rounded-lg flex-shrink-0`}
                        >
                          {getTaskIcon(task.type)}
                        </div>
                        <div className="flex-1">
                          <h3
                            className={`font-semibold ${
                              task.completed
                                ? 'text-gray-500 line-through'
                                : 'text-gray-900'
                            }`}
                          >
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {task.clientName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{task.time}</span>
                        </div>
                        {getPriorityIndicator(task.priority)}
                      </div>

                      {task.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600 italic">
                            {task.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!task.completed && (
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Mark Complete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
};
