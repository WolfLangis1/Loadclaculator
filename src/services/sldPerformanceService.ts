/**
 * SLD Performance Optimization Service
 * 
 * Canvas virtualization, WebGL rendering, and performance monitoring for large diagrams
 */

import { createComponentLogger } from './loggingService';
import type { SLDComponent, SLDConnection } from '../types/sld';

interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RenderChunk {
  id: string;
  bounds: ViewportBounds;
  components: SLDComponent[];
  connections: SLDConnection[];
  lastRenderTime: number;
  dirty: boolean;
}

interface PerformanceMetrics {
  frameRate: number;
  renderTime: number;
  componentCount: number;
  visibleComponents: number;
  memoryUsage: number;
  gpuMemoryUsage?: number;
}

interface LODLevel {
  level: number;
  scale: number;
  renderMode: 'full' | 'simplified' | 'symbol_only' | 'bbox_only';
  textVisible: boolean;
  detailsVisible: boolean;
}

export class SLDPerformanceService {
  private static logger = createComponentLogger('SLDPerformanceService');
  private static canvas?: HTMLCanvasElement;
  private static context?: CanvasRenderingContext2D;
  private static webglContext?: WebGLRenderingContext;
  private static offscreenCanvas?: OffscreenCanvas;
  
  // Virtualization settings
  private static readonly CHUNK_SIZE = 1000; // Pixels per chunk
  private static readonly MAX_VISIBLE_COMPONENTS = 500;
  private static readonly LOD_THRESHOLDS = [0.1, 0.25, 0.5, 1.0, 2.0];
  
  // Performance monitoring
  private static frameCount = 0;
  private static lastFrameTime = performance.now();
  private static renderTimes: number[] = [];
  private static metrics: PerformanceMetrics = {
    frameRate: 60,
    renderTime: 0,
    componentCount: 0,
    visibleComponents: 0,
    memoryUsage: 0
  };

  // Virtualization state
  private static chunks: Map<string, RenderChunk> = new Map();
  private static visibleChunks: Set<string> = new Set();
  private static currentViewport: ViewportBounds = { x: 0, y: 0, width: 1920, height: 1080 };

  /**
   * Initialize performance optimization system
   */
  static initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.context = canvas.getContext('2d') || undefined;
    
    // Try to initialize WebGL context
    try {
      this.webglContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || undefined;
      if (this.webglContext) {
        this.logger.info('WebGL context initialized successfully');
        this.initializeWebGL();
      }
    } catch (error) {
      this.logger.warn('WebGL not available, falling back to 2D canvas', { error });
    }

    // Initialize offscreen canvas for background rendering
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
      this.logger.info('OffscreenCanvas initialized for background rendering');
    }

    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    this.logger.info('SLD Performance Service initialized', { 
      webgl: !!this.webglContext,
      offscreen: !!this.offscreenCanvas 
    });
  }

  /**
   * Initialize WebGL shaders and buffers
   */
  private static initializeWebGL(): void {
    if (!this.webglContext) return;

    const gl = this.webglContext;

    // Vertex shader for electrical symbols
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      uniform mat3 u_transform;
      varying vec2 v_texCoord;
      
      void main() {
        vec3 position = u_transform * vec3(a_position, 1.0);
        gl_Position = vec4(position.xy, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    // Fragment shader for electrical symbols
    const fragmentShaderSource = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec4 u_color;
      varying vec2 v_texCoord;
      
      void main() {
        vec4 texColor = texture2D(u_texture, v_texCoord);
        gl_FragColor = texColor * u_color;
      }
    `;

    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      this.logger.error('Failed to create WebGL shaders');
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      this.logger.error('Failed to create WebGL program');
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      this.logger.error('Failed to link WebGL program', { 
        log: gl.getProgramInfoLog(program) 
      });
      return;
    }

    gl.useProgram(program);
    this.logger.info('WebGL shaders initialized successfully');
  }

  /**
   * Create WebGL shader
   */
  private static createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      this.logger.error('Failed to compile WebGL shader', { 
        log: gl.getShaderInfoLog(shader) 
      });
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Update viewport and recalculate visible chunks
   */
  static updateViewport(viewport: ViewportBounds): void {
    this.currentViewport = viewport;
    this.updateVisibleChunks();
  }

  /**
   * Virtualize components into spatial chunks
   */
  static virtualizeComponents(
    components: SLDComponent[], 
    connections: SLDConnection[]
  ): void {
    this.chunks.clear();

    // Group components by spatial location
    const componentChunks = new Map<string, SLDComponent[]>();
    const connectionChunks = new Map<string, SLDConnection[]>();

    components.forEach(component => {
      const chunkKey = this.getChunkKey(component.position.x, component.position.y);
      
      if (!componentChunks.has(chunkKey)) {
        componentChunks.set(chunkKey, []);
      }
      componentChunks.get(chunkKey)!.push(component);
    });

    connections.forEach(connection => {
      // Add connection to all chunks it intersects
      const chunks = this.getConnectionChunks(connection);
      chunks.forEach(chunkKey => {
        if (!connectionChunks.has(chunkKey)) {
          connectionChunks.set(chunkKey, []);
        }
        connectionChunks.get(chunkKey)!.push(connection);
      });
    });

    // Create render chunks
    const allChunkKeys = new Set([
      ...componentChunks.keys(),
      ...connectionChunks.keys()
    ]);

    allChunkKeys.forEach(chunkKey => {
      const [x, y] = this.parseChunkKey(chunkKey);
      const chunk: RenderChunk = {
        id: chunkKey,
        bounds: {
          x: x * this.CHUNK_SIZE,
          y: y * this.CHUNK_SIZE,
          width: this.CHUNK_SIZE,
          height: this.CHUNK_SIZE
        },
        components: componentChunks.get(chunkKey) || [],
        connections: connectionChunks.get(chunkKey) || [],
        lastRenderTime: 0,
        dirty: true
      };
      
      this.chunks.set(chunkKey, chunk);
    });

    this.updateVisibleChunks();
    
    this.logger.info('Components virtualized', { 
      totalChunks: this.chunks.size,
      visibleChunks: this.visibleChunks.size
    });
  }

  /**
   * Get chunk key for coordinates
   */
  private static getChunkKey(x: number, y: number): string {
    const chunkX = Math.floor(x / this.CHUNK_SIZE);
    const chunkY = Math.floor(y / this.CHUNK_SIZE);
    return `${chunkX},${chunkY}`;
  }

  /**
   * Parse chunk key back to coordinates
   */
  private static parseChunkKey(key: string): [number, number] {
    const [x, y] = key.split(',').map(Number);
    return [x, y];
  }

  /**
   * Get all chunk keys that a connection intersects
   */
  private static getConnectionChunks(connection: SLDConnection): string[] {
    const chunks: string[] = [];
    
    // Simple implementation - would use proper line-grid intersection
    const startChunk = this.getChunkKey(connection.startPoint.x, connection.startPoint.y);
    const endChunk = this.getChunkKey(connection.endPoint.x, connection.endPoint.y);
    
    chunks.push(startChunk);
    if (startChunk !== endChunk) {
      chunks.push(endChunk);
    }

    return chunks;
  }

  /**
   * Update which chunks are visible in current viewport
   */
  private static updateVisibleChunks(): void {
    this.visibleChunks.clear();

    const viewport = this.currentViewport;
    const startChunkX = Math.floor(viewport.x / this.CHUNK_SIZE);
    const endChunkX = Math.ceil((viewport.x + viewport.width) / this.CHUNK_SIZE);
    const startChunkY = Math.floor(viewport.y / this.CHUNK_SIZE);
    const endChunkY = Math.ceil((viewport.y + viewport.height) / this.CHUNK_SIZE);

    for (let x = startChunkX; x <= endChunkX; x++) {
      for (let y = startChunkY; y <= endChunkY; y++) {
        const chunkKey = `${x},${y}`;
        if (this.chunks.has(chunkKey)) {
          this.visibleChunks.add(chunkKey);
        }
      }
    }

    this.logger.debug('Visible chunks updated', { 
      visible: this.visibleChunks.size,
      total: this.chunks.size 
    });
  }

  /**
   * Calculate level of detail based on zoom scale
   */
  static calculateLOD(scale: number): LODLevel {
    let level = 0;
    for (let i = 0; i < this.LOD_THRESHOLDS.length; i++) {
      if (scale >= this.LOD_THRESHOLDS[i]) {
        level = i;
      }
    }

    const lodLevels: LODLevel[] = [
      { level: 0, scale: 0.1, renderMode: 'bbox_only', textVisible: false, detailsVisible: false },
      { level: 1, scale: 0.25, renderMode: 'symbol_only', textVisible: false, detailsVisible: false },
      { level: 2, scale: 0.5, renderMode: 'simplified', textVisible: false, detailsVisible: false },
      { level: 3, scale: 1.0, renderMode: 'full', textVisible: true, detailsVisible: false },
      { level: 4, scale: 2.0, renderMode: 'full', textVisible: true, detailsVisible: true }
    ];

    return lodLevels[level];
  }

  /**
   * Render visible chunks with LOD optimization
   */
  static renderOptimized(scale: number, deltaTime: number): void {
    if (!this.context) return;

    const startTime = performance.now();
    const lod = this.calculateLOD(scale);
    let renderedComponents = 0;

    // Clear canvas
    this.context.clearRect(0, 0, this.canvas!.width, this.canvas!.height);

    // Render only visible chunks
    for (const chunkKey of this.visibleChunks) {
      const chunk = this.chunks.get(chunkKey);
      if (!chunk) continue;

      // Skip if chunk was recently rendered and not dirty
      if (!chunk.dirty && (startTime - chunk.lastRenderTime) < 16) { // 60fps
        continue;
      }

      renderedComponents += this.renderChunk(chunk, lod);
      chunk.lastRenderTime = startTime;
      chunk.dirty = false;
    }

    const renderTime = performance.now() - startTime;
    this.updatePerformanceMetrics(renderTime, renderedComponents);
  }

  /**
   * Render a single chunk based on LOD level
   */
  private static renderChunk(chunk: RenderChunk, lod: LODLevel): number {
    if (!this.context) return 0;

    let renderedCount = 0;
    const ctx = this.context;

    // Render components based on LOD
    chunk.components.forEach(component => {
      switch (lod.renderMode) {
        case 'bbox_only':
          this.renderBoundingBox(ctx, component);
          break;
        case 'symbol_only':
          this.renderSimpleSymbol(ctx, component);
          break;
        case 'simplified':
          this.renderSimplifiedComponent(ctx, component, lod);
          break;
        case 'full':
          this.renderFullComponent(ctx, component, lod);
          break;
      }
      renderedCount++;
    });

    // Render connections
    chunk.connections.forEach(connection => {
      this.renderConnection(ctx, connection, lod);
    });

    return renderedCount;
  }

  /**
   * Render component bounding box only (lowest LOD)
   */
  private static renderBoundingBox(ctx: CanvasRenderingContext2D, component: SLDComponent): void {
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      component.position.x - 10,
      component.position.y - 10,
      20,
      20
    );
  }

  /**
   * Render simple symbol representation
   */
  private static renderSimpleSymbol(ctx: CanvasRenderingContext2D, component: SLDComponent): void {
    ctx.fillStyle = '#333333';
    ctx.fillRect(
      component.position.x - 8,
      component.position.y - 8,
      16,
      16
    );
  }

  /**
   * Render simplified component with basic details
   */
  private static renderSimplifiedComponent(
    ctx: CanvasRenderingContext2D, 
    component: SLDComponent, 
    lod: LODLevel
  ): void {
    // Basic symbol shape
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      component.position.x - 15,
      component.position.y - 15,
      30,
      30
    );

    // Component type indicator
    if (lod.textVisible) {
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        component.type.charAt(0).toUpperCase(),
        component.position.x,
        component.position.y + 4
      );
    }
  }

  /**
   * Render full component with all details
   */
  private static renderFullComponent(
    ctx: CanvasRenderingContext2D, 
    component: SLDComponent, 
    lod: LODLevel
  ): void {
    // This would integrate with the actual symbol rendering system
    // For now, render a detailed placeholder
    ctx.strokeStyle = '#1f2937';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 2;
    
    ctx.fillRect(
      component.position.x - 20,
      component.position.y - 20,
      40,
      40
    );
    ctx.strokeRect(
      component.position.x - 20,
      component.position.y - 20,
      40,
      40
    );

    if (lod.textVisible) {
      ctx.fillStyle = '#1f2937';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        component.label || component.type,
        component.position.x,
        component.position.y + 30
      );
    }

    if (lod.detailsVisible && component.specifications) {
      ctx.font = '8px Arial';
      ctx.fillText(
        `${component.specifications.rating || ''}`,
        component.position.x,
        component.position.y + 42
      );
    }
  }

  /**
   * Render connection line
   */
  private static renderConnection(
    ctx: CanvasRenderingContext2D, 
    connection: SLDConnection, 
    lod: LODLevel
  ): void {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = lod.level >= 3 ? 2 : 1;
    
    ctx.beginPath();
    ctx.moveTo(connection.startPoint.x, connection.startPoint.y);
    ctx.lineTo(connection.endPoint.x, connection.endPoint.y);
    ctx.stroke();

    if (lod.textVisible && connection.label) {
      const midX = (connection.startPoint.x + connection.endPoint.x) / 2;
      const midY = (connection.startPoint.y + connection.endPoint.y) / 2;
      
      ctx.fillStyle = '#374151';
      ctx.font = '9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(connection.label, midX, midY - 5);
    }
  }

  /**
   * Start performance monitoring
   */
  private static startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updateFrameRate();
      this.updateMemoryUsage();
      this.logPerformanceMetrics();
    }, 1000);
  }

  /**
   * Update frame rate calculation
   */
  private static updateFrameRate(): void {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.frameCount++;

    if (deltaTime >= 1000) {
      this.metrics.frameRate = Math.round((this.frameCount * 1000) / deltaTime);
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }

  /**
   * Update memory usage metrics
   */
  private static updateMemoryUsage(): void {
    if (performance.memory) {
      this.metrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
    }

    // WebGL memory usage (if available)
    if (this.webglContext) {
      const ext = this.webglContext.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        // This is an approximation - actual GPU memory tracking is limited
        this.metrics.gpuMemoryUsage = this.chunks.size * 0.1; // MB estimate
      }
    }
  }

  /**
   * Update performance metrics
   */
  private static updatePerformanceMetrics(renderTime: number, componentCount: number): void {
    this.metrics.renderTime = renderTime;
    this.metrics.componentCount = this.chunks.size * 10; // Estimate
    this.metrics.visibleComponents = componentCount;

    // Keep history of render times for averaging
    this.renderTimes.push(renderTime);
    if (this.renderTimes.length > 60) {
      this.renderTimes.shift();
    }
  }

  /**
   * Get current performance metrics
   */
  static getPerformanceMetrics(): PerformanceMetrics & {
    averageRenderTime: number;
    chunksTotal: number;
    chunksVisible: number;
  } {
    const averageRenderTime = this.renderTimes.length > 0 
      ? this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length 
      : 0;

    return {
      ...this.metrics,
      averageRenderTime,
      chunksTotal: this.chunks.size,
      chunksVisible: this.visibleChunks.size
    };
  }

  /**
   * Log performance metrics periodically
   */
  private static logPerformanceMetrics(): void {
    const metrics = this.getPerformanceMetrics();
    
    if (metrics.frameRate < 30 || metrics.renderTime > 16) {
      this.logger.warn('Performance degradation detected', metrics);
    } else {
      this.logger.debug('Performance metrics', metrics);
    }
  }

  /**
   * Optimize chunk rendering order based on importance
   */
  static optimizeRenderOrder(chunks: string[]): string[] {
    return chunks.sort((a, b) => {
      const chunkA = this.chunks.get(a);
      const chunkB = this.chunks.get(b);
      
      if (!chunkA || !chunkB) return 0;

      // Prioritize chunks with more components
      const weightA = chunkA.components.length + chunkA.connections.length;
      const weightB = chunkB.components.length + chunkB.connections.length;
      
      return weightB - weightA;
    });
  }

  /**
   * Preload and cache symbol textures for WebGL
   */
  static async preloadSymbolTextures(symbolUrls: string[]): Promise<void> {
    if (!this.webglContext) return;

    const loadPromises = symbolUrls.map(async (url) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });

        // Create WebGL texture
        const gl = this.webglContext!;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);

        this.logger.debug('Symbol texture loaded', { url });
      } catch (error) {
        this.logger.error('Failed to load symbol texture', { url, error });
      }
    });

    await Promise.all(loadPromises);
    this.logger.info('Symbol textures preloaded', { count: symbolUrls.length });
  }

  /**
   * Clean up resources
   */
  static cleanup(): void {
    this.chunks.clear();
    this.visibleChunks.clear();
    this.renderTimes.length = 0;
    
    this.logger.info('SLD Performance Service cleaned up');
  }
}