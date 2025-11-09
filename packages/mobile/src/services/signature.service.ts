/**
 * Signature Service
 *
 * Handles signature capture, cryptographic hashing, and integrity verification
 *
 * NOTE: Requires expo-crypto for production cryptographic hashing.
 * Current implementation uses placeholder hashing.
 */

import { database } from '../database/index.js';
import { Signature, type SignatureType, type DeviceInfo } from '../database/models/Signature.js';
import type { SignatureLocation } from '../database/models/Signature.js';
import { Q } from '@nozbe/watermelondb';
import { deviceInfoService } from './device-info.js';

export interface SignatureOptions {
  visitId: string;
  evvRecordId?: string;
  organizationId: string;
  caregiverId: string;
  clientId: string;
  signatureType: SignatureType;
  signerName: string;
  attestationText: string;
  location?: SignatureLocation;
}

class SignatureService {
  /**
   * Generate SHA-256 hash for signature integrity
   *
   * TODO: Install expo-crypto and implement actual cryptographic hashing:
   * ```
   * const hash = await Crypto.digestStringAsync(
   *   Crypto.CryptoDigestAlgorithm.SHA256,
   *   dataString
   * );
   * ```
   */
  async generateIntegrityHash(data: {
    signatureDataUrl: string;
    attestationText: string;
    signerName: string;
    deviceInfo: DeviceInfo;
    signedAt: Date;
  }): Promise<string> {
    // Combine all data into a single string
    const dataString = JSON.stringify({
      signature: data.signatureDataUrl,
      attestation: data.attestationText,
      signer: data.signerName,
      device: data.deviceInfo,
      timestamp: data.signedAt.toISOString(),
    });

    // Placeholder hash implementation using base64 encoding
    // In production, use expo-crypto for SHA-256 hashing
    const simpleHash = Buffer.from(dataString).toString('base64').substring(0, 64);

    return simpleHash;
  }

  /**
   * Save signature to local database with integrity hash
   */
  async saveSignature(
    signatureDataUrl: string,
    options: SignatureOptions
  ): Promise<Signature> {
    // Get device info
    const deviceInfo = await deviceInfoService.getDeviceInfo();

    // Generate file path (placeholder - in production use FileSystem.documentDirectory)
    const fileName = `signature_${Date.now()}.png`;
    const fileUri = `/tmp/${fileName}`; // Placeholder path

    // TODO: Save signature to file system when expo-file-system is properly configured
    // Extract base64 data from data URL
    // const base64Data = signatureDataUrl.split(',')[1];
    // await FileSystem.writeAsStringAsync(fileUri, base64Data, {
    //   encoding: FileSystem.EncodingType.Base64,
    // });

    const fileSize = Math.floor(signatureDataUrl.length * 0.75); // Estimate from base64

    const signedAt = new Date();

    // Generate integrity hash
    const integrityHash = await this.generateIntegrityHash({
      signatureDataUrl,
      attestationText: options.attestationText,
      signerName: options.signerName,
      deviceInfo: {
        deviceId: deviceInfo.deviceId || 'unknown',
        deviceModel: (deviceInfo as any).brand || 'unknown',
        osVersion: deviceInfo.osVersion || 'unknown',
        appVersion: '1.0.0', // Placeholder
        timestamp: Date.now(),
      },
      signedAt,
    });

    // Save to database
    const signature = await database.write(async () => {
      return await database.get<Signature>('signatures').create((record) => {
        record.visitId = options.visitId;
        record.evvRecordId = options.evvRecordId || null;
        record.organizationId = options.organizationId;
        record.caregiverId = options.caregiverId;
        record.clientId = options.clientId;

        // Signature data
        record.signatureType = options.signatureType;
        record.localUri = fileUri;
        record.remoteUrl = null;
        record.signatureDataUrl = signatureDataUrl;
        record.fileSize = fileSize;

        // Attestation
        record.attestationText = options.attestationText;
        record.signerName = options.signerName;
        record.signedAt = signedAt;

        // Device info for integrity
        record.deviceInfo = {
          deviceId: deviceInfo.deviceId || 'unknown',
          deviceModel: (deviceInfo as any).brand || 'unknown',
          osVersion: deviceInfo.osVersion || 'unknown',
          appVersion: '1.0.0', // Placeholder
          timestamp: Date.now(),
        };
        record.location = options.location || null;

        // Cryptographic integrity
        record.integrityHash = integrityHash;
        record.hashAlgorithm = 'SHA-256';

        // Upload status
        record.uploadStatus = 'pending';
        record.uploadError = null;
        record.uploadedAt = null;

        // Sync
        record.isSynced = false;
        record.syncPending = true;
      });
    });

    // Queue for upload
    await this.queueSignatureUpload(signature);

    return signature;
  }

  /**
   * Verify signature integrity
   */
  async verifySignature(signature: Signature): Promise<boolean> {
    try {
      // Regenerate hash from stored data
      const expectedHash = await this.generateIntegrityHash({
        signatureDataUrl: signature.signatureDataUrl,
        attestationText: signature.attestationText,
        signerName: signature.signerName,
        deviceInfo: signature.deviceInfo,
        signedAt: signature.signedAt,
      });

      // Compare with stored hash
      return expectedHash === signature.integrityHash;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Queue signature for upload
   */
  private async queueSignatureUpload(signature: Signature): Promise<void> {
    await database.write(async () => {
      await database.get('sync_queue').create((record: any) => {
        record.operationType = 'CREATE';
        record.entityType = 'SIGNATURE';
        record.entityId = signature.id;
        record.payloadJson = JSON.stringify({
          signatureId: signature.id,
          localUri: signature.localUri,
          visitId: signature.visitId,
          integrityHash: signature.integrityHash,
        });
        record.retryCount = 0;
        record.maxRetries = 5;
        record.status = 'PENDING';
        record.priority = 10; // High priority for EVV compliance
      });
    });
  }

  /**
   * Upload signature to cloud storage
   */
  async uploadSignature(signature: Signature): Promise<string> {
    try {
      // Verify integrity before upload
      const isValid = await this.verifySignature(signature);
      if (!isValid) {
        throw new Error('Signature integrity verification failed');
      }

      // Update status to uploading
      await database.write(async () => {
        await signature.update((record) => {
          record.uploadStatus = 'uploading';
        });
      });

      // TODO: Implement actual upload to HIPAA-compliant cloud storage
      // For now, we'll simulate a successful upload
      const remoteUrl = `https://hipaa-storage.example.com/signatures/${signature.id}`;

      // Update with remote URL
      await database.write(async () => {
        await signature.update((record) => {
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
        await signature.update((record) => {
          record.uploadStatus = 'failed';
          record.uploadError =
            error instanceof Error ? error.message : 'Upload failed';
        });
      });

      throw error;
    }
  }

  /**
   * Get signatures for a visit
   */
  async getVisitSignatures(visitId: string): Promise<Signature[]> {
    return await database
      .get<Signature>('signatures')
      .query(Q.where('visit_id', visitId))
      .fetch();
  }

  /**
   * Get client signature for a visit
   */
  async getClientSignature(visitId: string): Promise<Signature | null> {
    const signatures = await database
      .get<Signature>('signatures')
      .query(
        Q.where('visit_id', visitId),
        Q.where('signature_type', 'client')
      )
      .fetch();

    return signatures.length > 0 ? signatures[0] : null;
  }

  /**
   * Get pending uploads
   */
  async getPendingUploads(): Promise<Signature[]> {
    return await database
      .get<Signature>('signatures')
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
    const failedSignatures = await this.getPendingUploads();

    for (const signature of failedSignatures) {
      try {
        await this.uploadSignature(signature);
      } catch (error) {
        console.error(
          `Failed to retry upload for signature ${signature.id}:`,
          error
        );
      }
    }
  }

  /**
   * Delete signature
   */
  async deleteSignature(signatureId: string): Promise<void> {
    const signature = await database.get<Signature>('signatures').find(signatureId);

    // TODO: Delete local file when file system access is configured
    // try {
    //   await FileSystem.deleteAsync(signature.localUri, { idempotent: true });
    // } catch (error) {
    //   console.error('Failed to delete local signature file:', error);
    // }

    // Delete from database
    await database.write(async () => {
      await signature.destroyPermanently();
    });
  }
}

export const signatureService = new SignatureService();
