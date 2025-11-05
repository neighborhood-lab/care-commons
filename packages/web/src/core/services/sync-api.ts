/**
 * Sync API Client
 * 
 * Client-side service for communicating with sync endpoints.
 * Handles pulling server changes and pushing local changes.
 */

import type {
  PullChangesRequest,
  PullChangesResponse,
  PushChangesRequest,
  PushChangesResponse,
} from '@care-commons/core';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Pull changes from server since last sync
 */
export async function pullChanges(
  request: PullChangesRequest
): Promise<PullChangesResponse> {
  const params = new URLSearchParams({
    lastPulledAt: request.lastPulledAt.toString(),
    entities: request.entities.join(','),
    organizationId: request.organizationId,
  });

  if (request.branchId) {
    params.append('branchId', request.branchId);
  }

  if (request.caregiverId) {
    params.append('caregiverId', request.caregiverId);
  }

  if (request.limit) {
    params.append('limit', request.limit.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/sync/pull?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Pull changes failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Push local changes to server
 */
export async function pushChanges(
  request: PushChangesRequest
): Promise<PushChangesResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Push changes failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get current sync status
 */
export async function getSyncStatus(): Promise<{
  organizationId: string;
  userId: string;
  lastSyncAt: number;
  pendingCount: number;
  conflictCount: number;
  failedCount: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/sync/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Get sync status failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get auth token from storage
 */
function getAuthToken(): string {
  // Try localStorage first (web)
  if (typeof window !== 'undefined' && window.localStorage) {
    const token = window.localStorage.getItem('authToken');
    if (token) return token;
  }

  // Try sessionStorage as fallback
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const sessionToken = window.sessionStorage.getItem('authToken');
    if (sessionToken) return sessionToken;
  }

  throw new Error('No auth token found');
}
