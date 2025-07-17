export interface ViewportState {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface VirtualizationConfig {
  chunkSize: number;
  maxVisibleComponents: number;
  enableLOD: boolean;
  enableWebGL: boolean;
  preloadRadius: number; // Chunks to preload around viewport
}

export interface VirtualizationMetrics {
  totalComponents: number;
  visibleComponents: number;
  totalChunks: number;
  visibleChunks: number;
  frameRate: number;
  renderTime: number;
  memoryUsage: number;
}
