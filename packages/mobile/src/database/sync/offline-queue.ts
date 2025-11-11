import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Helper function to get auth token (to be implemented)
async function getAuthToken(): Promise<string> {
  // This should integrate with your auth service
  // For now, return empty string
  return '';
}

interface QueuedAction {
  id: string;
  type: 'visit-check-in' | 'visit-check-out' | 'task-complete' | 'care-note';
  payload: any;
  timestamp: number;
  retries: number;
}

export class OfflineQueue {
  private static QUEUE_KEY = '@offline_queue';

  static async enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) {
    const queue = await this.getQueue();

    const queuedAction: QueuedAction = {
      ...action,
      id: this.generateUUID(),
      timestamp: Date.now(),
      retries: 0
    };

    queue.push(queuedAction);
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));

    console.log(`Queued action: ${action.type}`);
  }

  static async processQueue() {
    const queue = await this.getQueue();

    if (queue.length === 0) {
      return;
    }

    console.log(`Processing ${queue.length} queued actions`);

    const processed: string[] = [];
    const failed: QueuedAction[] = [];

    for (const action of queue) {
      try {
        await this.executeAction(action);
        processed.push(action.id);
      } catch (error) {
        console.error(`Failed to execute ${action.type}:`, error);

        if (action.retries < 3) {
          failed.push({ ...action, retries: action.retries + 1 });
        } else {
          console.error(`Max retries exceeded for ${action.id}, discarding`);
        }
      }
    }

    // Update queue
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(failed));

    console.log(`Processed ${processed.length} actions, ${failed.length} failed`);
  }

  private static async executeAction(action: QueuedAction) {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/${action.type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(action.payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  private static async getQueue(): Promise<QueuedAction[]> {
    const queueJson = await AsyncStorage.getItem(this.QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  }

  static async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }
  
  static async getQueueItems(): Promise<QueuedAction[]> {
    return await this.getQueue();
  }
  
  static async retryFailedItems(): Promise<void> {
    const queue = await this.getQueue();
    
    // Reset retry count for failed items
    const resetQueue = queue.map(item => 
      item.retries > 0 ? { ...item, retries: 0 } : item
    );
    
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(resetQueue));
    await this.processQueue();
  }

  static async clearQueue() {
    await AsyncStorage.removeItem(this.QUEUE_KEY);
  }

  private static generateUUID(): string {
    // Simple UUID generator for React Native
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
