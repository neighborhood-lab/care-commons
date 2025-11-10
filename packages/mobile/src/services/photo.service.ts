/**
 * Photo Service
 *
 * Handles photo capture, gallery selection, compression, and upload
 * HIPAA-compliant photo management for EVV documentation
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Alert } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';
import type { VisitAttachment } from '../database/models/VisitAttachment';

export interface PhotoMetadata {
  width?: number;
  height?: number;
  orientation?: number;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  timestamp: number;
}

export interface PhotoUploadOptions {
  visitId: string;
  evvRecordId?: string;
  organizationId: string;
  caregiverId: string;
  category: 'CLOCK_IN' | 'CLOCK_OUT' | 'TASK' | 'INCIDENT' | 'GENERAL';
  caption?: string;
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export class PhotoService {
  constructor(private database: Database) {}

  /**
   * Request camera permissions
   */
  async requestCameraPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos.'
      );
      return false;
    }
    return true;
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library access is required to select photos.'
      );
      return false;
    }
    return true;
  }

  /**
   * Capture photo from camera
   */
  async capturePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        exif: true, // Capture EXIF data for metadata
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0];
    } catch (error) {
      console.error('Photo capture error:', error);
      Alert.alert('Error', 'Failed to capture photo');
      return null;
    }
  }

  /**
   * Select photo from gallery
   */
  async selectFromGallery(): Promise<ImagePicker.ImagePickerAsset | null> {
    const hasPermission = await this.requestMediaLibraryPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        exif: true,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0];
    } catch (error) {
      console.error('Photo selection error:', error);
      Alert.alert('Error', 'Failed to select photo');
      return null;
    }
  }

  /**
   * Compress image for upload
   */
  async compressImage(
    uri: string,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {}
  ): Promise<string> {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.7,
    } = options;

    try {
      const manipResult = await manipulateAsync(
        uri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight,
            },
          },
        ],
        {
          compress: quality,
          format: SaveFormat.JPEG,
        }
      );

      return manipResult.uri;
    } catch (error) {
      console.error('Image compression error:', error);
      // Return original URI if compression fails
      return uri;
    }
  }

  /**
   * Get file size
   */
  async getFileSize(uri: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && 'size' in fileInfo) {
        return fileInfo.size;
      }
      return 0;
    } catch (error) {
      console.error('File size error:', error);
      return 0;
    }
  }

  /**
   * Save photo attachment to database
   */
  async savePhotoAttachment(
    asset: ImagePicker.ImagePickerAsset,
    options: PhotoUploadOptions
  ): Promise<VisitAttachment> {
    const {
      visitId,
      evvRecordId,
      organizationId,
      caregiverId,
      category,
      caption,
      compress = true,
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.7,
    } = options;

    // Compress image if requested
    let finalUri = asset.uri;
    if (compress) {
      finalUri = await this.compressImage(asset.uri, {
        maxWidth,
        maxHeight,
        quality,
      });
    }

    // Get file size
    const fileSize = await this.getFileSize(finalUri);

    // Extract metadata
    const metadata: PhotoMetadata = {
      width: asset.width,
      height: asset.height,
      timestamp: Date.now(),
    };

    if (asset.exif) {
      if (asset.exif.Orientation) {
        metadata.orientation = asset.exif.Orientation;
      }
      // Add GPS data if available (for location verification)
      if (asset.exif.GPSLatitude && asset.exif.GPSLongitude) {
        metadata.location = {
          latitude: asset.exif.GPSLatitude,
          longitude: asset.exif.GPSLongitude,
          altitude: asset.exif.GPSAltitude,
        };
      }
    }

    // Save to database
    const attachment = await this.database.write(async () => {
      const newAttachment = await this.database
        .get<VisitAttachment>('visit_attachments')
        .create((record) => {
          record.visitId = visitId;
          if (evvRecordId) record.evvRecordId = evvRecordId;
          record.organizationId = organizationId;
          record.caregiverId = caregiverId;
          record.attachmentType = 'PHOTO';
          record.attachmentCategory = category;
          record.fileUri = finalUri;
          record.fileName = `photo_${Date.now()}.jpg`;
          record.fileSize = fileSize;
          record.mimeType = 'image/jpeg';
          if (caption) record.caption = caption;
          record.metadataJson = JSON.stringify(metadata);
          record.uploadStatus = 'PENDING';
          record.isSynced = false;
          record.syncPending = true;
        });

      return newAttachment;
    });

    return attachment;
  }

  /**
   * Delete photo attachment
   */
  async deletePhotoAttachment(attachment: VisitAttachment): Promise<void> {
    try {
      // Delete file from filesystem
      const fileInfo = await FileSystem.getInfoAsync(attachment.fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(attachment.fileUri);
      }

      // Delete from database
      await this.database.write(async () => {
        await attachment.markAsDeleted();
      });
    } catch (error) {
      console.error('Delete photo error:', error);
      throw error;
    }
  }

  /**
   * Get attachments for a visit
   */
  async getVisitAttachments(visitId: string): Promise<VisitAttachment[]> {
    const attachments = await this.database
      .get<VisitAttachment>('visit_attachments')
      .query(Q.where('visit_id', visitId))
      .fetch();

    return attachments;
  }

  /**
   * Get pending uploads
   */
  async getPendingUploads(): Promise<VisitAttachment[]> {
    const pending = await this.database
      .get<VisitAttachment>('visit_attachments')
      .query(Q.where('upload_status', 'PENDING'))
      .fetch();

    return pending;
  }

  /**
   * Upload photo to server
   * This would integrate with your API to upload photos to HIPAA-compliant storage
   */
  async uploadPhoto(attachment: VisitAttachment): Promise<void> {
    try {
      // Mark as uploading
      await attachment.update(() => {
        attachment.uploadStatus = 'UPLOADING';
      });

      // Read file (will be used when API integration is implemented)
      // const fileContent = await FileSystem.readAsStringAsync(
      //   attachment.fileUri,
      //   {
      //     encoding: FileSystem.EncodingType.Base64,
      //   }
      // );

      // TODO: Replace with actual API call
      // const response = await apiClient.post('/api/v1/attachments/upload', {
      //   file: fileContent,
      //   mimeType: attachment.mimeType,
      //   fileName: attachment.fileName,
      //   visitId: attachment.visitId,
      //   category: attachment.attachmentCategory,
      // });

      // Simulate upload for now
      const uploadUrl = `https://storage.example.com/photos/${attachment.id}`;

      // Mark as uploaded
      await attachment.update(() => {
        attachment.uploadStatus = 'UPLOADED';
        attachment.uploadUrl = uploadUrl;
        attachment.isSynced = true;
        attachment.syncPending = false;
      });
    } catch (error) {
      console.error('Photo upload error:', error);

      // Mark as failed
      await attachment.update(() => {
        attachment.uploadStatus = 'FAILED';
        attachment.uploadError = error instanceof Error ? error.message : 'Upload failed';
      });

      throw error;
    }
  }

  /**
   * Upload all pending photos
   */
  async uploadPendingPhotos(): Promise<{
    successful: number;
    failed: number;
  }> {
    const pending = await this.getPendingUploads();
    let successful = 0;
    let failed = 0;

    for (const attachment of pending) {
      try {
        await this.uploadPhoto(attachment);
        successful++;
      } catch {
        failed++;
      }
    }

    return { successful, failed };
  }
}
