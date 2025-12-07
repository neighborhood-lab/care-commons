/**
 * Prioritized Task List Component
 *
 * Beautiful mobile component that displays AI-prioritized tasks for caregivers.
 * Shows tasks ordered by urgency with visual indicators, reasoning, and patient context.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Badge, Card, CardContent } from '../index';
import type {
  PrioritizedTask,
  TaskPrioritizationResult,
} from '../../hooks/useTaskPrioritization';

interface PrioritizedTaskListProps {
  prioritization: TaskPrioritizationResult | null;
  loading: boolean;
  error: string | null;
  onRefresh?: () => Promise<void>;
  onTaskPress?: (task: PrioritizedTask) => void;
}

export function PrioritizedTaskList({
  prioritization,
  loading,
  error,
  onRefresh,
  onTaskPress,
}: PrioritizedTaskListProps) {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  // Loading state
  if (loading && !prioritization) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Analyzing patient condition...</Text>
        <Text style={styles.loadingSubtext}>AI is prioritizing tasks based on care plan</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Unable to prioritize tasks</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        {onRefresh && (
          <Pressable onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // No prioritization data
  if (!prioritization) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>No tasks to prioritize</Text>
        <Text style={styles.emptySubtext}>Start a visit to see prioritized tasks</Text>
      </View>
    );
  }

  // Get urgency badge variant
  const getUrgencyBadgeVariant = (
    level: PrioritizedTask['urgencyLevel']
  ): 'danger' | 'warning' | 'primary' | 'secondary' => {
    switch (level) {
      case 'CRITICAL':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'primary';
      case 'LOW':
        return 'secondary';
    }
  };

  // Get urgency icon
  const getUrgencyIcon = (level: PrioritizedTask['urgencyLevel']): string => {
    switch (level) {
      case 'CRITICAL':
        return '🚨';
      case 'HIGH':
        return '⚡';
      case 'MEDIUM':
        return '⏰';
      case 'LOW':
        return '📌';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2563EB']} />
        ) : undefined
      }
    >
      {/* Patient Context Header */}
      <Card style={styles.patientCard}>
        <CardContent>
          <View style={styles.patientHeader}>
            <Text style={styles.patientIcon}>👤</Text>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{prioritization.clientName}</Text>
              <Text style={styles.patientDate}>
                {new Date(prioritization.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Patient Condition Summary */}
          <View style={styles.conditionSection}>
            <Text style={styles.conditionLabel}>Patient Condition</Text>
            <Text style={styles.conditionText}>{prioritization.patientConditionSummary}</Text>
          </View>

          {/* Critical Alerts */}
          {prioritization.criticalAlerts && prioritization.criticalAlerts.length > 0 && (
            <View style={styles.alertsSection}>
              <Text style={styles.alertsLabel}>⚠️ Critical Alerts</Text>
              {prioritization.criticalAlerts.map((alert, index) => (
                <View key={index} style={styles.alertItem}>
                  <Text style={styles.alertBullet}>•</Text>
                  <Text style={styles.alertText}>{alert}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Analysis Metadata */}
          <View style={styles.metadataSection}>
            <Text style={styles.metadataText}>
              📊 Based on {prioritization.basedOnNotesCount} recent notes,{' '}
              {prioritization.basedOnVitalsCount} vital readings
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Task Count Summary */}
      <View style={styles.taskSummary}>
        <Text style={styles.taskSummaryText}>
          {prioritization.totalTasks} {prioritization.totalTasks === 1 ? 'Task' : 'Tasks'} •{' '}
          Prioritized by AI
        </Text>
      </View>

      {/* Prioritized Tasks */}
      {prioritization.tasks.map((task, index) => (
        <Pressable
          key={task.taskId}
          onPress={() => onTaskPress?.(task)}
          style={({ pressed }) => [styles.taskPressable, pressed && styles.taskPressed]}
        >
          <Card style={styles.taskCard}>
            <CardContent>
              {/* Task Header */}
              <View style={styles.taskHeader}>
                <View style={styles.taskHeaderLeft}>
                  <Text style={styles.taskNumber}>#{index + 1}</Text>
                  <Text style={styles.taskIcon}>{getUrgencyIcon(task.urgencyLevel)}</Text>
                </View>
                <Badge variant={getUrgencyBadgeVariant(task.urgencyLevel)} size="md">
                  {task.urgencyLevel}
                </Badge>
              </View>

              {/* Task Name */}
              <Text style={styles.taskName}>{task.taskName}</Text>

              {/* Task Category */}
              <View style={styles.taskMeta}>
                <Badge variant="secondary" size="sm">
                  {task.taskCategory}
                </Badge>
                {task.scheduledTime && (
                  <Text style={styles.taskTime}>🕐 {task.scheduledTime}</Text>
                )}
                {task.estimatedDuration && (
                  <Text style={styles.taskDuration}>⏱️ {task.estimatedDuration} min</Text>
                )}
              </View>

              {/* Urgency Score Progress Bar */}
              <View style={styles.urgencyScoreSection}>
                <Text style={styles.urgencyScoreLabel}>
                  Urgency Score: {task.urgencyScore}/100
                </Text>
                <View style={styles.urgencyProgressBar}>
                  <View
                    style={[
                      styles.urgencyProgressFill,
                      { width: `${task.urgencyScore}%` },
                      task.urgencyLevel === 'CRITICAL' && styles.urgencyFillCritical,
                      task.urgencyLevel === 'HIGH' && styles.urgencyFillHigh,
                      task.urgencyLevel === 'MEDIUM' && styles.urgencyFillMedium,
                      task.urgencyLevel === 'LOW' && styles.urgencyFillLow,
                    ]}
                  />
                </View>
              </View>

              {/* Priority Reason */}
              <View style={styles.reasonSection}>
                <Text style={styles.reasonLabel}>💡 Why this priority?</Text>
                <Text style={styles.reasonText}>{task.priorityReason}</Text>
              </View>

              {/* Recommended Timeframe */}
              <View style={styles.timeframeSection}>
                <Text style={styles.timeframeLabel}>⏰ Recommended:</Text>
                <Text style={styles.timeframeText}>{task.recommendedTimeframe}</Text>
              </View>

              {/* Related Goals */}
              {task.relatedGoals && task.relatedGoals.length > 0 && (
                <View style={styles.goalsSection}>
                  <Text style={styles.goalsLabel}>🎯 Supports Goals:</Text>
                  {task.relatedGoals.map((goal, goalIndex) => (
                    <Text key={goalIndex} style={styles.goalText}>
                      • {goal}
                    </Text>
                  ))}
                </View>
              )}

              {/* Safety Considerations */}
              {task.safetyConsiderations && task.safetyConsiderations.length > 0 && (
                <View style={styles.safetySection}>
                  <Text style={styles.safetyLabel}>🛡️ Safety Notes:</Text>
                  {task.safetyConsiderations.map((safety, safetyIndex) => (
                    <Text key={safetyIndex} style={styles.safetyText}>
                      • {safety}
                    </Text>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        </Pressable>
      ))}

      {/* Footer Note */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🤖 Task prioritization powered by Claude AI
        </Text>
        <Text style={styles.footerSubtext}>
          Last analyzed: {new Date(prioritization.analyzedAt).toLocaleTimeString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  patientCard: {
    marginBottom: 16,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  patientIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  patientDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  conditionSection: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  conditionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  conditionText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  alertsSection: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  alertBullet: {
    fontSize: 14,
    color: '#991B1B',
    marginRight: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  metadataSection: {
    marginTop: 8,
  },
  metadataText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  taskSummary: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  taskSummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  taskPressable: {
    marginBottom: 16,
  },
  taskPressed: {
    opacity: 0.7,
  },
  taskCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    marginRight: 8,
  },
  taskIcon: {
    fontSize: 24,
  },
  taskName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  taskTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  taskDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  urgencyScoreSection: {
    marginBottom: 12,
  },
  urgencyScoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  urgencyProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  urgencyProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  urgencyFillCritical: {
    backgroundColor: '#DC2626',
  },
  urgencyFillHigh: {
    backgroundColor: '#F59E0B',
  },
  urgencyFillMedium: {
    backgroundColor: '#2563EB',
  },
  urgencyFillLow: {
    backgroundColor: '#6B7280',
  },
  reasonSection: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3730A3',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  timeframeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeframeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  timeframeText: {
    fontSize: 13,
    color: '#1F2937',
  },
  goalsSection: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  goalsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 6,
  },
  goalText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
    marginBottom: 2,
  },
  safetySection: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  safetyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 6,
  },
  safetyText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
    marginBottom: 2,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
