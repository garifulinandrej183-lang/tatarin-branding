/* Adapted from Pavel Dobryakov's MIT-licensed WebGL-Fluid-Simulation. */
import { vertexSource, fragmentHeader, fragments } from './shaders.js';
import { portraitDisplay } from './portrait-shader.js';
import { PortraitScene } from './portrait-scene.js';

export class FluidRenderer {
  constructor(target, { hero, onSceneReady } = {}) {
    this.targets = [];
    this.programs = {};
    this.shaders = [];
    this.options = { hero, onSceneReady };
    try {
      this.initialize(target);
      if (hero) this.scene = new PortraitScene(this.gl, hero, onSceneReady);
    } catch (error) {
      this.destroy();
      throw error;
    }
  }
  initialize(target) {
    this.canvas = target;
    // Keep the last frame while idle or paused, without an always-running render loop.
    const attributes = { alpha:false, antialias:false, depth:false, stencil:false, preserveDrawingBuffer:true };
    let gl = target.getContext('webgl2', attributes);
    const webgl2 = !!gl;
    if (!gl) gl = target.getContext('webgl', attributes);
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    if (webgl2) {
      if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('Float render targets unavailable');
      this.type = gl.HALF_FLOAT;
      this.format = gl.RGBA16F;
      this.linear = !!gl.getExtension('OES_texture_float_linear');
    } else {
      const half = gl.getExtension('OES_texture_half_float');
      if (!half) throw new Error('Half-float textures unavailable');
      gl.getExtension('EXT_color_buffer_half_float');
      this.type = half.HALF_FLOAT_OES;
      this.format = gl.RGBA;
      this.linear = !!gl.getExtension('OES_texture_half_float_linear');
    }
    this.maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.programs = {};
    const vertex = this.shader(gl.VERTEX_SHADER, vertexSource);
    for (const [name, source] of Object.entries(fragments)) {
      const fragment = this.shader(gl.FRAGMENT_SHADER, (this.linear ? '#define HARDWARE_LINEAR\n' : '') + fragmentHeader + source);
      const program = gl.createProgram();
        this.programs[name] = { program, locations:{} };
      gl.attachShader(program, vertex); gl.attachShader(program, fragment);
      gl.bindAttribLocation(program, 0, 'aPosition'); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader link failed');
      gl.deleteShader(fragment);
    }
    if (this.options.hero) this.addProgram('portraitDisplay');
    gl.deleteShader(vertex);
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    this.targets = [];
  }
  addProgram(name) {
    const gl = this.gl;
    const fragment = this.shader(gl.FRAGMENT_SHADER, (this.linear ? '#define HARDWARE_LINEAR\n' : '') + fragmentHeader + portraitDisplay);
    const program = gl.createProgram();
    this.programs[name] = { program, locations:{} };
    const vertex = this.shader(gl.VERTEX_SHADER, vertexSource);
    gl.attachShader(program, vertex); gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition'); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader link failed');
    gl.deleteShader(fragment);
    gl.deleteShader(vertex);
  }
  shader(type, source) {
    const gl = this.gl, shader = gl.createShader(type);
    this.shaders.push(shader);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader compile failed');
    return shader;
  }
  use(name, texel = [0,0]) {
    this.current = this.programs[name]; this.gl.useProgram(this.current.program);
    this.uniform('texelSize', '2f', ...texel);
  }
  uniform(name, type, ...values) {
    const p = this.current;
    if (!(name in p.locations)) p.locations[name] = this.gl.getUniformLocation(p.program, name);
    if (p.locations[name] !== null) this.gl['uniform' + type](p.locations[name], ...values);
  }
  texture(name, buffer, unit = 0) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, buffer.texture);
    this.uniform(name, '1i', unit);
  }
  draw(target = null) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(0,0,target ? target.width : this.canvas.width, target ? target.height : this.canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  buffer(width, height) {
    const gl = this.gl, texture = gl.createTexture(), framebuffer = gl.createFramebuffer();
    const target = {texture, framebuffer, width, height, texel:[1/width,1/height]};
    this.targets.push(target);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    const filter = this.linear ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,this.format,width,height,0,gl.RGBA,this.type,null);
    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Incomplete float framebuffer');
    gl.viewport(0,0,width,height); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    return target;
  }
  pair(width,height) {
    return {read:this.buffer(width,height),write:this.buffer(width,height),swap(){[this.read,this.write]=[this.write,this.read];}};
  }
  resolution(shortSide, aspect) {
    const limit = Math.min(this.maxTexture, 2560);
    const scale = Math.min(1, limit / (shortSide * Math.max(aspect,1/aspect)));
    return aspect >= 1 ? [Math.round(shortSide * aspect * scale),Math.round(shortSide * scale)]
                       : [Math.round(shortSide * scale),Math.round(shortSide / aspect * scale)];
  }
  resize(width,height,dpr,fine) {
    const scale = Math.min(dpr || 1, 2, 2560/width, 1600/height);
    const w = Math.max(1,Math.round(width*scale)), h = Math.max(1,Math.round(height*scale));
    if (this.velocity && this.canvas.width === w && this.canvas.height === h && this.fine === fine) return false;
    this.fine = fine;
    const oldDye = this.dye?.read, oldTargets = this.targets;
    this.retiredTargets = oldTargets;
    this.targets = [];
    this.canvas.width = w; this.canvas.height = h; this.aspect = width/height;
    this.velocity = this.pair(...this.resolution(128,this.aspect));
    this.pressure = this.pair(this.velocity.read.width,this.velocity.read.height);
    this.divergence = this.buffer(this.velocity.read.width,this.velocity.read.height);
    this.dye = this.pair(...this.resolution(fine ? 1024 : 512,this.aspect));
    this.bloom = this.pair(...this.resolution(256,this.aspect));
    if (oldDye) {
      this.use('copy'); this.texture('uSource',oldDye); this.uniform('sourceTexel','2f',...oldDye.texel); this.draw(this.dye.read);
    }
    for (const old of oldTargets) { this.gl.deleteTexture(old.texture); this.gl.deleteFramebuffer(old.framebuffer); }
    this.retiredTargets = [];
    return !oldDye;
  }
  splat(x,y,dx,dy,hue,amount = 0.85,radiusMultiplier = 1) {
    const rgb = [0,2/3,1/3].map(phase => Math.max(0,Math.min(1,Math.abs(((hue+phase)%1)*6-3)-1)));
    this.use('splat');
    this.uniform('aspect','1f',this.aspect);
    this.uniform('point','2f',x,1-y);
    this.uniform('radius','1f',0.0015 * (this.aspect < 1 ? this.aspect*this.aspect : 1) * radiusMultiplier);
    this.uniform('color','3f',Math.max(-180,Math.min(180,dx*3000)),Math.max(-180,Math.min(180,-dy*3000)),0);
    this.texture('uSource',this.velocity.read); this.draw(this.velocity.write); this.velocity.swap();
    this.uniform('color','3f',...rgb.map(c=>c*amount));
    this.texture('uSource',this.dye.read); this.draw(this.dye.write); this.dye.swap();
  }
  step(dt) {
    const v = this.velocity, p = this.pressure;
    this.use('divergence',v.read.texel); this.texture('uVelocity',v.read); this.draw(this.divergence);
    this.use('clear'); this.texture('uSource',p.read); this.draw(p.write); p.swap();
    this.use('pressure',p.read.texel); this.texture('uDivergence',this.divergence,1);
    for (let i=0;i<20;i++) { this.texture('uPressure',p.read); this.draw(p.write); p.swap(); }
    this.use('gradient',v.read.texel); this.texture('uPressure',p.read); this.texture('uVelocity',v.read,1); this.draw(v.write); v.swap();
    this.use('advect',v.read.texel); this.uniform('dt','1f',dt); this.uniform('dissipation','1f',0.8);
    this.uniform('sourceTexel','2f',...v.read.texel); this.texture('uVelocity',v.read); this.texture('uSource',v.read,1); this.draw(v.write); v.swap();
    this.uniform('dissipation','1f',2.5); this.uniform('sourceTexel','2f',...this.dye.read.texel);
    this.texture('uVelocity',v.read); this.texture('uSource',this.dye.read,1); this.draw(this.dye.write); this.dye.swap();
  }
  paint(time = this.sceneTime ?? performance.now(), { burst = false } = {}) {
    this.sceneTime = time;
    this.use('bloomStart'); this.texture('uSource',this.dye.read); this.uniform('sourceTexel','2f',...this.dye.read.texel); this.draw(this.bloom.read);
    this.use('bloomBlur',this.bloom.read.texel);
    for (let i=0;i<4;i++) { this.texture('uSource',this.bloom.read); this.draw(this.bloom.write); this.bloom.swap(); }
    this.use(this.scene?.ready ? 'portraitDisplay' : 'display',this.dye.read.texel);
    this.texture('uSource',this.dye.read); this.texture('uBloom',this.bloom.read,1);
    this.uniform('bloomTexel','2f',...this.bloom.read.texel);
    if (this.scene?.ready) {
      this.scene.uniforms(this, time);
      this.uniform('burstMode','1f',burst ? 1 : 0);
    }
    this.draw();
  }
  reset() {
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    for (const target of this.targets) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.viewport(0, 0, target.width, target.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  burst() {
    this.reset();
    const hues = [0.2, 0.5, 0.62, 0.78, 0.1];
    const spreadX = this.aspect < 1 ? 0.43 : 0.35;
    const spreadY = 0.24;
    const segments = 8;
    for (let arm = 0; arm < hues.length; arm++) {
      const baseAngle = -Math.PI * 0.5 + arm * Math.PI * 2 / hues.length;
      let previous = { x: 0.5, y: 0.49 };
      for (let segment = 1; segment <= segments; segment++) {
        const t = segment / segments;
        const angle = baseAngle
          + 0.13 * Math.sin(t * Math.PI * 1.5 + arm * 1.13)
          + 0.045 * Math.sin(t * Math.PI * 3.0 + arm * 0.71);
        const next = {
          x: 0.5 + Math.cos(angle) * spreadX * t,
          y: 0.49 + Math.sin(angle) * spreadY * t,
        };
        const core = 1.95 - 0.95 * t;
        const amount = 0.7 - 0.22 * t;
        this.splat(next.x, next.y, next.x - previous.x, next.y - previous.y,
          hues[arm], amount, core);
        previous = next;
      }
    }
    for (let frame = 0; frame < 10; frame++) this.step(1 / 60);
    this.paint(undefined, { burst: true });
  }
  seed() {
    let point = null;
    for (let i=0;i<36;i++) {
      const t=i/35, x=0.18+0.66*t+0.07*Math.sin(t*Math.PI*4), y=0.6+0.2*Math.sin(t*Math.PI*3.3-0.7);
      this.splat(x,y,point ? x-point.x : 0,point ? y-point.y : 0,(0.08+t*0.62)%1,0.28);
      if (i%3===2) this.step(1/60);
      point={x,y};
    }
  }
  destroy() {
    this.scene?.destroy();
    const gl = this.gl;
    if (!gl) return;
    for (const target of [...this.targets, ...(this.retiredTargets || [])]) {
      gl.deleteTexture(target.texture);
      gl.deleteFramebuffer(target.framebuffer);
    }
    for (const { program } of Object.values(this.programs)) gl.deleteProgram(program);
    for (const shader of this.shaders) gl.deleteShader(shader);
    if (this.quad) gl.deleteBuffer(this.quad);
    this.targets = [];
    this.retiredTargets = [];
    this.programs = {};
    this.shaders = [];
  }
}

