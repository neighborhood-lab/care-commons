import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncManager } from '../database/sync/sync-manager';
import { OfflineQueue, QueuePriority } from '../database/sync/offline-queue';
import { OptimisticUpdateManager } from '../database/sync/optimistic-update-manager';

export function OfflineIndicator() {
  const [isConnected, setIsConnected] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOptimistic, setPendingOptimistic] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const updateStatus = async () => {
    const size = await OfflineQueue.getQueueSize();
    setQueueSize(size);

    // Get queue statistics for priority breakdown
    const stats = await OfflineQueue.getQueueStats();
    setCriticalCount(stats.byPriority[QueuePriority.CRITICAL] || 0);

    // Get optimistic update stats
    const optimisticStats = await OptimisticUpdateManager.getStats();
    setPendingOptimistic(optimisticStats.pending);

    setIsSyncing(syncManager.isSyncInProgress());
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);

      if (state.isConnected) {
        // When coming back online, process queue
        OfflineQueue.processQueue();
      }
    });

    // Update status immediately
    updateStatus();

    // Update status periodically
    const interval = setInterval(updateStatus, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const totalPending = queueSize + pendingOptimistic;

  if (isConnected && totalPending === 0 && !isSyncing) {
    return null; // Don't show anything when online and synced
  }

  const getStatusColor = () => {
    if (!isConnected) return '#EF4444'; // Red for offline
    if (criticalCount > 0) return '#DC2626'; // Dark red for critical pending
    if (isSyncing) return '#3B82F6'; // Blue for syncing
    if (totalPending > 0) return '#F59E0B'; // Orange for pending
    return '#10B981'; // Green for synced
  };

  const getStatusText = () => {
    if (!isConnected) return '📴 Offline Mode - Changes will sync when online';
    if (isSyncing) return '🔄 Syncing...';
    if (criticalCount > 0) return `⚠️ ${criticalCount} critical items pending`;
    if (totalPending > 0) return `⏳ ${totalPending} items pending sync`;
    return '✅ All synced';
  };

  return (
    <TouchableOpacity
      onPress={() => setShowDetails(!showDetails)}
      style={{
        backgroundColor: getStatusColor(),
        padding: 8,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
        {getStatusText()}
      </Text>
      {showDetails && totalPending > 0 && (
        <View style={{ marginTop: 4, alignItems: 'center' }}>
          {queueSize > 0 && (
            <Text style={{ color: 'white', fontSize: 10 }}>
              Queue: {queueSize} actions
            </Text>
          )}
          {pendingOptimistic > 0 && (
            <Text style={{ color: 'white', fontSize: 10 }}>
              Optimistic: {pendingOptimistic} updates
            </Text>
          )}
          {criticalCount > 0 && (
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
              ⚠️ {criticalCount} EVV/Critical items
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
