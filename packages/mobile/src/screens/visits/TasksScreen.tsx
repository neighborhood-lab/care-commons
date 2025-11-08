/**
 * Tasks Screen
 *
 * Comprehensive task management for active visits:
 * - View all tasks for the current visit
 * - Complete tasks with notes and photos
 * - Track ADLs, IADLs, and health monitoring activities
 * - Mark tasks as complete, skipped, or not applicable
 * - Offline support with automatic sync
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Badge, Card, CardContent } from '../../components/index.js';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';

type Props = NativeStackScreenProps<RootStackParamList, 'Tasks'>;

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'SKIPPED' | 'NOT_APPLICABLE';
type TaskCategory = 'ADL' | 'IADL' | 'HEALTH_MONITORING' | 'OTHER';

interface Task {
  id: string;
  visitId: string;
  category: TaskCategory;
  name: string;
  description: string;
  isRequired: boolean;
  status: TaskStatus;
  completedAt?: Date;
  completedByNote?: string;
  skipReason?: string;
  photoUrls?: string[];
  estimatedDuration?: number; // minutes
  clientPreferences?: string;
  safetyConsiderations?: string;
}

export function TasksScreen({ route, navigation }: Props) {
  const { visitId } = route.params;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Load tasks for the visit
   */
  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId]);

  const loadTasks = async () => {
    // Mock task data - in production, load from WatermelonDB
    const mockTasks: Task[] = [
      {
        id: '1',
        visitId,
        category: 'ADL',
        name: 'Personal Hygiene Assistance',
        description: 'Assist with bathing, grooming, and oral care',
        isRequired: true,
        status: 'PENDING',
        estimatedDuration: 30,
        clientPreferences: 'Prefers shower in the morning, lukewarm water',
        safetyConsiderations: 'Non-slip mat required, client has limited mobility',
      },
      {
        id: '2',
        visitId,
        category: 'ADL',
        name: 'Meal Preparation & Feeding',
        description: 'Prepare lunch and assist with eating',
        isRequired: true,
        status: 'PENDING',
        estimatedDuration: 45,
        clientPreferences: 'No dairy, prefers soft foods',
        safetyConsiderations: 'Check for choking hazards',
      },
      {
        id: '3',
        visitId,
        category: 'HEALTH_MONITORING',
        name: 'Medication Reminder',
        description: 'Remind client to take afternoon medications',
        isRequired: true,
        status: 'PENDING',
        estimatedDuration: 10,
        clientPreferences: 'Takes pills with water',
        safetyConsiderations: 'Verify correct medications and dosage',
      },
      {
        id: '4',
        visitId,
        category: 'IADL',
        name: 'Light Housekeeping',
        description: 'Clean kitchen and living areas',
        isRequired: false,
        status: 'PENDING',
        estimatedDuration: 20,
      },
      {
        id: '5',
        visitId,
        category: 'IADL',
        name: 'Companionship',
        description: 'Spend time talking, reading, or watching TV',
        isRequired: false,
        status: 'PENDING',
        estimatedDuration: 30,
        clientPreferences: 'Enjoys discussing family and gardening',
      },
    ];

    setTasks(mockTasks);
  };

  /**
   * Open task completion modal
   */
  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setCompletionNotes('');
    setPhotoUris([]);
    setCompletionModalVisible(true);
  };

  /**
   * Complete a task
   */
  const handleCompleteTask = async () => {
    if (!selectedTask) return;

    if (selectedTask.isRequired && !completionNotes.trim()) {
      Alert.alert('Notes Required', 'Please add completion notes for required tasks.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update task status
      const updatedTasks = tasks.map((task) =>
        task.id === selectedTask.id
          ? {
              ...task,
              status: 'COMPLETE' as TaskStatus,
              completedAt: new Date(),
              completedByNote: completionNotes.trim(),
              photoUrls: photoUris,
            }
          : task
      );

      setTasks(updatedTasks);

      // Queue for sync (in production, use OfflineQueueService)
      // await offlineQueue.queueTaskCompletion({ ... });

      setCompletionModalVisible(false);
      setSelectedTask(null);

      Alert.alert('Success', `"${selectedTask.name}" marked as complete!`);
    } catch (error) {
      console.error('Task completion error:', error);
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Skip a task
   */
  const handleSkipTask = () => {
    if (!selectedTask) return;

    Alert.prompt(
      'Skip Task',
      'Please provide a reason for skipping this task:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: (reason: string | undefined) => {
            if (!reason?.trim()) {
              Alert.alert('Reason Required', 'Please provide a reason for skipping.');
              return;
            }

            const updatedTasks = tasks.map((task) =>
              task.id === selectedTask.id
                ? {
                    ...task,
                    status: 'SKIPPED' as TaskStatus,
                    skipReason: reason.trim(),
                  }
                : task
            );

            setTasks(updatedTasks);
            setCompletionModalVisible(false);
            setSelectedTask(null);
          },
        },
      ],
      'plain-text'
    );
  };

  /**
   * Add photo to task completion
   */
  const handleAddPhoto = () => {
    navigation.navigate('Camera', {
      onCapture: (uri: string) => {
        setPhotoUris((prev) => [...prev, uri]);
      },
    });
  };

  /**
   * Get task category badge
   */
  const getCategoryBadge = (category: TaskCategory) => {
    const categoryMap = {
      ADL: { label: 'ADL', variant: 'primary' as const },
      IADL: { label: 'IADL', variant: 'secondary' as const },
      HEALTH_MONITORING: { label: 'Health', variant: 'warning' as const },
      OTHER: { label: 'Other', variant: 'secondary' as const },
    };

    return categoryMap[category];
  };

  /**
   * Get task status badge
   */
  const getStatusBadge = (status: TaskStatus) => {
    const statusMap = {
      PENDING: { label: 'Pending', variant: 'secondary' as const },
      IN_PROGRESS: { label: 'In Progress', variant: 'warning' as const },
      COMPLETE: { label: 'Complete', variant: 'success' as const },
      SKIPPED: { label: 'Skipped', variant: 'danger' as const },
      NOT_APPLICABLE: { label: 'N/A', variant: 'secondary' as const },
    };

    return statusMap[status];
  };

  /**
   * Calculate task completion progress
   */
  const getTaskProgress = () => {
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETE').length;
    const totalTasks = tasks.length;
    const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      completed: completedTasks,
      total: totalTasks,
      percentage: Math.round(percentage),
    };
  };

  const progress = getTaskProgress();
  const requiredTasks = tasks.filter((t) => t.isRequired);
  const completedRequired = requiredTasks.filter((t) => t.status === 'COMPLETE').length;

  return (
    <View style={styles.container}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Visit Tasks</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress.percentage}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {progress.completed} of {progress.total} completed ({progress.percentage}%)
          </Text>
          <Text style={styles.requiredText}>
            Required: {completedRequired} of {requiredTasks.length}
          </Text>
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: task }) => (
          <Pressable
            onPress={() => handleTaskPress(task)}
            disabled={task.status === 'COMPLETE'}
          >
            <Card style={styles.taskCard}>
              <CardContent>
                <View style={styles.taskHeader}>
                  <View style={styles.taskTitleRow}>
                    <Text style={styles.taskName}>{task.name}</Text>
                    {task.isRequired && (
                      <Badge variant="danger" size="sm">
                        Required
                      </Badge>
                    )}
                  </View>

                  <View style={styles.taskBadges}>
                    <Badge
                      variant={getCategoryBadge(task.category).variant}
                      size="sm"
                      style={styles.badge}
                    >
                      {getCategoryBadge(task.category).label}
                    </Badge>
                    <Badge
                      variant={getStatusBadge(task.status).variant}
                      size="sm"
                    >
                      {getStatusBadge(task.status).label}
                    </Badge>
                  </View>
                </View>

                <Text style={styles.taskDescription}>{task.description}</Text>

                {task.estimatedDuration && (
                  <Text style={styles.taskDuration}>
                    ⏱️ Est. {task.estimatedDuration} minutes
                  </Text>
                )}

                {task.completedByNote && (
                  <View style={styles.completionNote}>
                    <Text style={styles.completionNoteLabel}>Notes:</Text>
                    <Text style={styles.completionNoteText}>
                      {task.completedByNote}
                    </Text>
                  </View>
                )}

                {task.skipReason && (
                  <View style={styles.skipReason}>
                    <Text style={styles.skipReasonLabel}>Skip Reason:</Text>
                    <Text style={styles.skipReasonText}>{task.skipReason}</Text>
                  </View>
                )}
              </CardContent>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks for this visit</Text>
          </View>
        }
      />

      {/* Task Completion Modal */}
      <Modal
        visible={completionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCompletionModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Task</Text>
            <Pressable
              onPress={() => setCompletionModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedTask && (
              <>
                <Text style={styles.modalTaskName}>{selectedTask.name}</Text>
                <Text style={styles.modalTaskDescription}>
                  {selectedTask.description}
                </Text>

                {selectedTask.clientPreferences && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxLabel}>Client Preferences:</Text>
                    <Text style={styles.infoBoxText}>
                      {selectedTask.clientPreferences}
                    </Text>
                  </View>
                )}

                {selectedTask.safetyConsiderations && (
                  <View style={[styles.infoBox, styles.warningBox]}>
                    <Text style={styles.infoBoxLabel}>⚠️ Safety:</Text>
                    <Text style={styles.infoBoxText}>
                      {selectedTask.safetyConsiderations}
                    </Text>
                  </View>
                )}

                <Text style={styles.label}>
                  Completion Notes {selectedTask.isRequired && '*'}
                </Text>
                <TextInput
                  testID="task-completion-notes-input"
                  style={styles.textInput}
                  placeholder="Add notes about task completion..."
                  value={completionNotes}
                  onChangeText={setCompletionNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Text style={styles.label}>Photos (Optional)</Text>
                <Button
                  variant="secondary"
                  onPress={handleAddPhoto}
                  style={styles.addPhotoButton}
                >
                  Add Photo ({photoUris.length})
                </Button>

                {photoUris.length > 0 && (
                  <View style={styles.photoList}>
                    {photoUris.map((uri, index) => (
                      <View key={index} style={styles.photoItem}>
                        <Text style={styles.photoItemText}>
                          Photo {index + 1} captured
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              testID="skip-task-button"
              variant="secondary"
              onPress={handleSkipTask}
              style={styles.footerButton}
              disabled={isSubmitting}
            >
              Skip Task
            </Button>
            <Button
              testID="mark-complete-button"
              variant="primary"
              onPress={handleCompleteTask}
              style={styles.footerButton}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Mark Complete
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  requiredText: {
    fontSize: 12,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskHeader: {
    marginBottom: 12,
  },
  taskTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  taskName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    marginRight: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  taskDuration: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  completionNote: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
  },
  completionNoteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  completionNoteText: {
    fontSize: 14,
    color: '#065F46',
  },
  skipReason: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  skipReasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  skipReasonText: {
    fontSize: 14,
    color: '#991B1B',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalTaskName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalTaskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  infoBox: {
    padding: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    marginBottom: 16,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
  },
  infoBoxLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#4338CA',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    marginBottom: 20,
  },
  addPhotoButton: {
    marginBottom: 12,
  },
  photoList: {
    gap: 8,
  },
  photoItem: {
    padding: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
  },
  photoItemText: {
    fontSize: 14,
    color: '#065F46',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButton: {
    flex: 1,
  },
});
