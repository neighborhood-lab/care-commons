/**
 * Care Plan Screen - Offline-first care plan access
 *
 * Shows care plan details, goals, tasks, and safety info.
 * Works offline with pre-synced data.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, CardContent, Badge, Button } from '../../components/index';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import {
  carePlanService,
  type MobileCarePlan,
  type MobileTask,
} from '../../services/careplan.service';

type RouteProps = NativeStackScreenProps<RootStackParamList, 'CarePlan'>['route'];

export function CarePlanScreen() {
  const route = useRoute<RouteProps>();
  const { clientId, clientName } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [carePlan, setCarePlan] = useState<MobileCarePlan | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('tasks');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const loadCarePlan = useCallback(async () => {
    try {
      // Initialize service if needed
      await carePlanService.initialize();

      // Pre-sync for this visit
      await carePlanService.preSyncForVisit(clientId, new Date().toISOString());

      // Get care plans for client
      const plans = await carePlanService.getCarePlansForClient(clientId);
      if (plans.length > 0) {
        setCarePlan(plans[0]); // Use first active plan
      }
    } catch (error) {
      console.error('[CarePlanScreen] Error loading care plan:', error);
      Alert.alert('Error', 'Failed to load care plan');
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadCarePlan();
    setIsRefreshing(false);
  }, [loadCarePlan]);

  useEffect(() => {
    loadCarePlan();
  }, [loadCarePlan]);

  const handleCompleteTask = async (task: MobileTask) => {
    if (completingTaskId) return;

    setCompletingTaskId(task.id);

    try {
      const result = await carePlanService.completeTask(task.id, carePlan!.id, {
        completedBy: 'current-caregiver', // Would come from auth context
        note: 'Completed during visit',
      });

      if (result) {
        // Refresh care plan
        await loadCarePlan();
        Alert.alert('Success', 'Task marked as completed');
      }
    } catch {
      Alert.alert('Error', 'Failed to complete task');
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleSkipTask = async (task: MobileTask) => {
    if (!task.isOptional) {
      Alert.alert('Cannot Skip', 'This task is required and cannot be skipped.');
      return;
    }

    Alert.prompt(
      'Skip Task',
      'Please provide a reason for skipping this task:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async (reason: string | undefined) => {
            if (!reason?.trim()) {
              Alert.alert('Error', 'Please provide a reason');
              return;
            }

            try {
              await carePlanService.skipTask(
                task.id,
                carePlan!.id,
                reason,
                'current-caregiver'
              );
              await loadCarePlan();
            } catch {
              Alert.alert('Error', 'Failed to skip task');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading care plan...</Text>
      </View>
    );
  }

  if (!carePlan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No active care plan found</Text>
        <Button variant="secondary" size="md" onPress={handleRefresh}>
          Refresh
        </Button>
      </View>
    );
  }

  const pendingTasks = carePlan.tasks.filter(
    (t) => t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS'
  );
  const completedTasks = carePlan.tasks.filter(
    (t) => t.status === 'COMPLETED' || t.status === 'SKIPPED'
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Plan Header */}
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.planHeader}>
            <View style={styles.planInfo}>
              <Text style={styles.clientName}>{clientName}</Text>
              <Text style={styles.planName}>{carePlan.name}</Text>
              <Text style={styles.planNumber}>#{carePlan.planNumber}</Text>
            </View>
            <Badge
              variant={carePlan.status === 'ACTIVE' ? 'success' : 'secondary'}
              size="md"
            >
              {carePlan.status}
            </Badge>
          </View>

          {/* Sync Status */}
          <View style={styles.syncStatus}>
            <Text style={styles.syncText}>
              {carePlan.isSynced ? '✓ Synced' : '⟳ Pending sync'}
            </Text>
            <Text style={styles.syncTime}>
              Last updated: {new Date(carePlan.lastSyncedAt).toLocaleTimeString()}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Safety Alerts - Always Visible */}
      {(carePlan.allergies?.length || carePlan.precautions?.length) && (
        <Card style={[styles.card, styles.safetyCard]}>
          <CardContent>
            <Text style={styles.safetyTitle}>Safety Alerts</Text>

            {/* Allergies */}
            {carePlan.allergies && carePlan.allergies.length > 0 && (
              <View style={styles.allergySection}>
                <Text style={styles.allergyHeader}>Allergies</Text>
                {carePlan.allergies.map((allergy) => {
                  const severityInfo = carePlanService.getAllergySeverityInfo(
                    allergy.severity
                  );
                  return (
                    <View
                      key={allergy.id}
                      style={[
                        styles.allergyItem,
                        { backgroundColor: severityInfo.bgColor },
                      ]}
                    >
                      <View style={styles.allergyMain}>
                        <Text style={[styles.allergen, { color: severityInfo.color }]}>
                          {allergy.allergen}
                        </Text>
                        <Badge
                          variant={allergy.severity === 'LIFE_THREATENING' ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {severityInfo.label}
                        </Badge>
                      </View>
                      <Text style={styles.reaction}>{allergy.reaction}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Precautions */}
            {carePlan.precautions && carePlan.precautions.length > 0 && (
              <View style={styles.precautionsSection}>
                <Text style={styles.precautionsHeader}>Precautions</Text>
                {carePlan.precautions.map((precaution, index) => (
                  <View key={index} style={styles.precautionItem}>
                    <Text style={styles.precautionText}>• {precaution}</Text>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      )}

      {/* Today's Tasks */}
      <Card style={styles.card}>
        <CardContent>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('tasks')}
          >
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Today's Tasks</Text>
              <Badge variant="primary" size="sm">
                {pendingTasks.length} pending
              </Badge>
            </View>
            <Text style={styles.expandIcon}>
              {expandedSection === 'tasks' ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {expandedSection === 'tasks' && (
            <View style={styles.taskList}>
              {pendingTasks.map((task) => {
                const categoryIcon = carePlanService.getCategoryIcon(task.category);

                return (
                  <View key={task.id} style={styles.taskItem}>
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskIcon}>{categoryIcon}</Text>
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskName}>{task.name}</Text>
                        <Text style={styles.taskDuration}>
                          {task.estimatedDuration} min
                          {task.requiresSignature && ' • Signature required'}
                        </Text>
                      </View>
                      {task.isOptional && (
                        <Badge variant="secondary" size="sm">
                          Optional
                        </Badge>
                      )}
                    </View>

                    <Text style={styles.taskInstructions}>{task.instructions}</Text>

                    <View style={styles.taskActions}>
                      <TouchableOpacity
                        style={[
                          styles.completeButton,
                          completingTaskId === task.id && styles.buttonDisabled,
                        ]}
                        onPress={() => handleCompleteTask(task)}
                        disabled={completingTaskId === task.id}
                      >
                        {completingTaskId === task.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.completeButtonText}>✓ Complete</Text>
                        )}
                      </TouchableOpacity>

                      {task.isOptional && (
                        <TouchableOpacity
                          style={styles.skipButton}
                          onPress={() => handleSkipTask(task)}
                        >
                          <Text style={styles.skipButtonText}>Skip</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}

              {pendingTasks.length === 0 && (
                <Text style={styles.emptyTasks}>All tasks completed!</Text>
              )}
            </View>
          )}
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card style={styles.card}>
          <CardContent>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('completed')}
            >
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Completed</Text>
                <Badge variant="success" size="sm">
                  {completedTasks.length}
                </Badge>
              </View>
              <Text style={styles.expandIcon}>
                {expandedSection === 'completed' ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {expandedSection === 'completed' && (
              <View style={styles.taskList}>
                {completedTasks.map((task) => {
                  const statusInfo = carePlanService.getTaskStatusInfo(task.status);
                  return (
                    <View
                      key={task.id}
                      style={[styles.taskItem, styles.completedTaskItem]}
                    >
                      <View style={styles.taskHeader}>
                        <Text style={styles.taskIcon}>{statusInfo.icon}</Text>
                        <View style={styles.taskInfo}>
                          <Text style={styles.completedTaskName}>{task.name}</Text>
                          <Text style={styles.completedTime}>
                            {task.completedAt &&
                              new Date(task.completedAt).toLocaleTimeString()}
                          </Text>
                        </View>
                      </View>
                      {task.completionNote && (
                        <Text style={styles.completionNote}>{task.completionNote}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </CardContent>
        </Card>
      )}

      {/* Goals */}
      <Card style={styles.card}>
        <CardContent>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('goals')}
          >
            <Text style={styles.sectionTitle}>Care Goals</Text>
            <Text style={styles.expandIcon}>
              {expandedSection === 'goals' ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {expandedSection === 'goals' && (
            <View style={styles.goalList}>
              {carePlan.goals.map((goal) => {
                const statusInfo = carePlanService.getGoalStatusInfo(goal.status);
                return (
                  <View key={goal.id} style={styles.goalItem}>
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Badge
                        variant={goal.status === 'ON_TRACK' ? 'success' : 'primary'}
                        size="sm"
                      >
                        {statusInfo.label}
                      </Badge>
                    </View>
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                    {goal.progressPercentage !== undefined && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${goal.progressPercentage}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {goal.progressPercentage}%
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </CardContent>
      </Card>

      {/* Care Team Contact */}
      <Card style={[styles.card, styles.lastCard]}>
        <CardContent>
          <Text style={styles.sectionTitle}>Care Team</Text>
          {carePlan.coordinatorName && (
            <View style={styles.contactItem}>
              <Text style={styles.contactRole}>Care Coordinator</Text>
              <Text style={styles.contactName}>{carePlan.coordinatorName}</Text>
              <Text style={styles.contactPhone}>{carePlan.coordinatorPhone}</Text>
            </View>
          )}
          {carePlan.physicianName && (
            <View style={styles.contactItem}>
              <Text style={styles.contactRole}>Physician</Text>
              <Text style={styles.contactName}>{carePlan.physicianName}</Text>
              <Text style={styles.contactPhone}>{carePlan.physicianPhone}</Text>
            </View>
          )}
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  lastCard: {
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  planName: {
    fontSize: 16,
    color: '#374151',
    marginTop: 4,
  },
  planNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  syncStatus: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  syncText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  syncTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  safetyCard: {
    borderWidth: 2,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 12,
  },
  allergySection: {
    marginBottom: 12,
  },
  allergyHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F1D1D',
    marginBottom: 8,
  },
  allergyItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  allergyMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  allergen: {
    fontSize: 16,
    fontWeight: '600',
  },
  reaction: {
    fontSize: 12,
    color: '#374151',
  },
  precautionsSection: {
    marginTop: 8,
  },
  precautionsHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  precautionItem: {
    marginBottom: 4,
  },
  precautionText: {
    fontSize: 14,
    color: '#78350F',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  expandIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  taskList: {
    marginTop: 12,
  },
  taskItem: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  completedTaskItem: {
    backgroundColor: '#D1FAE5',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  taskDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  taskInstructions: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyTasks: {
    textAlign: 'center',
    color: '#10B981',
    fontWeight: '500',
    paddingVertical: 12,
  },
  completedTaskName: {
    fontSize: 14,
    color: '#065F46',
    textDecorationLine: 'line-through',
  },
  completedTime: {
    fontSize: 12,
    color: '#059669',
  },
  completionNote: {
    fontSize: 12,
    color: '#047857',
    fontStyle: 'italic',
    marginTop: 4,
  },
  goalList: {
    marginTop: 12,
  },
  goalItem: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    flex: 1,
  },
  goalDescription: {
    fontSize: 14,
    color: '#1E3A8A',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    width: 35,
    textAlign: 'right',
  },
  contactItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contactRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  contactPhone: {
    fontSize: 14,
    color: '#3B82F6',
  },
});
