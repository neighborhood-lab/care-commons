# Feature Flags System

Comprehensive feature flag system for Care Commons using OpenFeature.

## Overview

The Care Commons feature flag system provides a powerful, flexible way to control feature rollouts, A/B testing, and gradual deployments across the platform. Built on OpenFeature (CNCF standard), it supports:

- ✅ **Boolean, string, number, and JSON flags**
- ✅ **Advanced targeting rules** (user, org, role, state-based)
- ✅ **Gradual rollouts** with percentage-based distribution
- ✅ **Multi-platform support** (API server, React web, React Native mobile)
- ✅ **Configuration as code** (Git-tracked JSON)
- ✅ **No external services required** (self-hosted, in-memory provider)
- ✅ **Admin UI** for flag management
- ✅ **Type-safe** with TypeScript

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Configuration Layer                      │
│         config/feature-flags.json (Git-tracked)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Core Feature Flag Service                  │
│         packages/core/src/feature-flags/                     │
│  • Service (evaluation, management)                          │
│  • Provider (OpenFeature-compatible)                         │
│  • Types (TypeScript definitions)                            │
└──────────┬───────────────────────────────┬──────────────────┘
           │                               │
┌──────────▼─────────────┐    ┌───────────▼──────────────────┐
│   Backend (Express)    │    │   Frontend (React/RN)        │
│  • Middleware          │    │  • Provider Component        │
│  • API Routes          │    │  • Hooks (useFeatureFlag)    │
│  • Request Context     │    │  • Components (<FeatureFlag>)│
└────────────────────────┘    └──────────────────────────────┘
```

### Technology Stack

- **[OpenFeature](https://openfeature.dev/)**: CNCF vendor-neutral feature flag standard
- **Node.js/Express**: Server-side evaluation and API
- **React/React Native**: Client-side evaluation and UI
- **TypeScript**: Type-safe flag definitions
- **JSON**: Configuration storage (Git-tracked)

## Quick Start

### 1. Backend Usage (Express API)

```typescript
import { featureFlagMiddleware, RequestWithFeatureFlags } from '@care-commons/core/feature-flags';

// Add middleware
app.use(featureFlagMiddleware);

// Use in route handlers
app.get('/api/endpoint', async (req: RequestWithFeatureFlags, res) => {
  if (await req.featureFlags.isEnabled('new-feature')) {
    // New feature logic
    return res.json({ version: 'v2' });
  }

  // Old feature logic
  return res.json({ version: 'v1' });
});
```

### 2. Frontend Usage (React)

```tsx
import { useFeatureFlag, FeatureFlag } from '@/core/providers/FeatureFlagProvider';

function MyComponent() {
  const isNewDashboard = useFeatureFlag('new-dashboard-layout');

  if (isNewDashboard) {
    return <NewDashboard />;
  }

  return <OldDashboard />;
}

// Or use the component
function AnotherComponent() {
  return (
    <FeatureFlag flag="new-dashboard-layout" fallback={<OldDashboard />}>
      <NewDashboard />
    </FeatureFlag>
  );
}
```

### 3. Mobile Usage (React Native)

Same as React web - hooks and components work identically:

```tsx
import { useFeatureFlag } from '@/core/providers/FeatureFlagProvider';

function MobileScreen() {
  const isBiometricEnabled = useFeatureFlag('biometric-auth-enabled');

  return (
    <View>
      {isBiometricEnabled && <BiometricLogin />}
    </View>
  );
}
```

## Configuration

### Flag Definition

Flags are defined in `config/feature-flags.json`:

```json
{
  "version": "1.0.0",
  "environment": "development",
  "flags": [
    {
      "key": "new-feature",
      "name": "New Feature",
      "description": "Enable the new feature",
      "type": "boolean",
      "defaultValue": false,
      "enabled": true,
      "tags": ["features", "experimental"],
      "owner": "Product Team",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Flag Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `key` | string | ✅ | Unique flag identifier (kebab-case) |
| `name` | string | ✅ | Human-readable name |
| `description` | string | ✅ | Detailed description |
| `type` | `'boolean' \| 'string' \| 'number' \| 'json'` | ✅ | Value type |
| `defaultValue` | `boolean \| string \| number \| object` | ✅ | Default value |
| `enabled` | boolean | ✅ | Master switch |
| `targetingRules` | array | ❌ | Targeting rules (see below) |
| `rollout` | object | ❌ | Gradual rollout config |
| `tags` | string[] | ❌ | Tags for organization |
| `owner` | string | ❌ | Team/person responsible |
| `temporary` | boolean | ❌ | Flag for temporary features |
| `removalDate` | string | ❌ | Planned removal date |

## Advanced Features

### Targeting Rules

Target specific users, organizations, or contexts:

```json
{
  "key": "premium-features",
  "targetingRules": [
    {
      "id": "premium-orgs",
      "description": "Enable for premium organizations",
      "conditions": [
        {
          "attribute": "organizationId",
          "operator": "in",
          "value": ["org_123", "org_456"]
        }
      ],
      "value": true
    }
  ]
}
```

#### Supported Operators

- **Equality**: `equals`, `not_equals`
- **Set Membership**: `in`, `not_in`
- **String Matching**: `contains`, `not_contains`, `starts_with`, `ends_with`, `matches_regex`
- **Numeric**: `greater_than`, `less_than`
- **Versioning**: `semver_greater_than`, `semver_less_than`

### Gradual Rollouts

Roll out features to a percentage of users:

```json
{
  "key": "new-ui",
  "rollout": {
    "enabled": true,
    "percentage": 25,
    "attribute": "userId"
  }
}
```

Uses consistent hashing - same user always gets same experience.

### State-Specific Features

Enable features for specific states (compliance):

```json
{
  "key": "evv-texas-enabled",
  "targetingRules": [
    {
      "id": "texas-orgs",
      "conditions": [
        { "attribute": "stateCode", "operator": "equals", "value": "TX" }
      ],
      "value": true
    }
  ]
}
```

## API Endpoints

### Get All Flags (Admin)

```http
GET /api/feature-flags
```

**Response:**
```json
{
  "flags": [...],
  "metadata": {
    "version": "1.0.0",
    "environment": "development",
    "lastUpdated": "2025-01-01T00:00:00Z",
    "flagCount": 35
  }
}
```

### Get Flag Values for Current Context

```http
GET /api/feature-flags/values
```

**Response:**
```json
{
  "values": {
    "new-feature": true,
    "dark-mode-enabled": false,
    ...
  },
  "context": {
    "userId": "user_123",
    "organizationId": "org_456",
    "role": "ADMIN"
  }
}
```

### Toggle Flag

```http
POST /api/feature-flags/:key/toggle
```

### Update Flag

```http
PUT /api/feature-flags/:key
Content-Type: application/json

{
  "enabled": true,
  "defaultValue": true,
  "rollout": {
    "enabled": true,
    "percentage": 50
  }
}
```

### Reload Configuration

```http
POST /api/feature-flags/reload
```

Reloads `config/feature-flags.json` without server restart.

## Best Practices

### 1. Flag Naming

- Use **kebab-case**: `new-dashboard-layout`
- Be **descriptive**: `evv-geofencing-enabled` not `geo`
- Include **domain**: `mobile-offline-sync` not `sync`

### 2. Temporary Flags

Mark flags for temporary features:

```json
{
  "temporary": true,
  "removalDate": "2025-06-01"
}
```

Review and remove after rollout is complete.

### 3. Documentation

- **Always** add clear descriptions
- Specify **owner** (team/person)
- Link to **issue/PR**: `"issueLink": "https://github.com/..."`
- Use **tags** for organization

### 4. Targeting Context

Provide rich context for evaluation:

```typescript
const context = {
  userId: user.id,
  organizationId: user.organizationId,
  role: user.role,
  stateCode: org.state,
  platform: 'web',
  appVersion: '1.2.3'
};

const enabled = await service.isFlagEnabled('new-feature', context);
```

### 5. Gradual Rollouts

Start small, monitor, increase:

```
Day 1:  5% rollout → Monitor metrics
Day 2: 10% rollout → Check for errors
Day 3: 25% rollout → Validate performance
Day 5: 50% rollout → Review feedback
Day 7: 100% rollout → Full deployment
```

### 6. Testing

Test both branches:

```typescript
// Test feature enabled
it('should show new feature when flag enabled', () => {
  mockFeatureFlag('new-feature', true);
  render(<Component />);
  expect(screen.getByText('New Feature')).toBeInTheDocument();
});

// Test feature disabled
it('should show old feature when flag disabled', () => {
  mockFeatureFlag('new-feature', false);
  render(<Component />);
  expect(screen.getByText('Old Feature')).toBeInTheDocument();
});
```

## Admin UI

Access the feature flag management UI:

```
http://localhost:3000/feature-flags
```

Features:
- 📊 View all flags with status
- 🔄 Toggle flags on/off
- 🏷️ Filter by tags
- 🔍 Search flags
- ⚡ Reload configuration
- 📅 View rollout status

## Environment-Specific Configuration

Create environment-specific configs:

```
config/
  feature-flags.json          # Development
  feature-flags.staging.json  # Staging
  feature-flags.production.json # Production
```

Set `NODE_ENV` to determine which config to load.

## Migration Guide

### From Hard-Coded Conditionals

**Before:**
```typescript
if (process.env.ENABLE_NEW_FEATURE === 'true') {
  // New feature
}
```

**After:**
```typescript
if (await req.featureFlags.isEnabled('new-feature')) {
  // New feature
}
```

### From External Services (LaunchDarkly, etc.)

1. Export flag configurations
2. Convert to `config/feature-flags.json` format
3. Replace SDK calls with OpenFeature hooks
4. Test thoroughly
5. Deploy

## Troubleshooting

### Flag Not Found

**Error:** `Flag 'my-flag' not found`

**Solution:**
1. Check flag exists in `config/feature-flags.json`
2. Run `/api/feature-flags/reload` to reload config
3. Verify flag key matches exactly

### Flag Always Returns Default

**Possible Causes:**
1. Flag `enabled: false` - Check master switch
2. Targeting rules don't match - Review conditions
3. Rollout percentage excludes user - Check hash distribution

### Type Mismatch

**Error:** `Flag 'my-flag' is type 'string', expected 'boolean'`

**Solution:** Use correct evaluation method:
- `isFlagEnabled()` for boolean
- `getStringFlag()` for string
- `getNumberFlag()` for number
- `getObjectFlag()` for JSON

## Performance

- **Evaluation speed**: < 1ms (in-memory)
- **Memory footprint**: ~1MB for 1000 flags
- **Consistent hashing**: O(1) rollout determination
- **No network calls**: All evaluation local

## Security

- **No sensitive data in flags**: Flags are not encrypted
- **Admin endpoints**: Should be protected with authentication
- **Audit logging**: Consider implementing for compliance
- **Git tracking**: All changes version controlled

## Current Flags

### Authentication & Security
- `google-oauth-enabled`: Google OAuth login
- `password-auth-enabled`: Password authentication
- `biometric-auth-enabled`: Biometric auth (mobile)
- `mfa-enabled`: Multi-factor authentication

### Compliance & EVV
- `evv-enabled`: EVV system master switch
- `evv-texas-enabled`: Texas EVV compliance
- `evv-florida-enabled`: Florida EVV compliance
- `evv-ohio-enabled`: Ohio EVV compliance
- `evv-geofencing-enabled`: GPS geofencing
- `evv-offline-mode`: Offline EVV capture

### Major Features
- `scheduling-visits-enabled`: Visit scheduling
- `shift-matching-enabled`: Caregiver matching
- `care-plans-enabled`: Care plan management
- `billing-invoicing-enabled`: Billing system
- `payroll-processing-enabled`: Payroll
- `analytics-dashboard-enabled`: Analytics (disabled)
- `family-engagement-enabled`: Family portal (50% rollout)

### Mobile Features
- `mobile-offline-sync`: Offline data sync
- `mobile-gps-tracking`: GPS tracking
- `mobile-camera-enabled`: Camera access
- `mobile-background-location`: Background location (admin only)

### UI/UX
- `new-dashboard-layout`: New UI (10% rollout)
- `dark-mode-enabled`: Dark theme (disabled)
- `advanced-filters`: Advanced filtering

### Performance
- `query-caching-enabled`: Query caching (30% rollout)
- `lazy-loading-enabled`: Lazy loading

### Experimental
- `ai-scheduling-assistant`: AI scheduler (disabled)
- `predictive-matching`: ML matching (beta orgs only)

## Future Enhancements

- [ ] **Experiments/A/B Testing**: Track metrics, statistical analysis
- [ ] **Scheduled Rollouts**: Auto-increase percentage over time
- [ ] **User Segments**: Reusable targeting segments
- [ ] **Flag Dependencies**: Require other flags to be enabled
- [ ] **Webhook Notifications**: Alert on flag changes
- [ ] **Web UI for Editing**: Create/edit flags via UI (currently read-only)
- [ ] **Audit Trail**: Track all flag changes with user attribution
- [ ] **Flag Analytics**: Usage metrics, evaluation counts
- [ ] **Multi-Environment Sync**: Promote flags across environments

## Resources

- [OpenFeature Specification](https://openfeature.dev/specification/)
- [Feature Flag Best Practices](https://martinfowler.com/articles/feature-toggles.html)
- [Care Commons Architecture Docs](./ARCHITECTURE.md)

## Support

For questions or issues:
1. Check this documentation
2. Review flag configuration in `config/feature-flags.json`
3. Test with Admin UI at `/feature-flags`
4. File an issue on GitHub
