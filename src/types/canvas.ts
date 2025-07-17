export interface Transform {
  x: number;
  y: number;
  zoom: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface UseCanvasTransformOptions {
  initialTransform?: Transform;
  minZoom?: number;
  maxZoom?: number;
  zoomSensitivity?: number;
  bounds?: Bounds;
  animationDuration?: number;
}

export interface AnimationState {
  isAnimating: boolean;
  startTime: number;
  startTransform: Transform;
  targetTransform: Transform;
  duration: number;
  easing: (t: number) => number;
}

export interface ViewPort {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface InertiaState {
  velocity: Point;
  lastTime: number;
  animationId: number | null;
}

export interface TouchState {
  touches: Touch[];
  lastDistance: number;
  lastCenter: Point;
}