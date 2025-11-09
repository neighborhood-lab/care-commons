/**
 * @care-commons/core - Domain Mappings Types
 *
 * Custom domain configuration for white-label multi-tenancy
 */

import { UUID, Entity } from './base';

/**
 * Domain type
 */
export type DomainType = 'SUBDOMAIN' | 'CUSTOM_DOMAIN';

/**
 * SSL certificate status
 */
export type SSLStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'ERROR';

/**
 * DNS verification status
 */
export type DNSStatus = 'PENDING' | 'VERIFIED' | 'ERROR';

/**
 * Domain mapping status
 */
export type DomainStatus = 'PENDING' | 'ACTIVE' | 'ERROR' | 'SUSPENDED';

/**
 * Domain mapping entity
 */
export interface DomainMapping extends Entity {
  organizationId: UUID;

  // Domain information
  domain: string; // e.g., 'care.acme.com' or 'acmecare.com'
  domainType: DomainType;
  isPrimary: boolean;

  // SSL/TLS configuration
  sslStatus: SSLStatus;
  sslCertificate: string | null; // PEM-encoded certificate
  sslPrivateKey: string | null; // PEM-encoded private key (encrypted)
  sslExpiresAt: Date | null;
  autoRenewSsl: boolean;

  // DNS configuration
  dnsStatus: DNSStatus;
  dnsRecords: DNSRecord[] | null;
  dnsVerifiedAt: Date | null;
  lastDnsCheckAt: Date | null;

  // Routing configuration
  redirectToDomain: string | null;
  forceHttps: boolean;
  includeWww: boolean;

  // Status and metadata
  status: DomainStatus;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;

  // Activation tracking
  activatedAt: Date | null;
  activatedBy: UUID | null;
  suspendedAt: Date | null;
  suspendedBy: UUID | null;
  suspensionReason: string | null;
}

/**
 * DNS record configuration
 */
export interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX';
  name: string; // e.g., '@', 'www', '_acme-challenge'
  value: string;
  ttl?: number;
  priority?: number; // For MX records
}

/**
 * Create domain mapping request
 */
export interface CreateDomainMappingRequest {
  domain: string;
  domainType: DomainType;
  isPrimary?: boolean;
  forceHttps?: boolean;
  includeWww?: boolean;
  autoRenewSsl?: boolean;
}

/**
 * Update domain mapping request
 */
export interface UpdateDomainMappingRequest {
  isPrimary?: boolean;
  forceHttps?: boolean;
  includeWww?: boolean;
  autoRenewSsl?: boolean;
  redirectToDomain?: string | null;
  status?: DomainStatus;
  suspensionReason?: string | null;
}

/**
 * Domain verification instructions
 */
export interface DomainVerificationInstructions {
  domain: string;
  domainType: DomainType;
  dnsRecords: DNSRecord[];
  instructions: string;
  estimatedPropagationTime: string; // e.g., "24-48 hours"
}

/**
 * Domain health check result
 */
export interface DomainHealthCheck {
  domain: string;
  isReachable: boolean;
  sslValid: boolean;
  sslExpiresIn: number | null; // days
  dnsConfigured: boolean;
  errors: string[];
  warnings: string[];
  lastChecked: Date;
}

/**
 * SSL certificate info
 */
export interface SSLCertificateInfo {
  domain: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  daysUntilExpiration: number;
  isValid: boolean;
  subjectAltNames: string[];
}
