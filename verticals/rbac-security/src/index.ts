/**
 * @care-commons/rbac-security
 *
 * Role-Based Access Control & Security Vertical
 *
 * Comprehensive security and access control management for Care Commons platform.
 * Provides role management, permission management, user role assignments,
 * permission checking, and security audit logging capabilities.
 *
 * Features:
 * - Flexible role-based access control (RBAC)
 * - Fine-grained permission management
 * - User role assignment with expiration
 * - Permission condition evaluation
 * - Comprehensive security audit logging
 * - Failed login tracking
 * - Suspicious activity detection
 */

// Core types
export * from './types/role';

// Data access
export * from './repository/rbac-repository';

// Business logic
export * from './service/rbac-service';
export * from './service/security-audit-service';

// Validation
export * from './validation/rbac-validator';

// API handlers
export * from './api/rbac-handlers';
