# Document Management & eSignatures

> Secure document storage, versioning, and electronic signature workflows for home care operations

## Overview

The Document Management & eSignatures vertical provides comprehensive document lifecycle management and electronic signature collection capabilities for home care agencies. It enables secure storage, versioning, permission management, and compliant electronic signature workflows.

## Features

### Document Management

- **Document Storage**: Secure storage with support for multiple providers (Local, S3, Azure Blob, GCS)
- **Version Control**: Full document versioning with change tracking and rollback capabilities
- **Access Control**: Fine-grained permissions with role-based access control
- **Document Categories**: Organize documents by type (Client, Caregiver, Administrative, etc.)
- **Metadata Management**: Rich metadata support with custom fields
- **Expiration & Retention**: Automated document lifecycle management
- **Audit Trail**: Complete tracking of document access and modifications
- **Search & Filter**: Powerful search capabilities across documents

### Electronic Signatures

- **Multiple Signature Types**: Support for electronic, digital, biometric, and typed signatures
- **Signature Workflows**: Sequential and parallel signing workflows
- **Signer Roles**: Support for signers, approvers, witnesses, and reviewers
- **Authentication**: Multiple authentication methods (Email, SMS, Access Code, 2FA)
- **Audit Trail**: Complete signature audit trail with IP, geolocation, and device info
- **Compliance**: ESIGN Act and UETA compliant signature collection
- **Certificate of Completion**: Automated generation of completion certificates
- **Reminders**: Configurable reminder schedules for pending signatures

## Architecture

### Layers

```
document-esign/
├── types/           # TypeScript type definitions
├── validation/      # Zod validation schemas
├── repository/      # Data access layer
├── service/         # Business logic layer
└── api/             # HTTP/API handlers
```

### Core Types

#### Document Types

- **Document**: Core document entity with versioning and metadata
- **DocumentVersion**: Individual version with storage and checksum
- **DocumentPermission**: Access control permissions
- **DocumentTemplate**: Reusable document templates
- **DocumentMetadata**: Rich metadata support

#### Signature Types

- **SignatureRequest**: Electronic signature workflow
- **Signer**: Individual signer with role and status
- **SignatureField**: Signature field with position and type
- **SignatureData**: Captured signature with biometric data
- **AuditTrailEntry**: Complete audit trail entry
- **CertificateOfCompletion**: Signature completion certificate

## Installation

```bash
npm install @care-commons/document-esign
```

## Usage

### Document Management

#### Create a Document

```typescript
import { DocumentService, DocumentRepository } from '@care-commons/document-esign'

const repository = new DocumentRepository()
const service = new DocumentService(repository)

const document = await service.createDocument(
  {
    organizationId: 'org-123',
    branchId: 'branch-456',
    title: 'Client Care Plan',
    description: 'Care plan for John Doe',
    documentType: 'CARE_PLAN',
    category: 'CLIENT',
    fileName: 'care-plan-john-doe.pdf',
    mimeType: 'application/pdf',
    fileExtension: 'pdf',
    fileSize: 1024000,
    storageInfo: {
      storageProvider: 'S3',
      storagePath: 's3://bucket/care-plans/care-plan-john-doe.pdf',
      bucket: 'care-documents',
      region: 'us-east-1',
    },
    accessLevel: 'CONFIDENTIAL',
    ownerId: 'user-789',
    ownerType: 'USER',
    tags: ['care-plan', 'client'],
  },
  userContext,
)
```

#### Upload a New Version

```typescript
const updatedDocument = await service.uploadVersion(
  'doc-123',
  {
    fileName: 'care-plan-john-doe-v2.pdf',
    fileSize: 1050000,
    storageInfo: {
      storageProvider: 'S3',
      storagePath: 's3://bucket/care-plans/care-plan-john-doe-v2.pdf',
      bucket: 'care-documents',
      region: 'us-east-1',
    },
    checksum: 'sha256:abc123...',
    versionLabel: 'Updated care goals',
    changeNotes: 'Updated care goals based on assessment',
  },
  userContext,
)
```

#### Search Documents

```typescript
const results = await service.searchDocuments(
  {
    organizationId: 'org-123',
    documentType: 'CARE_PLAN',
    category: 'CLIENT',
    status: 'ACTIVE',
    searchText: 'john doe',
  },
  userContext,
)
```

### Electronic Signatures

#### Create a Signature Request

```typescript
import { SignatureService, SignatureRepository } from '@care-commons/document-esign'

const repository = new SignatureRepository()
const service = new SignatureService(repository)

const signatureRequest = await service.createSignatureRequest(
  {
    organizationId: 'org-123',
    branchId: 'branch-456',
    title: 'Client Consent Form',
    message: 'Please review and sign the consent form',
    documentId: 'doc-123',
    signers: [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'SIGNER',
        signingOrder: 1,
        authenticationMethod: 'EMAIL',
        fields: [
          {
            fieldType: 'SIGNATURE',
            position: {
              pageNumber: 1,
              x: 100,
              y: 500,
              width: 200,
              height: 50,
            },
            required: true,
          },
          {
            fieldType: 'DATE',
            position: {
              pageNumber: 1,
              x: 100,
              y: 560,
              width: 100,
              height: 30,
            },
            required: true,
          },
        ],
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'WITNESS',
        signingOrder: 2,
        authenticationMethod: 'EMAIL',
        fields: [
          {
            fieldType: 'SIGNATURE',
            position: {
              pageNumber: 1,
              x: 100,
              y: 650,
              width: 200,
              height: 50,
            },
            required: true,
          },
        ],
      },
    ],
    signingOrder: 'SEQUENTIAL',
    expirationDate: new Date('2025-12-31'),
    allowDecline: true,
    authenticationRequired: true,
  },
  userContext,
)
```

#### Send Signature Request

```typescript
const sentRequest = await service.sendSignatureRequest('sig-request-123', userContext)
```

#### Sign a Document

```typescript
const signedRequest = await service.signDocument(
  'sig-request-123',
  {
    signerId: 'signer-456',
    fields: [
      {
        fieldId: 'field-789',
        value: 'John Doe',
      },
      {
        fieldId: 'field-790',
        value: '2025-11-06',
      },
    ],
    signature: {
      signatureType: 'ELECTRONIC',
      signatureImage: 'data:image/png;base64,iVBORw0KGgo...',
      timestamp: '2025-11-06T10:30:00Z',
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    geolocation: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      timestamp: '2025-11-06T10:30:00Z',
    },
  },
  userContext,
)
```

## Document Types

| Type | Description | Use Cases |
|------|-------------|-----------|
| CARE_PLAN | Care plans and service plans | Client care management |
| ASSESSMENT | Assessment forms and reports | Initial and ongoing assessments |
| CONTRACT | Service agreements and contracts | Client onboarding |
| CONSENT_FORM | Consent and authorization forms | Legal compliance |
| INVOICE | Billing and invoices | Financial management |
| MEDICAL_RECORD | Medical records and histories | Clinical documentation |
| POLICY | Policies and procedures | Compliance documentation |
| CERTIFICATION | Staff certifications and licenses | Caregiver management |
| TRAINING_MATERIAL | Training documents and materials | Staff development |
| TIMESHEET | Visit timesheets and EVV records | Payroll processing |

## Document Categories

| Category | Purpose |
|----------|---------|
| CLIENT | Client-related documents |
| CAREGIVER | Caregiver/staff documents |
| ADMINISTRATIVE | Administrative documents |
| COMPLIANCE | Compliance and regulatory documents |
| FINANCIAL | Financial documents |
| TRAINING | Training materials |
| LEGAL | Legal documents |
| OPERATIONAL | Operational procedures |

## Access Levels

| Level | Description |
|-------|-------------|
| PUBLIC | Accessible to all users |
| INTERNAL | Internal organization access |
| CONFIDENTIAL | Limited access with permissions |
| RESTRICTED | Highly restricted access |

## Signature Types

| Type | Description | Use Cases |
|------|-------------|-----------|
| ELECTRONIC | Simple electronic signature | Standard agreements |
| DIGITAL | Certificate-based signature | High-security documents |
| BIOMETRIC | Touchscreen signature capture | In-person signing |
| CLICK_TO_SIGN | Click-to-accept signature | Terms and conditions |
| TYPED | Typed name signature | Simple acknowledgments |

## Signer Roles

| Role | Description |
|------|-------------|
| SIGNER | Primary document signer |
| APPROVER | Approval authority |
| WITNESS | Signature witness |
| REVIEWER | Document reviewer |
| CARBON_COPY | Receive copy only (no signature) |
| FORM_FILLER | Fill form fields |

## Security & Compliance

### Security Features

- **Encryption**: Documents encrypted at rest and in transit
- **Access Control**: Role-based permissions and access levels
- **Audit Trail**: Complete audit trail for all operations
- **Checksum Verification**: File integrity verification
- **Authentication**: Multiple authentication methods for signers

### Compliance

- **ESIGN Act**: Compliant electronic signature collection
- **UETA**: Uniform Electronic Transactions Act compliance
- **HIPAA**: Healthcare data privacy and security
- **SOC 2**: Security and availability controls
- **State Regulations**: Support for state-specific requirements

## API Reference

### Document Handlers

- `POST /api/documents` - Create document
- `GET /api/documents/:id` - Get document
- `GET /api/documents` - Search documents
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/versions` - Upload version
- `GET /api/documents/:id/versions` - Get version history
- `GET /api/documents/:id/download` - Download document
- `POST /api/documents/:id/archive` - Archive document

### Signature Handlers

- `POST /api/signature-requests` - Create signature request
- `GET /api/signature-requests/:id` - Get signature request
- `GET /api/signature-requests` - Search signature requests
- `POST /api/signature-requests/:id/send` - Send to signers
- `POST /api/signature-requests/:id/sign` - Sign document
- `POST /api/signature-requests/:id/decline` - Decline signature
- `POST /api/signature-requests/:id/cancel` - Cancel request
- `GET /api/signature-requests/pending/:email` - Get pending for signer

## Testing

```bash
npm test
```

## Building

```bash
npm run build
```

## License

Proprietary - Care Commons Platform
