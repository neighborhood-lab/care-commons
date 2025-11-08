/**
 * Photo Upload Service
 *
 * Handles uploading photos captured during visits to the server.
 * Supports:
 * - Task completion photos
 * - Incident report photos
 * - Clock-in/out verification photos
 */

import { getApiClient } from './api-client.js';

export interface PhotoUploadResult {
  uri: string;
  url: string;
  thumbnail?: string;
}

export interface PhotoUploadOptions {
  type: 'task' | 'incident' | 'verification';
  entityId: string; // Task ID, Visit ID, etc.
  compression?: number; // 0-1, default 0.7
}

/**
 * Upload a photo to the server
 */
export async function uploadPhoto(
  photoUri: string,
  options: PhotoUploadOptions
): Promise<PhotoUploadResult> {
  const apiClient = getApiClient();

  try {
    // Create FormData for multipart upload
    const formData = new FormData();

    // Get file extension from URI
    const uriParts = photoUri.split('.');
    const fileExtension = uriParts[uriParts.length - 1];
    const fileName = `${options.type}_${options.entityId}_${Date.now()}.${fileExtension}`;

    // Add photo to form data
    // @ts-expect-error - React Native FormData accepts uri, type, and name
    formData.append('photo', {
      uri: photoUri,
      type: `image/${fileExtension}`,
      name: fileName,
    });

    // Add metadata
    formData.append('type', options.type);
    formData.append('entityId', options.entityId);
    if (options.compression) {
      formData.append('compression', options.compression.toString());
    }

    // Upload photo
    const response = await apiClient.post<{ url: string; thumbnail?: string }>(
      '/uploads/photos',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return {
      uri: photoUri,
      url: response.data.url,
      thumbnail: response.data.thumbnail,
    };
  } catch (error) {
    console.error('Photo upload error:', error);
    throw new Error('Failed to upload photo');
  }
}

/**
 * Upload multiple photos in parallel
 */
export async function uploadPhotos(
  photoUris: string[],
  options: PhotoUploadOptions
): Promise<PhotoUploadResult[]> {
  const uploadPromises = photoUris.map((uri) => uploadPhoto(uri, options));
  return await Promise.all(uploadPromises);
}

/**
 * Delete a photo from the server
 */
export async function deletePhoto(photoUrl: string): Promise<void> {
  const apiClient = getApiClient();

  try {
    await apiClient.delete(`/uploads/photos`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Photo delete error:', error);
    throw new Error('Failed to delete photo');
  }
}
