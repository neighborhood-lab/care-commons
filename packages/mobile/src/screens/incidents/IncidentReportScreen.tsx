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

type IncidentType =
  | 'fall'
  | 'injury'
  | 'medication_error'
  | 'behavioral'
  | 'property_damage'
  | 'missing_items'
  | 'abuse_neglect'
  | 'emergency_911'
  | 'other';

type InjurySeverity = 'none' | 'minor' | 'moderate' | 'severe' | 'life_threatening';

interface IncidentReport {
  id: string;
  visitId: string;
  clientId: string;
  clientName: string;
  incidentType: IncidentType;
  occurredAt: string;
  reportedAt: string;
  reportedBy: string;
  description: string;
  injurySeverity: InjurySeverity;
  injuryLocation?: string;
  actionsTaken: string[];
  witnessName?: string;
  witnessPhone?: string;
  photoUris: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  familyNotified: boolean;
  emergencyServicesContacted: boolean;
}

const INCIDENT_TYPES: Array<{ value: IncidentType; label: string; icon: string }> = [
  { value: 'fall', label: 'Fall', icon: '🤕' },
  { value: 'injury', label: 'Injury', icon: '🩹' },
  { value: 'medication_error', label: 'Medication Error', icon: '💊' },
  { value: 'behavioral', label: 'Behavioral Issue', icon: '😤' },
  { value: 'property_damage', label: 'Property Damage', icon: '🔨' },
  { value: 'missing_items', label: 'Missing Items', icon: '🔍' },
  { value: 'abuse_neglect', label: 'Abuse/Neglect', icon: '⚠️' },
  { value: 'emergency_911', label: 'Emergency (911)', icon: '🚑' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const INJURY_SEVERITIES: Array<{ value: InjurySeverity; label: string; color: string }> = [
  { value: 'none', label: 'No Injury', color: '#10b981' },
  { value: 'minor', label: 'Minor (bruise, small cut)', color: '#3b82f6' },
  { value: 'moderate', label: 'Moderate (large cut, sprain)', color: '#f59e0b' },
  { value: 'severe', label: 'Severe (fracture, deep wound)', color: '#ef4444' },
  { value: 'life_threatening', label: 'Life Threatening', color: '#991b1b' },
];

const ACTIONS_TAKEN = [
  'Called 911',
  'Notified family/emergency contact',
  'Notified supervisor/coordinator',
  'Administered first aid',
  'Applied ice/heat',
  'Helped client to safe position',
  'Assessed vital signs',
  'Documented in medical records',
  'No action needed',
];

export default function IncidentReportScreen({ route, navigation }: any) {
  const { visitId, clientId, clientName } = route.params;

  const [step, setStep] = useState<'type' | 'details' | 'actions' | 'review'>('type');
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [description, setDescription] = useState('');
  const [injurySeverity, setInjurySeverity] = useState<InjurySeverity>('none');
  const [injuryLocation, setInjuryLocation] = useState('');
  const [actionsTaken, setActionsTaken] = useState<string[]>([]);
  const [witnessName, setWitnessName] = useState('');
  const [witnessPhone, setWitnessPhone] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [familyNotified, setFamilyNotified] = useState(false);
  const [emergencyServicesContacted, setEmergencyServicesContacted] = useState(false);

  const toggleAction = (action: string) => {
    if (actionsTaken.includes(action)) {
      setActionsTaken(actionsTaken.filter(a => a !== action));
    } else {
      setActionsTaken([...actionsTaken, action]);
    }
  };

  const handleSubmit = () => {
    if (!incidentType) {
      Alert.alert('Required', 'Please select an incident type');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Required', 'Please provide a description of what happened');
      return;
    }

    if (actionsTaken.length === 0) {
      Alert.alert('Required', 'Please select at least one action taken');
      return;
    }

    // Check for mandatory reporter scenario
    if (incidentType === 'abuse_neglect') {
      Alert.alert(
        'Mandated Reporter',
        'As a mandated reporter, you must immediately report suspected abuse or neglect to authorities. Have you contacted Adult Protective Services (APS) or law enforcement?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Reported',
            onPress: () => submitReport(),
          },
        ]
      );
      return;
    }

    submitReport();
  };

  const submitReport = () => {
    const report: IncidentReport = {
      id: `incident-${Date.now()}`,
      visitId,
      clientId,
      clientName,
      incidentType: incidentType!,
      occurredAt: new Date().toISOString(),
      reportedAt: new Date().toISOString(),
      reportedBy: 'Current Caregiver', // TODO: Get from auth context
      description,
      injurySeverity,
      injuryLocation: injuryLocation || undefined,
      actionsTaken,
      witnessName: witnessName || undefined,
      witnessPhone: witnessPhone || undefined,
      photoUris,
      location: {
        latitude: 30.2672,
        longitude: -97.7431,
      },
      familyNotified,
      emergencyServicesContacted: emergencyServicesContacted || incidentType === 'emergency_911',
    };

    // TODO: Save to database and sync to server
    console.log('Incident report submitted:', report);

    Alert.alert(
      'Report Submitted',
      `Incident report has been submitted and your supervisor has been notified.${
        incidentType === 'abuse_neglect' || injurySeverity === 'life_threatening'
          ? '\n\nThis is a HIGH PRIORITY incident. Coordinator has been alerted immediately.'
          : ''
      }`,
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  // Step 1: Type Selection
  if (step === 'type') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Incident</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Incident Type</Text>
            <Text style={styles.sectionSubtitle}>
              Choose the type that best describes what happened
            </Text>

            <View style={styles.typeGrid}>
              {INCIDENT_TYPES.map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeCard,
                    incidentType === type.value && styles.typeCardSelected,
                    type.value === 'abuse_neglect' && styles.typeCardCritical,
                  ]}
                  onPress={() => {
                    setIncidentType(type.value);
                    if (type.value === 'emergency_911') {
                      setEmergencyServicesContacted(true);
                      setActionsTaken(['Called 911']);
                    }
                  }}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text style={styles.typeLabel}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {incidentType && (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => setStep('details')}
            >
              <Text style={styles.nextButtonText}>Next: Incident Details →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // Step 2: Details
  if (step === 'details') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('type')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Incident Details</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Client</Text>
            <Text style={styles.clientName}>{clientName}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What happened? *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the incident in detail. Include when, where, and how it happened..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
            />
            <Text style={styles.helperText}>
              Be specific: Who, What, When, Where, How
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Injury Severity</Text>
            {INJURY_SEVERITIES.map(severity => (
              <TouchableOpacity
                key={severity.value}
                style={[
                  styles.severityOption,
                  injurySeverity === severity.value && styles.severityOptionSelected,
                ]}
                onPress={() => setInjurySeverity(severity.value)}
              >
                <View
                  style={[
                    styles.severityIndicator,
                    { backgroundColor: severity.color },
                  ]}
                />
                <Text style={styles.severityLabel}>{severity.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {injurySeverity !== 'none' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Injury Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Left knee, right forearm, head..."
                value={injuryLocation}
                onChangeText={setInjuryLocation}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Witness Information (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Witness name"
              value={witnessName}
              onChangeText={setWitnessName}
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Witness phone number"
              value={witnessPhone}
              onChangeText={setWitnessPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Photo Documentation (Optional)</Text>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => {
                // TODO: Integrate with camera
                setPhotoUris([...photoUris, 'photo-placeholder.jpg']);
              }}
            >
              <Text style={styles.photoButtonText}>
                📷 Take Photo ({photoUris.length} added)
              </Text>
            </TouchableOpacity>
            {photoUris.length > 0 && (
              <Text style={styles.helperText}>
                {photoUris.length} photo(s) attached
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => setStep('actions')}
          >
            <Text style={styles.nextButtonText}>Next: Actions Taken →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Step 3: Actions
  if (step === 'actions') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('details')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Actions Taken</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What actions did you take? *</Text>
            <Text style={styles.sectionSubtitle}>
              Select all that apply
            </Text>

            {ACTIONS_TAKEN.map(action => (
              <TouchableOpacity
                key={action}
                style={[
                  styles.actionOption,
                  actionsTaken.includes(action) && styles.actionOptionSelected,
                ]}
                onPress={() => toggleAction(action)}
              >
                <View
                  style={[
                    styles.actionCheckbox,
                    actionsTaken.includes(action) && styles.actionCheckboxChecked,
                  ]}
                >
                  {actionsTaken.includes(action) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.actionLabel}>{action}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.notificationOption,
                familyNotified && styles.notificationOptionChecked,
              ]}
              onPress={() => setFamilyNotified(!familyNotified)}
            >
              <View
                style={[
                  styles.notificationCheckbox,
                  familyNotified && styles.notificationCheckboxChecked,
                ]}
              >
                {familyNotified && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View>
                <Text style={styles.notificationLabel}>
                  Family/Emergency Contact Notified
                </Text>
                <Text style={styles.notificationSubtext}>
                  Check if you contacted the family about this incident
                </Text>
              </View>
            </TouchableOpacity>

            {(incidentType === 'emergency_911' || injurySeverity === 'life_threatening') && (
              <TouchableOpacity
                style={[
                  styles.notificationOption,
                  styles.notificationOptionCritical,
                  emergencyServicesContacted && styles.notificationOptionChecked,
                ]}
                onPress={() => setEmergencyServicesContacted(!emergencyServicesContacted)}
              >
                <View
                  style={[
                    styles.notificationCheckbox,
                    emergencyServicesContacted && styles.notificationCheckboxChecked,
                  ]}
                >
                  {emergencyServicesContacted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View>
                  <Text style={[styles.notificationLabel, { color: '#991b1b' }]}>
                    Emergency Services (911) Contacted
                  </Text>
                  <Text style={styles.notificationSubtext}>
                    Required for life-threatening situations
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => setStep('review')}
          >
            <Text style={styles.nextButtonText}>Review & Submit →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Step 4: Review
  const selectedType = INCIDENT_TYPES.find(t => t.value === incidentType);
  const selectedSeverity = INJURY_SEVERITIES.find(s => s.value === injurySeverity);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('actions')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Report</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Incident Type</Text>
          <Text style={styles.reviewValue}>
            {selectedType?.icon} {selectedType?.label}
          </Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Client</Text>
          <Text style={styles.reviewValue}>{clientName}</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Description</Text>
          <Text style={styles.reviewValue}>{description}</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Injury Severity</Text>
          <View style={styles.severityReview}>
            <View
              style={[
                styles.severityIndicator,
                { backgroundColor: selectedSeverity?.color },
              ]}
            />
            <Text style={styles.reviewValue}>{selectedSeverity?.label}</Text>
          </View>
          {injuryLocation && (
            <Text style={styles.reviewSubValue}>Location: {injuryLocation}</Text>
          )}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Actions Taken</Text>
          {actionsTaken.map((action, idx) => (
            <Text key={idx} style={styles.reviewListItem}>
              • {action}
            </Text>
          ))}
        </View>

        {witnessName && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Witness</Text>
            <Text style={styles.reviewValue}>{witnessName}</Text>
            {witnessPhone && (
              <Text style={styles.reviewSubValue}>{witnessPhone}</Text>
            )}
          </View>
        )}

        {photoUris.length > 0 && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Photos</Text>
            <Text style={styles.reviewValue}>{photoUris.length} photo(s) attached</Text>
          </View>
        )}

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Notifications</Text>
          {familyNotified && (
            <Text style={styles.reviewListItem}>✓ Family/Emergency Contact</Text>
          )}
          {emergencyServicesContacted && (
            <Text style={[styles.reviewListItem, { color: '#991b1b' }]}>
              ✓ Emergency Services (911)
            </Text>
          )}
          <Text style={[styles.reviewListItem, { color: '#3b82f6' }]}>
            ✓ Supervisor/Coordinator (automatic)
          </Text>
        </View>

        {(incidentType === 'abuse_neglect' ||
          injurySeverity === 'life_threatening' ||
          injurySeverity === 'severe') && (
          <View style={styles.criticalAlert}>
            <Text style={styles.criticalAlertIcon}>⚠️</Text>
            <View>
              <Text style={styles.criticalAlertTitle}>HIGH PRIORITY INCIDENT</Text>
              <Text style={styles.criticalAlertText}>
                Your supervisor will be notified immediately upon submission.
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Incident Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            Alert.alert(
              'Cancel Report?',
              'Are you sure you want to cancel? All information will be lost.',
              [
                { text: 'Keep Editing', style: 'cancel' },
                { text: 'Cancel Report', onPress: () => navigation.goBack(), style: 'destructive' },
              ]
            );
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel Report</Text>
        </TouchableOpacity>
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
    backgroundColor: '#ef4444',
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
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '47%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  typeCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  typeCardCritical: {
    borderColor: '#dc2626',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: '#374151',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  severityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  severityOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  severityIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  severityLabel: {
    fontSize: 14,
    color: '#374151',
  },
  photoButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3b82f6',
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  actionOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  actionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCheckboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  notificationOptionChecked: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  notificationOptionCritical: {
    borderColor: '#dc2626',
  },
  notificationCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCheckboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  notificationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  notificationSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewSection: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    color: '#111827',
  },
  reviewSubValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  reviewListItem: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
  },
  severityReview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criticalAlert: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  criticalAlertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  criticalAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  criticalAlertText: {
    fontSize: 12,
    color: '#991b1b',
  },
  submitButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9ca3af',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
