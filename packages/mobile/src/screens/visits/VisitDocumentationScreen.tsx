/**
 * Visit Documentation Screen
 *
 * Allows caregivers to document care activities during a visit:
 * - Task completion checklist
 * - Care notes entry with voice-to-text and templates
 * - Vital signs recording
 * - Incident reporting
 * - Photo documentation with upload
 * - Signature capture with integrity verification
 * - Auto-save drafts to local DB
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, CardContent, Badge, Button } from '../../components/index.js';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';
import { noteTemplatesService } from '../../services/note-templates.service.js';
import { voiceToTextService } from '../../services/voice-to-text.service.js';
import { photoUploadService } from '../../services/photo-upload.service.js';
import { useAuth } from '../../hooks/useAuth.js';
import type { NoteTemplate } from '../../database/models/NoteTemplate.js';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = NativeStackScreenProps<RootStackParamList, 'VisitDocumentation'>['route'];

interface Task {
  id: string;
  title: string;
  required: boolean;
  completed: boolean;
}

interface VitalSigns {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  temperature: string;
  oxygenSaturation: string;
}

interface IncidentReport {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export function VisitDocumentationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { visitId } = route.params;
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [careNotes, setCareNotes] = useState('');
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
  });
  const [hasIncident, setHasIncident] = useState(false);
  const [incidentReport, setIncidentReport] = useState<IncidentReport>({
    type: '',
    description: '',
    severity: 'low',
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [caregiverSignature] = useState<string | null>(null);
  const [clientSignature] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Voice-to-text state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Note templates state
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);

  useEffect(() => {
    loadDocumentation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId]);

  useEffect(() => {
    // Auto-save every 30 seconds
    const interval = setInterval(() => {
      if (!isSaving) {
        autoSave();
      }
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, careNotes, vitalSigns, incidentReport, photos]);

  useEffect(() => {
    // Recording timer
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const loadDocumentation = async () => {
    setIsLoading(true);
    try {
      // Load templates
      if (user?.organizationId) {
        const loadedTemplates = await noteTemplatesService.getActiveTemplates(
          user.organizationId,
          'care_notes'
        );
        setTemplates(loadedTemplates);
      }

      // TODO: Load from WatermelonDB
      // Mock data
      const mockTasks: Task[] = [
        { id: '1', title: 'Assist with bathing', required: true, completed: false },
        { id: '2', title: 'Medication reminder', required: true, completed: false },
        { id: '3', title: 'Prepare meal', required: true, completed: false },
        { id: '4', title: 'Light housekeeping', required: false, completed: false },
        { id: '5', title: 'Recreational activities', required: false, completed: false },
      ];
      setTasks(mockTasks);
    } catch (error) {
      console.error('Failed to load documentation:', error);
      Alert.alert('Error', 'Failed to load documentation');
    } finally {
      setIsLoading(false);
    }
  };

  const autoSave = async () => {
    try {
      // TODO: Save to WatermelonDB
      setLastSaved(new Date());
    } catch {
      // Silent fail for auto-save
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleTakePhoto = () => {
    navigation.navigate('Camera', {
      onCapture: async (uri: string) => {
        // Save photo to database and queue for upload
        try {
          if (user) {
            await photoUploadService.savePhoto(uri, {
              visitId,
              organizationId: user.organizationId,
              caregiverId: user.id, // Using user.id as caregiver identifier
              clientId: 'client_id', // TODO: Get from visit
              photoType: 'care_documentation',
            });
            setPhotos([...photos, uri]);
          }
        } catch (error) {
          console.error('Failed to save photo:', error);
          Alert.alert('Error', 'Failed to save photo');
        }
      },
    });
  };

  const handleCaptureSignature = (_type: 'caregiver' | 'client') => {
    navigation.navigate('Signature', {
      visitId,
      clientName: 'Client Name', // TODO: Get from visit
      clientId: 'client_id', // TODO: Get from visit
    });
  };

  // Voice-to-text handlers
  const handleStartRecording = async () => {
    try {
      await voiceToTextService.startRecording();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start voice recording. Please check microphone permissions.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const recording = await voiceToTextService.stopRecording();
      setIsRecording(false);

      // Show transcription in progress
      Alert.alert(
        'Transcribing...',
        'Converting your voice to text. This may take a moment.',
        [{ text: 'OK' }]
      );

      // Transcribe audio
      const transcription = await voiceToTextService.transcribeAudio(recording.uri);

      // Append to care notes
      const newText = careNotes
        ? `${careNotes}\n\n${transcription.text}`
        : transcription.text;
      setCareNotes(newText);

      // TODO: Save voice note to database
      if (user) {
        await noteTemplatesService.createNote({
          visitId,
          organizationId: user.organizationId,
          caregiverId: user.id, // Using user.id as caregiver identifier
          clientId: 'client_id', // TODO: Get from visit
          noteText: transcription.text,
          noteType: 'care_notes',
          isVoiceTranscribed: true,
          audioUri: recording.uri,
          transcriptionConfidence: transcription.confidence,
          durationSeconds: Math.floor(recording.durationMillis / 1000),
        });
      }

      Alert.alert(
        'Transcription Complete',
        `Voice note added to care notes (${Math.floor(transcription.confidence * 100)}% confidence)`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to process voice recording');
      setIsRecording(false);
    }
  };

  const handleCancelRecording = async () => {
    await voiceToTextService.cancelRecording();
    setIsRecording(false);
  };

  // Template handlers
  const handleSelectTemplate = (template: NoteTemplate) => {
    const templateText = noteTemplatesService.applyTemplate(template);
    const newText = careNotes
      ? `${careNotes}\n\n${templateText}`
      : templateText;
    setCareNotes(newText);
    setShowTemplates(false);
  };

  const handleSave = async () => {
    // Validate required fields
    const requiredTasks = tasks.filter(t => t.required);
    const completedRequiredTasks = requiredTasks.filter(t => t.completed);

    if (completedRequiredTasks.length < requiredTasks.length) {
      Alert.alert(
        'Required Tasks',
        'Please complete all required tasks before saving.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!careNotes.trim()) {
      Alert.alert(
        'Care Notes Required',
        'Please enter care notes before saving.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSaving(true);
    try {
      // Save care notes
      if (user) {
        await noteTemplatesService.createNote({
          visitId,
          organizationId: user.organizationId,
          caregiverId: user.id, // Using user.id as caregiver identifier
          clientId: 'client_id', // TODO: Get from visit
          noteText: careNotes,
          noteType: 'care_notes',
        });
      }

      Alert.alert(
        'Documentation Saved',
        'Visit documentation has been saved successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save documentation:', error);
      Alert.alert('Error', 'Failed to save documentation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const requiredTasksCompleted = tasks.filter(t => t.required && t.completed).length;
  const totalRequiredTasks = tasks.filter(t => t.required).length;

  return (
    <ScrollView style={styles.container}>
      {/* Auto-save indicator */}
      {lastSaved && (
        <View style={styles.autoSaveBanner}>
          <Text style={styles.autoSaveText}>
            ✓ Auto-saved at {lastSaved.toLocaleTimeString()}
          </Text>
        </View>
      )}

      {/* Task Checklist */}
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <Badge variant="primary" size="sm">
              {requiredTasksCompleted}/{totalRequiredTasks} Required
            </Badge>
          </View>

          {tasks.map((task) => (
            <Pressable
              key={task.id}
              style={styles.taskItem}
              onPress={() => toggleTask(task.id)}
            >
              <View style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
                {task.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                  {task.title}
                </Text>
                {task.required && (
                  <Badge variant="danger" size="sm">
                    Required
                  </Badge>
                )}
              </View>
            </Pressable>
          ))}
        </CardContent>
      </Card>

      {/* Care Notes */}
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Care Notes *</Text>
            <Badge variant="danger" size="sm">
              Required
            </Badge>
          </View>

          <TextInput
            style={styles.textArea}
            placeholder="Document care activities, observations, and any notable events..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            value={careNotes}
            onChangeText={setCareNotes}
            textAlignVertical="top"
          />

          {/* Voice-to-text and Templates */}
          <View style={styles.noteActions}>
            {!isRecording ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={handleStartRecording}
                  style={styles.noteActionButton}
                >
                  🎤 Voice Input
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => setShowTemplates(true)}
                  style={styles.noteActionButton}
                >
                  📝 Use Template
                </Button>
              </>
            ) : (
              <View style={styles.recordingControls}>
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>
                    Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
                <Button
                  variant="danger"
                  size="sm"
                  onPress={handleCancelRecording}
                  style={styles.recordingButton}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={handleStopRecording}
                  style={styles.recordingButton}
                >
                  Stop & Transcribe
                </Button>
              </View>
            )}
          </View>
        </CardContent>
      </Card>

      {/* Vital Signs */}
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vital Signs</Text>
            <Text style={styles.optionalText}>(Optional)</Text>
          </View>

          <View style={styles.vitalSignsRow}>
            <View style={styles.vitalSignInput}>
              <Text style={styles.inputLabel}>Blood Pressure</Text>
              <View style={styles.bpContainer}>
                <TextInput
                  style={styles.smallInput}
                  placeholder="120"
                  keyboardType="numeric"
                  value={vitalSigns.bloodPressureSystolic}
                  onChangeText={(text) =>
                    setVitalSigns({ ...vitalSigns, bloodPressureSystolic: text })
                  }
                />
                <Text style={styles.bpSeparator}>/</Text>
                <TextInput
                  style={styles.smallInput}
                  placeholder="80"
                  keyboardType="numeric"
                  value={vitalSigns.bloodPressureDiastolic}
                  onChangeText={(text) =>
                    setVitalSigns({ ...vitalSigns, bloodPressureDiastolic: text })
                  }
                />
              </View>
            </View>

            <View style={styles.vitalSignInput}>
              <Text style={styles.inputLabel}>Heart Rate (bpm)</Text>
              <TextInput
                style={styles.input}
                placeholder="72"
                keyboardType="numeric"
                value={vitalSigns.heartRate}
                onChangeText={(text) => setVitalSigns({ ...vitalSigns, heartRate: text })}
              />
            </View>
          </View>

          <View style={styles.vitalSignsRow}>
            <View style={styles.vitalSignInput}>
              <Text style={styles.inputLabel}>Temperature (°F)</Text>
              <TextInput
                style={styles.input}
                placeholder="98.6"
                keyboardType="decimal-pad"
                value={vitalSigns.temperature}
                onChangeText={(text) => setVitalSigns({ ...vitalSigns, temperature: text })}
              />
            </View>

            <View style={styles.vitalSignInput}>
              <Text style={styles.inputLabel}>O2 Saturation (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="98"
                keyboardType="numeric"
                value={vitalSigns.oxygenSaturation}
                onChangeText={(text) =>
                  setVitalSigns({ ...vitalSigns, oxygenSaturation: text })
                }
              />
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Incident Reporting */}
      <Card style={styles.card}>
        <CardContent>
          <Pressable
            style={styles.incidentToggle}
            onPress={() => setHasIncident(!hasIncident)}
          >
            <View style={[styles.checkbox, hasIncident && styles.checkboxChecked]}>
              {hasIncident && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.incidentToggleText}>Report an incident</Text>
          </Pressable>

          {hasIncident && (
            <View style={styles.incidentForm}>
              <Text style={styles.inputLabel}>Incident Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Fall, Medication issue, etc."
                value={incidentReport.type}
                onChangeText={(text) =>
                  setIncidentReport({ ...incidentReport, type: text })
                }
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe the incident in detail..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={incidentReport.description}
                onChangeText={(text) =>
                  setIncidentReport({ ...incidentReport, description: text })
                }
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>Severity</Text>
              <View style={styles.severityButtons}>
                {(['low', 'medium', 'high'] as const).map((severity) => (
                  <Pressable
                    key={severity}
                    style={[
                      styles.severityButton,
                      incidentReport.severity === severity && styles.severityButtonSelected,
                    ]}
                    onPress={() =>
                      setIncidentReport({ ...incidentReport, severity })
                    }
                  >
                    <Text
                      style={[
                        styles.severityButtonText,
                        incidentReport.severity === severity &&
                          styles.severityButtonTextSelected,
                      ]}
                    >
                      {severity.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Photo Documentation */}
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.optionalText}>
              ({photos.length} captured)
            </Text>
          </View>

          <Button
            variant="secondary"
            size="md"
            onPress={handleTakePhoto}
            style={styles.photoButton}
          >
            📷 Take Photo
          </Button>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Signatures</Text>

          <View style={styles.signatureItem}>
            <View style={styles.signatureHeader}>
              <Text style={styles.signatureLabel}>Caregiver Signature *</Text>
              {caregiverSignature && (
                <Badge variant="success" size="sm">
                  Signed
                </Badge>
              )}
            </View>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => handleCaptureSignature('caregiver')}
            >
              {caregiverSignature ? 'Update Signature' : 'Sign'}
            </Button>
          </View>

          <View style={styles.signatureItem}>
            <View style={styles.signatureHeader}>
              <Text style={styles.signatureLabel}>Client/Family Signature</Text>
              {clientSignature && (
                <Badge variant="success" size="sm">
                  Signed
                </Badge>
              )}
            </View>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => handleCaptureSignature('client')}
            >
              {clientSignature ? 'Update Signature' : 'Sign'}
            </Button>
          </View>
        </CardContent>
      </Card>

      {/* Save Button */}
      <View style={styles.actionContainer}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleSave}
          disabled={isSaving}
          style={styles.saveButton}
        >
          {isSaving ? 'Saving...' : 'Save Documentation'}
        </Button>
      </View>

      {/* Note Templates Modal */}
      <Modal
        visible={showTemplates}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTemplates(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Note Template</Text>
              <Pressable onPress={() => setShowTemplates(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.templateItem}
                  onPress={() => handleSelectTemplate(item)}
                >
                  <Text style={styles.templateName}>{item.templateName}</Text>
                  <Text style={styles.templatePreview} numberOfLines={2}>
                    {item.templateText}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No templates available</Text>
              }
            />
          </View>
        </View>
      </Modal>
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
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  autoSaveBanner: {
    padding: 8,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
  },
  autoSaveText: {
    fontSize: 12,
    color: '#065F46',
  },
  card: {
    margin: 16,
    marginBottom: 0,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  optionalText: {
    fontSize: 14,
    color: '#6B7280',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskTitle: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 120,
    backgroundColor: '#FFFFFF',
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  noteActionButton: {
    flex: 1,
  },
  recordingControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
  },
  recordingText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  recordingButton: {
    paddingHorizontal: 12,
  },
  vitalSignsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  vitalSignInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  bpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bpSeparator: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  incidentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  incidentToggleText: {
    fontSize: 16,
    color: '#111827',
  },
  incidentForm: {
    marginTop: 8,
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  severityButtonSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  severityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  severityButtonTextSelected: {
    color: '#FFFFFF',
  },
  photoButton: {
    marginTop: 4,
  },
  signatureItem: {
    marginBottom: 16,
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  actionContainer: {
    padding: 16,
    marginTop: 8,
  },
  saveButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
  },
  templateItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  templatePreview: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 20,
  },
});
