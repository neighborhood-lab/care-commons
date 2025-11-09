/**
 * Visit Notes Screen
 *
 * Rich text notes for visit documentation with:
 * - Template selection
 * - Voice-to-text input
 * - Text formatting
 * - Offline storage and sync
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
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/index.js';
import { VoiceService } from '../../services/voice.service.js';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../database/index.js';
import type { VisitNote } from '../../database/models/VisitNote.js';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';

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

export function VisitNotesScreen({ route, navigation }: Props) {
  const { visitId, organizationId, caregiverId, evvRecordId } = route.params;

  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'GENERAL' | 'CLINICAL' | 'INCIDENT' | 'TASK'>('GENERAL');
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
      // In production, load from database
      // For now, use default templates
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
   * Handle voice recording
   */
  const handleVoiceRecord = async () => {
    if (isRecording) {
      // Stop recording
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
      // Start recording
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
        });
      });

      Alert.alert('Success', 'Note saved successfully', [
        {
          text: 'Add Another',
          onPress: () => {
            setNoteText('');
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
  const renderNoteTypeButton = (
    type: typeof noteType,
    label: string
  ) => (
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
  const renderExistingNote = ({ item }: { item: VisitNote }) => (
    <View style={styles.existingNote}>
      <View style={styles.existingNoteHeader}>
        <Text style={styles.existingNoteType}>{item.noteType}</Text>
        <Text style={styles.existingNoteDate}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
      <Text style={styles.existingNoteText}>{item.noteText}</Text>
      {item.isVoiceNote && (
        <Text style={styles.voiceIndicator}>🎤 Voice note</Text>
      )}
    </View>
  );

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

        {/* Note Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Note Text</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Enter visit notes here..."
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
            <Text style={styles.sectionLabel}>Previous Notes</Text>
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
  existingNoteDate: {
    fontSize: 10,
    color: '#6B7280',
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
