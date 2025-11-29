# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### For Security Issues

If you discover a security vulnerability in Folk, please report it privately:

1. **Email**: brian.mabry.edwards@gmail.com
2. **Subject**: `[SECURITY] Folk Vulnerability Report`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - **Critical**: 24-72 hours
  - **High**: 1-2 weeks
  - **Medium**: 2-4 weeks
  - **Low**: Next release cycle

### What to Expect

1. **Acknowledgment**: We'll confirm receipt of your report
2. **Validation**: We'll verify the vulnerability
3. **Fix Development**: We'll develop and test a fix
4. **Disclosure**: We'll coordinate disclosure timing with you
5. **Credit**: You'll be credited in release notes (if desired)

## Security Measures

Folk implements multiple layers of security:

### Application Security

- **Authentication**: JWT-based authentication with secure token storage
- **Authorization**: Role-based access control (RBAC) with fine-grained permissions
- **Session Management**: Secure session handling with automatic timeout
- **CSRF Protection**: Token-based CSRF protection on all state-changing operations
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Zod schema validation on all inputs

### Data Security

- **Encryption at Rest**: Sensitive data encrypted in PostgreSQL
- **Encryption in Transit**: TLS 1.2+ for all network communications
- **Database Security**: Parameterized queries, no raw SQL concatenation
- **Password Security**: bcrypt hashing with salt (never stored in plaintext)
- **API Key Security**: Secure generation and storage of API keys
- **Audit Logging**: Comprehensive audit trails for PHI access

### HIPAA Compliance

Folk is designed with HIPAA compliance in mind:

- **Access Control**: Unique user identification and emergency access procedures
- **Audit Controls**: Audit trails for all PHI access and modifications
- **Integrity**: Data integrity controls prevent unauthorized alteration
- **Person/Entity Authentication**: Strong authentication mechanisms
- **Transmission Security**: Encryption for data in transit

**Note**: While Folk implements HIPAA-required technical safeguards, full HIPAA compliance requires additional administrative and physical safeguards that are the responsibility of the covered entity (healthcare provider/agency).

### Infrastructure Security

- **Hosting**: Vercel (SOC 2 Type II certified)
- **Database**: Neon PostgreSQL (SOC 2 Type II certified)
- **Monitoring**: Sentry for error tracking and security monitoring
- **Secrets Management**: Environment variables, never committed to git
- **Dependency Scanning**: Automated dependency vulnerability scanning

## Security Best Practices for Self-Hosting

If you're self-hosting Folk, follow these best practices:

### Required

1. **Use HTTPS**: Always deploy with valid TLS certificates
2. **Secure Database**: Restrict database access to application servers only
3. **Environment Variables**: Use secure secrets management (not .env files in production)
4. **Update Regularly**: Apply security patches promptly
5. **Backup Strategy**: Implement encrypted backups with retention policies
6. **Access Control**: Limit administrative access to authorized personnel only

### Recommended

1. **Web Application Firewall**: Use a WAF to protect against common attacks
2. **Intrusion Detection**: Monitor for suspicious activity
3. **DDoS Protection**: Implement DDoS mitigation
4. **Security Headers**: Configure security headers (CSP, HSTS, etc.)
5. **Regular Audits**: Perform periodic security audits
6. **Penetration Testing**: Conduct regular penetration tests

## Known Limitations

### Pre-Production Disclaimers

- OAuth integration (Google) is not fully implemented and should not be used in production
- Multi-tenant self-service signup needs additional security hardening
- Some features are in beta and require additional testing

### Out of Scope

The following are explicitly out of scope for security reports:

- Issues requiring physical access to user devices
- Social engineering attacks
- Theoretical vulnerabilities without proof of concept
- Attacks requiring compromised credentials (unless demonstrating credential theft)
- Reports from automated tools without validation

## Security Updates

Security updates are released as:

- **Critical**: Immediate hotfix release
- **High**: Patch release within 1-2 weeks
- **Medium/Low**: Included in next regular release

Subscribe to releases on GitHub to stay informed:
- https://github.com/neighborhood-lab/folkcare/releases

## Vulnerability Disclosure Policy

We follow responsible disclosure:

1. **Private Report**: Report vulnerabilities privately first
2. **Coordinated Disclosure**: We'll work with you on disclosure timing
3. **Public Disclosure**: After fix is deployed and users notified
4. **Credit**: Security researchers credited in release notes (optional)

## Security Hall of Fame

We appreciate security researchers who help improve Folk security. Once disclosed, we'll list contributors here (with permission):

<!-- Will be populated as vulnerabilities are responsibly disclosed and fixed -->

## Questions?

For non-security questions, use:
- GitHub Discussions: https://github.com/neighborhood-lab/folkcare/discussions
- Discord: https://discord.gg/EkeXQZFq

For security issues, email: brian.mabry.edwards@gmail.com

---

**Last Updated**: November 27, 2025  
**Version**: 1.0.0
