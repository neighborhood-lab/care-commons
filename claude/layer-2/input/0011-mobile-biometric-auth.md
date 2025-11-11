# Task 0011: Mobile Biometric Authentication

## Status
[ ] To Do

## Priority
Medium

## Description
Allow caregivers to use fingerprint/Face ID for quick re-authentication after initial login. Improves UX while maintaining security for accessing PHI.

## Acceptance Criteria
- [ ] Biometric enrollment flow after login
- [ ] Store encrypted token in SecureStore
- [ ] Biometric prompt on app foreground (after 5 min background)
- [ ] Fallback to PIN/password if biometric fails
- [ ] Settings toggle in ProfileScreen (already exists)
- [ ] Clear biometric data on logout
- [ ] Works on both iOS (Face ID/Touch ID) and Android
- [ ] Graceful handling of unsupported devices
- [ ] Respects user's biometric toggle preference

## Technical Notes
- Use expo-local-authentication
- Check biometric availability before enabling
- Store JWT in SecureStore after biometric verification
- Add timeout (auto-lock after 5 minutes of inactivity)
- Follow platform-specific guidelines (Apple, Android)

## Related Tasks
- Integrates with: ProfileScreen settings
- Enhances: Login security
