// Feature flags configuration
export interface FeatureFlags {
  aerialView: {
    inspection: boolean;
    compliance: boolean;
  };
  crm: {
    enabled: boolean;
  };
}

export const defaultFeatureFlags: FeatureFlags = {
  aerialView: {
    inspection: false,        // Coming soon
    compliance: false,        // Coming soon
  },
  crm: {
    enabled: false,           // CRM feature disabled by default
  },
};

// Feature flag hook
export const useFeatureFlags = (): FeatureFlags => {
  return defaultFeatureFlags;
};