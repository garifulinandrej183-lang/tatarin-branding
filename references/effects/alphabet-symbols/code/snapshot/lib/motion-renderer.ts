import { GLYPHS, PALETTE, type Layout, type Vec } from "./motion-math";

const SHAPE_VERTEX = `
attribute vec2 a_position;
void main(){ gl_Position=vec4(a_position,0.,1.); }
`;
const SHAPE_FRAGMENT = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_dpr;
uniform vec3 u_fit;
uniform vec4 u_rings[3];
uniform vec3 u_colors[4];
uniform vec3 u_disc;
float edge(float d, float width, float aa){return 1.-smoothstep(width-aa,width+aa,d);}
void main(){
  vec2 css=vec2(gl_FragCoord.x,u_resolution.y-gl_FragCoord.y)/u_dpr;
  vec2 p=(css-u_fit.xy)/u_fit.z;
  float aa=1./(u_fit.z*u_dpr);
  vec3 col=vec3(0.);
  float coverage=0.;
  for(int i=0;i<3;i++){
    vec4 r=u_rings[i];
    float mask=edge(abs(length(p-r.xy)-r.z),r.w*.5,aa);
    if(mask>0.){
      col=coverage>.01 ? mix(col,u_colors[i],mask*.52) : u_colors[i];
      coverage=max(coverage,mask);
    }
  }
  float disk=edge(length(p-u_disc.xy),u_disc.z,aa);
  col=mix(col,u_colors[3],disk);
  coverage=max(coverage,disk);
  gl_FragColor=vec4(col,coverage*.96);
}
`;
const GLYPH_VERTEX = `
precision highp float;
attribute vec2 a_position;
attribute float a_size;
attribute float a_tile;
attribute vec4 a_color;
uniform vec2 u_resolution;
uniform float u_dpr;
varying float v_tile;
varying vec4 v_color;
void main(){
  vec2 ndc=a_position/u_resolution*2.-1.;
  gl_Position=vec4(ndc.x,-ndc.y,0.,1.);
  gl_PointSize=max(1.,a_size*u_dpr);
  v_tile=a_tile; v_color=a_color;
}
`;
const GLYPH_FRAGMENT = `
precision mediump float;
uniform sampler2D u_atlas;
uniform float u_columns;
varying float v_tile;
varying vec4 v_color;
void main(){
  float row=floor(v_tile/u_columns);
  float col=mod(v_tile,u_columns);
  vec2 uv=vec2((col+gl_PointCoord.x)/u_columns,(row+gl_PointCoord.y)/3.);
  vec4 glyph=texture2D(u_atlas,uv);
  gl_FragColor=vec4(v_color.rgb*glyph.rgb,v_color.a*glyph.a);
}
`;

function makeAtlas() {
  const atlas = document.createElement("canvas");
  atlas.width = GLYPHS.length * 64; atlas.height = 192;
  const ctx = atlas.getContext("2d");
  if (!ctx) throw new Error("Glyph atlas unavailable");
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff";
  for (let row = 0; row < 3; row++) {
    GLYPHS.forEach((g, i) => {
      const weight = row ? "650 " : "490 ";
      const family = "px ui-monospace, SFMono-Regular, Consolas, monospace";
      ctx.font = weight + "42" + family;
      const width = ctx.measureText(g).width;
      if (width > 52) ctx.font = weight + Math.floor(42 * 52 / width) + family;
      if(row===2){
        ctx.strokeStyle="#101211";ctx.lineWidth=8;ctx.lineJoin="round";
        ctx.strokeText(g,i*64+32,row*64+33);
      }
      ctx.fillText(g, i * 64 + 32, row * 64 + 33);
    });
  }
  return atlas;
}
export interface SceneRenderer {
  readonly kind: string;
  resize(width: number, height: number, dpr: number): void;
  draw(layout: Layout, offset: Vec, fit: { x: number; y: number; scale: number }, data: Float32Array, count: number): void;
  dispose(): void;
}
export class GLRenderer implements SceneRenderer {
  readonly kind = "webgl";
  private gl: WebGLRenderingContext;
  private shapeProgram: WebGLProgram;
  private glyphProgram: WebGLProgram;
  private quad: WebGLBuffer;
  private glyphBuffer: WebGLBuffer;
  private texture: WebGLTexture;
  private locations: Record<string, WebGLUniformLocation | null> = {};
  private attributes: Record<string, number> = {};
  private rings = new Float32Array(12);
  private colors = new Float32Array(12);
  private w = 1; private h = 1; private dpr = 1;
  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false, depth: false, stencil: false, preserveDrawingBuffer: false });
    if (!gl) throw new Error("WebGL unavailable");
    this.gl = gl;
    const resources: (WebGLShader | WebGLProgram | WebGLBuffer | WebGLTexture)[] = [];
    try {
      const compile = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) throw new Error("Shader unavailable");
        resources.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
        return shader;
      };
      const program = (vert: string, frag: string) => {
        const p = gl.createProgram(); if (!p) throw new Error("Program unavailable");
        resources.push(p);
        const v = compile(gl.VERTEX_SHADER, vert), f = compile(gl.FRAGMENT_SHADER, frag);
        gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
        gl.deleteShader(v); gl.deleteShader(f);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "Program linking failed");
        return p;
      };
      this.shapeProgram = program(SHAPE_VERTEX, SHAPE_FRAGMENT);
      this.glyphProgram = program(GLYPH_VERTEX, GLYPH_FRAGMENT);
      const q = gl.createBuffer(), b = gl.createBuffer(), texture = gl.createTexture();
      if (!q || !b || !texture) throw new Error("GPU resources unavailable");
      this.quad = q; this.glyphBuffer = b; this.texture = texture;
      gl.bindBuffer(gl.ARRAY_BUFFER, q);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      for (const name of ["u_resolution","u_dpr","u_fit","u_rings[0]","u_colors[0]","u_disc"]) this.locations["s:"+name] = gl.getUniformLocation(this.shapeProgram,name);
      for (const name of ["u_resolution","u_dpr","u_atlas","u_columns"]) this.locations["g:"+name] = gl.getUniformLocation(this.glyphProgram,name);
      this.attributes["quad"] = gl.getAttribLocation(this.shapeProgram,"a_position");
      for (const name of ["a_position","a_size","a_tile","a_color"]) this.attributes[name] = gl.getAttribLocation(this.glyphProgram,name);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,makeAtlas());
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    } catch(error) {
      for (const resource of resources) {
        if (gl.isShader(resource as WebGLShader)) gl.deleteShader(resource as WebGLShader);
        else if (gl.isProgram(resource as WebGLProgram)) gl.deleteProgram(resource as WebGLProgram);
      }
      throw error;
    }
  }
  resize(width: number, height: number, dpr: number) {
    this.w = width; this.h = height; this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr); this.canvas.height = Math.round(height * dpr);
    this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
  }
  draw(layout: Layout, offset: Vec, fit: { x: number; y: number; scale: number }, data: Float32Array, count: number) {
    const gl = this.gl;
    if(gl.isContextLost()) return;
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.shapeProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);
    const qa = this.attributes.quad; gl.enableVertexAttribArray(qa); gl.vertexAttribPointer(qa,2,gl.FLOAT,false,0,0);
    for(let i=0;i<3;i++) {
      const r=layout.rings[i]; this.rings.set([r.x+offset.x,r.y+offset.y,r.radius,r.thickness],i*4);
      this.colors.set(PALETTE[r.color],i*3);
    }
    this.colors.set(PALETTE[layout.disc.color],9);
    gl.uniform2f(this.locations["s:u_resolution"],this.canvas.width,this.canvas.height);
    gl.uniform1f(this.locations["s:u_dpr"],this.dpr);
    gl.uniform3f(this.locations["s:u_fit"],fit.x,fit.y,fit.scale);
    gl.uniform4fv(this.locations["s:u_rings[0]"],this.rings);
    gl.uniform3fv(this.locations["s:u_colors[0]"],this.colors);
    gl.uniform3f(this.locations["s:u_disc"],layout.disc.x,layout.disc.y,layout.disc.radius);
    gl.drawArrays(gl.TRIANGLES,0,6); gl.disableVertexAttribArray(qa);
    gl.useProgram(this.glyphProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.glyphBuffer); gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
    const attrs = [["a_position",2,0],["a_size",1,8],["a_tile",1,12],["a_color",4,16]] as const;
    for(const [name,size,byteOffset] of attrs) { const a=this.attributes[name]; gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a,size,gl.FLOAT,false,32,byteOffset); }
    gl.uniform2f(this.locations["g:u_resolution"],this.w,this.h);
    gl.uniform1f(this.locations["g:u_dpr"],this.dpr); gl.uniform1f(this.locations["g:u_columns"],GLYPHS.length);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this.texture); gl.uniform1i(this.locations["g:u_atlas"],0);
    gl.drawArrays(gl.POINTS,0,count);
    for(const [name] of attrs) gl.disableVertexAttribArray(this.attributes[name]);
  }
  dispose() {
    const gl=this.gl; gl.deleteBuffer(this.quad); gl.deleteBuffer(this.glyphBuffer); gl.deleteTexture(this.texture);
    gl.deleteProgram(this.shapeProgram); gl.deleteProgram(this.glyphProgram);
  }
}
export class CanvasRenderer implements SceneRenderer {
  readonly kind = "canvas2d";
  private ctx: CanvasRenderingContext2D;
  private atlas = makeAtlas();
  private tinted: HTMLCanvasElement[];
  private inks: readonly (readonly number[])[] = [[.72,.72,.72],[.12,.12,.12],...PALETTE,[1,1,1]];
  private w=1; private h=1; private dpr=1;
  constructor(private canvas: HTMLCanvasElement) {
    const ctx=canvas.getContext("2d",{alpha:true});
    if(!ctx) throw new Error("Canvas unavailable");
    this.ctx=ctx;
    this.tinted=this.inks.map(color=>{
      const sprite=document.createElement("canvas");sprite.width=this.atlas.width;sprite.height=this.atlas.height;
      const paint=sprite.getContext("2d")!;paint.drawImage(this.atlas,0,0);
      paint.globalCompositeOperation="multiply";paint.fillStyle="rgb("+color.map(v=>Math.round(v*255)).join(",")+")";
      paint.fillRect(0,0,sprite.width,sprite.height);
      paint.globalCompositeOperation="destination-in";paint.drawImage(this.atlas,0,0);return sprite;
    });
  }
  resize(w:number,h:number,dpr:number) { this.w=w;this.h=h;this.dpr=dpr;this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr); }
  draw(layout:Layout,offset:Vec,fit:{x:number;y:number;scale:number},data:Float32Array,count:number) {
    const ctx=this.ctx; ctx.setTransform(this.dpr,0,0,this.dpr,0,0); ctx.clearRect(0,0,this.w,this.h);
    ctx.save();ctx.translate(fit.x,fit.y);ctx.scale(fit.scale,fit.scale);
    for(const r of layout.rings) {
      const c=PALETTE[r.color];ctx.strokeStyle="rgb("+c.map(v=>Math.round(v*255)).join(",")+")";
      ctx.lineWidth=r.thickness;ctx.beginPath();ctx.arc(r.x+offset.x,r.y+offset.y,r.radius,0,Math.PI*2);ctx.stroke();
    }
    const d=layout.disc,c=PALETTE[d.color];ctx.fillStyle="rgb("+c.map(v=>Math.round(v*255)).join(",")+")";
    ctx.beginPath();ctx.arc(d.x,d.y,d.radius,0,Math.PI*2);ctx.fill();ctx.restore();
    for(let i=0;i<count;i++){
      const j=i*8,size=data[j+2],tile=data[j+3];ctx.globalAlpha=data[j+7];
      let nearest=0,error=Infinity;
      for(let ink=0;ink<this.inks.length;ink++){
        const color=this.inks[ink],d=(data[j+4]-color[0])**2+(data[j+5]-color[1])**2+(data[j+6]-color[2])**2;
        if(d<error){error=d;nearest=ink;}
      }
      ctx.drawImage(this.tinted[nearest],(tile%GLYPHS.length)*64,Math.floor(tile/GLYPHS.length)*64,64,64,data[j]-size/2,data[j+1]-size/2,size,size);
    }
    ctx.globalAlpha=1;
  }
  dispose() { this.atlas.width=1;this.atlas.height=1;for(const atlas of this.tinted){atlas.width=1;atlas.height=1;} }
}
