/**
 * Training Screen
 *
 * Allows caregivers to view and complete training modules from mobile.
 * Features:
 * - Training stats overview (completion progress)
 * - Filter by status (All, Required, Overdue)
 * - Category grouping with collapsible sections
 * - Module cards with status, duration, and format
 * - Start/continue module functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Card, CardContent, Badge, Button } from '../../components/index';
import {
  trainingService,
  getCategoryLabel,
  getCategoryIcon,
  getFormatIcon,
  getStatusInfo,
  formatDuration,
} from '../../services/training.service';
import type {
  TrainingModuleWithProgress,
  TrainingStats,
  TrainingCategory,
} from '../../services/training.service';

type FilterType = 'ALL' | 'REQUIRED' | 'OVERDUE' | 'IN_PROGRESS';

interface GroupedModules {
  category: TrainingCategory;
  modules: TrainingModuleWithProgress[];
}

export function TrainingScreen() {
  const [modules, setModules] = useState<TrainingModuleWithProgress[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [expandedCategories, setExpandedCategories] = useState<Set<TrainingCategory>>(
    new Set(['ORIENTATION', 'SAFETY', 'CLINICAL', 'COMPLIANCE'])
  );

  const loadData = useCallback(async () => {
    try {
      const [allModules, trainingStats] = await Promise.all([
        trainingService.getAllModules(),
        trainingService.getStats(),
      ]);
      setModules(allModules);
      setStats(trainingStats);
    } catch (error) {
      console.error('Failed to load training data:', error);
      Alert.alert('Error', 'Failed to load training modules');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  const toggleCategory = useCallback((category: TrainingCategory) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const handleStartModule = useCallback(
    async (module: TrainingModuleWithProgress) => {
      const isResume = module.progress.status === 'IN_PROGRESS';
      const action = isResume ? 'Resume' : 'Start';

      Alert.alert(
        `${action} Training`,
        `${action} "${module.title}"?\n\nDuration: ${formatDuration(module.durationMinutes)}\nFormat: ${module.format}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: action,
            onPress: async () => {
              try {
                await trainingService.startModule(module.id);
                // In a real app, this would navigate to a content viewer
                Alert.alert(
                  'Training Module',
                  `Opening "${module.title}"...\n\nThis would open the training content viewer in a full implementation.\n\nFor demo purposes, you can mark this as complete.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Mark Complete',
                      onPress: async () => {
                        const success = await trainingService.completeModule(
                          module.id,
                          module.format === 'QUIZ' ? 90 : undefined,
                          module.format === 'QUIZ' ? 80 : undefined
                        );
                        if (success) {
                          Alert.alert('Success', 'Training module completed!');
                          void loadData();
                        } else {
                          Alert.alert('Failed', 'Quiz score too low. Please try again.');
                        }
                      },
                    },
                  ]
                );
              } catch {
                Alert.alert('Error', 'Failed to start training module');
              }
            },
          },
        ]
      );
    },
    [loadData]
  );

  const getFilteredModules = useCallback((): TrainingModuleWithProgress[] => {
    switch (filter) {
      case 'REQUIRED':
        return modules.filter((m) => m.isRequired);
      case 'OVERDUE':
        return modules.filter((m) => {
          if (m.progress.status === 'EXPIRED') return true;
          if (m.isRequired && m.dueDate && m.progress.status !== 'COMPLETED') {
            return new Date(m.dueDate) < new Date();
          }
          return false;
        });
      case 'IN_PROGRESS':
        return modules.filter((m) => m.progress.status === 'IN_PROGRESS');
      case 'ALL':
      default:
        return modules;
    }
  }, [modules, filter]);

  const groupModulesByCategory = useCallback(
    (moduleList: TrainingModuleWithProgress[]): GroupedModules[] => {
      const groups: Map<TrainingCategory, TrainingModuleWithProgress[]> = new Map();

      moduleList.forEach((module) => {
        const existing = groups.get(module.category) || [];
        existing.push(module);
        groups.set(module.category, existing);
      });

      const categoryOrder: TrainingCategory[] = [
        'ORIENTATION',
        'SAFETY',
        'CLINICAL',
        'COMPLIANCE',
        'SOFT_SKILLS',
        'SPECIALTY',
      ];

      return categoryOrder
        .filter((cat) => groups.has(cat))
        .map((cat) => ({
          category: cat,
          modules: groups.get(cat)!,
        }));
    },
    []
  );

  const filteredModules = getFilteredModules();
  const groupedModules = groupModulesByCategory(filteredModules);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading training modules...</Text>
      </View>
    );
  }

  const completionPercentage = stats
    ? Math.round((stats.requiredCompleted / stats.requiredModules) * 100)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Stats Header */}
      <Card style={styles.statsCard}>
        <CardContent>
          <Text style={styles.statsTitle}>Training Progress</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${completionPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{completionPercentage}%</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.requiredCompleted || 0}</Text>
              <Text style={styles.statLabel}>of {stats?.requiredModules || 0} Required</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.completedModules || 0}</Text>
              <Text style={styles.statLabel}>Total Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, stats?.overdueCount ? styles.overdueValue : null]}>
                {stats?.overdueCount || 0}
              </Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </View>

          {stats && stats.totalMinutesRemaining > 0 && (
            <Text style={styles.remainingTime}>
              {formatDuration(stats.totalMinutesRemaining)} remaining
            </Text>
          )}
        </CardContent>
      </Card>

      {/* Overdue Warning */}
      {stats && stats.overdueCount > 0 && (
        <View style={styles.overdueWarning}>
          <Text style={styles.overdueWarningText}>
            ⚠️ You have {stats.overdueCount} overdue training module(s)
          </Text>
          <TouchableOpacity onPress={() => setFilter('OVERDUE')}>
            <Text style={styles.overdueLink}>View Overdue</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['ALL', 'REQUIRED', 'IN_PROGRESS', 'OVERDUE'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'ALL' ? 'All' : f === 'REQUIRED' ? 'Required' : f === 'IN_PROGRESS' ? 'In Progress' : 'Overdue'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Module Groups */}
      {groupedModules.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No training modules found</Text>
          <Text style={styles.emptySubtext}>
            {filter !== 'ALL' ? 'Try adjusting your filter' : 'Check back later'}
          </Text>
        </View>
      ) : (
        groupedModules.map((group) => (
          <View key={group.category} style={styles.categoryContainer}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(group.category)}
            >
              <View style={styles.categoryTitleRow}>
                <Text style={styles.categoryIcon}>
                  {getCategoryIcon(group.category)}
                </Text>
                <Text style={styles.categoryTitle}>
                  {getCategoryLabel(group.category)}
                </Text>
                <Badge variant="secondary" size="sm">
                  {group.modules.filter((m) => m.progress.status === 'COMPLETED').length}/
                  {group.modules.length}
                </Badge>
              </View>
              <Text style={styles.expandIcon}>
                {expandedCategories.has(group.category) ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {expandedCategories.has(group.category) && (
              <View style={styles.modulesList}>
                {group.modules.map((module) => {
                  const statusInfo = getStatusInfo(module.progress.status);

                  return (
                    <Card key={module.id} style={styles.moduleCard}>
                      <CardContent>
                        <View style={styles.moduleHeader}>
                          <View style={styles.moduleTitleRow}>
                            <Text style={styles.moduleFormat}>
                              {getFormatIcon(module.format)}
                            </Text>
                            <Text style={styles.moduleTitle} numberOfLines={2}>
                              {module.title}
                            </Text>
                          </View>
                          <Badge variant={statusInfo.badgeVariant} size="sm">
                            {statusInfo.label}
                          </Badge>
                        </View>

                        <Text style={styles.moduleDescription} numberOfLines={2}>
                          {module.description}
                        </Text>

                        <View style={styles.moduleMetaRow}>
                          <Text style={styles.moduleMeta}>
                            {formatDuration(module.durationMinutes)}
                          </Text>
                          {module.isRequired && (
                            <Text style={styles.requiredBadge}>Required</Text>
                          )}
                          {module.dueDate && module.progress.status !== 'COMPLETED' && (
                            <Text
                              style={[
                                styles.dueDate,
                                new Date(module.dueDate) < new Date() && styles.dueDateOverdue,
                              ]}
                            >
                              Due: {new Date(module.dueDate).toLocaleDateString()}
                            </Text>
                          )}
                          {module.progress.expiresAt && module.progress.status === 'COMPLETED' && (
                            <Text style={styles.expiresDate}>
                              Expires: {new Date(module.progress.expiresAt).toLocaleDateString()}
                            </Text>
                          )}
                        </View>

                        {module.progress.quizScore !== undefined && (
                          <View style={styles.quizScoreRow}>
                            <Text style={styles.quizScoreLabel}>Quiz Score:</Text>
                            <Text
                              style={[
                                styles.quizScore,
                                module.progress.quizScore >= (module.progress.passingScore || 0)
                                  ? styles.quizScorePass
                                  : styles.quizScoreFail,
                              ]}
                            >
                              {module.progress.quizScore}%
                            </Text>
                          </View>
                        )}

                        <Button
                          variant={
                            module.progress.status === 'COMPLETED'
                              ? 'secondary'
                              : module.progress.status === 'EXPIRED'
                                ? 'danger'
                                : 'primary'
                          }
                          size="sm"
                          onPress={() => handleStartModule(module)}
                          style={styles.moduleButton}
                        >
                          {module.progress.status === 'COMPLETED'
                            ? 'Review'
                            : module.progress.status === 'IN_PROGRESS'
                              ? 'Continue'
                              : module.progress.status === 'EXPIRED'
                                ? 'Recertify'
                                : 'Start'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        ))
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    width: 45,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  overdueValue: {
    color: '#EF4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  remainingTime: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  overdueWarning: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  overdueWarningText: {
    fontSize: 13,
    color: '#991B1B',
    flex: 1,
  },
  overdueLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#2563EB',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  categoryContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  expandIcon: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  modulesList: {
    marginTop: 8,
  },
  moduleCard: {
    marginBottom: 8,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  moduleFormat: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 1,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  moduleDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  moduleMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  moduleMeta: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredBadge: {
    fontSize: 12,
    color: '#7C3AED',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
  },
  dueDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  dueDateOverdue: {
    color: '#EF4444',
    fontWeight: '500',
  },
  expiresDate: {
    fontSize: 12,
    color: '#F59E0B',
  },
  quizScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quizScoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  quizScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  quizScorePass: {
    color: '#10B981',
  },
  quizScoreFail: {
    color: '#EF4444',
  },
  moduleButton: {
    alignSelf: 'flex-start',
  },
  bottomSpacing: {
    height: 32,
  },
});
