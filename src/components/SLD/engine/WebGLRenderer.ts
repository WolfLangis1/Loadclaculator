/**
 * WebGL-based Canvas Renderer for Professional SLD
 * 
 * High-performance rendering engine with viewport culling and smooth transformations
 */

export interface RenderObject {
  id: string;
  type: 'component' | 'connection' | 'label' | 'grid';
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  visible: boolean;
  zIndex: number;
  data: any;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface RenderStats {
  totalObjects: number;
  visibleObjects: number;
  culledObjects: number;
  renderTime: number;
  fps: number;
}

export class WebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private viewport: Viewport;
  private renderObjects: Map<string, RenderObject> = new Map();
  private frameId: number = 0;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fpsHistory: number[] = [];
  private devicePixelRatio: number;
  
  // Shader programs
  private shaderPrograms: Map<string, WebGLProgram> = new Map();
  
  // Buffers
  private vertexBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  
  // Performance monitoring
  private stats: RenderStats = {
    totalObjects: 0,
    visibleObjects: 0,
    culledObjects: 0,
    renderTime: 0,
    fps: 60
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    
    // Initialize WebGL context
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      depth: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });
    
    if (!gl) {
      throw new Error('WebGL2 not supported');
    }
    
    this.gl = gl;
    this.viewport = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      zoom: 1
    };
    
    this.initializeWebGL();
    this.setupEventListeners();
  }

  private initializeWebGL(): void {
    const gl = this.gl;
    
    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    // Set clear color
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    
    // Initialize shaders
    this.initializeShaders();
    
    // Initialize buffers
    this.initializeBuffers();
  }

  private initializeShaders(): void {
    // Basic vertex shader for 2D rendering
    const vertexShaderSource = `#version 300 es
      precision highp float;
      
      in vec2 a_position;
      in vec2 a_texCoord;
      in vec4 a_color;
      
      uniform mat3 u_transform;
      uniform vec2 u_resolution;
      
      out vec2 v_texCoord;
      out vec4 v_color;
      
      void main() {
        vec3 position = u_transform * vec3(a_position, 1.0);
        
        // Convert to clip space
        vec2 clipSpace = ((position.xy / u_resolution) * 2.0) - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        
        v_texCoord = a_texCoord;
        v_color = a_color;
      }
    `;
    
    // Basic fragment shader
    const fragmentShaderSource = `#version 300 es
      precision highp float;
      
      in vec2 v_texCoord;
      in vec4 v_color;
      
      uniform sampler2D u_texture;
      uniform bool u_useTexture;
      
      out vec4 fragColor;
      
      void main() {
        if (u_useTexture) {
          fragColor = texture(u_texture, v_texCoord) * v_color;
        } else {
          fragColor = v_color;
        }
      }
    `;
    
    const program = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    if (program) {
      this.shaderPrograms.set('basic', program);
    }
  }

  private createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    const gl = this.gl;
    
    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
    
    if (!vertexShader || !fragmentShader) {
      return null;
    }
    
    const program = gl.createProgram();
    if (!program) {
      return null;
    }
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader program linking failed:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    const shader = gl.createShader(type);
    
    if (!shader) {
      return null;
    }
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }

  private initializeBuffers(): void {
    const gl = this.gl;
    
    // Create vertex buffer
    this.vertexBuffer = gl.createBuffer();
    
    // Create index buffer
    this.indexBuffer = gl.createBuffer();
  }

  private setupEventListeners(): void {
    // Handle canvas resize
    const resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    
    resizeObserver.observe(this.canvas);
    
    // Handle device pixel ratio changes
    window.addEventListener('resize', () => {
      this.devicePixelRatio = window.devicePixelRatio || 1;
      this.handleResize();
    });
  }

  private handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width * this.devicePixelRatio;
    const height = rect.height * this.devicePixelRatio;
    
    // Update canvas size
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Update viewport
    this.viewport.width = width;
    this.viewport.height = height;
    
    // Update WebGL viewport
    this.gl.viewport(0, 0, width, height);
    
    // Trigger re-render
    this.render();
  }

  public setViewport(viewport: Partial<Viewport>): void {
    this.viewport = { ...this.viewport, ...viewport };
    this.render();
  }

  public addRenderObject(object: RenderObject): void {
    this.renderObjects.set(object.id, object);
  }

  public removeRenderObject(id: string): void {
    this.renderObjects.delete(id);
  }

  public updateRenderObject(id: string, updates: Partial<RenderObject>): void {
    const existing = this.renderObjects.get(id);
    if (existing) {
      this.renderObjects.set(id, { ...existing, ...updates });
    }
  }

  public clearRenderObjects(): void {
    this.renderObjects.clear();
  }

  private performViewportCulling(): RenderObject[] {
    const visibleObjects: RenderObject[] = [];
    const viewBounds = {
      left: this.viewport.x,
      top: this.viewport.y,
      right: this.viewport.x + this.viewport.width / this.viewport.zoom,
      bottom: this.viewport.y + this.viewport.height / this.viewport.zoom
    };
    
    for (const object of this.renderObjects.values()) {
      const objBounds = object.bounds;
      
      // Check if object intersects with viewport
      const intersects = !(
        objBounds.x + objBounds.width < viewBounds.left ||
        objBounds.x > viewBounds.right ||
        objBounds.y + objBounds.height < viewBounds.top ||
        objBounds.y > viewBounds.bottom
      );
      
      if (intersects && object.visible) {
        visibleObjects.push(object);
      }
    }
    
    // Sort by z-index
    visibleObjects.sort((a, b) => a.zIndex - b.zIndex);
    
    return visibleObjects;
  }

  public render(): void {
    const startTime = performance.now();
    
    const gl = this.gl;
    
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Perform viewport culling
    const visibleObjects = this.performViewportCulling();
    
    // Update stats
    this.stats.totalObjects = this.renderObjects.size;
    this.stats.visibleObjects = visibleObjects.length;
    this.stats.culledObjects = this.renderObjects.size - visibleObjects.length;
    
    // Use basic shader program
    const program = this.shaderPrograms.get('basic');
    if (!program) {
      return;
    }
    
    gl.useProgram(program);
    
    // Set uniforms
    const transformLocation = gl.getUniformLocation(program, 'u_transform');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    
    if (resolutionLocation) {
      gl.uniform2f(resolutionLocation, this.viewport.width, this.viewport.height);
    }
    
    // Create transformation matrix
    const transform = this.createTransformMatrix();
    if (transformLocation) {
      gl.uniformMatrix3fv(transformLocation, false, transform);
    }
    
    // Render visible objects
    for (const object of visibleObjects) {
      this.renderObject(object);
    }
    
    // Update performance stats
    const endTime = performance.now();
    this.stats.renderTime = endTime - startTime;
    this.updateFPS();
  }

  private createTransformMatrix(): Float32Array {
    // Create 2D transformation matrix for zoom and pan
    const zoom = this.viewport.zoom;
    const panX = -this.viewport.x * zoom;
    const panY = -this.viewport.y * zoom;
    
    return new Float32Array([
      zoom, 0, panX,
      0, zoom, panY,
      0, 0, 1
    ]);
  }

  private renderObject(object: RenderObject): void {
    // This is a simplified render method
    // In a full implementation, this would handle different object types
    // with appropriate rendering strategies
    
    switch (object.type) {
      case 'component':
        this.renderComponent(object);
        break;
      case 'connection':
        this.renderConnection(object);
        break;
      case 'label':
        this.renderLabel(object);
        break;
      case 'grid':
        this.renderGrid(object);
        break;
    }
  }

  private renderComponent(object: RenderObject): void {
    // Component rendering implementation
    // This would create appropriate geometry and render it
  }

  private renderConnection(object: RenderObject): void {
    // Connection line rendering implementation
  }

  private renderLabel(object: RenderObject): void {
    // Text label rendering implementation
  }

  private renderGrid(object: RenderObject): void {
    // Grid rendering implementation
  }

  private updateFPS(): void {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    
    if (delta > 0) {
      const fps = 1000 / delta;
      this.fpsHistory.push(fps);
      
      // Keep only last 60 frames for averaging
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }
      
      // Calculate average FPS
      this.stats.fps = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    }
    
    this.lastFrameTime = now;
    this.frameCount++;
  }

  public startRenderLoop(): void {
    const renderFrame = () => {
      this.render();
      this.frameId = requestAnimationFrame(renderFrame);
    };
    
    this.frameId = requestAnimationFrame(renderFrame);
  }

  public stopRenderLoop(): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }
  }

  public getStats(): RenderStats {
    return { ...this.stats };
  }

  public dispose(): void {
    this.stopRenderLoop();
    
    // Clean up WebGL resources
    const gl = this.gl;
    
    if (this.vertexBuffer) {
      gl.deleteBuffer(this.vertexBuffer);
    }
    
    if (this.indexBuffer) {
      gl.deleteBuffer(this.indexBuffer);
    }
    
    for (const program of this.shaderPrograms.values()) {
      gl.deleteProgram(program);
    }
    
    this.shaderPrograms.clear();
    this.renderObjects.clear();
  }
}