/**
 * Mobile-optimized task checklist page for caregivers
 *
 * Features:
 * - Swipe to complete gestures
 * - Large touch targets
 * - Visual feedback for completion
 * - Quick task filtering
 */

import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useIsMobile } from '@/core/hooks';
import { Card, Button } from '@/core/components';
import {
  CheckCircle,
  Circle,
  ChevronRight,
} from 'lucide-react';

interface Task {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface SwipeState {
  startX: number;
  currentX: number;
  isSwiping: boolean;
  taskId: string | null;
}

export const TaskChecklistPage: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const isMobile = useIsMobile();

  // Use visitId to prevent unused warning - will be used with API integration
  const _visitId = visitId;

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Morning routine assistance',
      description: 'Help with bathing, dressing, and grooming',
      completed: false,
      priority: 'high',
      category: 'Personal Care',
    },
    {
      id: '2',
      name: 'Medication reminder',
      description: '8:00 AM medications - see med list',
      completed: false,
      priority: 'high',
      category: 'Medication',
    },
    {
      id: '3',
      name: 'Prepare breakfast',
      description: 'Ensure proper nutrition and hydration',
      completed: false,
      priority: 'medium',
      category: 'Meal Prep',
    },
    {
      id: '4',
      name: 'Light housekeeping',
      description: 'Kitchen and bedroom tidying',
      completed: false,
      priority: 'low',
      category: 'Housekeeping',
    },
    {
      id: '5',
      name: 'Exercise routine',
      description: '15-minute stretching exercises',
      completed: false,
      priority: 'medium',
      category: 'Activities',
    },
  ]);

  const [filterBy, setFilterBy] = useState<'all' | 'pending' | 'completed'>('all');
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    currentX: 0,
    isSwiping: false,
    taskId: null,
  });

  const taskRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleTouchStart = (e: React.TouchEvent, taskId: string) => {
    if (!isMobile) return;
    setSwipeState({
      startX: e.touches[0].clientX,
      currentX: e.touches[0].clientX,
      isSwiping: true,
      taskId,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !swipeState.isSwiping) return;
    setSwipeState((prev) => ({
      ...prev,
      currentX: e.touches[0].clientX,
    }));
  };

  const handleTouchEnd = (taskId: string) => {
    if (!isMobile || !swipeState.isSwiping) return;

    const swipeDistance = swipeState.currentX - swipeState.startX;
    const threshold = 100; // pixels

    if (swipeDistance > threshold) {
      // Swiped right - complete task
      toggleTask(taskId);
    }

    setSwipeState({
      startX: 0,
      currentX: 0,
      isSwiping: false,
      taskId: null,
    });
  };

  const toggleTask = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const getSwipeOffset = (taskId: string): number => {
    if (!swipeState.isSwiping || swipeState.taskId !== taskId) return 0;
    const offset = swipeState.currentX - swipeState.startX;
    return Math.max(0, Math.min(offset, 150)); // Clamp between 0 and 150px
  };

  const getFilteredTasks = () => {
    switch (filterBy) {
      case 'pending':
        return tasks.filter((t) => !t.completed);
      case 'completed':
        return tasks.filter((t) => t.completed);
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const completionPercentage = (completedCount / totalCount) * 100;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={`space-y-${isMobile ? '4' : '6'} ${isMobile ? 'pb-6' : ''}`}>
      {/* Header */}
      <div>
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
          Task Checklist
        </h1>
        <p className="text-gray-600 mt-1">
          {completedCount} of {totalCount} tasks completed
        </p>
      </div>

      {/* Progress Bar */}
      <Card padding="md">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Overall Progress</span>
            <span className="font-semibold text-gray-900">{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filterBy === 'all' ? 'primary' : 'outline'}
          size={isMobile ? 'md' : 'sm'}
          onClick={() => setFilterBy('all')}
          className={isMobile ? 'min-h-[44px]' : ''}
        >
          All ({totalCount})
        </Button>
        <Button
          variant={filterBy === 'pending' ? 'primary' : 'outline'}
          size={isMobile ? 'md' : 'sm'}
          onClick={() => setFilterBy('pending')}
          className={isMobile ? 'min-h-[44px]' : ''}
        >
          Pending ({totalCount - completedCount})
        </Button>
        <Button
          variant={filterBy === 'completed' ? 'primary' : 'outline'}
          size={isMobile ? 'md' : 'sm'}
          onClick={() => setFilterBy('completed')}
          className={isMobile ? 'min-h-[44px]' : ''}
        >
          Completed ({completedCount})
        </Button>
      </div>

      {/* Swipe Instruction (Mobile Only) */}
      {isMobile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <ChevronRight className="h-5 w-5 text-blue-600 mt-0.5" />
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Swipe right on a task to mark it as complete
          </p>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const swipeOffset = getSwipeOffset(task.id);

          return (
            <div
              key={task.id}
              className="relative overflow-hidden rounded-lg"
              ref={(el) => (taskRefs.current[task.id] = el)}
            >
              {/* Swipe Background */}
              {isMobile && (
                <div
                  className={`absolute inset-0 ${
                    task.completed ? 'bg-gray-400' : 'bg-green-500'
                  } flex items-center justify-start pl-6 transition-opacity`}
                  style={{ opacity: swipeOffset > 20 ? 1 : 0 }}
                >
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              )}

              {/* Task Card */}
              <div
                className={`relative bg-white transition-transform touch-pan-y ${
                  task.completed ? 'opacity-60' : ''
                }`}
                style={{
                  transform: `translateX(${swipeOffset}px)`,
                }}
                onTouchStart={(e) => handleTouchStart(e, task.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(task.id)}
              >
                <Card
                  padding="md"
                  className={`border-2 ${
                    task.completed
                      ? 'bg-gray-50 border-gray-200'
                      : 'border-gray-200'
                  } ${isMobile ? 'min-h-[60px]' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex-shrink-0 ${isMobile ? 'mt-1' : 'mt-0.5'}`}
                    >
                      {task.completed ? (
                        <CheckCircle className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-green-600`} />
                      ) : (
                        <Circle className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-gray-400`} />
                      )}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`font-medium ${
                            task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                          } ${isMobile ? 'text-base' : 'text-sm'}`}
                        >
                          {task.name}
                        </h3>
                        <span
                          className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded border ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p
                          className={`text-gray-600 mt-1 ${
                            task.completed ? 'line-through' : ''
                          } ${isMobile ? 'text-sm' : 'text-xs'}`}
                        >
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-700`}>
                          {task.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete All Button */}
      {filteredTasks.some((t) => !t.completed) && (
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            setTasks((prevTasks) =>
              prevTasks.map((task) => ({ ...task, completed: true }))
            );
          }}
          className={`w-full ${isMobile ? 'min-h-[48px]' : ''}`}
        >
          <CheckCircle className="h-5 w-5" />
          Mark All Complete
        </Button>
      )}
    </div>
  );
};
