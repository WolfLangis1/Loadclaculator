export type DeviceMode = 'desktop' | 'tablet' | 'mobile';
export type Orientation = 'portrait' | 'landscape';

export interface DevicePreset {
  name: string;
  width: number;
  height: number;
  userAgent: string;
  touchEnabled: boolean;
}

export interface DeviceToggleState {
  isEnabled: boolean;
  deviceMode: DeviceMode;
  presetIndex: number;
  orientation: Orientation;
  customDimensions: { width: number; height: number };
  isCustomMode: boolean;
}
