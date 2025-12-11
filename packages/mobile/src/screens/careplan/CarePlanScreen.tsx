/**
 * Care Plan Screen
 *
 * Displays the client's care plan for offline access by caregivers.
 * Shows goals, interventions, tasks, restrictions, and key info.
 * Data is pre-synced and available offline.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, CardContent, Badge, Button } from '../../components/index';
import { format } from 'date-fns';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type RouteProps = NativeStackScreenProps<RootStackParamList, 'CarePlan'>['route'];

type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'MET' | 'PARTIALLY_MET' | 'NOT_MET';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type TaskCategory = 'ADL' | 'IADL' | 'HEALTH_MONITORING' | 'SKILLED_NURSING' | 'THERAPY' | 'OTHER';

interface CarePlanGoal {
  id: string;
  description: string;
  targetDate?: Date;
  status: GoalStatus;
  progressPercentage?: number;
  progressNotes?: string;
}

interface Intervention {
  id: string;
  name: string;
  description: string;
  frequency: string;
  category: TaskCategory;
  priority: Priority;
  instructions?: string;
}

interface Allergy {
  allergen: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
  reaction?: string;
}

interface CarePlan {
  id: string;
  planNumber: string;
  name: string;
  clientId: string;
  clientName: string;
  planType: string;
  status: string;
  effectiveDate: Date;
  expirationDate?: Date;
  goals: CarePlanGoal[];
  interventions: Intervention[];
  restrictions?: string[];
  precautions?: string[];
  allergies?: Allergy[];
  medicalDiagnosis?: string[];
  functionalLimitations?: string[];
  assessmentSummary?: string;
  estimatedHoursPerWeek?: number;
  primaryCaregiverName?: string;
  coordinatorName?: string;
  lastSyncedAt?: Date;
}

export function CarePlanScreen() {
  const route = useRoute<RouteProps>();
  const { clientId } = route.params;

  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    goals: true,
    interventions: true,
    safety: true,
  });

  const loadCarePlan = useCallback(async () => {
    try {
      // In production, this would load from WatermelonDB (offline-first)
      // const db = await getDatabase();
      // const plan = await db.collections.get('care_plans').query(Q.where('client_id', clientId)).fetch();

      // Mock data for demonstration
      const mockCarePlan: CarePlan = {
        id: 'cp-001',
        planNumber: 'CP-2024-001',
        name: 'Personal Care Plan',
        clientId,
        clientName: 'Dorothy Chen',
        planType: 'PERSONAL_CARE',
        status: 'ACTIVE',
        effectiveDate: new Date('2024-01-01'),
        expirationDate: new Date('2024-12-31'),
        estimatedHoursPerWeek: 20,
        primaryCaregiverName: 'Sarah Johnson',
        coordinatorName: 'Maria Garcia',
        assessmentSummary: 'Client requires assistance with ADLs due to limited mobility following hip replacement surgery. Good cognitive function, able to direct own care.',
        medicalDiagnosis: [
          'Osteoarthritis',
          'Hypertension (controlled)',
          'Type 2 Diabetes',
        ],
        functionalLimitations: [
          'Limited mobility - uses walker',
          'Difficulty with bending and reaching',
          'Fatigue with extended activity',
        ],
        goals: [
          {
            id: 'g1',
            description: 'Maintain independence in personal hygiene with minimal assistance',
            targetDate: new Date('2024-06-30'),
            status: 'IN_PROGRESS',
            progressPercentage: 60,
            progressNotes: 'Client showing good progress, now able to manage grooming independently',
          },
          {
            id: 'g2',
            description: 'Improve mobility and reduce fall risk',
            targetDate: new Date('2024-09-30'),
            status: 'IN_PROGRESS',
            progressPercentage: 40,
            progressNotes: 'Physical therapy exercises being performed consistently',
          },
          {
            id: 'g3',
            description: 'Maintain blood sugar levels within target range',
            targetDate: new Date('2024-12-31'),
            status: 'MET',
            progressPercentage: 100,
            progressNotes: 'A1C levels have been stable for 3 months',
          },
        ],
        interventions: [
          {
            id: 'i1',
            name: 'Bathing Assistance',
            description: 'Assist with shower, ensure safety with non-slip mat and grab bars',
            frequency: 'Daily',
            category: 'ADL',
            priority: 'HIGH',
            instructions: 'Client prefers morning showers. Lukewarm water only. Watch for dizziness.',
          },
          {
            id: 'i2',
            name: 'Medication Reminders',
            description: 'Remind client to take medications at scheduled times',
            frequency: '3x daily',
            category: 'HEALTH_MONITORING',
            priority: 'HIGH',
            instructions: 'Morning: 8am, Noon: 12pm, Evening: 6pm. Check pill organizer.',
          },
          {
            id: 'i3',
            name: 'Mobility Exercises',
            description: 'Assist with prescribed physical therapy exercises',
            frequency: 'Daily',
            category: 'THERAPY',
            priority: 'MEDIUM',
            instructions: 'Follow PT exercise sheet in binder. 15-20 minutes.',
          },
          {
            id: 'i4',
            name: 'Meal Preparation',
            description: 'Prepare balanced meals following diabetic diet guidelines',
            frequency: '2x daily',
            category: 'IADL',
            priority: 'MEDIUM',
            instructions: 'Low sodium, diabetic-friendly. Menu suggestions in kitchen.',
          },
          {
            id: 'i5',
            name: 'Blood Sugar Monitoring',
            description: 'Assist with glucose check and log results',
            frequency: 'Daily (morning)',
            category: 'HEALTH_MONITORING',
            priority: 'HIGH',
            instructions: 'Record in diabetes log. Alert coordinator if >200 or <70.',
          },
        ],
        restrictions: [
          'No high-sodium foods',
          'No climbing ladders or step stools',
          'Avoid prolonged standing (>15 minutes)',
        ],
        precautions: [
          'Fall risk - ensure clear pathways',
          'Diabetic - monitor for signs of hypo/hyperglycemia',
          'Blood thinner - watch for unusual bleeding/bruising',
        ],
        allergies: [
          {
            allergen: 'Penicillin',
            severity: 'SEVERE',
            reaction: 'Anaphylaxis',
          },
          {
            allergen: 'Shellfish',
            severity: 'MODERATE',
            reaction: 'Hives, swelling',
          },
          {
            allergen: 'Latex',
            severity: 'MILD',
            reaction: 'Skin irritation',
          },
        ],
        lastSyncedAt: new Date(),
      };

      setCarePlan(mockCarePlan);
    } catch (error) {
      console.error('Failed to load care plan:', error);
      Alert.alert('Error', 'Failed to load care plan. Data may be unavailable offline.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadCarePlan();
  }, [loadCarePlan]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadCarePlan();
  }, [loadCarePlan]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getGoalStatusColor = (status: GoalStatus): string => {
    switch (status) {
      case 'MET':
        return '#10B981';
      case 'IN_PROGRESS':
        return '#3B82F6';
      case 'PARTIALLY_MET':
        return '#F59E0B';
      case 'NOT_MET':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'URGENT':
        return '#DC2626';
      case 'HIGH':
        return '#F97316';
      case 'MEDIUM':
        return '#FBBF24';
      case 'LOW':
        return '#22C55E';
      default:
        return '#6B7280';
    }
  };

  const getAllergySeverityColor = (severity: string): string => {
    switch (severity) {
      case 'LIFE_THREATENING':
        return '#7C3AED';
      case 'SEVERE':
        return '#DC2626';
      case 'MODERATE':
        return '#F97316';
      case 'MILD':
        return '#FBBF24';
      default:
        return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading care plan...</Text>
      </View>
    );
  }

  if (!carePlan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No care plan found for this client</Text>
        <Button variant="secondary" onPress={loadCarePlan}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.planNumber}>{carePlan.planNumber}</Text>
          <Badge
            variant={carePlan.status === 'ACTIVE' ? 'success' : 'secondary'}
          >
            {carePlan.status}
          </Badge>
        </View>
        <Text style={styles.clientName}>{carePlan.clientName}</Text>
        <Text style={styles.planType}>{carePlan.planType.replace(/_/g, ' ')}</Text>

        <View style={styles.headerDetails}>
          <View style={styles.headerDetailRow}>
            <Text style={styles.headerDetailLabel}>Effective:</Text>
            <Text style={styles.headerDetailValue}>
              {format(carePlan.effectiveDate, 'MMM d, yyyy')}
              {carePlan.expirationDate && ` - ${format(carePlan.expirationDate, 'MMM d, yyyy')}`}
            </Text>
          </View>
          {carePlan.estimatedHoursPerWeek && (
            <View style={styles.headerDetailRow}>
              <Text style={styles.headerDetailLabel}>Hours/Week:</Text>
              <Text style={styles.headerDetailValue}>{carePlan.estimatedHoursPerWeek}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Offline Status */}
      {carePlan.lastSyncedAt && (
        <View style={styles.syncStatus}>
          <Text style={styles.syncStatusText}>
            Last synced: {format(carePlan.lastSyncedAt, 'MMM d, h:mm a')}
          </Text>
        </View>
      )}

      {/* Assessment Summary */}
      {carePlan.assessmentSummary && (
        <Card style={styles.card}>
          <CardContent>
            <Text style={styles.sectionTitle}>Assessment Summary</Text>
            <Text style={styles.summaryText}>{carePlan.assessmentSummary}</Text>
          </CardContent>
        </Card>
      )}

      {/* Allergies (Critical Safety Info) */}
      {carePlan.allergies && carePlan.allergies.length > 0 && (
        <Card style={[styles.card, styles.alertCard]}>
          <CardContent>
            <View style={styles.alertHeader}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <Text style={styles.alertTitle}>ALLERGIES</Text>
            </View>
            {carePlan.allergies.map((allergy, index) => (
              <View key={index} style={styles.allergyItem}>
                <View style={styles.allergyHeader}>
                  <Text style={styles.allergyName}>{allergy.allergen}</Text>
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: getAllergySeverityColor(allergy.severity) }}
                  >
                    {allergy.severity}
                  </Badge>
                </View>
                {allergy.reaction && (
                  <Text style={styles.allergyReaction}>Reaction: {allergy.reaction}</Text>
                )}
              </View>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Safety Section (Restrictions & Precautions) */}
      <Card style={styles.card}>
        <CardContent>
          <Button
            variant="secondary"
            onPress={() => toggleSection('safety')}
            style={styles.sectionHeaderButton}
          >
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>Safety Information</Text>
              <Text style={styles.expandIcon}>{expandedSections.safety ? '▼' : '▶'}</Text>
            </View>
          </Button>

          {expandedSections.safety && (
            <View style={styles.sectionContent}>
              {carePlan.restrictions && carePlan.restrictions.length > 0 && (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Restrictions</Text>
                  {carePlan.restrictions.map((restriction, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.listItemText}>{restriction}</Text>
                    </View>
                  ))}
                </View>
              )}

              {carePlan.precautions && carePlan.precautions.length > 0 && (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Precautions</Text>
                  {carePlan.precautions.map((precaution, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.listItemText}>{precaution}</Text>
                    </View>
                  ))}
                </View>
              )}

              {carePlan.medicalDiagnosis && carePlan.medicalDiagnosis.length > 0 && (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Medical Diagnoses</Text>
                  {carePlan.medicalDiagnosis.map((diagnosis, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.listItemText}>{diagnosis}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </CardContent>
      </Card>

      {/* Goals */}
      <Card style={styles.card}>
        <CardContent>
          <Button
            variant="secondary"
            onPress={() => toggleSection('goals')}
            style={styles.sectionHeaderButton}
          >
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>Goals ({carePlan.goals.length})</Text>
              <Text style={styles.expandIcon}>{expandedSections.goals ? '▼' : '▶'}</Text>
            </View>
          </Button>

          {expandedSections.goals && (
            <View style={styles.sectionContent}>
              {carePlan.goals.map((goal) => (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                    <Badge
                      variant="secondary"
                      style={{ backgroundColor: getGoalStatusColor(goal.status) }}
                    >
                      {goal.status.replace(/_/g, ' ')}
                    </Badge>
                  </View>

                  {goal.progressPercentage !== undefined && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${goal.progressPercentage}%`,
                              backgroundColor: getGoalStatusColor(goal.status),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>{goal.progressPercentage}%</Text>
                    </View>
                  )}

                  {goal.progressNotes && (
                    <Text style={styles.goalNotes}>{goal.progressNotes}</Text>
                  )}

                  {goal.targetDate && (
                    <Text style={styles.goalTargetDate}>
                      Target: {format(goal.targetDate, 'MMM d, yyyy')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </CardContent>
      </Card>

      {/* Interventions/Tasks */}
      <Card style={styles.card}>
        <CardContent>
          <Button
            variant="secondary"
            onPress={() => toggleSection('interventions')}
            style={styles.sectionHeaderButton}
          >
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>
                Interventions ({carePlan.interventions.length})
              </Text>
              <Text style={styles.expandIcon}>
                {expandedSections.interventions ? '▼' : '▶'}
              </Text>
            </View>
          </Button>

          {expandedSections.interventions && (
            <View style={styles.sectionContent}>
              {carePlan.interventions.map((intervention) => (
                <View key={intervention.id} style={styles.interventionItem}>
                  <View style={styles.interventionHeader}>
                    <Text style={styles.interventionName}>{intervention.name}</Text>
                    <Badge
                      variant="secondary"
                      style={{ backgroundColor: getPriorityColor(intervention.priority) }}
                    >
                      {intervention.priority}
                    </Badge>
                  </View>

                  <Text style={styles.interventionDescription}>
                    {intervention.description}
                  </Text>

                  <View style={styles.interventionDetails}>
                    <Text style={styles.interventionFrequency}>
                      📅 {intervention.frequency}
                    </Text>
                    <Text style={styles.interventionCategory}>
                      {intervention.category.replace(/_/g, ' ')}
                    </Text>
                  </View>

                  {intervention.instructions && (
                    <View style={styles.instructionsBox}>
                      <Text style={styles.instructionsLabel}>Instructions:</Text>
                      <Text style={styles.instructionsText}>{intervention.instructions}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </CardContent>
      </Card>

      {/* Care Team */}
      {(carePlan.primaryCaregiverName || carePlan.coordinatorName) && (
        <Card style={styles.card}>
          <CardContent>
            <Text style={styles.sectionTitle}>Care Team</Text>
            {carePlan.primaryCaregiverName && (
              <View style={styles.careTeamMember}>
                <Text style={styles.careTeamRole}>Primary Caregiver:</Text>
                <Text style={styles.careTeamName}>{carePlan.primaryCaregiverName}</Text>
              </View>
            )}
            {carePlan.coordinatorName && (
              <View style={styles.careTeamMember}>
                <Text style={styles.careTeamRole}>Coordinator:</Text>
                <Text style={styles.careTeamName}>{carePlan.coordinatorName}</Text>
              </View>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planNumber: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  clientName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  planType: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '500',
    marginBottom: 12,
  },
  headerDetails: {
    gap: 4,
  },
  headerDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerDetailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  syncStatus: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  syncStatusText: {
    fontSize: 12,
    color: '#1E40AF',
    textAlign: 'center',
  },
  card: {
    margin: 12,
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  alertCard: {
    borderWidth: 2,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B91C1C',
  },
  allergyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  allergyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allergyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
  },
  allergyReaction: {
    fontSize: 14,
    color: '#B91C1C',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  sectionHeaderButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 0,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  expandIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionContent: {
    marginTop: 8,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#6B7280',
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  goalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  goalDescription: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 22,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 40,
    textAlign: 'right',
  },
  goalNotes: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  goalTargetDate: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  interventionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  interventionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  interventionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  interventionDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 6,
    lineHeight: 20,
  },
  interventionDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  interventionFrequency: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
  },
  interventionCategory: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  instructionsBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  instructionsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  careTeamMember: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  careTeamRole: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  careTeamName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 24,
  },
});

export default CarePlanScreen;
