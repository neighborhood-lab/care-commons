# Signup Flow Test Plan

**Purpose:** Comprehensive test scenarios for the multi-step organization signup flow  
**Status:** Test plan ready - awaiting implementation  
**Related Issue:** #508

---

## Overview

The signup flow is a critical user journey that creates:
- New organization record
- Admin user account  
- Trial subscription (14 days)
- Email verification token
- Auto-login tokens

**Files:**
- Frontend: `packages/web/src/app/pages/Signup.tsx` (3-step wizard)
- Backend: `packages/core/src/service/signup-service.ts` (orchestration)
- API: `packages/app/src/routes/auth.ts` (POST /api/auth/signup)

---

## Test Scenarios

### 1. Happy Path - Complete Signup

**Steps:**
1. Navigate to `/signup`
2. Step 1: Organization Details
   - Enter organization name: "Test Home Health Agency"
   - Select state: "TX" (Texas)
   - Enter phone: "512-555-1234"
   - Click "Next"
3. Step 2: Admin Account
   - Enter first name: "John"
   - Enter last name: "Smith"
   - Enter email: "john.smith@example.com"
   - Enter phone: "512-555-5678"
   - Click "Next"
4. Step 3: Password
   - Enter password: "SecurePassword123!"
   - Confirm password: "SecurePassword123!"
   - Click "Complete Signup"

**Expected Results:**
- ✅ Organization created in database
- ✅ Admin user created with proper permissions
- ✅ Trial subscription created (14-day, STARTER plan)
- ✅ Email verification token generated
- ✅ Welcome email sent (if SMTP configured)
- ✅ User auto-logged in
- ✅ Redirected to `/onboarding`
- ✅ JWT tokens stored in localStorage/cookies
- ✅ No sensitive data exposed in client

**Database Verification:**
```sql
-- Organization created
SELECT * FROM organizations WHERE name = 'Test Home Health Agency';

-- Admin user created
SELECT * FROM users WHERE email = 'john.smith@example.com';

-- Subscription created
SELECT * FROM subscriptions WHERE organization_id = ...;

-- Permissions assigned
SELECT * FROM user_permissions WHERE user_id = ...;
```

---

### 2. Password Validation

**Test Cases:**

#### 2a. Password Too Short
- Password: "Short1!"
- Expected: "Password must be at least 12 characters"

#### 2b. Password Missing Uppercase
- Password: "nouppercase123!"
- Expected: "Password must contain uppercase letter"

#### 2c. Password Missing Lowercase
- Password: "NOLOWERCASE123!"
- Expected: "Password must contain lowercase letter"

#### 2d. Password Missing Number
- Password: "NoNumbersHere!"
- Expected: "Password must contain a number"

#### 2e. Password Missing Special Character
- Password: "NoSpecialChar123"
- Expected: "Password must contain special character"

#### 2f. Passwords Don't Match
- Password: "SecurePassword123!"
- Confirm: "DifferentPassword123!"
- Expected: "Passwords must match"

---

### 3. Email Validation

#### 3a. Invalid Email Format
- Email: "notanemail"
- Expected: "Invalid email address"

#### 3b. Email Already Exists
- Email: "admin@folkcare.example" (demo user)
- Expected: "Email already in use"

---

### 4. State Selection

#### 4a. Texas Agency
- State: "TX"
- Expected: 
  - Organization settings include `evvAggregator: "HHAeXchange"`
  - State-specific config applied

#### 4b. Florida Agency
- State: "FL"  
- Expected:
  - Organization settings include EVV aggregator options
  - Florida-specific compliance rules

---

### 5. Navigation Between Steps

#### 5a. Back Button
- Fill Step 1, click Next
- Click "Back" on Step 2
- Expected: Returns to Step 1 with data preserved

#### 5b. Direct URL Access
- Navigate to `/signup` when already on Step 2
- Expected: Stays on current step or resets gracefully

---

### 6. Error Handling

#### 6a. Network Failure
- Disable network during signup submit
- Expected: 
  - Error message shown
  - Form data preserved
  - Retry allowed

#### 6b. Server Error (500)
- Mock server to return 500 error
- Expected:
  - User-friendly error message
  - "Please try again" option
  - No sensitive error details exposed

#### 6c. Duplicate Organization Name
- Organization name already exists
- Expected: 
  - Warning shown (not blocking)
  - User can proceed

---

### 7. Security Verification

#### 7a. SQL Injection Attempt
- Organization name: `'; DROP TABLE organizations; --`
- Expected: Safely escaped, no SQL execution

#### 7b. XSS Attempt
- Organization name: `<script>alert('XSS')</script>`
- Expected: HTML escaped, rendered as text

#### 7c. Password Storage
- After signup, query database
- Expected: Password is bcrypt hashed, never plain text

#### 7d. Session Security
- Check JWT tokens
- Expected:
  - HttpOnly cookies (if using cookies)
  - Secure flag in production
  - Proper expiration times

---

### 8. Stripe Integration (Optional)

#### 8a. Stripe Not Configured
- Missing `STRIPE_API_KEY`
- Expected:
  - Signup still works
  - Temp subscription ID generated
  - Trial period starts

#### 8b. Stripe Configured
- Valid Stripe credentials
- Expected:
  - Stripe customer created
  - Stripe subscription created
  - Webhook events handled

---

### 9. Email Verification Flow

#### 9a. Verification Email Sent
- Complete signup
- Expected:
  - Email sent to admin email
  - Contains verification link
  - Token is secure (UUID v4)

#### 9b. Click Verification Link
- Click link in email
- Expected:
  - Email marked as verified
  - User can access all features
  - Redirect to dashboard

#### 9c. Expired Token
- Token older than 24 hours
- Expected:
  - "Token expired" message
  - Option to resend verification email

---

### 10. Multi-Browser/Device Testing

**Test on:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**Verify:**
- Form renders correctly
- Validation messages visible
- Buttons clickable
- No layout issues
- Touch interactions work (mobile)

---

### 11. Performance Testing

#### 11a. Signup Speed
- Expected: < 3 seconds for complete flow
- Measure: Time from submit to redirect

#### 11b. Concurrent Signups
- 10 users signup simultaneously
- Expected: All succeed without errors

---

### 12. Accessibility Testing

#### 12a. Keyboard Navigation
- Tab through all form fields
- Expected: Logical tab order, visible focus indicators

#### 12b. Screen Reader
- Test with VoiceOver/NVDA
- Expected: All labels readable, errors announced

#### 12c. Color Contrast
- Check with accessibility tools
- Expected: WCAG AA compliance

---

## Edge Cases

### E1. Organization Name Edge Cases
- Empty string → "Organization name required"
- Single character → Allowed
- 255 characters → Allowed
- 256 characters → "Name too long"
- Unicode characters → Allowed
- Emoji → Allowed

### E2. Phone Number Formats
- "(512) 555-1234" → Normalized
- "512-555-1234" → Normalized
- "5125551234" → Normalized
- "512.555.1234" → Normalized

### E3. State Code Validation
- "TX" → Valid
- "tx" → Auto-uppercase to "TX"
- "ZZ" → "Invalid state code"
- "" → "State required"

---

## Test Data

### Valid Test Organizations

```json
{
  "organizationName": "Sunrise Home Health",
  "stateCode": "TX",
  "organizationPhone": "512-555-1000",
  "adminFirstName": "Sarah",
  "adminLastName": "Johnson",
  "adminEmail": "sarah.johnson@sunrisehh.test",
  "adminPhone": "512-555-1001",
  "password": "TestPassword123!"
}
```

```json
{
  "organizationName": "Coastal Care Services",
  "stateCode": "FL",
  "organizationPhone": "305-555-2000",
  "adminFirstName": "Michael",
  "adminLastName": "Rodriguez",
  "adminEmail": "michael.r@coastalcare.test",
  "adminPhone": "305-555-2001",
  "password": "SecurePass456!"
}
```

---

## Automated Test Implementation

**Recommended:** Playwright E2E tests

```typescript
// Example test structure
describe('Signup Flow', () => {
  test('should complete signup successfully', async ({ page }) => {
    await page.goto('/signup');
    
    // Step 1
    await page.fill('[name="organizationName"]', 'Test Agency');
    await page.selectOption('[name="stateCode"]', 'TX');
    await page.fill('[name="organizationPhone"]', '512-555-1234');
    await page.click('button:has-text("Next")');
    
    // Step 2
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Smith');
    await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('[name="phone"]', '512-555-5678');
    await page.click('button:has-text("Next")');
    
    // Step 3
    const password = 'SecurePassword123!';
    await page.fill('[name="password"]', password);
    await page.fill('[name="confirmPassword"]', password);
    await page.click('button:has-text("Complete Signup")');
    
    // Verify redirect
    await page.waitForURL('/onboarding');
    
    // Verify success
    expect(await page.textContent('h1')).toContain('Welcome');
  });
  
  // Add more tests...
});
```

---

## Manual Testing Checklist

Before launch, manually verify:

- [ ] Can complete full signup flow
- [ ] All validation errors show correctly
- [ ] Auto-login works after signup
- [ ] Email verification link works
- [ ] Trial subscription created
- [ ] Permissions assigned correctly
- [ ] Redirect to onboarding works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Works in all major browsers

---

## Known Issues / Future Improvements

1. **Email verification optional** - Users can skip for now (by design)
2. **Phone validation basic** - Could add more robust formatting
3. **State config incomplete** - Only TX and FL have detailed config
4. **No CAPTCHA** - Consider adding to prevent abuse
5. **No password strength meter** - Could improve UX

---

## Related Documentation

- Signup UI: `packages/web/src/app/pages/Signup.tsx`
- Signup Service: `packages/core/src/service/signup-service.ts`
- Onboarding Service: `packages/core/src/service/onboarding-service.ts`
- Auth Routes: `packages/app/src/routes/auth.ts`
- Issue: #508 (Signup Flow End-to-End Testing Needed)

