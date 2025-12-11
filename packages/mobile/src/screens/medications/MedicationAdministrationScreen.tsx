import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Share,
} from 'react-native';
import {
  medicationService,
  type Medication,
  type AdministrationStatus,
  type MARRecord,
} from '../../services/medication.service';

type ActionMode = 'administer' | 'refuse' | 'missed' | 'held' | null;

export default function MedicationAdministrationScreen({ route, navigation }: any) {
  const { visitId, clientName, clientId } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [marRecords, setMarRecords] = useState<MARRecord[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [administrationNotes, setAdministrationNotes] = useState('');
  const [refusalReason, setRefusalReason] = useState('');
  const [missedReason, setMissedReason] = useState('');
  const [heldReason, setHeldReason] = useState('');
  const [witnessInitials, setWitnessInitials] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Load medications and records
  const loadData = useCallback(async () => {
    try {
      const [meds, records] = await Promise.all([
        medicationService.getMedicationsForClient(clientId),
        medicationService.getMARRecordsForVisit(visitId),
      ]);
      setMedications(meds);
      setMarRecords(records);
    } catch (error) {
      console.error('Failed to load medications:', error);
      Alert.alert('Error', 'Failed to load medications');
    } finally {
      setIsLoading(false);
    }
  }, [clientId, visitId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setSelectedMedication(null);
    setActionMode(null);
    setAdministrationNotes('');
    setRefusalReason('');
    setMissedReason('');
    setHeldReason('');
    setWitnessInitials('');
    setWitnessName('');
    setPhotoUri(null);
  };

  const handleAdminister = (medication: Medication) => {
    setSelectedMedication(medication);
    setActionMode('administer');
    setAdministrationNotes('');
    setPhotoUri(null);
    setWitnessInitials('');
    setWitnessName('');
  };

  const handleRefusal = (medication: Medication) => {
    setSelectedMedication(medication);
    setActionMode('refuse');
    setRefusalReason('');
  };

  const handleMissed = (medication: Medication) => {
    setSelectedMedication(medication);
    setActionMode('missed');
    setMissedReason('');
  };

  const handleHeld = (medication: Medication) => {
    setSelectedMedication(medication);
    setActionMode('held');
    setHeldReason('');
  };

  const confirmAdministration = useCallback(async () => {
    if (!selectedMedication || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      await medicationService.recordAdministration({
        medicationId: selectedMedication.id,
        medicationName: selectedMedication.name,
        clientId,
        visitId,
        scheduledTime: selectedMedication.scheduledTimes[0] || 'PRN',
        scheduledDate: today,
        dosage: `${selectedMedication.dosage}${selectedMedication.unit}`,
        route: selectedMedication.route,
        notes: administrationNotes || undefined,
        photoUri: photoUri || undefined,
        witnessName: witnessName || undefined,
        witnessInitials: witnessInitials || undefined,
      });

      await loadData();
      resetForm();

      Alert.alert('Success', `${selectedMedication.name} administered and documented`);
    } catch (error) {
      console.error('Failed to record administration:', error);
      Alert.alert('Error', 'Failed to record administration');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedMedication, isSubmitting, clientId, visitId, administrationNotes, photoUri, witnessName, witnessInitials, loadData]);

  const confirmRefusal = useCallback(async () => {
    if (!selectedMedication || !refusalReason.trim() || isSubmitting) {
      if (!refusalReason.trim()) {
        Alert.alert('Required', 'Please provide a reason for refusal');
      }
      return;
    }
    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      await medicationService.recordRefusal({
        medicationId: selectedMedication.id,
        medicationName: selectedMedication.name,
        clientId,
        visitId,
        scheduledTime: selectedMedication.scheduledTimes[0] || 'PRN',
        scheduledDate: today,
        dosage: `${selectedMedication.dosage}${selectedMedication.unit}`,
        route: selectedMedication.route,
        refusalReason,
        notes: administrationNotes || undefined,
      });

      await loadData();
      resetForm();

      Alert.alert('Documented', `Refusal of ${selectedMedication.name} has been recorded`);
    } catch (error) {
      console.error('Failed to record refusal:', error);
      Alert.alert('Error', 'Failed to record refusal');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedMedication, refusalReason, isSubmitting, clientId, visitId, administrationNotes, loadData]);

  const confirmMissed = useCallback(async () => {
    if (!selectedMedication || !missedReason.trim() || isSubmitting) {
      if (!missedReason.trim()) {
        Alert.alert('Required', 'Please provide a reason why the medication was missed');
      }
      return;
    }
    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      await medicationService.recordMissed({
        medicationId: selectedMedication.id,
        medicationName: selectedMedication.name,
        clientId,
        visitId,
        scheduledTime: selectedMedication.scheduledTimes[0] || 'PRN',
        scheduledDate: today,
        dosage: `${selectedMedication.dosage}${selectedMedication.unit}`,
        route: selectedMedication.route,
        missedReason,
        notes: administrationNotes || undefined,
      });

      await loadData();
      resetForm();

      Alert.alert('Documented', `Missed dose of ${selectedMedication.name} has been recorded`);
    } catch (error) {
      console.error('Failed to record missed:', error);
      Alert.alert('Error', 'Failed to record missed dose');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedMedication, missedReason, isSubmitting, clientId, visitId, administrationNotes, loadData]);

  const confirmHeld = useCallback(async () => {
    if (!selectedMedication || !heldReason.trim() || isSubmitting) {
      if (!heldReason.trim()) {
        Alert.alert('Required', 'Please provide a reason why the medication was held');
      }
      return;
    }
    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      await medicationService.recordHeld({
        medicationId: selectedMedication.id,
        medicationName: selectedMedication.name,
        clientId,
        visitId,
        scheduledTime: selectedMedication.scheduledTimes[0] || 'PRN',
        scheduledDate: today,
        dosage: `${selectedMedication.dosage}${selectedMedication.unit}`,
        route: selectedMedication.route,
        heldReason,
        notes: administrationNotes || undefined,
      });

      await loadData();
      resetForm();

      Alert.alert('Documented', `${selectedMedication.name} held - documented`);
    } catch (error) {
      console.error('Failed to record held:', error);
      Alert.alert('Error', 'Failed to record held medication');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedMedication, heldReason, isSubmitting, clientId, visitId, administrationNotes, loadData]);

  const handleExportMAR = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const exportData = await medicationService.generateMARExport(clientId, clientName, weekAgo, today);

      const summary = `MAR Report for ${clientName}\n` +
        `Date Range: ${exportData.dateRange.start} to ${exportData.dateRange.end}\n\n` +
        `Medications: ${exportData.medications.length}\n` +
        `Records: ${exportData.records.length}\n\n` +
        exportData.records.map((r) => {
          const statusInfo = medicationService.getStatusInfo(r.status);
          return `${r.medicationName} - ${statusInfo.label} (${r.scheduledDate} ${r.scheduledTime})`;
        }).join('\n');

      await Share.share({
        message: summary,
        title: `MAR Report - ${clientName}`,
      });
    } catch (error) {
      console.error('Failed to export MAR:', error);
      Alert.alert('Error', 'Failed to generate MAR export');
    }
  }, [clientId, clientName]);

  const getMedicationStatus = (medId: string): AdministrationStatus => {
    const record = marRecords.find((r) => r.medicationId === medId);
    return record?.status || 'pending';
  };

  const getStatusColor = (status: AdministrationStatus) => {
    return medicationService.getStatusInfo(status).color;
  };

  const getStatusText = (status: AdministrationStatus) => {
    const info = medicationService.getStatusInfo(status);
    return `${info.icon} ${info.label}`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading medications...</Text>
      </View>
    );
  }

  if (selectedMedication && actionMode) {
    const getHeaderTitle = () => {
      switch (actionMode) {
        case 'administer': return 'Administer Medication';
        case 'refuse': return 'Document Refusal';
        case 'missed': return 'Document Missed Dose';
        case 'held': return 'Document Held Medication';
        default: return 'Medication';
      }
    };

    const routeInfo = medicationService.getRouteInfo(selectedMedication.route);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={resetForm}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.medicationCard}>
            <Text style={styles.medicationName}>{selectedMedication.name}</Text>
            {selectedMedication.genericName && (
              <Text style={styles.medicationGeneric}>({selectedMedication.genericName})</Text>
            )}
            <Text style={styles.medicationDetail}>
              Dosage: {selectedMedication.dosage}{selectedMedication.unit}
            </Text>
            <Text style={styles.medicationDetail}>
              Route: {routeInfo.label} ({routeInfo.abbreviation})
            </Text>
            <Text style={styles.medicationDetail}>
              Time: {selectedMedication.scheduledTimes.join(', ') || 'PRN'}
            </Text>
            {selectedMedication.instructions && (
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsLabel}>Instructions:</Text>
                <Text style={styles.instructionsText}>{selectedMedication.instructions}</Text>
              </View>
            )}
            {selectedMedication.warnings && selectedMedication.warnings.length > 0 && (
              <View style={styles.warningBox}>
                <Text style={styles.warningLabel}>Warnings:</Text>
                {selectedMedication.warnings.map((w, i) => (
                  <Text key={i} style={styles.warningText}>• {w}</Text>
                ))}
              </View>
            )}
          </View>

          {actionMode === 'administer' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Administration Notes (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Any observations or notes..."
                  value={administrationNotes}
                  onChangeText={setAdministrationNotes}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Witness (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Witness name"
                  value={witnessName}
                  onChangeText={setWitnessName}
                />
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Witness initials"
                  value={witnessInitials}
                  onChangeText={setWitnessInitials}
                  maxLength={4}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Photo of Pill Bottle (Optional)</Text>
                {photoUri ? (
                  <View>
                    <Text style={styles.photoPlaceholder}>📷 Photo captured</Text>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => setPhotoUri(null)}
                    >
                      <Text style={styles.secondaryButtonText}>Remove Photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setPhotoUri('photo-placeholder.jpg')}
                  >
                    <Text style={styles.secondaryButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.refuseButton}
                  onPress={() => setActionMode('refuse')}
                >
                  <Text style={styles.refuseButtonText}>Patient Refused</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, isSubmitting && styles.buttonDisabled]}
                  onPress={confirmAdministration}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {actionMode === 'refuse' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Refusal Reason *</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Why did the patient refuse? (Required)"
                  value={refusalReason}
                  onChangeText={setRefusalReason}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Additional Notes (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Any additional observations..."
                  value={administrationNotes}
                  onChangeText={setAdministrationNotes}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, isSubmitting && styles.buttonDisabled]}
                  onPress={confirmRefusal}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Document Refusal</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {actionMode === 'missed' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Reason Missed *</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Why was this dose missed? (Required)"
                  value={missedReason}
                  onChangeText={setMissedReason}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Additional Notes (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Any additional observations..."
                  value={administrationNotes}
                  onChangeText={setAdministrationNotes}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, isSubmitting && styles.buttonDisabled]}
                  onPress={confirmMissed}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Document Missed</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {actionMode === 'held' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Reason Held *</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Why was this medication held? (e.g., MD order, clinical reason)"
                  value={heldReason}
                  onChangeText={setHeldReason}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Additional Notes (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Any additional observations..."
                  value={administrationNotes}
                  onChangeText={setAdministrationNotes}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, isSubmitting && styles.buttonDisabled]}
                  onPress={confirmHeld}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Document Held</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // Calculate summary counts from MAR records
  const givenCount = marRecords.filter((r) => r.status === 'administered').length;
  const refusedCount = marRecords.filter((r) => r.status === 'refused').length;
  const missedCount = marRecords.filter((r) => r.status === 'missed').length;
  const heldCount = marRecords.filter((r) => r.status === 'held').length;
  const pendingCount = medications.length - givenCount - refusedCount - missedCount - heldCount;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back to Visit</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Medications</Text>
            <Text style={styles.headerSubtitle}>{clientName}</Text>
          </View>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportMAR}>
            <Text style={styles.exportButtonText}>Export MAR</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{medications.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              {givenCount}
            </Text>
            <Text style={styles.summaryLabel}>Given</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
              {refusedCount}
            </Text>
            <Text style={styles.summaryLabel}>Refused</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
              {missedCount + heldCount}
            </Text>
            <Text style={styles.summaryLabel}>Missed/Held</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#6b7280' }]}>
              {pendingCount > 0 ? pendingCount : 0}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.medicationList}>
          {medications.map((med) => {
            const status = getMedicationStatus(med.id);
            const routeInfo = medicationService.getRouteInfo(med.route);
            return (
              <View key={med.id} style={styles.medicationItem}>
                <View style={styles.medicationInfo}>
                  <View style={styles.medicationHeader}>
                    <Text style={styles.medicationItemName}>{med.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{getStatusText(status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.medicationItemDetail}>
                    {med.dosage}{med.unit} • {routeInfo.abbreviation}
                  </Text>
                  <Text style={styles.medicationItemTime}>
                    {med.isPRN ? 'PRN - As needed' : `Scheduled: ${med.scheduledTimes.join(', ')}`}
                  </Text>
                  {med.remainingCount !== undefined && (
                    <Text style={styles.medicationItemCount}>
                      {med.remainingCount} remaining
                    </Text>
                  )}
                </View>

                {status === 'pending' && (
                  <View style={styles.medicationActions}>
                    <TouchableOpacity
                      style={styles.administerButton}
                      onPress={() => handleAdminister(med)}
                    >
                      <Text style={styles.administerButtonText}>Give Med</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.refuseSmallButton}
                      onPress={() => handleRefusal(med)}
                    >
                      <Text style={styles.refuseSmallButtonText}>Refused</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {status === 'pending' && (
                  <View style={styles.secondaryActions}>
                    <TouchableOpacity
                      style={styles.missedButton}
                      onPress={() => handleMissed(med)}
                    >
                      <Text style={styles.missedButtonText}>Missed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.heldButton}
                      onPress={() => handleHeld(med)}
                    >
                      <Text style={styles.heldButtonText}>Held</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 16,
    paddingTop: 48,
  },
  backButton: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  medicationList: {
    padding: 16,
  },
  medicationItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  medicationInfo: {
    marginBottom: 12,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  medicationItemDetail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  medicationItemTime: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  medicationItemCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  medicationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  administerButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  administerButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  refuseSmallButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  refuseSmallButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  medicationCard: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  medicationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  medicationDetail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  instructionsBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#92400e',
  },
  section: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoPlaceholder: {
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  refuseButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  refuseButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9ca3af',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exportButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  missedButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  missedButtonText: {
    color: '#f59e0b',
    fontWeight: '500',
    fontSize: 12,
  },
  heldButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  heldButtonText: {
    color: '#8b5cf6',
    fontWeight: '500',
    fontSize: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  medicationGeneric: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  warningBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  warningLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#991b1b',
  },
});
