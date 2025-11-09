/**
 * Photo Upload Service
 *
 * Handles photo capture, compression, HIPAA-compliant storage, and upload
 *
 * NOTE: Requires expo-image-manipulator for production image compression.
 * Current implementation uses placeholder compression.
 */

import * as FileSystem from 'expo-file-system';
import { database } from '../database/index.js';
import { Photo, type PhotoType } from '../database/models/Photo.js';
import type { PhotoLocation } from '../database/models/Photo.js';
import { Q } from '@nozbe/watermelondb';

export interface PhotoUploadOptions {
  visitId: string;
  evvRecordId?: string;
  taskId?: string;
  organizationId: string;
  caregiverId: string;
  clientId: string;
  photoType: PhotoType;
  caption?: string;
  location?: PhotoLocation;
}

export interface PhotoMetadata {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  fileName: string;
  mimeType: string;
}

class PhotoUploadService {
  private readonly compressionQuality = 0.7; // 70% quality
  private readonly maxWidth = 1920;
  private readonly maxHeight = 1920;

  /**
   * Compress image to reduce file size
   *
   * TODO: Install expo-image-manipulator and implement actual compression:
   * ```
   * const manipulatedImage = await ImageManipulator.manipulateAsync(
   *   uri,
   *   [{ resize: { width: this.maxWidth, height: this.maxHeight } }],
   *   { compress: this.compressionQuality, format: ImageManipulator.SaveFormat.JPEG }
   * );
   * ```
   */
  async compressImage(uri: string): Promise<PhotoMetadata> {
    // Placeholder implementation - returns original image metadata
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const fileName = uri.split('/').pop() || 'photo.jpg';

    return {
      uri,
      width: 1920, // Placeholder dimensions
      height: 1920,
      fileSize: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
      fileName,
      mimeType: 'image/jpeg',
    };
  }

  /**
   * Save photo to local database
   */
  async savePhoto(
    photoUri: string,
    options: PhotoUploadOptions
  ): Promise<Photo> {
    // Compress image
    const metadata = await this.compressImage(photoUri);

    // Save to database
    const photo = await database.write(async () => {
      return await database.get<Photo>('photos').create((record) => {
        record.visitId = options.visitId;
        record.evvRecordId = options.evvRecordId || null;
        record.taskId = options.taskId || null;
        record.organizationId = options.organizationId;
        record.caregiverId = options.caregiverId;
        record.clientId = options.clientId;

        // Photo details
        record.localUri = metadata.uri;
        record.remoteUrl = null;
        record.fileName = metadata.fileName;
        record.fileSize = metadata.fileSize;
        record.mimeType = metadata.mimeType;
        record.width = metadata.width;
        record.height = metadata.height;

        // Metadata
        record.caption = options.caption || null;
        record.photoType = options.photoType;
        record.takenAt = new Date();
        record.location = options.location || null;

        // Upload status
        record.uploadStatus = 'pending';
        record.uploadError = null;
        record.uploadedAt = null;

        // HIPAA compliance
        record.isHipaaCompliant = true;
        record.encryptionKeyId = null; // Will be set during upload

        // Sync
        record.isSynced = false;
        record.syncPending = true;
      });
    });

    // Queue for upload
    await this.queuePhotoUpload(photo);

    return photo;
  }

  /**
   * Queue photo for upload to cloud storage
   */
  private async queuePhotoUpload(photo: Photo): Promise<void> {
    // Add to sync queue
    await database.write(async () => {
      await database.get('sync_queue').create((record: any) => {
        record.operationType = 'CREATE';
        record.entityType = 'PHOTO';
        record.entityId = photo.id;
        record.payloadJson = JSON.stringify({
          photoId: photo.id,
          localUri: photo.localUri,
          visitId: photo.visitId,
        });
        record.retryCount = 0;
        record.maxRetries = 5;
        record.status = 'PENDING';
        record.priority = 5; // Medium priority
      });
    });
  }

  /**
   * Upload photo to cloud storage (placeholder for actual implementation)
   * In production, this would upload to S3, Azure Blob, or similar HIPAA-compliant storage
   */
  async uploadPhoto(photo: Photo): Promise<string> {
    try {
      // Update status to uploading
      await database.write(async () => {
        await photo.update((record) => {
          record.uploadStatus = 'uploading';
        });
      });

      // TODO: Implement actual upload to cloud storage
      // For now, we'll simulate a successful upload
      // const remoteUrl = await uploadToS3(photo.localUri, photo.fileName);
      const remoteUrl = `https://hipaa-storage.example.com/photos/${photo.id}`;

      // Update with remote URL
      await database.write(async () => {
        await photo.update((record) => {
          record.uploadStatus = 'uploaded';
          record.remoteUrl = remoteUrl;
          record.uploadedAt = new Date();
          record.uploadError = null;
        });
      });

      return remoteUrl;
    } catch (error) {
      // Update with error
      await database.write(async () => {
        await photo.update((record) => {
          record.uploadStatus = 'failed';
          record.uploadError =
            error instanceof Error ? error.message : 'Upload failed';
        });
      });

      throw error;
    }
  }

  /**
   * Get photos for a visit
   */
  async getVisitPhotos(visitId: string): Promise<Photo[]> {
    return await database
      .get<Photo>('photos')
      .query(Q.where('visit_id', visitId))
      .fetch();
  }

  /**
   * Get pending uploads
   */
  async getPendingUploads(): Promise<Photo[]> {
    return await database
      .get<Photo>('photos')
      .query(
        Q.or(
          Q.where('upload_status', 'pending'),
          Q.where('upload_status', 'failed')
        )
      )
      .fetch();
  }

  /**
   * Retry failed uploads
   */
  async retryFailedUploads(): Promise<void> {
    const failedPhotos = await database
      .get<Photo>('photos')
      .query(Q.where('upload_status', 'failed'))
      .fetch();

    for (const photo of failedPhotos) {
      try {
        await this.uploadPhoto(photo);
      } catch (error) {
        console.error(`Failed to retry upload for photo ${photo.id}:`, error);
      }
    }
  }

  /**
   * Delete photo
   */
  async deletePhoto(photoId: string): Promise<void> {
    const photo = await database.get<Photo>('photos').find(photoId);

    // Delete local file
    try {
      await FileSystem.deleteAsync(photo.localUri, { idempotent: true });
    } catch (error) {
      console.error('Failed to delete local photo file:', error);
    }

    // Delete from database
    await database.write(async () => {
      await photo.destroyPermanently();
    });
  }
}

export const photoUploadService = new PhotoUploadService();
