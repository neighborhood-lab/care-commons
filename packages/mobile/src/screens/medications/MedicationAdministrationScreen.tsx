import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  scheduledTime: string;
  instructions?: string;
  isPRN: boolean;
  remainingCount?: number;
}

interface MedicationAdministration {
  medicationId: string;
  administeredAt: string;
  administeredBy: string;
  dosageGiven: string;
  route: string;
  notes?: string;
  photoUri?: string;
  patientRefused: boolean;
  refusalReason?: string;
  witnessInitials?: string;
}

const DEMO_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    name: 'Lisinopril',
    dosage: '10mg',
    route: 'Oral',
    frequency: 'Once daily',
    scheduledTime: '09:00',
    instructions: 'Take with food',
    isPRN: false,
    remainingCount: 28,
  },
  {
    id: 'med-2',
    name: 'Metformin',
    dosage: '500mg',
    route: 'Oral',
    frequency: 'Twice daily',
    scheduledTime: '09:00',
    instructions: 'Take with meals',
    isPRN: false,
    remainingCount: 56,
  },
  {
    id: 'med-3',
    name: 'Tylenol',
    dosage: '325mg',
    route: 'Oral',
    frequency: 'As needed',
    scheduledTime: 'PRN',
    instructions: 'For pain or fever. Max 4000mg per day',
    isPRN: true,
    remainingCount: 20,
  },
];

export default function MedicationAdministrationScreen({ route, navigation }: any) {
  const { visitId, clientName, clientId } = route.params;

  const [medications, setMedications] = useState<Medication[]>(DEMO_MEDICATIONS);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [administrationNotes, setAdministrationNotes] = useState('');
  const [refusalReason, setRefusalReason] = useState('');
  const [witnessInitials, setWitnessInitials] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [administeredMeds, setAdministeredMeds] = useState<Set<string>>(new Set());
  const [refusedMeds, setRefusedMeds] = useState<Set<string>>(new Set());

  const handleAdminister = (medication: Medication) => {
    setSelectedMedication(medication);
    setAdministrationNotes('');
    setPhotoUri(null);
    setWitnessInitials('');
  };

  const confirmAdministration = () => {
    if (!selectedMedication) return;

    const administration: MedicationAdministration = {
      medicationId: selectedMedication.id,
      administeredAt: new Date().toISOString(),
      administeredBy: 'Current Caregiver', // TODO: Get from auth context
      dosageGiven: selectedMedication.dosage,
      route: selectedMedication.route,
      notes: administrationNotes,
      photoUri: photoUri || undefined,
      patientRefused: false,
      witnessInitials: witnessInitials || undefined,
    };

    // TODO: Send to API
    console.log('Medication administered:', administration);

    setAdministeredMeds(prev => new Set([...prev, selectedMedication.id]));
    setSelectedMedication(null);

    Alert.alert(
      'Success',
      `${selectedMedication.name} administered and documented`,
      [{ text: 'OK' }]
    );
  };

  const handleRefusal = (medication: Medication) => {
    setSelectedMedication(medication);
    setRefusalReason('');
  };

  const confirmRefusal = () => {
    if (!selectedMedication || !refusalReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for refusal');
      return;
    }

    const refusal: MedicationAdministration = {
      medicationId: selectedMedication.id,
      administeredAt: new Date().toISOString(),
      administeredBy: 'Current Caregiver',
      dosageGiven: selectedMedication.dosage,
      route: selectedMedication.route,
      patientRefused: true,
      refusalReason,
      notes: administrationNotes,
    };

    // TODO: Send to API
    console.log('Medication refusal documented:', refusal);

    setRefusedMeds(prev => new Set([...prev, selectedMedication.id]));
    setSelectedMedication(null);

    Alert.alert(
      'Documented',
      `Refusal of ${selectedMedication.name} has been recorded`,
      [{ text: 'OK' }]
    );
  };

  const getMedicationStatus = (medId: string): 'pending' | 'administered' | 'refused' => {
    if (administeredMeds.has(medId)) return 'administered';
    if (refusedMeds.has(medId)) return 'refused';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'administered': return '#10b981';
      case 'refused': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'administered': return '✓ Given';
      case 'refused': return '✕ Refused';
      default: return 'Pending';
    }
  };

  if (selectedMedication) {
    const isRefusal = refusalReason.length > 0 || refusedMeds.has(selectedMedication.id);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedMedication(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isRefusal ? 'Document Refusal' : 'Administer Medication'}
          </Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.medicationCard}>
            <Text style={styles.medicationName}>{selectedMedication.name}</Text>
            <Text style={styles.medicationDetail}>Dosage: {selectedMedication.dosage}</Text>
            <Text style={styles.medicationDetail}>Route: {selectedMedication.route}</Text>
            <Text style={styles.medicationDetail}>Time: {selectedMedication.scheduledTime}</Text>
            {selectedMedication.instructions && (
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsLabel}>Instructions:</Text>
                <Text style={styles.instructionsText}>{selectedMedication.instructions}</Text>
              </View>
            )}
          </View>

          {!isRefusal ? (
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
                <Text style={styles.sectionLabel}>Witness Initials (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter initials if witnessed"
                  value={witnessInitials}
                  onChangeText={setWitnessInitials}
                  maxLength={4}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Photo Documentation (Optional)</Text>
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
                  onPress={() => setRefusalReason('Patient refused')}
                >
                  <Text style={styles.refuseButtonText}>Patient Refused</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmAdministration}
                >
                  <Text style={styles.confirmButtonText}>Confirm Administration</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
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
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setSelectedMedication(null);
                    setRefusalReason('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmRefusal}
                >
                  <Text style={styles.confirmButtonText}>Document Refusal</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back to Visit</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Medications</Text>
          <Text style={styles.headerSubtitle}>{clientName}</Text>
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
              {administeredMeds.size}
            </Text>
            <Text style={styles.summaryLabel}>Given</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
              {refusedMeds.size}
            </Text>
            <Text style={styles.summaryLabel}>Refused</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#6b7280' }]}>
              {medications.length - administeredMeds.size - refusedMeds.size}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.medicationList}>
          {medications.map(med => {
            const status = getMedicationStatus(med.id);
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
                    {med.dosage} • {med.route} • {med.frequency}
                  </Text>
                  <Text style={styles.medicationItemTime}>
                    {med.isPRN ? 'PRN - As needed' : `Scheduled: ${med.scheduledTime}`}
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
});
