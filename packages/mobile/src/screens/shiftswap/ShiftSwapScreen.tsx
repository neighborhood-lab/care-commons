/**
 * Shift Swap Screen
 *
 * Allows caregivers to request and manage shift swaps with other caregivers.
 * Features:
 * - View available shifts for swap
 * - Request shift swaps
 * - View and respond to incoming requests
 * - Track swap request status
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
} from 'react-native';
import { useTheme, ThemeColors } from '../../themes';
import {
  shiftSwapService,
  ShiftSwapRequest,
  AvailableShift,
  Shift,
} from '../../services/shiftswap.service';

type TabType = 'available' | 'requests' | 'received';

export function ShiftSwapScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [availableShifts, setAvailableShifts] = useState<AvailableShift[]>([]);
  const [sentRequests, setSentRequests] = useState<ShiftSwapRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ShiftSwapRequest[]>([]);
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('available');

  // Swap request modal state
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedTargetShift, setSelectedTargetShift] = useState<AvailableShift | null>(null);
  const [selectedMyShift, setSelectedMyShift] = useState<Shift | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [available, sent, received, my] = await Promise.all([
        shiftSwapService.getAvailableShiftsForSwap(),
        shiftSwapService.getSentRequests(),
        shiftSwapService.getReceivedRequests(),
        shiftSwapService.getMyShiftsForSwap(),
      ]);
      setAvailableShifts(available);
      setSentRequests(sent);
      setReceivedRequests(received);
      setMyShifts(my);
    } catch (error) {
      console.error('Failed to load shift swap data:', error);
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

  const pendingReceivedCount = receivedRequests.filter((r) => r.status === 'pending').length;

  const handleRequestSwap = (targetShift: AvailableShift) => {
    setSelectedTargetShift(targetShift);
    setSelectedMyShift(null);
    setShowSwapModal(true);
  };

  const handleSelectMyShift = (shift: Shift) => {
    setSelectedMyShift(shift);
  };

  const handleSubmitSwapRequest = async () => {
    if (!selectedTargetShift || !selectedMyShift) {
      Alert.alert('Select Shift', 'Please select one of your shifts to offer in exchange.');
      return;
    }

    try {
      await shiftSwapService.submitSwapRequest(
        selectedMyShift.id,
        selectedTargetShift.id,
        'Swap request from mobile app'
      );
      Alert.alert(
        'Request Sent',
        `Your swap request has been sent to ${selectedTargetShift.caregiverName}.`
      );
      setShowSwapModal(false);
      setSelectedTargetShift(null);
      setSelectedMyShift(null);
      loadData();
    } catch {
      Alert.alert('Error', 'Failed to send swap request. Please try again.');
    }
  };

  const handleAcceptRequest = (request: ShiftSwapRequest) => {
    Alert.alert(
      'Accept Swap',
      `Accept shift swap with ${request.requesterName}?\n\nYou will take: ${request.requesterShift.clientName}\nThey will take: ${request.targetShift.clientName}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            const success = await shiftSwapService.acceptSwapRequest(request.id);
            if (success) {
              Alert.alert('Accepted', 'Shift swap has been accepted. Coordinator will be notified.');
              loadData();
            }
          },
        },
      ]
    );
  };

  const handleDeclineRequest = (request: ShiftSwapRequest) => {
    Alert.alert('Decline Swap', `Decline shift swap request from ${request.requesterName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          const success = await shiftSwapService.declineSwapRequest(request.id);
          if (success) {
            Alert.alert('Declined', 'Shift swap request has been declined.');
            loadData();
          }
        },
      },
    ]);
  };

  const handleCancelRequest = (request: ShiftSwapRequest) => {
    Alert.alert('Cancel Request', 'Cancel this swap request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          const success = await shiftSwapService.cancelSwapRequest(request.id);
          if (success) {
            Alert.alert('Cancelled', 'Your swap request has been cancelled.');
            loadData();
          }
        },
      },
    ]);
  };

  const renderShiftCard = (shift: AvailableShift) => (
    <View key={shift.id} style={styles.shiftCard}>
      <View style={styles.shiftHeader}>
        <View>
          <Text style={styles.shiftDate}>{shiftSwapService.formatShiftDate(shift.date)}</Text>
          <Text style={styles.shiftTime}>{shiftSwapService.formatShiftTime(shift)}</Text>
        </View>
        <View style={styles.caregiverBadge}>
          <Text style={styles.caregiverName}>{shift.caregiverName}</Text>
        </View>
      </View>

      <Text style={styles.clientName}>{shift.clientName}</Text>
      <Text style={styles.clientAddress}>{shift.clientAddress}</Text>
      <Text style={styles.services}>{shift.services.join(', ')}</Text>

      {shift.swapNote && (
        <View style={styles.swapNote}>
          <Text style={styles.swapNoteLabel}>Reason for swap:</Text>
          <Text style={styles.swapNoteText}>{shift.swapNote}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.swapButton} onPress={() => handleRequestSwap(shift)}>
        <Text style={styles.swapButtonText}>Request Swap</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRequestCard = (request: ShiftSwapRequest, type: 'sent' | 'received') => {
    const statusInfo = shiftSwapService.getStatusInfo(request.status);
    const isSent = type === 'sent';

    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View>
            <Text style={styles.requestType}>
              {isSent ? `To: ${request.targetCaregiverName}` : `From: ${request.requesterName}`}
            </Text>
            <Text style={styles.requestDate}>
              {new Date(request.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.swapDetails}>
          <View style={styles.swapShift}>
            <Text style={styles.swapShiftLabel}>{isSent ? 'Your shift:' : 'Their shift:'}</Text>
            <Text style={styles.swapShiftClient}>{request.requesterShift.clientName}</Text>
            <Text style={styles.swapShiftDate}>
              {shiftSwapService.formatShiftDate(request.requesterShift.date)}
            </Text>
            <Text style={styles.swapShiftTime}>
              {shiftSwapService.formatShiftTime(request.requesterShift)}
            </Text>
          </View>
          <View style={styles.swapArrow}>
            <Text style={styles.swapArrowText}>⇄</Text>
          </View>
          <View style={styles.swapShift}>
            <Text style={styles.swapShiftLabel}>{isSent ? 'Their shift:' : 'Your shift:'}</Text>
            <Text style={styles.swapShiftClient}>{request.targetShift.clientName}</Text>
            <Text style={styles.swapShiftDate}>
              {shiftSwapService.formatShiftDate(request.targetShift.date)}
            </Text>
            <Text style={styles.swapShiftTime}>
              {shiftSwapService.formatShiftTime(request.targetShift)}
            </Text>
          </View>
        </View>

        {request.responseNote && (
          <View style={styles.responseNote}>
            <Text style={styles.responseNoteText}>{request.responseNote}</Text>
          </View>
        )}

        {/* Actions based on type and status */}
        {isSent && request.status === 'pending' && (
          <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelRequest(request)}>
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        )}

        {!isSent && request.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleDeclineRequest(request)}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptRequest(request)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderSwapModal = () => (
    <Modal visible={showSwapModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Shift Swap</Text>
            <TouchableOpacity onPress={() => setShowSwapModal(false)}>
              <Text style={styles.closeButton}>X</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {selectedTargetShift && (
              <View style={styles.targetShiftInfo}>
                <Text style={styles.modalSectionTitle}>Shift you want:</Text>
                <View style={styles.miniShiftCard}>
                  <Text style={styles.miniShiftCaregiver}>
                    {selectedTargetShift.caregiverName}'s shift
                  </Text>
                  <Text style={styles.miniShiftClient}>{selectedTargetShift.clientName}</Text>
                  <Text style={styles.miniShiftDate}>
                    {shiftSwapService.formatShiftDate(selectedTargetShift.date)} •{' '}
                    {shiftSwapService.formatShiftTime(selectedTargetShift)}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.modalSectionTitle}>Select your shift to offer:</Text>
            {myShifts.map((shift) => (
              <TouchableOpacity
                key={shift.id}
                style={[
                  styles.selectableShift,
                  selectedMyShift?.id === shift.id && styles.selectableShiftSelected,
                ]}
                onPress={() => handleSelectMyShift(shift)}
              >
                <View style={styles.selectableShiftContent}>
                  <Text style={styles.selectableShiftClient}>{shift.clientName}</Text>
                  <Text style={styles.selectableShiftDate}>
                    {shiftSwapService.formatShiftDate(shift.date)} •{' '}
                    {shiftSwapService.formatShiftTime(shift)}
                  </Text>
                  <Text style={styles.selectableShiftServices}>{shift.services.join(', ')}</Text>
                </View>
                {selectedMyShift?.id === shift.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelFooterButton]}
              onPress={() => setShowSwapModal(false)}
            >
              <Text style={styles.cancelFooterText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.submitFooterButton,
                !selectedMyShift && styles.disabledButton,
              ]}
              onPress={handleSubmitSwapRequest}
              disabled={!selectedMyShift}
            >
              <Text style={styles.submitFooterText}>Send Request</Text>
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
          <Text style={styles.headerTitle}>Shift Swaps</Text>
          <Text style={styles.headerSubtitle}>Trade shifts with other caregivers</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && styles.tabActive]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
              Available
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
              My Requests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'received' && styles.tabActive]}
            onPress={() => setActiveTab('received')}
          >
            <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
              Received
              {pendingReceivedCount > 0 && (
                <Text style={styles.badge}> ({pendingReceivedCount})</Text>
              )}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on tab */}
        <View style={styles.content}>
          {activeTab === 'available' && (
            <>
              {availableShifts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No shifts available for swap right now</Text>
                </View>
              ) : (
                availableShifts.map(renderShiftCard)
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <>
              {sentRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>You haven't sent any swap requests</Text>
                </View>
              ) : (
                sentRequests.map((r) => renderRequestCard(r, 'sent'))
              )}
            </>
          )}

          {activeTab === 'received' && (
            <>
              {receivedRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No swap requests received</Text>
                </View>
              ) : (
                receivedRequests.map((r) => renderRequestCard(r, 'received'))
              )}
            </>
          )}
        </View>
      </ScrollView>

      {renderSwapModal()}
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
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    tabTextActive: {
      color: colors.text,
      fontWeight: '600',
    },
    badge: {
      color: colors.error,
      fontWeight: 'bold',
    },
    content: {
      padding: 20,
    },
    shiftCard: {
      backgroundColor: colors.surface,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
    },
    shiftHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    shiftDate: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    shiftTime: {
      fontSize: 14,
      color: colors.primary,
      marginTop: 2,
    },
    caregiverBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    caregiverName: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    clientName: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    clientAddress: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    services: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    swapNote: {
      marginTop: 10,
      padding: 10,
      backgroundColor: colors.warningLight,
      borderRadius: 8,
    },
    swapNoteLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.warning,
    },
    swapNoteText: {
      fontSize: 13,
      color: colors.text,
      marginTop: 2,
    },
    swapButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    swapButtonText: {
      color: colors.textInverse,
      fontSize: 14,
      fontWeight: '600',
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
      marginBottom: 12,
    },
    requestType: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    requestDate: {
      fontSize: 12,
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
    swapDetails: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    swapShift: {
      flex: 1,
    },
    swapShiftLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      marginBottom: 4,
    },
    swapShiftClient: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    swapShiftDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    swapShiftTime: {
      fontSize: 12,
      color: colors.primary,
    },
    swapArrow: {
      paddingHorizontal: 10,
    },
    swapArrowText: {
      fontSize: 24,
      color: colors.textTertiary,
    },
    responseNote: {
      marginTop: 12,
      padding: 10,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
    },
    responseNoteText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    cancelButton: {
      marginTop: 12,
      paddingVertical: 10,
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
    actionButtons: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 10,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    declineButton: {
      backgroundColor: colors.surfaceSecondary,
    },
    acceptButton: {
      backgroundColor: colors.success,
    },
    declineButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    acceptButtonText: {
      color: colors.textInverse,
      fontSize: 14,
      fontWeight: '600',
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
      maxHeight: '85%',
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
    targetShiftInfo: {
      marginBottom: 20,
    },
    modalSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
    },
    miniShiftCard: {
      backgroundColor: colors.primaryLight,
      padding: 12,
      borderRadius: 8,
    },
    miniShiftCaregiver: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
    },
    miniShiftClient: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
      marginTop: 4,
    },
    miniShiftDate: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    selectableShift: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectableShiftSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    selectableShiftContent: {
      flex: 1,
    },
    selectableShiftClient: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    selectableShiftDate: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    selectableShiftServices: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    checkmark: {
      fontSize: 20,
      color: colors.primary,
      fontWeight: 'bold',
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
    disabledButton: {
      opacity: 0.5,
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

export default ShiftSwapScreen;
