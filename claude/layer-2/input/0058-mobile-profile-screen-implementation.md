# Task 0058: Mobile ProfileScreen Implementation

**Priority**: 🟠 MEDIUM (Feature Completion)
**Category**: Mobile / Frontend
**Estimated Effort**: 2-3 days

## Context

ProfileScreen placeholder (42 lines). Caregivers need settings, preferences, and logout.

## Objective

Implement full ProfileScreen with user info, settings, preferences, and account management.

## Requirements

1. **User Info**: Display name, email, phone, credentials
2. **Settings**: Notification preferences, language, biometric toggle
3. **Credentials**: View uploaded certifications/licenses
4. **Theme**: Toggle dark/light mode
5. **Logout**: Clear tokens and return to login
6. **App Info**: Version number, terms, privacy policy links

## Implementation

**Key Features**:
- Fetch user profile from `/api/caregivers/me`
- Toggle settings stored in AsyncStorage
- Biometric preference toggle
- Logout clears SecureStore tokens
- Links to web pages (terms, privacy)

## Success Criteria

- [ ] User info displays correctly
- [ ] Settings persist across app restarts
- [ ] Biometric toggle works
- [ ] Logout clears session completely
- [ ] Credentials viewable
- [ ] App version shown
