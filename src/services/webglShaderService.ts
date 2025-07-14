/**
 * WebGL Shader Service for SLD Hardware Acceleration
 * 
 * GPU-accelerated rendering of electrical symbols and connections
 */

import { createComponentLogger } from './loggingService';

interface ShaderProgram {
  program: WebGLProgram;
  attributes: Record<string, number>;
  uniforms: Record<string, WebGLUniformLocation>;
}

interface BufferGeometry {
  vertices: Float32Array;
  indices: Uint16Array;
  textureCoords?: Float32Array;
  normals?: Float32Array;
}

interface RenderBatch {
  geometry: BufferGeometry;
  texture?: WebGLTexture;
  transform: Float32Array; // 3x3 matrix
  color: Float32Array; // RGBA
  count: number;
}

export class WebGLShaderService {
  private static logger = createComponentLogger('WebGLShaderService');
  private static gl?: WebGLRenderingContext;
  private static programs: Map<string, ShaderProgram> = new Map();
  private static textures: Map<string, WebGLTexture> = new Map();
  private static buffers: Map<string, WebGLBuffer> = new Map();

  // Standard shader sources
  private static readonly VERTEX_SHADERS = {
    symbol: `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      
      uniform mat3 u_transform;
      uniform mat3 u_projection;
      
      varying vec2 v_texCoord;
      
      void main() {
        // Apply transform then projection
        vec3 position = u_projection * u_transform * vec3(a_position, 1.0);
        gl_Position = vec4(position.xy, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `,
    
    line: `
      attribute vec2 a_position;
      
      uniform mat3 u_transform;
      uniform mat3 u_projection;
      uniform float u_lineWidth;
      
      void main() {
        vec3 position = u_projection * u_transform * vec3(a_position, 1.0);
        gl_Position = vec4(position.xy, 0.0, 1.0);
        gl_PointSize = u_lineWidth;
      }
    `,
    
    instanced: `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      attribute mat3 a_instanceTransform;
      attribute vec4 a_instanceColor;
      
      uniform mat3 u_projection;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      void main() {
        vec3 position = u_projection * a_instanceTransform * vec3(a_position, 1.0);
        gl_Position = vec4(position.xy, 0.0, 1.0);
        v_texCoord = a_texCoord;
        v_color = a_instanceColor;
      }
    `
  };

  private static readonly FRAGMENT_SHADERS = {
    symbol: `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform vec4 u_color;
      uniform float u_opacity;
      
      varying vec2 v_texCoord;
      
      void main() {
        vec4 texColor = texture2D(u_texture, v_texCoord);
        gl_FragColor = texColor * u_color * u_opacity;
      }
    `,
    
    solidColor: `
      precision mediump float;
      
      uniform vec4 u_color;
      uniform float u_opacity;
      
      void main() {
        gl_FragColor = u_color * u_opacity;
      }
    `,
    
    line: `
      precision mediump float;
      
      uniform vec4 u_color;
      uniform float u_opacity;
      uniform float u_dashPattern;
      
      varying vec2 v_position;
      
      void main() {
        float pattern = mod(v_position.x + v_position.y, u_dashPattern);
        if (u_dashPattern > 0.0 && pattern < u_dashPattern * 0.5) {
          discard;
        }
        gl_FragColor = u_color * u_opacity;
      }
    `,
    
    instanced: `
      precision mediump float;
      
      uniform sampler2D u_texture;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      void main() {
        vec4 texColor = texture2D(u_texture, v_texCoord);
        gl_FragColor = texColor * v_color;
      }
    `
  };

  /**
   * Initialize WebGL shader service
   */
  static initialize(gl: WebGLRenderingContext): boolean {
    this.gl = gl;

    try {
      // Initialize core shader programs
      this.createShaderProgram('symbol', this.VERTEX_SHADERS.symbol, this.FRAGMENT_SHADERS.symbol);
      this.createShaderProgram('line', this.VERTEX_SHADERS.line, this.FRAGMENT_SHADERS.line);
      this.createShaderProgram('solid', this.VERTEX_SHADERS.symbol, this.FRAGMENT_SHADERS.solidColor);
      this.createShaderProgram('instanced', this.VERTEX_SHADERS.instanced, this.FRAGMENT_SHADERS.instanced);

      // Set up default GL state
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);

      this.logger.info('WebGL Shader Service initialized successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize WebGL Shader Service', { error });
      return false;
    }
  }

  /**
   * Create and compile shader program
   */
  private static createShaderProgram(
    name: string, 
    vertexSource: string, 
    fragmentSource: string
  ): ShaderProgram | null {
    if (!this.gl) return null;

    const gl = this.gl;
    
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const program = gl.createProgram();
    if (!program) {
      this.logger.error('Failed to create shader program');
      return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      this.logger.error('Failed to link shader program', { 
        name,
        log: gl.getProgramInfoLog(program) 
      });
      gl.deleteProgram(program);
      return null;
    }

    // Get attribute and uniform locations
    const attributes: Record<string, number> = {};
    const uniforms: Record<string, WebGLUniformLocation> = {};

    const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < numAttributes; i++) {
      const attribute = gl.getActiveAttrib(program, i);
      if (attribute) {
        attributes[attribute.name] = gl.getAttribLocation(program, attribute.name);
      }
    }

    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; i++) {
      const uniform = gl.getActiveUniform(program, i);
      if (uniform) {
        const location = gl.getUniformLocation(program, uniform.name);
        if (location) {
          uniforms[uniform.name] = location;
        }
      }
    }

    const shaderProgram: ShaderProgram = { program, attributes, uniforms };
    this.programs.set(name, shaderProgram);

    this.logger.debug('Shader program created', { 
      name, 
      attributes: Object.keys(attributes),
      uniforms: Object.keys(uniforms)
    });

    return shaderProgram;
  }

  /**
   * Compile individual shader
   */
  private static compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const gl = this.gl;
    const shader = gl.createShader(type);
    
    if (!shader) {
      this.logger.error('Failed to create shader');
      return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      this.logger.error('Failed to compile shader', { 
        type: type === gl.VERTEX_SHADER ? 'vertex' : 'fragment',
        log: gl.getShaderInfoLog(shader) 
      });
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Create texture from image data
   */
  static createTexture(name: string, image: HTMLImageElement | ImageData): WebGLTexture | null {
    if (!this.gl) return null;

    const gl = this.gl;
    const texture = gl.createTexture();
    
    if (!texture) {
      this.logger.error('Failed to create texture');
      return null;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    if (image instanceof HTMLImageElement) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image.data);
    }

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.textures.set(name, texture);
    this.logger.debug('Texture created', { name });

    return texture;
  }

  /**
   * Create buffer with geometry data
   */
  static createBuffer(name: string, data: Float32Array | Uint16Array, type: 'vertex' | 'index'): WebGLBuffer | null {
    if (!this.gl) return null;

    const gl = this.gl;
    const buffer = gl.createBuffer();
    
    if (!buffer) {
      this.logger.error('Failed to create buffer');
      return null;
    }

    const target = type === 'index' ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
    
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    gl.bindBuffer(target, null);

    this.buffers.set(name, buffer);
    this.logger.debug('Buffer created', { name, type, size: data.length });

    return buffer;
  }

  /**
   * Render electrical symbol with WebGL
   */
  static renderSymbol(
    position: { x: number; y: number },
    size: { width: number; height: number },
    rotation: number,
    textureName: string,
    color: [number, number, number, number] = [1, 1, 1, 1],
    opacity: number = 1.0
  ): void {
    if (!this.gl) return;

    const gl = this.gl;
    const program = this.programs.get('symbol');
    const texture = this.textures.get(textureName);

    if (!program || !texture) {
      this.logger.warn('Missing shader program or texture', { textureName });
      return;
    }

    gl.useProgram(program.program);

    // Create transform matrix
    const transform = this.createTransformMatrix(position, size, rotation);
    
    // Set uniforms
    gl.uniformMatrix3fv(program.uniforms['u_transform'], false, transform);
    gl.uniform4fv(program.uniforms['u_color'], color);
    gl.uniform1f(program.uniforms['u_opacity'], opacity);

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(program.uniforms['u_texture'], 0);

    // Create quad geometry for symbol
    const vertices = new Float32Array([
      -0.5, -0.5,  0.0, 0.0,  // bottom-left
       0.5, -0.5,  1.0, 0.0,  // bottom-right
       0.5,  0.5,  1.0, 1.0,  // top-right
      -0.5,  0.5,  0.0, 1.0   // top-left
    ]);

    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    // Create temporary buffers (would optimize with buffer pooling)
    const vertexBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();

    if (!vertexBuffer || !indexBuffer) return;

    // Upload vertex data
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    // Set up attributes
    gl.enableVertexAttribArray(program.attributes['a_position']);
    gl.vertexAttribPointer(program.attributes['a_position'], 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(program.attributes['a_texCoord']);
    gl.vertexAttribPointer(program.attributes['a_texCoord'], 2, gl.FLOAT, false, 16, 8);

    // Upload index data
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);

    // Draw
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    // Cleanup temporary buffers
    gl.deleteBuffer(vertexBuffer);
    gl.deleteBuffer(indexBuffer);
  }

  /**
   * Render connection line with WebGL
   */
  static renderConnection(
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    width: number,
    color: [number, number, number, number] = [0, 0, 0, 1],
    dashPattern: number = 0
  ): void {
    if (!this.gl) return;

    const gl = this.gl;
    const program = this.programs.get('line');

    if (!program) {
      this.logger.warn('Line shader program not found');
      return;
    }

    gl.useProgram(program.program);

    // Create line geometry
    const vertices = new Float32Array([
      startPoint.x, startPoint.y,
      endPoint.x, endPoint.y
    ]);

    // Set uniforms
    const identity = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    gl.uniformMatrix3fv(program.uniforms['u_transform'], false, identity);
    gl.uniform4fv(program.uniforms['u_color'], color);
    gl.uniform1f(program.uniforms['u_lineWidth'], width);
    gl.uniform1f(program.uniforms['u_dashPattern'], dashPattern);

    // Create temporary buffer
    const buffer = gl.createBuffer();
    if (!buffer) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(program.attributes['a_position']);
    gl.vertexAttribPointer(program.attributes['a_position'], 2, gl.FLOAT, false, 0, 0);

    // Set line width
    gl.lineWidth(width);

    // Draw line
    gl.drawArrays(gl.LINES, 0, 2);

    // Cleanup
    gl.deleteBuffer(buffer);
  }

  /**
   * Batch render multiple symbols (instanced rendering)
   */
  static renderSymbolBatch(batches: RenderBatch[]): void {
    if (!this.gl || batches.length === 0) return;

    const gl = this.gl;
    const program = this.programs.get('instanced');

    if (!program) {
      this.logger.warn('Instanced shader program not found');
      return;
    }

    gl.useProgram(program.program);

    batches.forEach(batch => {
      // Create instance data arrays
      const transforms: number[] = [];
      const colors: number[] = [];

      // This would be optimized with proper instancing
      for (let i = 0; i < batch.count; i++) {
        transforms.push(...batch.transform);
        colors.push(...batch.color);
      }

      // Upload instance data
      const transformBuffer = gl.createBuffer();
      const colorBuffer = gl.createBuffer();

      if (!transformBuffer || !colorBuffer) return;

      // Set up instanced attributes (WebGL 2.0 feature)
      // For WebGL 1.0, we'd batch into larger buffers

      // Draw batch
      gl.drawElementsInstanced?.(gl.TRIANGLES, batch.geometry.indices.length, gl.UNSIGNED_SHORT, 0, batch.count);

      // Cleanup
      gl.deleteBuffer(transformBuffer);
      gl.deleteBuffer(colorBuffer);
    });
  }

  /**
   * Create 3x3 transformation matrix
   */
  private static createTransformMatrix(
    position: { x: number; y: number },
    size: { width: number; height: number },
    rotation: number
  ): Float32Array {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const sx = size.width;
    const sy = size.height;
    const tx = position.x;
    const ty = position.y;

    return new Float32Array([
      sx * cos, sx * sin, 0,
      -sy * sin, sy * cos, 0,
      tx, ty, 1
    ]);
  }

  /**
   * Create projection matrix for viewport
   */
  static createProjectionMatrix(width: number, height: number): Float32Array {
    // Convert from screen space to clip space
    return new Float32Array([
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1
    ]);
  }

  /**
   * Set projection matrix for all programs
   */
  static setProjectionMatrix(matrix: Float32Array): void {
    if (!this.gl) return;

    this.programs.forEach((program, name) => {
      if (program.uniforms['u_projection']) {
        this.gl!.useProgram(program.program);
        this.gl!.uniformMatrix3fv(program.uniforms['u_projection'], false, matrix);
      }
    });
  }

  /**
   * Get GPU memory usage estimation
   */
  static getMemoryUsage(): { textures: number; buffers: number; total: number } {
    if (!this.gl) return { textures: 0, buffers: 0, total: 0 };

    // Rough estimates in MB
    const textureMemory = this.textures.size * 1; // 1MB per texture estimate
    const bufferMemory = this.buffers.size * 0.5; // 0.5MB per buffer estimate
    
    return {
      textures: textureMemory,
      buffers: bufferMemory,
      total: textureMemory + bufferMemory
    };
  }

  /**
   * Clean up all WebGL resources
   */
  static cleanup(): void {
    if (!this.gl) return;

    const gl = this.gl;

    // Delete textures
    this.textures.forEach(texture => gl.deleteTexture(texture));
    this.textures.clear();

    // Delete buffers
    this.buffers.forEach(buffer => gl.deleteBuffer(buffer));
    this.buffers.clear();

    // Delete programs
    this.programs.forEach(({ program }) => gl.deleteProgram(program));
    this.programs.clear();

    this.logger.info('WebGL resources cleaned up');
  }
}