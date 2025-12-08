/**
 * MedicationInteractionAlerts Component
 *
 * Mobile UI for displaying AI-powered medication interaction warnings.
 * Shows drug-drug, drug-allergy, and drug-condition interactions with
 * color-coded severity levels and clinical recommendations.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import type {
  MedicationInteractionResult,
  DrugInteraction,
  AllergyAlert,
  ConditionAlert,
  InteractionSeverity,
} from '../../hooks/useMedicationInteractionCheck.js';

export interface MedicationInteractionAlertsProps {
  result: MedicationInteractionResult | null;
  loading: boolean;
  error: string | null;
  onDismiss?: () => void;
  onProceed?: () => void;
  onContactPhysician?: () => void;
}

/**
 * Get color for severity level
 */
function getSeverityColor(severity: InteractionSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return '#DC2626'; // Red
    case 'HIGH':
      return '#F59E0B'; // Orange
    case 'MODERATE':
      return '#2563EB'; // Blue
    case 'LOW':
      return '#6B7280'; // Gray
  }
}

/**
 * Get emoji icon for severity level
 */
function getSeverityIcon(severity: InteractionSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return '🚨';
    case 'HIGH':
      return '⚠️';
    case 'MODERATE':
      return '⚡';
    case 'LOW':
      return 'ℹ️';
  }
}

/**
 * Drug Interaction Card Component
 */
function DrugInteractionCard({ interaction }: { interaction: DrugInteraction }) {
  const severityColor = getSeverityColor(interaction.severity);
  const severityIcon = getSeverityIcon(interaction.severity);

  return (
    <View style={[styles.card, { borderLeftColor: severityColor }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.severityIcon}>{severityIcon}</Text>
        <Text style={[styles.severityLabel, { color: severityColor }]}>
          {interaction.severity}
        </Text>
      </View>

      <Text style={styles.cardTitle}>
        {interaction.medication1} ↔ {interaction.medication2}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Description:</Text>
        <Text style={styles.sectionText}>{interaction.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Clinical Effect:</Text>
        <Text style={styles.sectionText}>{interaction.clinicalEffect}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Recommendation:</Text>
        <Text style={[styles.sectionText, styles.recommendation]}>
          {interaction.recommendation}
        </Text>
      </View>

      {interaction.references && interaction.references.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>References:</Text>
          {interaction.references.map((ref, index) => (
            <Text key={index} style={styles.referenceText}>
              • {ref}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Allergy Alert Card Component
 */
function AllergyAlertCard({ alert }: { alert: AllergyAlert }) {
  const severityColor = getSeverityColor(alert.severity);
  const severityIcon = getSeverityIcon(alert.severity);

  return (
    <View style={[styles.card, { borderLeftColor: severityColor }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.severityIcon}>{severityIcon}</Text>
        <Text style={[styles.severityLabel, { color: severityColor }]}>
          ALLERGY ALERT - {alert.severity}
        </Text>
      </View>

      <Text style={styles.cardTitle}>
        {alert.medication} → {alert.allergen}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Description:</Text>
        <Text style={styles.sectionText}>{alert.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Recommendation:</Text>
        <Text style={[styles.sectionText, styles.recommendation]}>
          {alert.recommendation}
        </Text>
      </View>
    </View>
  );
}

/**
 * Condition Alert Card Component
 */
function ConditionAlertCard({ alert }: { alert: ConditionAlert }) {
  const severityColor = getSeverityColor(alert.severity);
  const severityIcon = getSeverityIcon(alert.severity);

  return (
    <View style={[styles.card, { borderLeftColor: severityColor }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.severityIcon}>{severityIcon}</Text>
        <Text style={[styles.severityLabel, { color: severityColor }]}>
          CONDITION ALERT - {alert.severity}
        </Text>
      </View>

      <Text style={styles.cardTitle}>
        {alert.medication} ↔ {alert.condition}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Description:</Text>
        <Text style={styles.sectionText}>{alert.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Recommendation:</Text>
        <Text style={[styles.sectionText, styles.recommendation]}>
          {alert.recommendation}
        </Text>
      </View>
    </View>
  );
}

/**
 * Main MedicationInteractionAlerts Component
 */
export function MedicationInteractionAlerts({
  result,
  loading,
  error,
  onDismiss,
  onProceed,
  onContactPhysician,
}: MedicationInteractionAlertsProps): React.ReactElement {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔬 Analyzing medication interactions...</Text>
          <Text style={styles.loadingSubtext}>Checking for safety concerns</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>Error: {error}</Text>
          {onDismiss && (
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (!result) {
    return <View style={styles.container} />;
  }

  const hasInteractions =
    result.drugInteractions.length > 0 ||
    result.allergyAlerts.length > 0 ||
    result.conditionAlerts.length > 0;

  const overallColor = getSeverityColor(result.overallRiskLevel);
  const overallIcon = getSeverityIcon(result.overallRiskLevel);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: overallColor }]}>
        <Text style={styles.headerIcon}>{overallIcon}</Text>
        <Text style={styles.headerTitle}>Medication Safety Check</Text>
        <Text style={styles.headerSubtitle}>{result.clientName}</Text>
      </View>

      {/* Clinical Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryLabel}>Clinical Summary:</Text>
        <Text style={styles.summaryText}>{result.clinicalSummary}</Text>
      </View>

      {/* Overall Risk */}
      <View style={[styles.riskContainer, { borderColor: overallColor }]}>
        <Text style={[styles.riskLabel, { color: overallColor }]}>
          Overall Risk Level: {result.overallRiskLevel}
        </Text>
        <Text style={[styles.safetyStatus, { color: result.safeToAdminister ? '#10B981' : '#DC2626' }]}>
          {result.safeToAdminister ? '✓ Safe to Administer' : '✗ DO NOT ADMINISTER'}
        </Text>
        {result.requiresPhysicianReview && (
          <Text style={styles.physicianReview}>⚕️ Physician Review Required</Text>
        )}
      </View>

      {/* New Medication */}
      {result.newMedication && (
        <View style={styles.medicationContainer}>
          <Text style={styles.medicationLabel}>New Medication:</Text>
          <Text style={styles.medicationName}>{result.newMedication.name}</Text>
          {result.newMedication.dosage && (
            <Text style={styles.medicationDetail}>Dosage: {result.newMedication.dosage}</Text>
          )}
          {result.newMedication.route && (
            <Text style={styles.medicationDetail}>Route: {result.newMedication.route}</Text>
          )}
        </View>
      )}

      {/* Current Medications */}
      {result.currentMedications.length > 0 && (
        <View style={styles.currentMedsContainer}>
          <Text style={styles.currentMedsLabel}>Current Medications ({result.currentMedications.length}):</Text>
          {result.currentMedications.map((med) => (
            <Text key={med.id} style={styles.currentMedText}>
              • {med.name} - {med.dosage} {med.route}
            </Text>
          ))}
        </View>
      )}

      {/* Interactions */}
      {hasInteractions ? (
        <View style={styles.alertsContainer}>
          <Text style={styles.alertsTitle}>Safety Alerts:</Text>

          {/* Drug Interactions */}
          {result.drugInteractions.map((interaction, index) => (
            <DrugInteractionCard key={`drug-${index}`} interaction={interaction} />
          ))}

          {/* Allergy Alerts */}
          {result.allergyAlerts.map((alert, index) => (
            <AllergyAlertCard key={`allergy-${index}`} alert={alert} />
          ))}

          {/* Condition Alerts */}
          {result.conditionAlerts.map((alert, index) => (
            <ConditionAlertCard key={`condition-${index}`} alert={alert} />
          ))}
        </View>
      ) : (
        <View style={styles.noAlertsContainer}>
          <Text style={styles.noAlertsIcon}>✅</Text>
          <Text style={styles.noAlertsText}>No significant interactions detected</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {result.requiresPhysicianReview && onContactPhysician && (
          <TouchableOpacity
            style={[styles.actionButton, styles.physicianButton]}
            onPress={onContactPhysician}
          >
            <Text style={styles.actionButtonText}>⚕️ Contact Physician</Text>
          </TouchableOpacity>
        )}

        {result.safeToAdminister && onProceed && (
          <TouchableOpacity
            style={[styles.actionButton, styles.proceedButton]}
            onPress={onProceed}
          >
            <Text style={styles.actionButtonText}>✓ Proceed with Administration</Text>
          </TouchableOpacity>
        )}

        {onDismiss && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={onDismiss}
          >
            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Analyzed Timestamp */}
      <Text style={styles.timestamp}>
        Analyzed: {new Date(result.analyzedAt).toLocaleString()}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  summaryContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  riskContainer: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  safetyStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  physicianReview: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 4,
  },
  medicationContainer: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  medicationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  medicationDetail: {
    fontSize: 14,
    color: '#6B7280',
  },
  currentMedsContainer: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  currentMedsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  currentMedText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  alertsContainer: {
    margin: 16,
    marginTop: 0,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  recommendation: {
    fontWeight: '600',
    color: '#111827',
  },
  referenceText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  noAlertsContainer: {
    margin: 16,
    marginTop: 0,
    padding: 32,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    alignItems: 'center',
  },
  noAlertsIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  noAlertsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  actionsContainer: {
    margin: 16,
    marginTop: 0,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  physicianButton: {
    backgroundColor: '#DC2626',
  },
  proceedButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#6B7280',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 24,
  },
  dismissButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#6B7280',
    borderRadius: 8,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
