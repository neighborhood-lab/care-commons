/**
 * Visit Notes Screen - Enhanced
 *
 * Rich text notes for visit documentation with:
 * - Template selection by category with customizable fields
 * - Voice-to-text input
 * - Activities performed checkboxes
 * - Client mood/condition assessment
 * - Incident reporting with severity
 * - Auto-fill from care plan
 * - Save as new template
 * - Offline storage and API sync
 * - 24-hour modification lock (compliance)
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/index';
import { VoiceService } from '../../services/voice.service';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../database/index';
import type { VisitNote } from '../../database/models/VisitNote';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import {
  visitNotesTemplateService,
  type VisitNoteTemplate,
  type TemplateCategory,
  type TemplateVariable,
} from '../../services/visitnotes-template.service';

type Props = NativeStackScreenProps<RootStackParamList, 'VisitNotes'>;

// Template categories for filtering
const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string; icon: string }[] = [
  { value: 'personal_care', label: 'Personal Care', icon: '🛁' },
  { value: 'medication', label: 'Medication', icon: '💊' },
  { value: 'meal_prep', label: 'Meal Prep', icon: '🍽️' },
  { value: 'companionship', label: 'Companionship', icon: '💬' },
  { value: 'transportation', label: 'Transportation', icon: '🚗' },
  { value: 'housekeeping', label: 'Housekeeping', icon: '🧹' },
  { value: 'vital_signs', label: 'Vital Signs', icon: '❤️' },
  { value: 'mobility', label: 'Mobility', icon: '🚶' },
  { value: 'general', label: 'General', icon: '📝' },
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
  const [templates, setTemplates] = useState<VisitNoteTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<VisitNoteTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingNotes, setExistingNotes] = useState<VisitNote[]>([]);

  const voiceService = new VoiceService(database);

  const loadTemplates = useCallback(async () => {
    try {
      if (selectedCategory) {
        const categoryTemplates = await visitNotesTemplateService.getTemplatesByCategory(selectedCategory);
        setTemplates(categoryTemplates);
      } else {
        const allTemplates = await visitNotesTemplateService.getAllTemplates();
        setTemplates(allTemplates);
      }
    } catch (error) {
      console.error('Load templates error:', error);
    }
  }, [selectedCategory]);

  /**
   * Load templates and existing notes
   */
  useEffect(() => {
    void loadTemplates();
    void loadExistingNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Reload templates when category changes
   */
  useEffect(() => {
    void loadTemplates();
  }, [selectedCategory, loadTemplates]);

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
  const handleSelectTemplate = (template: VisitNoteTemplate) => {
    if (template.variables.length > 0) {
      // Template has variables - show modal for customization
      setSelectedTemplate(template);
      // Initialize with default values
      const defaults: Record<string, string> = {};
      template.variables.forEach((v) => {
        if (v.defaultValue) {
          defaults[v.key] = v.defaultValue;
        }
      });
      setTemplateVariables(defaults);
      setShowTemplateModal(true);
    } else {
      // No variables - apply directly
      setNoteText((prev) => prev + (prev ? '\n\n' : '') + template.text);
    }
    setShowTemplates(false);
  };

  /**
   * Apply template with filled variables
   */
  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    const filledText = visitNotesTemplateService.fillTemplate(selectedTemplate, templateVariables);
    setNoteText((prev) => prev + (prev ? '\n\n' : '') + filledText);
    setShowTemplateModal(false);
    setSelectedTemplate(null);
    setTemplateVariables({});
  };

  /**
   * Handle variable value change
   */
  const handleVariableChange = (key: string, value: string) => {
    setTemplateVariables((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Save current note text as a new template
   */
  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }
    if (!noteText.trim()) {
      Alert.alert('Error', 'No text to save as template');
      return;
    }

    try {
      await visitNotesTemplateService.saveCustomTemplate(
        newTemplateName.trim(),
        'custom',
        noteText.trim()
      );
      Alert.alert('Success', 'Template saved successfully');
      setShowSaveTemplateModal(false);
      setNewTemplateName('');
      void loadTemplates();
    } catch (error) {
      console.error('Save template error:', error);
      Alert.alert('Error', 'Failed to save template');
    }
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
          record.isIncident = isIncident;
          
          // Store activities as JSON string
          if (selectedActivities.length > 0) {
            record.activitiesPerformed = JSON.stringify(selectedActivities);
          }
          
          // Store mood and condition
          if (clientMood) {
            record.clientMood = clientMood as typeof record.clientMood;
          }
          if (clientConditionNotes) {
            record.clientConditionNotes = clientConditionNotes;
          }
          
          // Store incident data
          if (isIncident) {
            record.incidentSeverity = incidentSeverity as typeof record.incidentSeverity;
            record.incidentDescription = incidentDescription;
            record.incidentReportedAt = Date.now();
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
  const renderTemplate = ({ item }: { item: VisitNoteTemplate }) => {
    const categoryInfo = visitNotesTemplateService.getCategoryInfo(item.category);
    return (
      <Pressable
        style={styles.templateItem}
        onPress={() => handleSelectTemplate(item)}
      >
        <View style={styles.templateHeader}>
          <Text style={styles.templateIcon}>{categoryInfo.icon}</Text>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{item.name}</Text>
            <Text style={[styles.templateCategory, { color: categoryInfo.color }]}>
              {categoryInfo.label}
            </Text>
          </View>
        </View>
        <Text style={styles.templatePreview} numberOfLines={2}>
          {item.text}
        </Text>
        {item.variables.length > 0 && (
          <View style={styles.templateVariableBadge}>
            <Text style={styles.templateVariableText}>
              {item.variables.length} customizable field{item.variables.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  /**
   * Render variable input field
   */
  const renderVariableInput = (variable: TemplateVariable) => {
    const value = templateVariables[variable.key] || '';

    if (variable.type === 'select' && variable.options) {
      return (
        <View key={variable.key} style={styles.variableContainer}>
          <Text style={styles.variableLabel}>{variable.label}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.variableOptions}>
              {variable.options.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.variableOption,
                    value === option && styles.variableOptionSelected,
                  ]}
                  onPress={() => handleVariableChange(variable.key, option)}
                >
                  <Text
                    style={[
                      styles.variableOptionText,
                      value === option && styles.variableOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      );
    }

    return (
      <View key={variable.key} style={styles.variableContainer}>
        <Text style={styles.variableLabel}>{variable.label}</Text>
        <TextInput
          style={styles.variableInput}
          placeholder={variable.placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={(text) => handleVariableChange(variable.key, text)}
          keyboardType={variable.type === 'number' ? 'numeric' : 'default'}
        />
      </View>
    );
  };

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
            <>
              {/* Category Filter */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryFilter}
              >
                <Pressable
                  style={[
                    styles.categoryChip,
                    !selectedCategory && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      !selectedCategory && styles.categoryChipTextSelected,
                    ]}
                  >
                    All
                  </Text>
                </Pressable>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      selectedCategory === cat.value && styles.categoryChipSelected,
                    ]}
                    onPress={() => setSelectedCategory(cat.value)}
                  >
                    <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === cat.value && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Template List */}
              <FlatList
                data={templates}
                renderItem={renderTemplate}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.templateList}
                ListEmptyComponent={
                  <Text style={styles.noTemplates}>No templates in this category</Text>
                }
              />
            </>
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

          {/* Save as Template Button */}
          {noteText.trim().length > 0 && (
            <Pressable
              style={styles.saveTemplateButton}
              onPress={() => setShowSaveTemplateModal(true)}
            >
              <Text style={styles.saveTemplateIcon}>⭐</Text>
              <Text style={styles.saveTemplateText}>Save as Template</Text>
            </Pressable>
          )}
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

      {/* Template Variables Modal */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customize Template</Text>
              <Pressable onPress={() => setShowTemplateModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            {selectedTemplate && (
              <>
                <Text style={styles.modalSubtitle}>{selectedTemplate.name}</Text>

                <ScrollView style={styles.modalBody}>
                  {selectedTemplate.variables.map(renderVariableInput)}

                  <View style={styles.templatePreviewContainer}>
                    <Text style={styles.templatePreviewLabel}>Preview:</Text>
                    <Text style={styles.templatePreviewText}>
                      {visitNotesTemplateService.fillTemplate(selectedTemplate, templateVariables)}
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable
                    style={styles.modalCancelButton}
                    onPress={() => setShowTemplateModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalApplyButton}
                    onPress={handleApplyTemplate}
                  >
                    <Text style={styles.modalApplyText}>Apply Template</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Save as Template Modal */}
      <Modal
        visible={showSaveTemplateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSaveTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save as Template</Text>
              <Pressable onPress={() => setShowSaveTemplateModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.variableLabel}>Template Name</Text>
              <TextInput
                style={styles.variableInput}
                placeholder="Enter a name for this template"
                placeholderTextColor="#9CA3AF"
                value={newTemplateName}
                onChangeText={setNewTemplateName}
              />

              <Text style={styles.templatePreviewLabel}>Template Content:</Text>
              <Text style={styles.templatePreviewText} numberOfLines={5}>
                {noteText}
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowSaveTemplateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalApplyButton}
                onPress={handleSaveAsTemplate}
              >
                <Text style={styles.modalApplyText}>Save Template</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  // Category filter styles
  categoryFilter: {
    marginTop: 12,
    marginBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryChipIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryChipText: {
    fontSize: 12,
    color: '#374151',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noTemplates: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    padding: 20,
  },
  // Enhanced template styles
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  templateInfo: {
    flex: 1,
  },
  templateVariableBadge: {
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  templateVariableText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '500',
  },
  // Save as template button
  saveTemplateButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  saveTemplateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  saveTemplateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  // Modal styles
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
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalClose: {
    fontSize: 20,
    color: '#6B7280',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalApplyButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalApplyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Variable input styles
  variableContainer: {
    marginBottom: 16,
  },
  variableLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  variableInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  variableOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  variableOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  variableOptionSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  variableOptionText: {
    fontSize: 12,
    color: '#374151',
  },
  variableOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Template preview styles
  templatePreviewContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  templatePreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  templatePreviewText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
});
