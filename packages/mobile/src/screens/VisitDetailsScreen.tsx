/**
 * Visit Details Screen
 *
 * Core caregiver workflow screen showing:
 * - Visit information
 * - Care plan tasks with completion tracking
 * - Visit notes
 * - Client status
 * - Navigation to client
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';

interface Task {
  id: string;
  category: string;
  name: string;
  completed: boolean;
  notes?: string;
}

interface Visit {
  id: string;
  clientName: string;
  clientAddress: string;
  scheduledStart: string;
  scheduledEnd: string;
  visitType: string;
  tasks: Task[];
  clientPhone?: string;
  emergencyContact?: string;
  specialInstructions?: string;
}

// Demo visit data
const DEMO_VISIT: Visit = {
  id: '1',
  clientName: 'Margaret Johnson',
  clientAddress: '842 Oak Street, Austin, TX 78701',
  scheduledStart: '2:00 PM',
  scheduledEnd: '4:00 PM',
  visitType: 'Personal Care',
  clientPhone: '512-555-0123',
  emergencyContact: 'Daughter Sarah: 512-555-0124',
  specialInstructions: 'Client prefers shower in afternoon. Uses walker. Hard of hearing - speak clearly.',
  tasks: [
    {
      id: '1',
      category: 'Personal Care',
      name: 'Assist with shower/bathing',
      completed: false,
    },
    {
      id: '2',
      category: 'Personal Care',
      name: 'Help with dressing',
      completed: false,
    },
    {
      id: '3',
      category: 'Meal Preparation',
      name: 'Prepare afternoon snack',
      completed: false,
    },
    {
      id: '4',
      category: 'Medication',
      name: 'Remind to take 2PM medications',
      completed: false,
    },
    {
      id: '5',
      category: 'Light Housekeeping',
      name: 'Tidy living room and bedroom',
      completed: false,
    },
    {
      id: '6',
      category: 'Mobility Assistance',
      name: 'Assist with light exercise/walking',
      completed: false,
    },
    {
      id: '7',
      category: 'Companionship',
      name: 'Social engagement and conversation',
      completed: false,
    },
  ],
};

export default function VisitDetailsScreen({ route: _route, navigation }: any) {
  const [visit, setVisit] = useState<Visit>(DEMO_VISIT);
  const [visitNotes, setVisitNotes] = useState('');

  const toggleTask = (taskId: string) => {
    setVisit(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  const handleNavigate = () => {
    const url = `maps://app?daddr=${encodeURIComponent(visit.clientAddress)}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open maps app');
      }
    });
  };

  const handleCall = () => {
    if (visit.clientPhone) {
      Linking.openURL(`tel:${visit.clientPhone.replace(/\D/g, '')}`);
    }
  };

  const handleSaveNotes = () => {
    Alert.alert('Success', 'Visit notes saved!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const handleClockOut = () => {
    navigation.navigate('ClockInOut', {
      visitId: visit.id,
      clientName: visit.clientName,
      clientAddress: visit.clientAddress,
      action: 'clockOut'
    });
  };

  const completedTasks = visit.tasks.filter(t => t.completed).length;
  const totalTasks = visit.tasks.length;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  // Group tasks by category
  const tasksByCategory = visit.tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visit Details</Text>
      </View>

      {/* Client Info Card */}
      <View style={styles.card}>
        <Text style={styles.clientName}>{visit.clientName}</Text>
        <Text style={styles.visitType}>{visit.visitType}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>⏰ Time:</Text>
          <Text style={styles.infoValue}>{visit.scheduledStart} - {visit.scheduledEnd}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📍 Address:</Text>
          <Text style={styles.infoValue}>{visit.clientAddress}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleNavigate}>
            <Text style={styles.actionButtonText}>🗺️ Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Text style={styles.actionButtonText}>📞 Call</Text>
          </TouchableOpacity>
        </View>

        {/* Special Instructions */}
        {visit.specialInstructions && (
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>⚠️ Special Instructions</Text>
            <Text style={styles.instructionsText}>{visit.specialInstructions}</Text>
          </View>
        )}

        {/* Emergency Contact */}
        {visit.emergencyContact && (
          <View style={styles.emergencyBox}>
            <Text style={styles.emergencyText}>🚨 Emergency: {visit.emergencyContact}</Text>
          </View>
        )}
      </View>

      {/* Progress Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Task Progress</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {completedTasks} of {totalTasks} tasks completed ({progress}%)
        </Text>
      </View>

      {/* Tasks by Category */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Care Plan Tasks</Text>
        {Object.entries(tasksByCategory).map(([category, tasks]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {tasks.map(task => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskItem}
                onPress={() => toggleTask(task.id)}
              >
                <View style={[
                  styles.checkbox,
                  task.completed && styles.checkboxChecked
                ]}>
                  {task.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[
                  styles.taskName,
                  task.completed && styles.taskNameCompleted
                ]}>
                  {task.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Visit Notes */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Visit Notes</Text>
        <Text style={styles.notesHint}>
          Document what happened during the visit, client's condition, any concerns, etc.
        </Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Enter visit notes here..."
          multiline
          numberOfLines={6}
          value={visitNotes}
          onChangeText={setVisitNotes}
          textAlignVertical="top"
        />
      </View>

      {/* Clock Out Button */}
      <TouchableOpacity
        style={[
          styles.clockOutButton,
          completedTasks === 0 && styles.saveButtonDisabled
        ]}
        onPress={handleClockOut}
        disabled={completedTasks === 0}
      >
        <Text style={styles.saveButtonText}>
          {completedTasks === 0 ? 'Complete Tasks to Clock Out' : '🕐 Clock Out & Complete Visit'}
        </Text>
      </TouchableOpacity>

      {/* Save Notes Button */}
      <TouchableOpacity
        style={styles.saveNotesButton}
        onPress={handleSaveNotes}
      >
        <Text style={styles.saveNotesButtonText}>
          💾 Save Notes (without clocking out)
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  visitType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsBox: {
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emergencyBox: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E53935',
  },
  emergencyText: {
    fontSize: 14,
    color: '#C62828',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#CCC',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  taskNameCompleted: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  notesHint: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    backgroundColor: '#FAFAFA',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  clockOutButton: {
    backgroundColor: '#2196F3',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveNotesButton: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  saveNotesButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCC',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
