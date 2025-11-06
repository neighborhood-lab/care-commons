import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncManager } from '../database/sync/sync-manager.js';
import { OfflineQueue } from '../database/sync/offline-queue.js';

export function OfflineIndicator() {
  const [isConnected, setIsConnected] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);

      if (state.isConnected) {
        // When coming back online, process queue
        OfflineQueue.processQueue();
      }
    });

    // Update queue size periodically
    const interval = setInterval(async () => {
      const size = await OfflineQueue.getQueueSize();
      setQueueSize(size);
      setIsSyncing(syncManager.isSyncInProgress());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (isConnected && queueSize === 0 && !isSyncing) {
    return null; // Don't show anything when online and synced
  }

  return (
    <View
      style={{
        backgroundColor: isConnected ? '#fbbf24' : '#ef4444',
        padding: 8,
        alignItems: 'center'
      }}
    >
      <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
        {!isConnected && '📴 Offline Mode - Changes will sync when online'}
        {isConnected && isSyncing && '🔄 Syncing...'}
        {isConnected && !isSyncing && queueSize > 0 && `⏳ ${queueSize} actions pending sync`}
      </Text>
    </View>
  );
}
