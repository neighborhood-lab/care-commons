/**
 * Family Document Service
 *
 * Enables families to upload relevant documents (insurance, medical records)
 * and download care documentation from the agency.
 *
 * Features:
 * - Secure document upload with signed URLs
 * - Document organization by category
 * - Download access to care documentation
 * - Expiration tracking and alerts
 * - Search and filtering
 */

import crypto from 'node:crypto';
import type { UUID } from '@folkcare/core';
import type {
  FamilyMember,
  FamilyDocument,
  FamilyDocumentCategory,
  FamilyDocumentStatus,
  DocumentAccessLevel,
  DocumentFileType,
  DocumentUploadRequest,
  DocumentUploadResponse,
  CompleteUploadRequest,
  DocumentDownloadResponse,
  FamilyDocumentListItem,
  FamilyDocumentListResponse,
  DocumentSearchOptions,
  DocumentExpirationAlert,
  FamilyDocumentDashboard,
  DocumentCategoryInfo,
  UpdateDocumentInput,
  DeleteDocumentInput,
} from '../types/family-engagement.js';

/**
 * Error thrown when family member lacks document access
 */
export class DocumentAccessDeniedError extends Error {
  constructor(familyMemberId: UUID, reason?: string) {
    const baseMessage = `Family member ${familyMemberId} does not have document access`;
    const message = reason !== undefined ? `${baseMessage}: ${reason}` : baseMessage;
    super(message);
    this.name = 'DocumentAccessDeniedError';
  }
}

/**
 * Error thrown when document not found
 */
export class DocumentNotFoundError extends Error {
  constructor(documentId: UUID) {
    super(`Document ${documentId} not found`);
    this.name = 'DocumentNotFoundError';
  }
}

/**
 * Repository interface for family member data
 */
export interface DocumentFamilyMemberRepository {
  getFamilyMemberForClient(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<FamilyMember | null>;
}

/**
 * Repository interface for document data
 */
export interface DocumentDataRepository {
  createDocument(data: CreateDocumentData): Promise<RawDocument>;
  getDocument(documentId: UUID): Promise<RawDocument | null>;
  updateDocument(
    documentId: UUID,
    updates: Partial<RawDocument>
  ): Promise<void>;
  deleteDocument(documentId: UUID): Promise<void>;
  listDocuments(
    clientId: UUID,
    organizationId: UUID,
    filters?: DocumentFilters
  ): Promise<RawDocument[]>;
  countDocuments(
    clientId: UUID,
    organizationId: UUID,
    filters?: DocumentFilters
  ): Promise<number>;
  getClientInfo(clientId: UUID): Promise<{ firstName: string; lastName: string } | null>;
  getStorageUsage(clientId: UUID, organizationId: UUID): Promise<number>;
  getFamilyMemberName(familyMemberId: UUID): Promise<string | null>;
}

/**
 * Storage service interface for file operations
 */
export interface DocumentStorageService {
  generateUploadUrl(
    storagePath: string,
    contentType: string,
    expiresInSeconds: number
  ): Promise<string>;
  generateDownloadUrl(
    storagePath: string,
    fileName: string,
    expiresInSeconds: number
  ): Promise<string>;
  deleteFile(storagePath: string): Promise<void>;
}

// ---- Internal types ----

interface CreateDocumentData {
  id: UUID;
  clientId: UUID;
  uploadedByFamilyMemberId: UUID;
  category: string;
  title: string;
  description?: string;
  status: string;
  accessLevel: string;
  uploadSource: string;
  documentDate?: string;
  expiresAt?: Date;
  tags?: string[];
  storagePath: string;
  organizationId: UUID;
  createdBy: UUID;
  updatedBy: UUID;
}

interface RawDocument {
  id: UUID;
  clientId: UUID;
  uploadedByFamilyMemberId?: UUID;
  category: string;
  title: string;
  description?: string;
  fileName: string;
  fileExtension: string;
  fileType: string;
  fileSizeBytes: number;
  mimeType: string;
  storagePath: string;
  status: string;
  accessLevel: string;
  uploadSource: string;
  documentDate?: string;
  expiresAt?: Date;
  tagsJson?: string;
  metadataJson?: string;
  thumbnailUrl?: string;
  downloadCount: number;
  lastDownloadedAt?: Date;
  lastViewedAt?: Date;
  virusScanStatus: string;
  virusScanCompletedAt?: Date;
  organizationId: UUID;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UUID;
  updatedBy: UUID;
  version: number;
}

interface DocumentFilters {
  categories?: string[];
  statuses?: string[];
  searchTerm?: string;
  tags?: string[];
  uploadedAfter?: Date;
  uploadedBefore?: Date;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  offset?: number;
}

/**
 * Service for managing family document uploads and downloads
 */
export class FamilyDocumentService {
  private readonly maxFileSizeBytes = 50 * 1024 * 1024; // 50 MB
  private readonly storageLimitBytes = 500 * 1024 * 1024; // 500 MB per client
  private readonly uploadUrlExpirySeconds = 3600; // 1 hour
  private readonly downloadUrlExpirySeconds = 3600; // 1 hour

  constructor(
    private familyMemberRepo: DocumentFamilyMemberRepository,
    private documentRepo: DocumentDataRepository,
    private storageService: DocumentStorageService
  ) {}

  /**
   * Verify family member has document access
   */
  private async verifyAccess(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<FamilyMember> {
    const familyMember = await this.familyMemberRepo.getFamilyMemberForClient(
      familyMemberId,
      clientId
    );

    if (familyMember === null) {
      throw new DocumentAccessDeniedError(familyMemberId);
    }

    if (
      familyMember.status !== 'ACTIVE' ||
      familyMember.invitationStatus !== 'ACCEPTED'
    ) {
      throw new DocumentAccessDeniedError(familyMemberId);
    }

    return familyMember;
  }

  /**
   * Initiate document upload - returns signed upload URL
   */
  async initiateUpload(
    request: DocumentUploadRequest
  ): Promise<DocumentUploadResponse> {
    const familyMember = await this.verifyAccess(
      request.familyMemberId,
      request.clientId
    );

    // Check storage limits
    const currentUsage = await this.documentRepo.getStorageUsage(
      request.clientId,
      familyMember.organizationId
    );

    if (currentUsage >= this.storageLimitBytes) {
      throw new DocumentAccessDeniedError(
        request.familyMemberId,
        'Storage limit reached'
      );
    }

    // Generate document ID and storage path
    const documentId = crypto.randomUUID() as UUID;
    const storagePath = `documents/${familyMember.organizationId}/${request.clientId}/${documentId}`;

    // Create document record in pending state
    await this.documentRepo.createDocument({
      id: documentId,
      clientId: request.clientId,
      uploadedByFamilyMemberId: request.familyMemberId,
      category: request.category,
      title: request.title,
      description: request.description,
      status: 'UPLOADING',
      accessLevel: request.accessLevel ?? 'CARE_TEAM',
      uploadSource: 'FAMILY_PORTAL',
      documentDate: request.documentDate,
      expiresAt: request.expiresAt as Date | undefined,
      tags: request.tags,
      storagePath,
      organizationId: familyMember.organizationId,
      createdBy: request.familyMemberId,
      updatedBy: request.familyMemberId,
    });

    // Generate signed upload URL
    const uploadUrl = await this.storageService.generateUploadUrl(
      storagePath,
      'application/octet-stream',
      this.uploadUrlExpirySeconds
    );

    return {
      documentId,
      uploadUrl,
      uploadUrlExpiresAt: new Date(
        Date.now() + this.uploadUrlExpirySeconds * 1000
      ),
      maxFileSizeBytes: this.maxFileSizeBytes,
      allowedMimeTypes: this.getAllowedMimeTypes(),
      instructions:
        'Upload your file using a PUT request to the provided URL. Include the Content-Type header matching your file type.',
    };
  }

  /**
   * Complete upload - called after file is uploaded to storage
   */
  async completeUpload(request: CompleteUploadRequest): Promise<FamilyDocument> {
    await this.verifyAccess(request.familyMemberId, request.clientId);

    const document = await this.documentRepo.getDocument(request.documentId);
    if (document === null) {
      throw new DocumentNotFoundError(request.documentId);
    }

    if (document.status !== 'UPLOADING') {
      throw new Error('Document is not in uploading state');
    }

    // Update document with file info
    const fileExtension = this.extractExtension(request.fileName);
    const fileType = this.mapMimeToFileType(request.mimeType);

    await this.documentRepo.updateDocument(request.documentId, {
      fileName: request.fileName,
      fileExtension,
      fileType,
      fileSizeBytes: request.fileSizeBytes,
      mimeType: request.mimeType,
      status: 'PROCESSING',
      virusScanStatus: 'PENDING',
      updatedBy: request.familyMemberId,
    });

    // In production, trigger virus scan here
    // For now, mark as clean
    await this.documentRepo.updateDocument(request.documentId, {
      status: 'ACTIVE',
      virusScanStatus: 'CLEAN',
      virusScanCompletedAt: new Date(),
    });

    const updated = await this.documentRepo.getDocument(request.documentId);
    if (updated === null) {
      throw new DocumentNotFoundError(request.documentId);
    }

    return this.transformDocument(updated);
  }

  /**
   * Get download URL for a document
   */
  async getDownloadUrl(
    familyMemberId: UUID,
    clientId: UUID,
    documentId: UUID
  ): Promise<DocumentDownloadResponse> {
    await this.verifyAccess(familyMemberId, clientId);

    const document = await this.documentRepo.getDocument(documentId);
    if (document === null) {
      throw new DocumentNotFoundError(documentId);
    }

    // Verify document belongs to client
    if (document.clientId !== clientId) {
      throw new DocumentAccessDeniedError(familyMemberId, 'Document not found');
    }

    // Verify document is active
    if (document.status !== 'ACTIVE') {
      throw new DocumentAccessDeniedError(
        familyMemberId,
        'Document not available for download'
      );
    }

    // Generate signed download URL
    const downloadUrl = await this.storageService.generateDownloadUrl(
      document.storagePath,
      document.fileName,
      this.downloadUrlExpirySeconds
    );

    // Update download count
    await this.documentRepo.updateDocument(documentId, {
      downloadCount: document.downloadCount + 1,
      lastDownloadedAt: new Date(),
    });

    return {
      documentId,
      downloadUrl,
      expiresAt: new Date(Date.now() + this.downloadUrlExpirySeconds * 1000),
      fileName: document.fileName,
      fileType: this.mapFileType(document.fileType),
      fileSizeBytes: document.fileSizeBytes,
    };
  }

  /**
   * List documents for a client
   */
  async listDocuments(
    options: DocumentSearchOptions
  ): Promise<FamilyDocumentListResponse> {
    const familyMember = await this.verifyAccess(
      options.familyMemberId,
      options.clientId
    );

    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const filters: DocumentFilters = {
      categories: options.categories,
      statuses: options.status,
      searchTerm: options.searchTerm,
      tags: options.tags,
      uploadedAfter: options.uploadedAfter as Date | undefined,
      uploadedBefore: options.uploadedBefore as Date | undefined,
      sortBy: options.sortBy ?? 'uploadedAt',
      sortOrder: options.sortOrder ?? 'DESC',
      limit: pageSize,
      offset,
    };

    const [documents, totalCount] = await Promise.all([
      this.documentRepo.listDocuments(
        options.clientId,
        familyMember.organizationId,
        filters
      ),
      this.documentRepo.countDocuments(
        options.clientId,
        familyMember.organizationId,
        { ...filters, limit: undefined, offset: undefined }
      ),
    ]);

    // Get uploader names
    const listItems: FamilyDocumentListItem[] = [];
    for (const doc of documents) {
      const uploaderName =
        doc.uploadedByFamilyMemberId !== undefined
          ? await this.documentRepo.getFamilyMemberName(
              doc.uploadedByFamilyMemberId
            )
          : undefined;

      listItems.push(this.transformToListItem(doc, uploaderName ?? undefined));
    }

    // Group by category
    const allDocs = await this.documentRepo.listDocuments(
      options.clientId,
      familyMember.organizationId,
      { statuses: ['ACTIVE'] }
    );

    const byCategory = this.groupByCategory(allDocs);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      documents: listItems,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      byCategory,
    };
  }

  /**
   * Get document dashboard
   */
  async getDocumentDashboard(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<FamilyDocumentDashboard> {
    const familyMember = await this.verifyAccess(familyMemberId, clientId);
    const organizationId = familyMember.organizationId;

    const [allDocs, clientInfo, storageUsed] = await Promise.all([
      this.documentRepo.listDocuments(clientId, organizationId, {
        statuses: ['ACTIVE'],
      }),
      this.documentRepo.getClientInfo(clientId),
      this.documentRepo.getStorageUsage(clientId, organizationId),
    ]);

    // Recent uploads
    const recentUploads = [...allDocs]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5)
      .map((d) => this.transformToListItem(d));

    // Recently viewed
    const recentlyViewed = [...allDocs]
      .filter((d) => d.lastViewedAt !== undefined)
      .sort(
        (a, b) =>
          new Date(b.lastViewedAt ?? 0).getTime() -
          new Date(a.lastViewedAt ?? 0).getTime()
      )
      .slice(0, 5)
      .map((d) => this.transformToListItem(d));

    // Expiration alerts
    const expirationAlerts = this.generateExpirationAlerts(allDocs);

    // Group by category with icons
    const documentsByCategory = this.getCategoryStats(allDocs);

    // Missing required documents (simplified for now)
    const missingRequired = this.getMissingRequiredDocuments(allDocs);

    return {
      clientId,
      clientName: clientInfo !== null
        ? `${clientInfo.firstName} ${clientInfo.lastName}`
        : 'Unknown',
      totalDocuments: allDocs.length,
      documentsByCategory,
      recentUploads,
      recentlyViewed,
      expirationAlerts,
      missingRequiredDocuments: missingRequired,
      storageUsed: {
        bytesUsed: storageUsed,
        bytesLimit: this.storageLimitBytes,
        percentUsed: Math.round((storageUsed / this.storageLimitBytes) * 100),
      },
      organizationId,
      lastUpdated: new Date(),
    };
  }

  /**
   * Update document metadata
   */
  async updateDocument(input: UpdateDocumentInput): Promise<FamilyDocument> {
    await this.verifyAccess(input.familyMemberId, input.clientId);

    const document = await this.documentRepo.getDocument(input.documentId);
    if (document === null) {
      throw new DocumentNotFoundError(input.documentId);
    }

    if (document.clientId !== input.clientId) {
      throw new DocumentAccessDeniedError(input.familyMemberId);
    }

    const updates: Partial<RawDocument> = {
      updatedBy: input.familyMemberId,
    };

    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.category !== undefined) updates.category = input.category;
    if (input.documentDate !== undefined)
      updates.documentDate = input.documentDate;
    if (input.expiresAt !== undefined)
      updates.expiresAt = input.expiresAt as Date;
    if (input.tags !== undefined) updates.tagsJson = JSON.stringify(input.tags);

    await this.documentRepo.updateDocument(input.documentId, updates);

    const updated = await this.documentRepo.getDocument(input.documentId);
    if (updated === null) {
      throw new DocumentNotFoundError(input.documentId);
    }

    return this.transformDocument(updated);
  }

  /**
   * Delete a document
   */
  async deleteDocument(input: DeleteDocumentInput): Promise<void> {
    await this.verifyAccess(input.familyMemberId, input.clientId);

    const document = await this.documentRepo.getDocument(input.documentId);
    if (document === null) {
      throw new DocumentNotFoundError(input.documentId);
    }

    if (document.clientId !== input.clientId) {
      throw new DocumentAccessDeniedError(input.familyMemberId);
    }

    // Soft delete
    await this.documentRepo.updateDocument(input.documentId, {
      status: 'DELETED',
      updatedBy: input.familyMemberId,
    });

    // Delete from storage
    await this.storageService.deleteFile(document.storagePath);
  }

  /**
   * Get category information
   */
  getCategoryInfo(): DocumentCategoryInfo[] {
    const categories: DocumentCategoryInfo[] = [
      {
        category: 'INSURANCE',
        displayName: 'Insurance',
        description: 'Insurance cards, policies, and coverage documents',
        iconName: 'shield',
        allowedFileTypes: ['PDF', 'IMAGE'],
        maxFileSizeBytes: this.maxFileSizeBytes,
        isRequiredForClient: true,
        exampleDocuments: [
          'Insurance card (front and back)',
          'Policy documents',
        ],
      },
      {
        category: 'MEDICAL_RECORDS',
        displayName: 'Medical Records',
        description: 'Medical history, lab results, and health reports',
        iconName: 'file-medical',
        allowedFileTypes: ['PDF', 'IMAGE', 'WORD'],
        maxFileSizeBytes: this.maxFileSizeBytes,
        isRequiredForClient: false,
        exampleDocuments: ['Medical history summary', 'Lab results', 'Diagnoses'],
      },
      {
        category: 'LEGAL',
        displayName: 'Legal Documents',
        description: 'Power of attorney, advance directives, legal forms',
        iconName: 'gavel',
        allowedFileTypes: ['PDF', 'IMAGE'],
        maxFileSizeBytes: this.maxFileSizeBytes,
        isRequiredForClient: true,
        exampleDocuments: [
          'Power of Attorney',
          'Healthcare Proxy',
          'Living Will',
        ],
      },
      {
        category: 'IDENTIFICATION',
        displayName: 'Identification',
        description: 'ID cards, birth certificates, social security',
        iconName: 'id-card',
        allowedFileTypes: ['PDF', 'IMAGE'],
        maxFileSizeBytes: this.maxFileSizeBytes,
        isRequiredForClient: true,
        exampleDocuments: ["Driver's license", 'Birth certificate', 'SS card'],
      },
      {
        category: 'CARE_PLAN',
        displayName: 'Care Plans',
        description: 'Care plans and service agreements',
        iconName: 'clipboard-list',
        allowedFileTypes: ['PDF', 'WORD'],
        maxFileSizeBytes: this.maxFileSizeBytes,
        isRequiredForClient: false,
        exampleDocuments: ['Care plan', 'Service agreement'],
      },
      {
        category: 'PROGRESS_NOTES',
        displayName: 'Progress Notes',
        description: 'Progress notes and care reports',
        iconName: 'notes-medical',
        allowedFileTypes: ['PDF', 'WORD', 'TEXT'],
        maxFileSizeBytes: this.maxFileSizeBytes,
        isRequiredForClient: false,
        exampleDocuments: ['Weekly progress report', 'Monthly summary'],
      },
      {
        category: 'CONSENTS',
        displayName: 'Consent Forms',
        description: 'Signed consent and authorization forms',
        iconName: 'signature',
        allowedFileTypes: ['PDF', 'IMAGE'],
        maxFileSizeBytes: this.maxFileSizeBytes,
        isRequiredForClient: true,
        exampleDocuments: ['Service consent', 'HIPAA authorization'],
      },
      {
        category: 'OTHER',
        displayName: 'Other Documents',
        description: 'Other relevant documents',
        iconName: 'file',
        allowedFileTypes: ['PDF', 'IMAGE', 'WORD', 'EXCEL', 'TEXT', 'OTHER'],
        maxFileSizeBytes: this.maxFileSizeBytes,
        isRequiredForClient: false,
        exampleDocuments: [],
      },
    ];

    return categories;
  }

  // ---- Private helper methods ----

  private getAllowedMimeTypes(): string[] {
    return [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
  }

  private extractExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? (parts.pop() ?? '').toLowerCase() : '';
  }

  private mapMimeToFileType(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (
      mimeType.includes('word') ||
      mimeType.includes('document')
    )
      return 'WORD';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
      return 'EXCEL';
    if (mimeType.startsWith('text/')) return 'TEXT';
    return 'OTHER';
  }

  private mapFileType(raw: string): DocumentFileType {
    const mapping: Record<string, DocumentFileType> = {
      PDF: 'PDF',
      IMAGE: 'IMAGE',
      WORD: 'WORD',
      EXCEL: 'EXCEL',
      TEXT: 'TEXT',
      OTHER: 'OTHER',
    };
    return mapping[raw] ?? 'OTHER';
  }

  private mapCategory(raw: string): FamilyDocumentCategory {
    const mapping: Record<string, FamilyDocumentCategory> = {
      INSURANCE: 'INSURANCE',
      MEDICAL_RECORDS: 'MEDICAL_RECORDS',
      LEGAL: 'LEGAL',
      IDENTIFICATION: 'IDENTIFICATION',
      CARE_PLAN: 'CARE_PLAN',
      PROGRESS_NOTES: 'PROGRESS_NOTES',
      ASSESSMENTS: 'ASSESSMENTS',
      CONSENTS: 'CONSENTS',
      BILLING: 'BILLING',
      CORRESPONDENCE: 'CORRESPONDENCE',
      PHOTOS: 'PHOTOS',
      OTHER: 'OTHER',
    };
    return mapping[raw] ?? 'OTHER';
  }

  private mapStatus(raw: string): FamilyDocumentStatus {
    const mapping: Record<string, FamilyDocumentStatus> = {
      UPLOADING: 'UPLOADING',
      PROCESSING: 'PROCESSING',
      ACTIVE: 'ACTIVE',
      ARCHIVED: 'ARCHIVED',
      EXPIRED: 'EXPIRED',
      DELETED: 'DELETED',
    };
    return mapping[raw] ?? 'ACTIVE';
  }

  private mapAccessLevel(raw: string): DocumentAccessLevel {
    const mapping: Record<string, DocumentAccessLevel> = {
      FAMILY_ONLY: 'FAMILY_ONLY',
      CARE_TEAM: 'CARE_TEAM',
      AGENCY_ONLY: 'AGENCY_ONLY',
      PUBLIC: 'PUBLIC',
    };
    return mapping[raw] ?? 'CARE_TEAM';
  }

  private transformDocument(raw: RawDocument): FamilyDocument {
    return {
      id: raw.id,
      clientId: raw.clientId,
      uploadedByFamilyMemberId: raw.uploadedByFamilyMemberId,
      category: this.mapCategory(raw.category),
      title: raw.title,
      description: raw.description,
      fileName: raw.fileName,
      fileExtension: raw.fileExtension,
      fileType: this.mapFileType(raw.fileType),
      fileSizeBytes: raw.fileSizeBytes,
      mimeType: raw.mimeType,
      storagePath: raw.storagePath,
      status: this.mapStatus(raw.status),
      accessLevel: this.mapAccessLevel(raw.accessLevel),
      uploadSource: 'FAMILY_PORTAL',
      documentDate: raw.documentDate,
      expiresAt: raw.expiresAt,
      tags: raw.tagsJson !== undefined ? JSON.parse(raw.tagsJson) : undefined,
      metadata: raw.metadataJson !== undefined
        ? JSON.parse(raw.metadataJson)
        : undefined,
      thumbnailUrl: raw.thumbnailUrl,
      downloadCount: raw.downloadCount,
      lastDownloadedAt: raw.lastDownloadedAt,
      lastViewedAt: raw.lastViewedAt,
      virusScanStatus: raw.virusScanStatus as FamilyDocument['virusScanStatus'],
      virusScanCompletedAt: raw.virusScanCompletedAt,
      organizationId: raw.organizationId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      createdBy: raw.createdBy,
      updatedBy: raw.updatedBy,
      version: raw.version,
    };
  }

  private transformToListItem(
    raw: RawDocument,
    uploaderName?: string
  ): FamilyDocumentListItem {
    const now = new Date();
    const daysUntilExpiry =
      raw.expiresAt !== undefined
        ? Math.ceil(
            (new Date(raw.expiresAt).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : undefined;

    return {
      id: raw.id,
      title: raw.title,
      category: this.mapCategory(raw.category),
      categoryDisplayName: this.getCategoryDisplayName(raw.category),
      fileName: raw.fileName,
      fileType: this.mapFileType(raw.fileType),
      fileSizeBytes: raw.fileSizeBytes,
      status: this.mapStatus(raw.status),
      uploadedAt: raw.createdAt,
      uploadedByName: uploaderName,
      documentDate: raw.documentDate,
      expiresAt: raw.expiresAt,
      isExpiringSoon: daysUntilExpiry !== undefined && daysUntilExpiry <= 30,
      thumbnailUrl: raw.thumbnailUrl,
      downloadCount: raw.downloadCount,
    };
  }

  private getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      INSURANCE: 'Insurance',
      MEDICAL_RECORDS: 'Medical Records',
      LEGAL: 'Legal',
      IDENTIFICATION: 'Identification',
      CARE_PLAN: 'Care Plan',
      PROGRESS_NOTES: 'Progress Notes',
      ASSESSMENTS: 'Assessments',
      CONSENTS: 'Consents',
      BILLING: 'Billing',
      CORRESPONDENCE: 'Correspondence',
      PHOTOS: 'Photos',
      OTHER: 'Other',
    };
    return names[category] ?? 'Other';
  }

  private groupByCategory(
    docs: RawDocument[]
  ): FamilyDocumentListResponse['byCategory'] {
    const counts = new Map<string, number>();

    for (const doc of docs) {
      const current = counts.get(doc.category) ?? 0;
      counts.set(doc.category, current + 1);
    }

    return Array.from(counts.entries()).map(([category, count]) => ({
      category: this.mapCategory(category),
      displayName: this.getCategoryDisplayName(category),
      count,
    }));
  }

  private getCategoryStats(
    docs: RawDocument[]
  ): FamilyDocumentDashboard['documentsByCategory'] {
    const counts = new Map<string, number>();

    for (const doc of docs) {
      const current = counts.get(doc.category) ?? 0;
      counts.set(doc.category, current + 1);
    }

    const iconMap: Record<string, string> = {
      INSURANCE: 'shield',
      MEDICAL_RECORDS: 'file-medical',
      LEGAL: 'gavel',
      IDENTIFICATION: 'id-card',
      CARE_PLAN: 'clipboard-list',
      PROGRESS_NOTES: 'notes-medical',
      ASSESSMENTS: 'clipboard-check',
      CONSENTS: 'signature',
      BILLING: 'receipt',
      CORRESPONDENCE: 'envelope',
      PHOTOS: 'image',
      OTHER: 'file',
    };

    return Array.from(counts.entries()).map(([category, count]) => ({
      category: this.mapCategory(category),
      displayName: this.getCategoryDisplayName(category),
      count,
      iconName: iconMap[category] ?? 'file',
    }));
  }

  private generateExpirationAlerts(docs: RawDocument[]): DocumentExpirationAlert[] {
    const now = new Date();
    const alerts: DocumentExpirationAlert[] = [];

    for (const doc of docs) {
      if (doc.expiresAt === undefined) continue;

      const expiresAt = new Date(doc.expiresAt);
      const daysUntil = Math.ceil(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil <= 0) {
        alerts.push({
          documentId: doc.id,
          title: doc.title,
          category: this.mapCategory(doc.category),
          expiresAt: expiresAt,
          daysUntilExpiration: daysUntil,
          severity: 'URGENT',
          message: `${doc.title} has expired`,
        });
      } else if (daysUntil <= 7) {
        alerts.push({
          documentId: doc.id,
          title: doc.title,
          category: this.mapCategory(doc.category),
          expiresAt: expiresAt,
          daysUntilExpiration: daysUntil,
          severity: 'WARNING',
          message: `${doc.title} expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
        });
      } else if (daysUntil <= 30) {
        alerts.push({
          documentId: doc.id,
          title: doc.title,
          category: this.mapCategory(doc.category),
          expiresAt: expiresAt,
          daysUntilExpiration: daysUntil,
          severity: 'INFO',
          message: `${doc.title} expires in ${daysUntil} days`,
        });
      }
    }

    return alerts.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
  }

  private getMissingRequiredDocuments(
    docs: RawDocument[]
  ): FamilyDocumentDashboard['missingRequiredDocuments'] {
    const requiredCategories = ['INSURANCE', 'IDENTIFICATION', 'LEGAL', 'CONSENTS'];
    const existingCategories = new Set(docs.map((d) => d.category));

    return requiredCategories
      .filter((cat) => !existingCategories.has(cat))
      .map((cat) => ({
        category: this.mapCategory(cat),
        displayName: this.getCategoryDisplayName(cat),
        description: `Please upload your ${this.getCategoryDisplayName(cat).toLowerCase()} documents`,
        isRequired: true,
      }));
  }
}
