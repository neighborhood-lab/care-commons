# Security Audit Findings - November 2025

## Executive Summary

This document outlines critical security vulnerabilities discovered during automated code review. These findings require immediate attention before production deployment.

**Status**: 🔴 **CRITICAL ISSUES FOUND**  
**HIPAA Compliance**: ⚠️ **AT RISK**  
**Production Readiness**: ❌ **NOT READY**

---

## Critical Vulnerabilities (Immediate Action Required)

### 1. Authentication Bypass via Header Spoofing
**Severity**: 🔴 CRITICAL  
**CVSS Score**: 9.8 (Critical)  
**CWE**: CWE-287 (Improper Authentication)

**Location**: `packages/app/src/middleware/auth-context.ts:21-43`

**Issue**:  
Mock authentication middleware trusts unauthenticated HTTP headers for user identity and permissions. Any attacker can impersonate any user including administrators.

**Attack Vector**:
```bash
curl -H "X-User-Id: admin-user-id" \
     -H "X-Organization-Id: victim-org" \
     -H "X-User-Roles: SUPER_ADMIN,ORG_ADMIN" \
     https://api.example.com/api/mobile/visits
```

**Affected Endpoints**:
- `/api/mobile/*` (7 endpoints)
- `/api/sync/*` (4 endpoints)
- `/api/demo/*` (9 endpoints)
- `/api/organizations/*` (6 endpoints)

**Impact**:
- Complete access control bypass
- Unauthorized PHI access (HIPAA violation)
- Data modification/deletion
- Privilege escalation

**Remediation**:
Replace `authContextMiddleware` with proper JWT authentication:
```typescript
import { AuthMiddleware } from '@care-commons/core';
const authMiddleware = new AuthMiddleware(db);
router.use(authMiddleware.requireAuth);
```

**Status**: Proper `AuthMiddleware` exists in `packages/core/src/middleware/auth-middleware.ts` but is not wired up.

---

### 2. Missing Input Validation on API Endpoints
**Severity**: 🔴 HIGH  
**CVSS Score**: 7.5 (High)  
**CWE**: CWE-20 (Improper Input Validation)

**Locations**:
- `packages/app/src/routes/mobile.ts` - 7 endpoints
- `packages/app/src/routes/sync.ts` - 4 endpoints
- `packages/app/src/routes/organizations.ts` - 6 endpoints
- `packages/app/src/routes/demo.ts` - 9 endpoints

**Issue**:  
No Zod schema validation on request bodies, query parameters, or path parameters. Invalid data reaches business logic causing crashes and potential data corruption.

**Attack Vectors**:
- Type confusion attacks
- SQL injection via unvalidated inputs
- Buffer overflow via oversized payloads
- Denial of service

**Remediation**:
Add Zod validation to all endpoints:
```typescript
import { z } from 'zod';

const VisitSchema = z.object({
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  deviceInfo: z.object({
    deviceId: z.string().min(1).max(255),
    deviceType: z.enum(['IOS', 'ANDROID', 'WEB']),
  }),
}).strict();

router.post('/visits/:id/start', (req, res) => {
  const validation = VisitSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.issues });
  }
  // Proceed with validated data
});
```

---

### 3. PHI Access Without Audit Logging
**Severity**: 🔴 CRITICAL (HIPAA Compliance)  
**Regulation**: HIPAA §164.312(b)  
**CWE**: CWE-778 (Insufficient Logging)

**Locations**:
- `verticals/time-tracking-evv/src/service/evv-service.ts` (10 methods)
- `verticals/client-demographics/src/service/client-service.ts` (8 methods)
- `verticals/caregiver-staff/src/service/caregiver-service.ts` (6 methods)

**Issue**:  
All PHI access methods lack audit trail logging. Cannot track who accessed what data, when, and why.

**HIPAA Violations**:
- §164.312(b) - Audit Controls
- §164.308(a)(1)(ii)(D) - Information System Activity Review

**Remediation**:
```typescript
// Client service example
async getClientById(id: string, context: UserContext): Promise<Client> {
  const client = await this.repository.findById(id);
  
  // ADD THIS:
  await this.auditService.logAccess({
    userId: context.userId,
    action: 'READ',
    resource: 'CLIENT',
    resourceId: id,
    phiAccessed: ['demographics', 'contact_info'],
  });
  
  return client;
}
```

**Status**: `ClientAuditService` exists in `verticals/client-demographics/src/service/client-audit-service.ts` but not integrated.

---

### 4. Unencrypted SSN Storage
**Severity**: 🔴 CRITICAL (HIPAA Compliance)  
**Regulation**: HIPAA §164.312(a)(2)(iv)  
**CWE**: CWE-311 (Missing Encryption of Sensitive Data)

**Location**: `verticals/client-demographics/src/repository/client-repository.ts:69-70`

**Issue**:  
Social Security Numbers stored in plain text in PostgreSQL. Comment claims encryption but it's not implemented.

**Code**:
```typescript
// Line 226 in types/client.ts
ssn?: string; // Encrypted  ← LIE: Not actually encrypted
```

**HIPAA Violations**:
- §164.312(a)(2)(iv) - Encryption and Decryption
- §164.312(e)(2)(ii) - Encryption

**Remediation**:
```typescript
import { CryptoUtils } from '@care-commons/core';

// On write:
const encryptedSSN = await CryptoUtils.encrypt(client.ssn);
await db.query('INSERT INTO clients (ssn) VALUES ($1)', [encryptedSSN]);

// On read:
const row = await db.query('SELECT ssn FROM clients WHERE id = $1', [id]);
const decryptedSSN = await CryptoUtils.decrypt(row.ssn);
```

**Status**: Crypto utils exist in `verticals/time-tracking-evv/src/utils/crypto-utils.ts` but not used for SSN.

---

## High Severity Issues

### 5. Missing Rate Limiting
**Severity**: 🟠 HIGH  
**Impact**: Denial of Service, Brute Force Attacks

**Issue**:  
Only auth routes have rate limiting. All other endpoints vulnerable to:
- API abuse
- Brute force attacks
- Resource exhaustion
- DDoS amplification

**Affected**: All `/api/mobile/*`, `/api/sync/*`, `/api/organizations/*` endpoints

**Remediation**:  
Add express-rate-limit middleware globally.

---

### 6. Overly Permissive CORS in Development
**Severity**: 🟠 HIGH  
**Location**: `packages/app/src/server.ts:113-117`

**Issue**:
```typescript
if (NODE_ENV === 'development') {
  callback(null, true);  // Allows ALL origins
}
```

**Risk**: Development databases exposed to malicious websites if reachable (common in cloud dev).

**Remediation**: Whitelist specific dev origins.

---

### 7. SELECT * Anti-Pattern with PHI
**Severity**: 🟠 MEDIUM (HIPAA Minimum Necessary)  
**Regulation**: HIPAA Minimum Necessary Standard

**Locations**: Multiple repository queries use `SELECT *`

**Issue**: Returns all columns including potentially sensitive fields user shouldn't access.

**Remediation**: Explicitly list columns in all SELECT statements.

---

## Compliance Violations

### HIPAA Violations Summary
| Violation | Regulation | Severity | Status |
|-----------|-----------|----------|--------|
| Missing Audit Logs | §164.312(b) | Critical | Open |
| Unencrypted SSN | §164.312(a)(2)(iv) | Critical | Open |
| Auth Bypass | §164.312(a)(1) | Critical | Open |
| SELECT * PHI | Minimum Necessary | High | Open |

### State Regulatory Gaps

#### Texas (26 TAC §558)
- ❌ Employee Misconduct Registry checks not implemented
- ❌ VMUR 30-day submission window not enforced  
- ❌ HHAeXchange submission error handling incomplete

#### Florida (Chapter 59A-8)
- ❌ Level 2 background screening 5-year lifecycle not tracked
- ❌ RN supervision visits (60-day) not automated
- ❌ Multi-aggregator submission logic incomplete

---

## Recommended Action Plan

### Phase 1 - Critical (This Week)
1. ✅ **[PR #96]** Sanitize error messages (COMPLETED)
2. ⏳ Replace mock authentication with JWT middleware
3. ⏳ Add Zod validation to all API endpoints
4. ⏳ Wire up PHI audit logging to all access methods
5. ⏳ Implement SSN encryption

### Phase 2 - High Priority (Next Week)
6. ⏳ Add rate limiting middleware
7. ⏳ Fix CORS whitelist
8. ⏳ Replace SELECT * with explicit columns
9. ⏳ Add authentication error logging

### Phase 3 - Compliance (Next 2 Weeks)
10. ⏳ Texas Employee Misconduct Registry integration
11. ⏳ Florida background screening lifecycle
12. ⏳ EVV aggregator submission hardening
13. ⏳ Data retention policy implementation

---

## Testing Checklist

Before each deployment:
- [ ] All API endpoints require authentication
- [ ] Input validation rejects invalid data
- [ ] PHI access generates audit logs
- [ ] SSN read/write operations use encryption
- [ ] Rate limits prevent abuse
- [ ] Error messages don't leak details
- [ ] Health check endpoint accessible
- [ ] Database migrations complete

---

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [21st Century Cures Act §12006](https://www.congress.gov/bill/114th-congress/house-bill/34/text)

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-06  
**Author**: OpenCode Security Review  
**Classification**: INTERNAL - SECURITY SENSITIVE
