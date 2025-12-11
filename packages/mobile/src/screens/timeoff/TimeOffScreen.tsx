/**
 * Time-Off Request Screen
 *
 * Allows caregivers to request PTO/time-off from mobile.
 * Features:
 * - View time-off balance
 * - Submit new requests
 * - View request history and status
 * - Cancel pending requests
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme, ThemeColors } from '../../themes';
import {
  timeOffService,
  TimeOffRequest,
  TimeOffType,
  TimeOffBalance,
} from '../../services/timeoff.service';

type TabType = 'upcoming' | 'history';

export function TimeOffScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [balance, setBalance] = useState<TimeOffBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [showNewRequest, setShowNewRequest] = useState(false);

  // New request form state
  const [requestType, setRequestType] = useState<TimeOffType>('vacation');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [allRequests, timeOffBalance] = await Promise.all([
        timeOffService.getAllRequests(),
        timeOffService.getBalance(),
      ]);
      setRequests(allRequests);
      setBalance(timeOffBalance);
    } catch (error) {
      console.error('Failed to load time-off data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredRequests = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (activeTab === 'upcoming') {
      return requests.filter(
        (r) => r.endDate >= today && (r.status === 'approved' || r.status === 'pending')
      );
    }
    return requests;
  }, [requests, activeTab]);

  const handleSubmitRequest = async () => {
    if (!reason.trim()) {
      Alert.alert('Missing Information', 'Please provide a reason for your request.');
      return;
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    if (startStr > endStr) {
      Alert.alert('Invalid Dates', 'End date must be on or after start date.');
      return;
    }

    // Check for overlap
    const hasOverlap = await timeOffService.hasOverlap(startStr, endStr);
    if (hasOverlap) {
      Alert.alert(
        'Date Conflict',
        'You already have a request for these dates. Please choose different dates.'
      );
      return;
    }

    try {
      await timeOffService.submitRequest(requestType, startStr, endStr, reason.trim());
      Alert.alert('Request Submitted', 'Your time-off request has been submitted for approval.');
      setShowNewRequest(false);
      resetForm();
      loadData();
    } catch {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    }
  };

  const handleCancelRequest = (request: TimeOffRequest) => {
    Alert.alert('Cancel Request', 'Are you sure you want to cancel this time-off request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          const success = await timeOffService.cancelRequest(request.id);
          if (success) {
            Alert.alert('Cancelled', 'Your request has been cancelled.');
            loadData();
          } else {
            Alert.alert('Error', 'Unable to cancel this request.');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setRequestType('vacation');
    setStartDate(new Date());
    setEndDate(new Date());
    setReason('');
  };

  const typeOptions: { value: TimeOffType; label: string }[] = [
    { value: 'vacation', label: 'Vacation' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'personal', label: 'Personal' },
    { value: 'bereavement', label: 'Bereavement' },
    { value: 'other', label: 'Other' },
  ];

  const renderBalanceCard = () => {
    if (!balance) return null;

    const items = [
      {
        label: 'Vacation',
        available: balance.vacation - balance.used.vacation,
        total: balance.vacation,
      },
      {
        label: 'Sick',
        available: balance.sick - balance.used.sick,
        total: balance.sick,
      },
      {
        label: 'Personal',
        available: balance.personal - balance.used.personal,
        total: balance.personal,
      },
    ];

    return (
      <View style={styles.balanceCard}>
        <Text style={styles.balanceTitle}>Time-Off Balance</Text>
        <View style={styles.balanceGrid}>
          {items.map((item) => (
            <View key={item.label} style={styles.balanceItem}>
              <Text style={styles.balanceValue}>{item.available}</Text>
              <Text style={styles.balanceLabel}>
                {item.label} ({item.total} total)
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRequestCard = (request: TimeOffRequest) => {
    const statusInfo = timeOffService.getStatusInfo(request.status);
    const dateRange = timeOffService.formatDateRange(request.startDate, request.endDate);
    const days =
      Math.ceil(
        (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View>
            <Text style={styles.requestType}>{timeOffService.getTypeLabel(request.type)}</Text>
            <Text style={styles.requestDates}>{dateRange}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <Text style={styles.requestDays}>
          {days} day{days !== 1 ? 's' : ''}
        </Text>

        {request.reason && <Text style={styles.requestReason}>{request.reason}</Text>}

        {request.reviewNote && (
          <View style={styles.reviewNote}>
            <Text style={styles.reviewNoteLabel}>Note from reviewer:</Text>
            <Text style={styles.reviewNoteText}>{request.reviewNote}</Text>
          </View>
        )}

        {request.status === 'pending' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelRequest(request)}
          >
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderNewRequestModal = () => (
    <Modal visible={showNewRequest} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Time-Off Request</Text>
            <TouchableOpacity onPress={() => setShowNewRequest(false)}>
              <Text style={styles.closeButton}>X</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Type Selection */}
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeOptions}>
              {typeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeOption,
                    requestType === option.value && styles.typeOptionSelected,
                  ]}
                  onPress={() => setRequestType(option.value)}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      requestType === option.value && styles.typeOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Selection */}
            <Text style={styles.fieldLabel}>Start Date</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
              <Text style={styles.dateButtonText}>{timeOffService.formatDate(startDate.toISOString())}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(_event: DateTimePickerEvent, date?: Date) => {
                  setShowStartPicker(Platform.OS === 'ios');
                  if (date) {
                    setStartDate(date);
                    if (date > endDate) {
                      setEndDate(date);
                    }
                  }
                }}
              />
            )}

            <Text style={styles.fieldLabel}>End Date</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
              <Text style={styles.dateButtonText}>{timeOffService.formatDate(endDate.toISOString())}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={startDate}
                onChange={(_event: DateTimePickerEvent, date?: Date) => {
                  setShowEndPicker(Platform.OS === 'ios');
                  if (date) {
                    setEndDate(date);
                  }
                }}
              />
            )}

            {/* Reason */}
            <Text style={styles.fieldLabel}>Reason</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter reason for time off..."
              placeholderTextColor={colors.textTertiary}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelFooterButton]}
              onPress={() => setShowNewRequest(false)}
            >
              <Text style={styles.cancelFooterText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.submitFooterButton]}
              onPress={handleSubmitRequest}
            >
              <Text style={styles.submitFooterText}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Time Off</Text>
          <Text style={styles.headerSubtitle}>Request and manage your time off</Text>
        </View>

        {/* Balance Card */}
        {renderBalanceCard()}

        {/* New Request Button */}
        <TouchableOpacity style={styles.newRequestButton} onPress={() => setShowNewRequest(true)}>
          <Text style={styles.newRequestText}>+ Request Time Off</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Requests List */}
        <View style={styles.requestsList}>
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {activeTab === 'upcoming'
                  ? 'No upcoming time off scheduled'
                  : 'No time-off requests yet'}
              </Text>
            </View>
          ) : (
            filteredRequests.map(renderRequestCard)
          )}
        </View>
      </ScrollView>

      {renderNewRequestModal()}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    header: {
      padding: 20,
      paddingTop: 60,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    balanceCard: {
      backgroundColor: colors.surface,
      margin: 20,
      padding: 15,
      borderRadius: 12,
    },
    balanceTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 15,
    },
    balanceGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    balanceItem: {
      alignItems: 'center',
      flex: 1,
    },
    balanceValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
    },
    balanceLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    newRequestButton: {
      backgroundColor: colors.primary,
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 10,
      alignItems: 'center',
    },
    newRequestText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    tabs: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginTop: 20,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 10,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: colors.surface,
    },
    tabText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    tabTextActive: {
      color: colors.text,
      fontWeight: '600',
    },
    requestsList: {
      padding: 20,
    },
    requestCard: {
      backgroundColor: colors.surface,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
    },
    requestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    requestType: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    requestDates: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    requestDays: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    requestReason: {
      fontSize: 14,
      color: colors.text,
      fontStyle: 'italic',
    },
    reviewNote: {
      marginTop: 10,
      padding: 10,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
    },
    reviewNoteLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    reviewNoteText: {
      fontSize: 13,
      color: colors.text,
    },
    cancelButton: {
      marginTop: 12,
      paddingVertical: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: 8,
    },
    cancelButtonText: {
      color: colors.error,
      fontSize: 14,
      fontWeight: '500',
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      fontSize: 20,
      color: colors.textSecondary,
      fontWeight: 'bold',
    },
    modalBody: {
      padding: 20,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 16,
    },
    typeOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeOption: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeOptionSelected: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    typeOptionText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    typeOptionTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    dateButton: {
      backgroundColor: colors.surfaceSecondary,
      padding: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateButtonText: {
      fontSize: 16,
      color: colors.text,
    },
    textInput: {
      backgroundColor: colors.surfaceSecondary,
      padding: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: 16,
      color: colors.text,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    modalFooter: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    cancelFooterButton: {
      backgroundColor: colors.surfaceSecondary,
    },
    submitFooterButton: {
      backgroundColor: colors.primary,
    },
    cancelFooterText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '600',
    },
    submitFooterText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}

export default TimeOffScreen;
