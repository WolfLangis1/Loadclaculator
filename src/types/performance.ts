export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentUpdates: number;
  lastUpdate: Date;
  averageRenderTime: number;
  peakMemoryUsage: number;
}

export interface PerformanceMonitorOptions {
  trackRenders?: boolean;
  trackMemory?: boolean;
  trackUpdates?: boolean;
  sampleInterval?: number;
  alertThreshold?: number;
}

export interface PerformanceMonitorState {
  isInitialized: boolean;
  activeLayerId: string;
  selectedLayers: Set<string>;
  layerVisibility: Map<string, boolean>;
  componentAssignments: Map<string, string>; // componentId -> layerId
}
