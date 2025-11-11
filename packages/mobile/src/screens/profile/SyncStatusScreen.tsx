/**
 * Sync Status Screen
 *
 * Comprehensive sync status interface for caregivers to:
 * - View current sync state and connection status
 * - See pending changes and queue size
 * - Manually trigger sync
 * - View sync history and errors
 * - Clear local data (for testing/troubleshooting)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { OfflineQueue } from '../../database/sync/offline-queue';
import { syncManager } from '../../database/sync/sync-manager';

interface SyncHistoryEntry {
  timestamp: Date;
  success: boolean;
  error?: string;
  changesCount?: number;
}

export function SyncStatusScreen() {
  const { isOnline, isSyncing, lastSyncTime, manualSync } = useSyncStatus();
  const [queueSize, setQueueSize] = useState(0);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const loadSyncData = async () => {
    const size = await OfflineQueue.getQueueSize();
    setQueueSize(size);
    
    // Get sync history from manager
    const history = syncManager.getSyncHistory();
    setSyncHistory(history.slice(0, 10)); // Show last 10 syncs
  };

  useEffect(() => {
    loadSyncData();
    
    // Refresh data every 2 seconds
    const interval = setInterval(loadSyncData, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (isManualSyncing || isSyncing) {
      return;
    }

    if (!isOnline) {
      Alert.alert(
        'No Connection',
        'You are currently offline. Sync will happen automatically when you reconnect.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsManualSyncing(true);
      await manualSync();
      Alert.alert('Success', 'Sync completed successfully', [{ text: 'OK' }]);
      await loadSyncData();
    } catch (error) {
      Alert.alert(
        'Sync Failed',
        error instanceof Error ? error.message : 'An unknown error occurred',
        [{ text: 'OK' }]
      );
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleClearQueue = () => {
    Alert.alert(
      'Clear Pending Changes',
      'This will permanently delete all pending changes that have not been synced. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Queue',
          style: 'destructive',
          onPress: async () => {
            await OfflineQueue.clearQueue();
            await loadSyncData();
            Alert.alert('Queue Cleared', 'All pending changes have been removed.', [
              { text: 'OK' },
            ]);
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSyncData();
    setRefreshing(false);
  };

  const formatTimestamp = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = () => {
    if (!isOnline) return '#EF4444'; // Red for offline
    if (isSyncing || isManualSyncing) return '#3B82F6'; // Blue for syncing
    if (queueSize > 0) return '#F59E0B'; // Orange for pending
    return '#10B981'; // Green for synced
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing || isManualSyncing) return 'Syncing...';
    if (queueSize > 0) return `${queueSize} Pending`;
    return 'Synced';
  };

  const getStatusIcon = () => {
    if (!isOnline) return '📴';
    if (isSyncing || isManualSyncing) return '🔄';
    if (queueSize > 0) return '⏳';
    return '✅';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Connection Status Card */}
      <View style={styles.card}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>{getStatusText()}</Text>
            <Text style={styles.statusSubtitle}>
              {isOnline ? 'Connected to server' : 'Working offline'}
            </Text>
          </View>
          <View
            style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}
          />
        </View>
      </View>

      {/* Last Sync Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last Sync</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Time:</Text>
          <Text style={styles.infoValue}>{formatTimestamp(lastSyncTime)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pending Changes:</Text>
          <Text style={[styles.infoValue, queueSize > 0 && styles.pendingText]}>
            {queueSize}
          </Text>
        </View>
      </View>

      {/* Manual Sync Button */}
      <TouchableOpacity
        style={[
          styles.syncButton,
          (!isOnline || isManualSyncing || isSyncing) && styles.syncButtonDisabled,
        ]}
        onPress={handleManualSync}
        disabled={!isOnline || isManualSyncing || isSyncing}
      >
        {isManualSyncing || isSyncing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.syncButtonText}>
            {isOnline ? '🔄 Sync Now' : '📴 Offline - Cannot Sync'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Sync History */}
      {syncHistory.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sync History</Text>
          {syncHistory.map((entry, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyItemHeader}>
                <Text style={styles.historyIcon}>
                  {entry.success ? '✅' : '❌'}
                </Text>
                <Text style={styles.historyTime}>
                  {formatTimestamp(entry.timestamp)}
                </Text>
              </View>
              {entry.error && (
                <Text style={styles.historyError}>{entry.error}</Text>
              )}
              {entry.changesCount !== undefined && (
                <Text style={styles.historyChanges}>
                  {entry.changesCount} changes synced
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Advanced Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Advanced</Text>
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleClearQueue}
          disabled={queueSize === 0}
        >
          <Text style={[styles.actionButtonText, queueSize === 0 && styles.disabledText]}>
            Clear Pending Changes ({queueSize})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Help Text */}
      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>ℹ️ About Sync</Text>
        <Text style={styles.helpText}>
          Your changes are automatically saved locally and synced to the server
          when you have an internet connection. While offline, all your work is
          queued and will sync when you reconnect.
        </Text>
        <Text style={styles.helpText}>
          Manual sync is useful if you want to ensure all changes are uploaded
          immediately before going offline.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  pendingText: {
    color: '#F59E0B',
  },
  syncButton: {
    backgroundColor: '#2563EB',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  historyTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  historyChanges: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  dangerButton: {
    borderColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    textAlign: 'center',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  helpCard: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
    marginBottom: 8,
  },
});
