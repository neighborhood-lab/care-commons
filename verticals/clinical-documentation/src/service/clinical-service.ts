/**
 * Clinical Documentation Service
 * 
 * Business logic for clinical visit notes with regulatory compliance.
 * Enforces permission-based access for licensed clinical staff only.
 */

import { Pool } from 'pg';
import { UUID, PermissionError } from '@care-commons/core';
import { ClinicalRepository } from '../repository/clinical-repository.js';
import {
  VisitNote,
  CreateVisitNoteInput,
  UpdateVisitNoteInput,
  VisitNoteSearchFilters,
} from '../types/clinical.js';

/**
 * Clinical credentials that are authorized to create/sign notes
 */
const AUTHORIZED_CREDENTIALS = new Set(['RN', 'LVN', 'LPN', 'PT', 'OT', 'ST', 'MSW']);

/**
 * Credentials that require RN co-signature (state-dependent)
 */
const REQUIRES_COSIGN_CREDENTIALS = new Set(['LVN', 'LPN']);

export class ClinicalService {
  private repository: ClinicalRepository;

  constructor(pool: Pool) {
    this.repository = new ClinicalRepository(pool);
  }

  /**
   * CREATE VISIT NOTE
   * 
   * Only licensed clinical staff can create clinical notes.
   */
  async createVisitNote(
    input: CreateVisitNoteInput,
    userId: UUID,
    userCredentials?: string
  ): Promise<VisitNote> {
    // Validate clinical credentials
    if (!userCredentials || !AUTHORIZED_CREDENTIALS.has(userCredentials)) {
      throw new PermissionError(
        `Only licensed clinical staff (RN, LVN, PT, OT, ST, MSW) can create clinical notes. Provided: ${userCredentials}`
      );
    }

    // Determine if co-signature is required
    const requiresCoSign = REQUIRES_COSIGN_CREDENTIALS.has(userCredentials);

    return this.repository.createVisitNote(
      {
        ...input,
        signedByCredentials: userCredentials,
        requiresCoSign,
      },
      userId
    );
  }

  /**
   * UPDATE VISIT NOTE (draft only)
   */
  async updateVisitNote(
    input: UpdateVisitNoteInput,
    userId: UUID
  ): Promise<VisitNote> {
    return this.repository.updateVisitNote(input, userId);
  }

  /**
   * SIGN VISIT NOTE
   * 
   * Only licensed clinical staff can sign notes.
   * LVN/LPN notes require RN co-signature.
   */
  async signVisitNote(
    noteId: UUID,
    userId: UUID,
    userName: string,
    userCredentials: string
  ): Promise<VisitNote> {
    // Validate clinical credentials
    if (!AUTHORIZED_CREDENTIALS.has(userCredentials)) {
      throw new PermissionError(
        `Only licensed clinical staff can sign clinical notes. Provided: ${userCredentials}`
      );
    }

    return this.repository.signVisitNote({
      noteId,
      signedBy: userId,
      signedByName: userName,
      signedByCredentials: userCredentials,
    });
  }

  /**
   * CO-SIGN VISIT NOTE
   * 
   * Only RN credentials can co-sign notes.
   */
  async coSignVisitNote(
    noteId: UUID,
    userId: UUID,
    userName: string,
    userCredentials: string
  ): Promise<VisitNote> {
    // Only RN can co-sign
    if (userCredentials !== 'RN') {
      throw new PermissionError('Only RN staff can co-sign clinical notes');
    }

    return this.repository.coSignVisitNote({
      noteId,
      coSignedBy: userId,
      coSignedByName: userName,
      coSignedByCredentials: userCredentials,
    });
  }

  /**
   * GET VISIT NOTE BY ID
   */
  async getVisitNoteById(id: UUID): Promise<VisitNote | null> {
    return this.repository.getVisitNoteById(id);
  }

  /**
   * SEARCH VISIT NOTES
   */
  async searchVisitNotes(filters: VisitNoteSearchFilters): Promise<VisitNote[]> {
    return this.repository.searchVisitNotes(filters);
  }

  /**
   * GET NOTES PENDING CO-SIGNATURE
   * 
   * For RN supervisors to review and co-sign LVN/LPN notes.
   */
  async getNotesPendingCoSign(organizationId: UUID): Promise<VisitNote[]> {
    return this.repository.getNotesPendingCoSign(organizationId);
  }

  /**
   * DELETE VISIT NOTE (soft delete)
   */
  async deleteVisitNote(id: UUID, userId: UUID): Promise<void> {
    return this.repository.deleteVisitNote(id, userId);
  }
}
