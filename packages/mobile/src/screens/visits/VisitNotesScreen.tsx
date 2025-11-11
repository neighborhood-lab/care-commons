/**
 * Visit Notes Screen - Enhanced
 *
 * Rich text notes for visit documentation with:
 * - Template selection
 * - Voice-to-text input
 * - Activities performed checkboxes
 * - Client mood/condition assessment
 * - Incident reporting with severity
 * - Offline storage and API sync
 * - 24-hour modification lock (compliance)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  FlatList,
  Switch,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/index';
import { VoiceService } from '../../services/voice.service';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../database/index';
import type { VisitNote } from '../../database/models/VisitNote';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'VisitNotes'>;

const DEFAULT_TEMPLATES = [
  {
    id: 'template-1',
    name: 'Client in Good Spirits',
    category: 'GENERAL',
    text: 'Client was in good spirits and responsive. All scheduled services were completed as planned.',
  },
  {
    id: 'template-2',
    name: 'Assisted with ADLs',
    category: 'ADL',
    text: 'Assisted client with activities of daily living including bathing, dressing, and meal preparation. Client tolerated activities well.',
  },
  {
    id: 'template-3',
    name: 'Vital Signs Checked',
    category: 'VITAL_SIGNS',
    text: 'Vital signs checked and recorded. Blood pressure: [BP], Pulse: [PULSE], Temperature: [TEMP]. All readings within normal range.',
  },
  {
    id: 'template-4',
    name: 'Medication Reminder',
    category: 'CLINICAL',
    text: 'Reminded client to take prescribed medications. Client took medications as scheduled without issues.',
  },
  {
    id: 'template-5',
    name: 'Mobility Assistance',
    category: 'ADL',
    text: 'Provided mobility assistance and fall prevention support. Client used walker/cane safely throughout visit.',
  },
];

const COMMON_ACTIVITIES = [
  { id: 'bathing', label: 'Bathing/Showering' },
  { id: 'dressing', label: 'Dressing' },
  { id: 'grooming', label: 'Grooming' },
  { id: 'meal_prep', label: 'Meal Preparation' },
  { id: 'feeding', label: 'Feeding Assistance' },
  { id: 'mobility', label: 'Mobility Assistance' },
  { id: 'medication', label: 'Medication Reminder' },
  { id: 'companionship', label: 'Companionship' },
  { id: 'light_housekeeping', label: 'Light Housekeeping' },
  { id: 'vital_signs', label: 'Vital Signs Check' },
];

const CLIENT_MOODS = [
  { value: 'EXCELLENT', label: 'Excellent', color: '#10B981' },
  { value: 'GOOD', label: 'Good', color: '#3B82F6' },
  { value: 'FAIR', label: 'Fair', color: '#F59E0B' },
  { value: 'POOR', label: 'Poor', color: '#EF4444' },
  { value: 'DISTRESSED', label: 'Distressed', color: '#DC2626' },
  { value: 'UNRESPONSIVE', label: 'Unresponsive', color: '#991B1B' },
];

const INCIDENT_SEVERITIES = [
  { value: 'LOW', label: 'Low', description: 'Minor issue, no injury' },
  { value: 'MEDIUM', label: 'Medium', description: 'Moderate concern' },
  { value: 'HIGH', label: 'High', description: 'Significant issue' },
  { value: 'CRITICAL', label: 'Critical', description: 'Immediate action required' },
];

export function VisitNotesScreen({ route, navigation }: Props) {
  const { visitId, organizationId, caregiverId, evvRecordId } = route.params;

  // Note content
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'GENERAL' | 'CLINICAL' | 'INCIDENT' | 'TASK'>('GENERAL');
  
  // Activities performed
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  
  // Client assessment
  const [clientMood, setClientMood] = useState<string | null>(null);
  const [clientConditionNotes, setClientConditionNotes] = useState('');
  
  // Incident tracking
  const [isIncident, setIsIncident] = useState(false);
  const [incidentSeverity, setIncidentSeverity] = useState<string | null>(null);
  const [incidentDescription, setIncidentDescription] = useState('');
  
  // UI state
  const [templates, setTemplates] = useState<typeof DEFAULT_TEMPLATES>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingNotes, setExistingNotes] = useState<VisitNote[]>([]);

  const voiceService = new VoiceService(database);

  /**
   * Load templates and existing notes
   */
  useEffect(() => {
    void loadTemplates();
    void loadExistingNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = async () => {
    try {
      setTemplates(DEFAULT_TEMPLATES);
    } catch (error) {
      console.error('Load templates error:', error);
    }
  };

  const loadExistingNotes = async () => {
    try {
      const notes = await database
        .get<VisitNote>('visit_notes')
        .query(Q.where('visit_id', visitId))
        .fetch();

      setExistingNotes(notes);
    } catch (error) {
      console.error('Load notes error:', error);
    }
  };

  /**
   * Handle template selection
   */
  const handleSelectTemplate = (template: typeof DEFAULT_TEMPLATES[0]) => {
    setNoteText(template.text);
    setShowTemplates(false);
  };

  /**
   * Handle activity toggle
   */
  const toggleActivity = (activityId: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  /**
   * Handle voice recording
   */
  const handleVoiceRecord = async () => {
    if (isRecording) {
      try {
        const recognizedText = await voiceService.stopRecognition();
        if (recognizedText) {
          setNoteText((prev) => prev + (prev ? ' ' : '') + recognizedText);
        }
        setIsRecording(false);
      } catch (error) {
        console.error('Stop recording error:', error);
        setIsRecording(false);
      }
    } else {
      try {
        await voiceService.startRecognition(
          {
            language: 'en-US',
            continuous: true,
          },
          (result) => {
            if (result.isFinal) {
              setNoteText((prev) => prev + (prev ? ' ' : '') + result.text);
            }
          },
          (error) => {
            console.error('Voice recognition error:', error);
            setIsRecording(false);
            Alert.alert('Error', error.message);
          }
        );
        setIsRecording(true);
      } catch (error) {
        console.error('Start recording error:', error);
        Alert.alert('Error', 'Failed to start voice recording');
      }
    }
  };

  /**
   * Handle save note
   */
  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      Alert.alert('Error', 'Please enter some text for the note');
      return;
    }

    if (isIncident && !incidentSeverity) {
      Alert.alert('Error', 'Please select incident severity');
      return;
    }

    setIsSaving(true);

    try {
      await database.write(async () => {
        await database.get<VisitNote>('visit_notes').create((record) => {
          record.visitId = visitId;
          if (evvRecordId) record.evvRecordId = evvRecordId;
          record.organizationId = organizationId;
          record.caregiverId = caregiverId;
          record.noteType = noteType;
          record.noteText = noteText.trim();
          record.isVoiceNote = false;
          record.isSynced = false;
          record.syncPending = true;
          
          // Store activities as JSONB-compatible string
          // Will be synced to backend as array
          if (selectedActivities.length > 0) {
            // @ts-expect-error - WatermelonDB doesn't have built-in JSONB support yet
            record._raw.activities_performed = JSON.stringify(selectedActivities);
          }
          
          // Store mood and condition
          if (clientMood) {
            // @ts-expect-error - Extended schema field
            record._raw.client_mood = clientMood;
          }
          if (clientConditionNotes) {
            // @ts-expect-error - Extended schema field
            record._raw.client_condition_notes = clientConditionNotes;
          }
          
          // Store incident data
          if (isIncident) {
            // @ts-expect-error - Extended schema field
            record._raw.is_incident = true;
            // @ts-expect-error - Extended schema field
            record._raw.incident_severity = incidentSeverity;
            // @ts-expect-error - Extended schema field
            record._raw.incident_description = incidentDescription;
          }
        });
      });

      Alert.alert('Success', 'Note saved successfully', [
        {
          text: 'Add Another',
          onPress: () => {
            // Reset form
            setNoteText('');
            setSelectedActivities([]);
            setClientMood(null);
            setClientConditionNotes('');
            setIsIncident(false);
            setIncidentSeverity(null);
            setIncidentDescription('');
            void loadExistingNotes();
          },
        },
        {
          text: 'Done',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Save note error:', error);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Render note type button
   */
  const renderNoteTypeButton = (type: typeof noteType, label: string) => (
    <Pressable
      style={[
        styles.typeButton,
        noteType === type && styles.typeButtonActive,
      ]}
      onPress={() => setNoteType(type)}
    >
      <Text
        style={[
          styles.typeButtonText,
          noteType === type && styles.typeButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  /**
   * Render template item
   */
  const renderTemplate = ({ item }: { item: typeof DEFAULT_TEMPLATES[0] }) => (
    <Pressable
      style={styles.templateItem}
      onPress={() => handleSelectTemplate(item)}
    >
      <Text style={styles.templateName}>{item.name}</Text>
      <Text style={styles.templateCategory}>{item.category}</Text>
      <Text style={styles.templatePreview} numberOfLines={2}>
        {item.text}
      </Text>
    </Pressable>
  );

  /**
   * Render existing note
   */
  const renderExistingNote = ({ item }: { item: VisitNote }) => {
    const isLocked = item.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return (
      <View style={styles.existingNote}>
        <View style={styles.existingNoteHeader}>
          <Text style={styles.existingNoteType}>{item.noteType}</Text>
          <View style={styles.existingNoteMetadata}>
            <Text style={styles.existingNoteDate}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
            {isLocked && <Text style={styles.lockedIndicator}>🔒 Locked</Text>}
            {item.syncPending && <Text style={styles.syncIndicator}>⏳ Pending</Text>}
            {item.isSynced && <Text style={styles.syncedIndicator}>✓ Synced</Text>}
          </View>
        </View>
        <Text style={styles.existingNoteText}>{item.noteText}</Text>
        {item.isVoiceNote && (
          <Text style={styles.voiceIndicator}>🎤 Voice note</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Visit Notes</Text>
        <Text style={styles.subtitle}>Document visit details and observations</Text>

        {/* Note Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Note Type</Text>
          <View style={styles.typeButtons}>
            {renderNoteTypeButton('GENERAL', 'General')}
            {renderNoteTypeButton('CLINICAL', 'Clinical')}
            {renderNoteTypeButton('INCIDENT', 'Incident')}
            {renderNoteTypeButton('TASK', 'Task')}
          </View>
        </View>

        {/* Template Selection */}
        <View style={styles.section}>
          <Pressable
            style={styles.templateToggle}
            onPress={() => setShowTemplates(!showTemplates)}
          >
            <Text style={styles.sectionLabel}>Quick Templates</Text>
            <Text style={styles.templateToggleIcon}>
              {showTemplates ? '▼' : '▶'}
            </Text>
          </Pressable>

          {showTemplates && (
            <FlatList
              data={templates}
              renderItem={renderTemplate}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templateList}
            />
          )}
        </View>

        {/* Activities Performed */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Activities Performed</Text>
          <View style={styles.activitiesGrid}>
            {COMMON_ACTIVITIES.map((activity) => (
              <Pressable
                key={activity.id}
                style={[
                  styles.activityItem,
                  selectedActivities.includes(activity.id) && styles.activityItemSelected,
                ]}
                onPress={() => toggleActivity(activity.id)}
              >
                <View style={styles.checkbox}>
                  {selectedActivities.includes(activity.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.activityLabel,
                    selectedActivities.includes(activity.id) && styles.activityLabelSelected,
                  ]}
                >
                  {activity.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Client Mood/Condition */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Client Mood</Text>
          <View style={styles.moodButtons}>
            {CLIENT_MOODS.map((mood) => (
              <Pressable
                key={mood.value}
                style={[
                  styles.moodButton,
                  clientMood === mood.value && { backgroundColor: mood.color, borderColor: mood.color },
                ]}
                onPress={() => setClientMood(mood.value)}
              >
                <Text
                  style={[
                    styles.moodButtonText,
                    clientMood === mood.value && styles.moodButtonTextSelected,
                  ]}
                >
                  {mood.label}
                </Text>
              </Pressable>
            ))}
          </View>
          
          <Text style={styles.subSectionLabel}>Additional Condition Notes</Text>
          <TextInput
            style={styles.conditionInput}
            placeholder="Any observations about client's condition..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={clientConditionNotes}
            onChangeText={setClientConditionNotes}
            textAlignVertical="top"
          />
        </View>

        {/* Incident Reporting */}
        <View style={styles.section}>
          <View style={styles.incidentHeader}>
            <Text style={styles.sectionLabel}>Incident Reported</Text>
            <Switch
              value={isIncident}
              onValueChange={setIsIncident}
              trackColor={{ false: '#D1D5DB', true: '#EF4444' }}
              thumbColor={isIncident ? '#DC2626' : '#F3F4F6'}
            />
          </View>

          {isIncident && (
            <>
              <Text style={styles.subSectionLabel}>Incident Severity</Text>
              <View style={styles.severityButtons}>
                {INCIDENT_SEVERITIES.map((severity) => (
                  <Pressable
                    key={severity.value}
                    style={[
                      styles.severityButton,
                      incidentSeverity === severity.value && styles.severityButtonActive,
                    ]}
                    onPress={() => setIncidentSeverity(severity.value)}
                  >
                    <Text
                      style={[
                        styles.severityButtonLabel,
                        incidentSeverity === severity.value && styles.severityButtonLabelActive,
                      ]}
                    >
                      {severity.label}
                    </Text>
                    <Text style={styles.severityButtonDescription}>
                      {severity.description}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.subSectionLabel}>Incident Description</Text>
              <TextInput
                style={styles.incidentInput}
                placeholder="Describe the incident in detail..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={incidentDescription}
                onChangeText={setIncidentDescription}
                textAlignVertical="top"
              />
            </>
          )}
        </View>

        {/* Note Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Visit Notes</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Enter detailed visit notes here..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={8}
            value={noteText}
            onChangeText={setNoteText}
            textAlignVertical="top"
          />

          {/* Voice Recording Button */}
          <Pressable
            style={[
              styles.voiceButton,
              isRecording && styles.voiceButtonActive,
            ]}
            onPress={handleVoiceRecord}
          >
            <Text style={styles.voiceButtonIcon}>
              {isRecording ? '⏹' : '🎤'}
            </Text>
            <Text style={styles.voiceButtonText}>
              {isRecording ? 'Stop Recording' : 'Voice to Text'}
            </Text>
          </Pressable>
        </View>

        {/* Existing Notes */}
        {existingNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Previous Notes ({existingNotes.length})</Text>
            {existingNotes.map((note) => (
              <View key={note.id}>
                {renderExistingNote({ item: note })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Button
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={styles.footerButton}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onPress={handleSaveNote}
          style={styles.footerButton}
          disabled={isSaving || !noteText.trim()}
          loading={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Note'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  subSectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  templateToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateToggleIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  templateList: {
    marginTop: 12,
  },
  templateItem: {
    width: 200,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  templateCategory: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 8,
  },
  templatePreview: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  activityLabel: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
  },
  activityLabelSelected: {
    color: '#2563EB',
    fontWeight: '500',
  },
  moodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moodButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  moodButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  conditionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  severityButtons: {
    gap: 8,
    marginBottom: 12,
  },
  severityButton: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  severityButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  severityButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  severityButtonLabelActive: {
    color: '#DC2626',
  },
  severityButtonDescription: {
    fontSize: 11,
    color: '#6B7280',
  },
  incidentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 150,
  },
  voiceButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  voiceButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  voiceButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  voiceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  existingNote: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 12,
  },
  existingNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  existingNoteType: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  existingNoteMetadata: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  existingNoteDate: {
    fontSize: 10,
    color: '#6B7280',
  },
  lockedIndicator: {
    fontSize: 10,
    color: '#EF4444',
  },
  syncIndicator: {
    fontSize: 10,
    color: '#F59E0B',
  },
  syncedIndicator: {
    fontSize: 10,
    color: '#10B981',
  },
  existingNoteText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  voiceIndicator: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButton: {
    flex: 1,
  },
});
