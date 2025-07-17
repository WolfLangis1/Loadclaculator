// Feature flags configuration
export interface FeatureFlags {
  aerialView: {
    inspection: boolean;
    compliance: boolean;
  };
}

export const defaultFeatureFlags: FeatureFlags = {
  aerialView: {
    inspection: false,        // Coming soon
    compliance: false,        // Coming soon
  },
};

// Feature flag hook
export const useFeatureFlags = (): FeatureFlags => {
  return defaultFeatureFlags;
};