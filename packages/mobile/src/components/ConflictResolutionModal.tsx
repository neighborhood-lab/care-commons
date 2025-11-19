/**
 * Conflict Resolution Modal
 *
 * Provides a user-friendly interface for caregivers to manually resolve
 * data conflicts that occur during offline sync. This is critical for
 * EVV compliance and accurate care documentation.
 *
 * Features:
 * - Side-by-side comparison of conflicting values
 * - Field-level resolution for granular control
 * - Automatic highlighting of critical compliance fields
 * - One-tap resolution for simple cases
 * - Audit trail of resolution decisions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import type {
  ConflictResolution,
  ManualResolution,
} from '../database/sync/conflict-resolver';

interface ConflictResolutionModalProps {
  visible: boolean;
  recordType: string;
  recordId: string;
  conflictResolution: ConflictResolution;
  onResolve: (resolution: ManualResolution) => void;
  onCancel: () => void;
}

export function ConflictResolutionModal({
  visible,
  recordType,
  recordId,
  conflictResolution,
  onResolve,
  onCancel,
}: ConflictResolutionModalProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<
    'client' | 'server' | 'field-by-field' | null
  >(null);
  const [fieldResolutions, setFieldResolutions] = useState<
    Record<string, 'client' | 'server'>
  >({});

  const handleResolve = () => {
    if (!selectedStrategy) {
      Alert.alert('Selection Required', 'Please choose a resolution strategy', [
        { text: 'OK' },
      ]);
      return;
    }

    // Validate field-by-field selections
    if (selectedStrategy === 'field-by-field') {
      const unresolved = (conflictResolution.fieldConflicts || []).filter(
        (conflict) => !fieldResolutions[conflict.field]
      );

      if (unresolved.length > 0) {
        Alert.alert(
          'Incomplete Resolution',
          `Please resolve all conflicting fields. ${unresolved.length} field(s) remaining.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    const resolution: ManualResolution = {
      recordId,
      recordType,
      selectedStrategy,
      fieldResolutions: selectedStrategy === 'field-by-field' ? fieldResolutions : undefined,
      userId: 'current-user-id', // TODO: Get from auth context
      timestamp: new Date(),
    };

    onResolve(resolution);
  };

  const handleFieldSelection = (field: string, choice: 'client' | 'server') => {
    setFieldResolutions((prev) => ({
      ...prev,
      [field]: choice,
    }));
  };

  const getFieldLabel = (field: string): string => {
    // Convert snake_case to Title Case
    return field
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'Not set';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const isCriticalField = (field: string): boolean => {
    const criticalFields = [
      'clock_in_time',
      'clock_out_time',
      'client_signature',
      'caregiver_signature',
      'verification_status',
      'evv_status',
    ];
    return criticalFields.includes(field);
  };

  const renderQuickResolution = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Resolution</Text>
      <Text style={styles.sectionDescription}>
        Choose which version to use for all conflicting fields:
      </Text>

      <View style={styles.quickButtonContainer}>
        <TouchableOpacity
          style={[
            styles.quickButton,
            selectedStrategy === 'client' && styles.quickButtonSelected,
          ]}
          onPress={() => setSelectedStrategy('client')}
        >
          <Text
            style={[
              styles.quickButtonText,
              selectedStrategy === 'client' && styles.quickButtonTextSelected,
            ]}
          >
            📱 Use My Version
          </Text>
          <Text style={styles.quickButtonHint}>Your offline changes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickButton,
            selectedStrategy === 'server' && styles.quickButtonSelected,
          ]}
          onPress={() => setSelectedStrategy('server')}
        >
          <Text
            style={[
              styles.quickButtonText,
              selectedStrategy === 'server' && styles.quickButtonTextSelected,
            ]}
          >
            ☁️ Use Server Version
          </Text>
          <Text style={styles.quickButtonHint}>Latest from server</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.detailedButton,
          selectedStrategy === 'field-by-field' && styles.detailedButtonSelected,
        ]}
        onPress={() => setSelectedStrategy('field-by-field')}
      >
        <Text
          style={[
            styles.detailedButtonText,
            selectedStrategy === 'field-by-field' && styles.detailedButtonTextSelected,
          ]}
        >
          🔍 Review Field by Field
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFieldConflicts = () => {
    if (selectedStrategy !== 'field-by-field' || !conflictResolution.fieldConflicts) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conflicting Fields</Text>
        {conflictResolution.fieldConflicts.map((conflict) => (
          <View
            key={conflict.field}
            style={[
              styles.conflictCard,
              isCriticalField(conflict.field) && styles.conflictCardCritical,
            ]}
          >
            <View style={styles.conflictHeader}>
              <Text style={styles.conflictFieldName}>{getFieldLabel(conflict.field)}</Text>
              {isCriticalField(conflict.field) && (
                <View style={styles.criticalBadge}>
                  <Text style={styles.criticalBadgeText}>⚠️ CRITICAL</Text>
                </View>
              )}
            </View>

            <View style={styles.conflictComparison}>
              {/* Client Value */}
              <TouchableOpacity
                style={[
                  styles.conflictOption,
                  fieldResolutions[conflict.field] === 'client' &&
                    styles.conflictOptionSelected,
                ]}
                onPress={() => handleFieldSelection(conflict.field, 'client')}
              >
                <Text style={styles.conflictOptionLabel}>📱 Your Version</Text>
                <Text style={styles.conflictOptionValue}>
                  {formatValue(conflict.clientValue)}
                </Text>
                {fieldResolutions[conflict.field] === 'client' && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓ Selected</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Server Value */}
              <TouchableOpacity
                style={[
                  styles.conflictOption,
                  fieldResolutions[conflict.field] === 'server' &&
                    styles.conflictOptionSelected,
                ]}
                onPress={() => handleFieldSelection(conflict.field, 'server')}
              >
                <Text style={styles.conflictOptionLabel}>☁️ Server Version</Text>
                <Text style={styles.conflictOptionValue}>
                  {formatValue(conflict.serverValue)}
                </Text>
                {fieldResolutions[conflict.field] === 'server' && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓ Selected</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>⚠️ Sync Conflict Detected</Text>
      <Text style={styles.subtitle}>
        Your offline changes conflict with updates made on the server. Please choose how to
        resolve this conflict.
      </Text>
      {conflictResolution.fieldConflicts && conflictResolution.fieldConflicts.length > 0 && (
        <View style={styles.conflictCountBadge}>
          <Text style={styles.conflictCountText}>
            {conflictResolution.fieldConflicts.length} field(s) affected
          </Text>
        </View>
      )}
    </View>
  );

  const renderActions = () => (
    <View style={styles.actions}>
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.resolveButton, !selectedStrategy && styles.resolveButtonDisabled]}
        onPress={handleResolve}
        disabled={!selectedStrategy}
      >
        <Text style={styles.resolveButtonText}>Resolve Conflict</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {renderHeader()}
          {renderQuickResolution()}
          {renderFieldConflicts()}
        </ScrollView>
        {renderActions()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  conflictCountBadge: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  conflictCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78350F',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  quickButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  quickButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  quickButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  quickButtonTextSelected: {
    color: '#1E40AF',
  },
  quickButtonHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailedButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  detailedButtonSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  detailedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  detailedButtonTextSelected: {
    color: '#6D28D9',
  },
  conflictCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  conflictCardCritical: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  conflictFieldName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  criticalBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  criticalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  conflictComparison: {
    gap: 8,
  },
  conflictOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  conflictOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  conflictOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  conflictOptionValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'monospace',
  },
  selectedIndicator: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  selectedIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  resolveButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  resolveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  resolveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
