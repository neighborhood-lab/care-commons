/**
 * Clinical Documentation Service Tests
 *
 * Tests business logic for clinical visit notes:
 * - Permission validation for licensed clinical staff
 * - Co-signature requirements for LVN/LPN
 * - Note creation, updating, signing, and co-signing
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClinicalService } from '../clinical-service.js';
import { PermissionError } from '@care-commons/core';
import type { CreateVisitNoteInput, UpdateVisitNoteInput, VisitNote } from '../../types/clinical.js';

describe('ClinicalService', () => {
  let service: ClinicalService;
  let mockRepository: any;
  let mockPool: any;

  const mockUserId = '00000000-0000-0000-0000-000000000001';
  const mockNoteId = '00000000-0000-0000-0000-000000000002';
  const mockOrgId = '00000000-0000-0000-0000-000000000003';

  const mockVisitNote: VisitNote = {
    id: mockNoteId,
    visitId: '00000000-0000-0000-0000-000000000004',
    organizationId: mockOrgId,
    branchId: '00000000-0000-0000-0000-000000000005',
    clientId: '00000000-0000-0000-0000-000000000006',
    caregiverId: '00000000-0000-0000-0000-000000000007',
    noteType: 'SKILLED_NURSING',
    serviceDate: new Date('2024-01-15'),
    documentedAt: new Date('2024-01-15T10:00:00Z'),
    status: 'DRAFT',
    requiresCoSign: false,
    isEncrypted: false,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    createdBy: mockUserId,
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    updatedBy: mockUserId,
    version: 1,
  };

  beforeEach(() => {
    mockPool = {};

    // Mock ClinicalRepository
    mockRepository = {
      createVisitNote: vi.fn(),
      updateVisitNote: vi.fn(),
      signVisitNote: vi.fn(),
      coSignVisitNote: vi.fn(),
      getVisitNoteById: vi.fn(),
      searchVisitNotes: vi.fn(),
      getNotesPendingCoSign: vi.fn(),
      deleteVisitNote: vi.fn(),
    };

    service = new ClinicalService(mockPool);
    // Replace repository with mock
    (service as any).repository = mockRepository;
  });

  describe('createVisitNote', () => {
    const createInput: CreateVisitNoteInput = {
      visitId: '00000000-0000-0000-0000-000000000004',
      organizationId: mockOrgId,
      branchId: '00000000-0000-0000-0000-000000000005',
      clientId: '00000000-0000-0000-0000-000000000006',
      caregiverId: '00000000-0000-0000-0000-000000000007',
      noteType: 'SKILLED_NURSING',
      serviceDate: new Date('2024-01-15'),
      subjectiveNotes: 'Patient reports feeling well',
      objectiveNotes: 'Vital signs stable',
      assessment: 'Recovering well from surgery',
      plan: 'Continue current care plan',
    };

    it('should create visit note for RN', async () => {
      mockRepository.createVisitNote.mockResolvedValue(mockVisitNote);

      const result = await service.createVisitNote(createInput, mockUserId, 'RN');

      expect(result).toEqual(mockVisitNote);
      expect(mockRepository.createVisitNote).toHaveBeenCalledWith(
        {
          ...createInput,
          signedByCredentials: 'RN',
          requiresCoSign: false,
        },
        mockUserId
      );
    });

    it('should create visit note for PT', async () => {
      mockRepository.createVisitNote.mockResolvedValue(mockVisitNote);

      const result = await service.createVisitNote(createInput, mockUserId, 'PT');

      expect(result).toEqual(mockVisitNote);
      expect(mockRepository.createVisitNote).toHaveBeenCalledWith(
        {
          ...createInput,
          signedByCredentials: 'PT',
          requiresCoSign: false,
        },
        mockUserId
      );
    });

    it('should create visit note for LVN with co-sign requirement', async () => {
      const noteWithCoSign = { ...mockVisitNote, requiresCoSign: true };
      mockRepository.createVisitNote.mockResolvedValue(noteWithCoSign);

      const result = await service.createVisitNote(createInput, mockUserId, 'LVN');

      expect(result).toEqual(noteWithCoSign);
      expect(mockRepository.createVisitNote).toHaveBeenCalledWith(
        {
          ...createInput,
          signedByCredentials: 'LVN',
          requiresCoSign: true,
        },
        mockUserId
      );
    });

    it('should create visit note for LPN with co-sign requirement', async () => {
      const noteWithCoSign = { ...mockVisitNote, requiresCoSign: true };
      mockRepository.createVisitNote.mockResolvedValue(noteWithCoSign);

      const result = await service.createVisitNote(createInput, mockUserId, 'LPN');

      expect(result).toEqual(noteWithCoSign);
      expect(mockRepository.createVisitNote).toHaveBeenCalledWith(
        {
          ...createInput,
          signedByCredentials: 'LPN',
          requiresCoSign: true,
        },
        mockUserId
      );
    });

    it('should create visit note for OT', async () => {
      mockRepository.createVisitNote.mockResolvedValue(mockVisitNote);

      const result = await service.createVisitNote(createInput, mockUserId, 'OT');

      expect(result).toEqual(mockVisitNote);
      expect(mockRepository.createVisitNote).toHaveBeenCalledWith(
        {
          ...createInput,
          signedByCredentials: 'OT',
          requiresCoSign: false,
        },
        mockUserId
      );
    });

    it('should create visit note for ST', async () => {
      mockRepository.createVisitNote.mockResolvedValue(mockVisitNote);

      const result = await service.createVisitNote(createInput, mockUserId, 'ST');

      expect(result).toEqual(mockVisitNote);
    });

    it('should create visit note for MSW', async () => {
      mockRepository.createVisitNote.mockResolvedValue(mockVisitNote);

      const result = await service.createVisitNote(createInput, mockUserId, 'MSW');

      expect(result).toEqual(mockVisitNote);
    });

    it('should throw PermissionError for unauthorized credentials', async () => {
      await expect(
        service.createVisitNote(createInput, mockUserId, 'CNA')
      ).rejects.toThrow(PermissionError);
    });

    it('should throw PermissionError when no credentials provided', async () => {
      await expect(
        service.createVisitNote(createInput, mockUserId, undefined)
      ).rejects.toThrow(PermissionError);
    });

    it('should throw PermissionError for empty credentials', async () => {
      await expect(
        service.createVisitNote(createInput, mockUserId, '')
      ).rejects.toThrow(PermissionError);
    });
  });

  describe('updateVisitNote', () => {
    const updateInput: UpdateVisitNoteInput = {
      id: mockNoteId,
      subjectiveNotes: 'Updated subjective notes',
      objectiveNotes: 'Updated objective notes',
      assessment: 'Updated assessment',
      plan: 'Updated plan',
    };

    it('should update visit note', async () => {
      const updatedNote = { ...mockVisitNote, ...updateInput };
      mockRepository.updateVisitNote.mockResolvedValue(updatedNote);

      const result = await service.updateVisitNote(updateInput, mockUserId);

      expect(result).toEqual(updatedNote);
      expect(mockRepository.updateVisitNote).toHaveBeenCalledWith(updateInput, mockUserId);
    });
  });

  describe('signVisitNote', () => {
    it('should sign visit note with RN credentials', async () => {
      const signedNote = { ...mockVisitNote, status: 'SIGNED' };
      mockRepository.signVisitNote.mockResolvedValue(signedNote);

      const result = await service.signVisitNote(mockNoteId, mockUserId, 'Dr. Smith', 'RN');

      expect(result).toEqual(signedNote);
      expect(mockRepository.signVisitNote).toHaveBeenCalledWith({
        noteId: mockNoteId,
        signedBy: mockUserId,
        signedByName: 'Dr. Smith',
        signedByCredentials: 'RN',
      });
    });

    it('should sign visit note with PT credentials', async () => {
      const signedNote = { ...mockVisitNote, status: 'SIGNED' };
      mockRepository.signVisitNote.mockResolvedValue(signedNote);

      const result = await service.signVisitNote(mockNoteId, mockUserId, 'Jane Doe', 'PT');

      expect(result).toEqual(signedNote);
    });

    it('should sign visit note with OT credentials', async () => {
      const signedNote = { ...mockVisitNote, status: 'SIGNED' };
      mockRepository.signVisitNote.mockResolvedValue(signedNote);

      const result = await service.signVisitNote(mockNoteId, mockUserId, 'John Doe', 'OT');

      expect(result).toEqual(signedNote);
    });

    it('should throw PermissionError for unauthorized credentials', async () => {
      await expect(
        service.signVisitNote(mockNoteId, mockUserId, 'John Doe', 'CNA')
      ).rejects.toThrow(PermissionError);

      expect(mockRepository.signVisitNote).not.toHaveBeenCalled();
    });

    it('should throw PermissionError for invalid credentials', async () => {
      await expect(
        service.signVisitNote(mockNoteId, mockUserId, 'John Doe', 'INVALID')
      ).rejects.toThrow(PermissionError);
    });
  });

  describe('coSignVisitNote', () => {
    it('should co-sign visit note with RN credentials', async () => {
      const coSignedNote = { ...mockVisitNote, status: 'CO_SIGNED' };
      mockRepository.coSignVisitNote.mockResolvedValue(coSignedNote);

      const result = await service.coSignVisitNote(mockNoteId, mockUserId, 'RN Supervisor', 'RN');

      expect(result).toEqual(coSignedNote);
      expect(mockRepository.coSignVisitNote).toHaveBeenCalledWith({
        noteId: mockNoteId,
        coSignedBy: mockUserId,
        coSignedByName: 'RN Supervisor',
        coSignedByCredentials: 'RN',
      });
    });

    it('should throw PermissionError when non-RN tries to co-sign', async () => {
      await expect(
        service.coSignVisitNote(mockNoteId, mockUserId, 'Jane Doe', 'LVN')
      ).rejects.toThrow(PermissionError);

      expect(mockRepository.coSignVisitNote).not.toHaveBeenCalled();
    });

    it('should throw PermissionError when PT tries to co-sign', async () => {
      await expect(
        service.coSignVisitNote(mockNoteId, mockUserId, 'PT Staff', 'PT')
      ).rejects.toThrow(PermissionError);
    });

    it('should throw PermissionError when LPN tries to co-sign', async () => {
      await expect(
        service.coSignVisitNote(mockNoteId, mockUserId, 'LPN Staff', 'LPN')
      ).rejects.toThrow(PermissionError);
    });
  });

  describe('getVisitNoteById', () => {
    it('should return visit note by id', async () => {
      mockRepository.getVisitNoteById.mockResolvedValue(mockVisitNote);

      const result = await service.getVisitNoteById(mockNoteId);

      expect(result).toEqual(mockVisitNote);
      expect(mockRepository.getVisitNoteById).toHaveBeenCalledWith(mockNoteId);
    });

    it('should return null when note not found', async () => {
      mockRepository.getVisitNoteById.mockResolvedValue(null);

      const result = await service.getVisitNoteById(mockNoteId);

      expect(result).toBeNull();
    });
  });

  describe('searchVisitNotes', () => {
    it('should search visit notes by client', async () => {
      const notes = [mockVisitNote];
      mockRepository.searchVisitNotes.mockResolvedValue(notes);

      const filters = {
        clientId: '00000000-0000-0000-0000-000000000006',
        organizationId: mockOrgId,
      };

      const result = await service.searchVisitNotes(filters);

      expect(result).toEqual(notes);
      expect(mockRepository.searchVisitNotes).toHaveBeenCalledWith(filters);
    });

    it('should search visit notes by status', async () => {
      const notes = [mockVisitNote];
      mockRepository.searchVisitNotes.mockResolvedValue(notes);

      const filters = {
        status: 'DRAFT' as const,
        organizationId: mockOrgId,
      };

      const result = await service.searchVisitNotes(filters);

      expect(result).toEqual(notes);
    });

    it('should search visit notes by caregiver', async () => {
      const notes = [mockVisitNote];
      mockRepository.searchVisitNotes.mockResolvedValue(notes);

      const filters = {
        caregiverId: '00000000-0000-0000-0000-000000000007',
        organizationId: mockOrgId,
      };

      const result = await service.searchVisitNotes(filters);

      expect(result).toEqual(notes);
    });

    it('should return empty array when no notes found', async () => {
      mockRepository.searchVisitNotes.mockResolvedValue([]);

      const result = await service.searchVisitNotes({ organizationId: mockOrgId });

      expect(result).toEqual([]);
    });
  });

  describe('getNotesPendingCoSign', () => {
    it('should return notes pending co-signature', async () => {
      const notes = [{ ...mockVisitNote, requiresCoSign: true, status: 'SIGNED' }];
      mockRepository.getNotesPendingCoSign.mockResolvedValue(notes);

      const result = await service.getNotesPendingCoSign(mockOrgId);

      expect(result).toEqual(notes);
      expect(mockRepository.getNotesPendingCoSign).toHaveBeenCalledWith(mockOrgId);
    });

    it('should return empty array when no notes pending', async () => {
      mockRepository.getNotesPendingCoSign.mockResolvedValue([]);

      const result = await service.getNotesPendingCoSign(mockOrgId);

      expect(result).toEqual([]);
    });
  });

  describe('deleteVisitNote', () => {
    it('should delete visit note', async () => {
      mockRepository.deleteVisitNote.mockResolvedValue(undefined);

      await service.deleteVisitNote(mockNoteId, mockUserId);

      expect(mockRepository.deleteVisitNote).toHaveBeenCalledWith(mockNoteId, mockUserId);
    });
  });
});
