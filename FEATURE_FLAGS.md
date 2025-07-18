# Feature Flags Documentation

This document explains how to configure feature flags to enable or disable specific features in the Load Calculator application.

## Overview

Feature flags allow you to control which features are available in the application without changing the core code. This is useful for:

- **Gradual rollouts**: Enable features for specific users or environments
- **A/B testing**: Test different feature configurations
- **Maintenance**: Temporarily disable features during updates
- **Development**: Enable/disable features under development

## Configuration

Feature flags are configured in `/src/config/featureFlags.ts`.

### Available Features

#### CRM System
Controls the Customer Relationship Management system including customer management, project pipeline, and task tracking.

```typescript
crm: {
  enabled: boolean;  // Default: false
}
```

**When enabled:**
- CRM tab appears in the main navigation
- CRM context provider is loaded
- All CRM functionality is available

**When disabled:**
- CRM tab is hidden and marked as "Coming Soon"
- CRM context provider is not loaded (saves memory)
- CRM-related API calls are not made

#### Aerial View Features
Controls advanced features within the Site Analysis tab.

```typescript
aerialView: {
  inspection: boolean;    // Default: false
  compliance: boolean;    // Default: false
}
```

## How to Enable/Disable Features

### 1. Enable CRM System

Edit `/src/config/featureFlags.ts`:

```typescript
export const defaultFeatureFlags: FeatureFlags = {
  aerialView: {
    inspection: false,
    compliance: false,
  },
  crm: {
    enabled: true,  // ← Change this to true
  },
};
```

### 2. Enable Aerial View Features

```typescript
export const defaultFeatureFlags: FeatureFlags = {
  aerialView: {
    inspection: true,   // ← Enable inspection features
    compliance: true,   // ← Enable compliance features
  },
  crm: {
    enabled: false,
  },
};
```

## Implementation Details

### Tab Visibility

Features are automatically hidden/shown in the main navigation based on their feature flag status:

- **Enabled features**: Appear as normal tabs
- **Disabled features**: Hidden from navigation or marked as "Coming Soon"

### Context Providers

The `UnifiedAppContext` conditionally loads context providers based on feature flags:

- **CRM Context**: Only loaded when `crm.enabled = true`
- **Other contexts**: Always loaded (core functionality)

### Safe Hooks

When features are disabled, their context hooks are not available. Use safe hooks when needed:

```typescript
// Standard hook (throws error if CRM disabled)
const crm = useCRM();

// Safe hook (returns null if CRM disabled)
const crm = useCRMSafe();
if (crm) {
  // CRM is enabled, use it
}
```

### Build Optimization

Disabled features may still be included in the build bundle due to dynamic imports and lazy loading. For true tree-shaking, additional build configuration would be needed.

## Environment-Specific Configuration

For different environments, you can extend the feature flag system:

### Option 1: Environment Variables

```typescript
export const defaultFeatureFlags: FeatureFlags = {
  crm: {
    enabled: process.env.VITE_CRM_ENABLED === 'true',
  },
};
```

### Option 2: Build-time Configuration

```typescript
export const defaultFeatureFlags: FeatureFlags = {
  crm: {
    enabled: import.meta.env.MODE === 'production',
  },
};
```

### Option 3: Remote Configuration

```typescript
export const useFeatureFlags = (): FeatureFlags => {
  // Fetch from remote API or local storage
  // Fall back to defaultFeatureFlags
};
```

## Testing Feature Flags

### Local Development

1. Edit `/src/config/featureFlags.ts`
2. Save the file
3. Hot reload will update the application
4. Navigate to see enabled/disabled features

### Production Deployment

1. Update feature flags
2. Build the application: `npm run build`
3. Deploy the updated build

## Troubleshooting

### Feature Not Appearing

1. Check feature flag is set to `true`
2. Clear browser cache and reload
3. Check browser console for errors
4. Verify build completed successfully

### Context Errors

If you see errors like "must be used within a Provider":

1. Check if the feature is enabled
2. Use safe hooks (`useCRMSafe`) instead of standard hooks
3. Verify the context provider is loaded in `UnifiedAppContext`

### Build Errors

If the build fails after changing feature flags:

1. Run `npm run typecheck` to check for TypeScript errors
2. Ensure all imports are still valid
3. Check that disabled features don't have required dependencies

## Best Practices

1. **Default to disabled**: New features should be disabled by default
2. **Document changes**: Update this file when adding new feature flags
3. **Test both states**: Test with features enabled and disabled
4. **Gradual rollout**: Enable features incrementally in production
5. **Monitor performance**: Check that disabled features don't impact performance