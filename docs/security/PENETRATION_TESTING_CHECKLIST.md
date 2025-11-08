# Penetration Testing Checklist

## Authentication & Authorization

- [ ] Test password reset flow for account takeover
- [ ] Test JWT token expiration and refresh
- [ ] Test privilege escalation (caregiver ’ admin)
- [ ] Test session fixation attacks
- [ ] Test brute force protection (account lockout)
- [ ] Test OAuth flow security

## Input Validation

- [ ] Test SQL injection on all input fields
- [ ] Test NoSQL injection if using MongoDB
- [ ] Test XSS on text inputs, rich text editors
- [ ] Test LDAP injection
- [ ] Test XML injection
- [ ] Test command injection

## API Security

- [ ] Test rate limiting on all endpoints
- [ ] Test CSRF protection on state-changing operations
- [ ] Test CORS configuration
- [ ] Test API authentication bypass
- [ ] Test mass assignment vulnerabilities

## Data Protection

- [ ] Test encryption at rest (database)
- [ ] Test encryption in transit (HTTPS)
- [ ] Test sensitive data exposure in logs
- [ ] Test sensitive data exposure in error messages
- [ ] Test data leakage through API responses

## Business Logic

- [ ] Test EVV GPS spoofing prevention
- [ ] Test visit time manipulation
- [ ] Test billing amount manipulation
- [ ] Test unauthorized visit access
- [ ] Test unauthorized client data access

## Infrastructure

- [ ] Test security headers (CSP, HSTS, X-Frame-Options)
- [ ] Test SSL/TLS configuration
- [ ] Test exposed admin interfaces
- [ ] Test default credentials
- [ ] Test directory traversal

## Mobile App

- [ ] Test root/jailbreak detection bypass
- [ ] Test certificate pinning
- [ ] Test local data encryption
- [ ] Test biometric authentication bypass
- [ ] Test API key exposure in app bundle
