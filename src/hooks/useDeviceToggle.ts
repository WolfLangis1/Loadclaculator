import { useState, useEffect, useCallback } from 'react';
import { createComponentLogger } from '../services/loggingService';
import type { DeviceMode, Orientation, DevicePreset, DeviceToggleState } from '../types/device';

const DEVICE_PRESETS: Record<DeviceMode, DevicePreset[]> = {
  desktop: [
    {
      name: 'Desktop 1920x1080',
      width: 1920,
      height: 1080,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      touchEnabled: false
    },
    {
      name: 'Desktop 1366x768',
      width: 1366,
      height: 768,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      touchEnabled: false
    }
  ],
  tablet: [
    {
      name: 'iPad Pro 12.9"',
      width: 1024,
      height: 1366,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      touchEnabled: true
    },
    {
      name: 'iPad Air',
      width: 820,
      height: 1180,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      touchEnabled: true
    }
  ],
  mobile: [
    {
      name: 'iPhone 15 Pro',
      width: 393,
      height: 852,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      touchEnabled: true
    },
    {
      name: 'Samsung Galaxy S24',
      width: 384,
      height: 854,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36',
      touchEnabled: true
    }
  ]
};

export const useDeviceToggle = () => {
  const logger = createComponentLogger('DeviceToggle');
  const isDevelopment = process.env.NODE_ENV === 'development';

  const [state, setState] = useState<DeviceToggleState>(() => {
    if (!isDevelopment) {
      return {
        isEnabled: false,
        deviceMode: 'desktop',
        presetIndex: 0,
        orientation: 'landscape',
        customDimensions: { width: 1920, height: 1080 },
        isCustomMode: false
      };
    }

    try {
      const saved = localStorage.getItem('dev-device-toggle');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      logger.warn('Failed to restore device toggle state', error as Error);
    }

    return {
      isEnabled: false,
      deviceMode: 'desktop',
      presetIndex: 0,
      orientation: 'landscape',
      customDimensions: { width: 1920, height: 1080 },
      isCustomMode: false
    };
  });

  useEffect(() => {
    if (!isDevelopment) return;
    
    try {
      localStorage.setItem('dev-device-toggle', JSON.stringify(state));
    } catch (error) {
      logger.warn('Failed to save device toggle state', error as Error);
    }
  }, [state, isDevelopment, logger]);

  const currentPreset = DEVICE_PRESETS[state.deviceMode][state.presetIndex];

  const effectiveDimensions = useCallback(() => {
    if (state.isCustomMode) {
      return state.orientation === 'portrait' 
        ? { width: Math.min(state.customDimensions.width, state.customDimensions.height), 
            height: Math.max(state.customDimensions.width, state.customDimensions.height) }
        : state.customDimensions;
    }

    if (!currentPreset) return { width: 1920, height: 1080 };

    return state.orientation === 'portrait'
      ? { width: Math.min(currentPreset.width, currentPreset.height), 
          height: Math.max(currentPreset.width, currentPreset.height) }
      : { width: currentPreset.width, height: currentPreset.height };
  }, [state, currentPreset]);

  useEffect(() => {
    if (!isDevelopment || !state.isEnabled) {
      document.documentElement.style.removeProperty('--dev-viewport-width');
      document.documentElement.style.removeProperty('--dev-viewport-height');
      document.documentElement.classList.remove('dev-device-override');
      return;
    }

    const dimensions = effectiveDimensions();
    document.documentElement.style.setProperty('--dev-viewport-width', `${dimensions.width}px`);
    document.documentElement.style.setProperty('--dev-viewport-height', `${dimensions.height}px`);
    document.documentElement.classList.add('dev-device-override');

    logger.info('Device override applied', {
      deviceMode: state.deviceMode,
      preset: currentPreset?.name,
      dimensions,
      orientation: state.orientation
    });

    return () => {
      document.documentElement.style.removeProperty('--dev-viewport-width');
      document.documentElement.style.removeProperty('--dev-viewport-height');
      document.documentElement.classList.remove('dev-device-override');
    };
  }, [isDevelopment, state.isEnabled, effectiveDimensions, state.deviceMode, state.orientation, currentPreset, logger]);

  const toggleDeviceMode = useCallback(() => {
    if (!isDevelopment) return;

    setState(prev => ({
      ...prev,
      isEnabled: !prev.isEnabled
    }));
  }, [isDevelopment]);

  const setDeviceMode = useCallback((mode: DeviceMode) => {
    if (!isDevelopment) return;

    setState(prev => ({
      ...prev,
      deviceMode: mode,
      presetIndex: 0,
      isCustomMode: false
    }));
  }, [isDevelopment]);

  const setPreset = useCallback((index: number) => {
    if (!isDevelopment) return;

    const maxIndex = DEVICE_PRESETS[state.deviceMode].length - 1;
    const clampedIndex = Math.max(0, Math.min(index, maxIndex));

    setState(prev => ({
      ...prev,
      presetIndex: clampedIndex,
      isCustomMode: false
    }));
  }, [isDevelopment, state.deviceMode]);

  const toggleOrientation = useCallback(() => {
    if (!isDevelopment) return;

    setState(prev => ({
      ...prev,
      orientation: prev.orientation === 'portrait' ? 'landscape' : 'portrait'
    }));
  }, [isDevelopment]);

  const setCustomDimensions = useCallback((width: number, height: number) => {
    if (!isDevelopment) return;

    setState(prev => ({
      ...prev,
      customDimensions: { width, height },
      isCustomMode: true
    }));
  }, [isDevelopment]);

  const getBreakpointInfo = useCallback(() => {
    const dimensions = effectiveDimensions();
    const width = dimensions.width;

    if (width >= 1280) return { breakpoint: 'xl', isMobile: false, isTablet: false };
    if (width >= 1024) return { breakpoint: 'lg', isMobile: false, isTablet: false };
    if (width >= 768) return { breakpoint: 'md', isMobile: false, isTablet: true };
    if (width >= 640) return { breakpoint: 'sm', isMobile: true, isTablet: false };
    return { breakpoint: 'xs', isMobile: true, isTablet: false };
  }, [effectiveDimensions]);

  if (!isDevelopment) {
    return {
      isDevelopment: false,
      isEnabled: false,
      deviceMode: 'desktop',
      orientation: 'landscape',
      dimensions: { width: window.innerWidth, height: window.innerHeight },
      presets: [],
      currentPreset: null,
      breakpointInfo: { breakpoint: 'xl', isMobile: false, isTablet: false },
      actions: {
        toggle: () => {},
        setDeviceMode: () => {},
        setPreset: () => {},
        toggleOrientation: () => {},
        setCustomDimensions: () => {}
      }
    };
  }

  return {
    isDevelopment: true,
    isEnabled: state.isEnabled,
    deviceMode: state.deviceMode,
    orientation: state.orientation,
    dimensions: effectiveDimensions(),
    presets: DEVICE_PRESETS[state.deviceMode],
    currentPreset,
    currentPresetIndex: state.presetIndex,
    isCustomMode: state.isCustomMode,
    customDimensions: state.customDimensions,
    breakpointInfo: getBreakpointInfo(),
    actions: {
      toggle: toggleDeviceMode,
      setDeviceMode,
      setPreset,
      toggleOrientation,
      setCustomDimensions
    }
  };
};