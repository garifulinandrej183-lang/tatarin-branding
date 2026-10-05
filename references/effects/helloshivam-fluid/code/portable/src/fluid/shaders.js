/* Original prototype shaders. MIT attribution: see LICENSE-fluid.txt. */
export const vertexSource = `
  precision highp float;
  attribute vec2 aPosition;
  uniform vec2 texelSize;
  varying vec2 vUv, vL, vR, vT, vB;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }`;
export const fragmentHeader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv, vL, vR, vT, vB;
  uniform vec2 texelSize;
  vec4 sampleAt(sampler2D source, vec2 uv, vec2 pixel) {
    #ifdef HARDWARE_LINEAR
      return texture2D(source, uv);
    #else
      vec2 st = uv / pixel - 0.5;
      vec2 i = floor(st), f = fract(st);
      vec4 a = texture2D(source, (i + vec2(0.5, 0.5)) * pixel);
      vec4 b = texture2D(source, (i + vec2(1.5, 0.5)) * pixel);
      vec4 c = texture2D(source, (i + vec2(0.5, 1.5)) * pixel);
      vec4 d = texture2D(source, (i + vec2(1.5, 1.5)) * pixel);
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    #endif
  }`;
export const fragments = {
  copy: `uniform sampler2D uSource;
    uniform vec2 sourceTexel;
    void main() { gl_FragColor = sampleAt(uSource, vUv, sourceTexel); }`,
  splat: `uniform sampler2D uSource;
    uniform vec2 point;
    uniform vec3 color;
    uniform float aspect, radius;
    void main() {
      vec2 p = vUv - point; p.x *= aspect;
      vec3 c = texture2D(uSource, vUv).rgb + exp(-dot(p,p) / radius) * color;
      gl_FragColor = vec4(c, 1.0);
    }`,
  advect: `uniform sampler2D uVelocity, uSource;
    uniform vec2 sourceTexel;
    uniform float dt, dissipation;
    void main() {
      vec2 uv = vUv - dt * sampleAt(uVelocity, vUv, texelSize).xy * texelSize;
      gl_FragColor = sampleAt(uSource, uv, sourceTexel) / (1.0 + dissipation * dt);
    }`,
  divergence: `uniform sampler2D uVelocity;
    void main() {
      vec2 c = texture2D(uVelocity, vUv).xy;
      float l = texture2D(uVelocity, vL).x, r = texture2D(uVelocity, vR).x;
      float t = texture2D(uVelocity, vT).y, b = texture2D(uVelocity, vB).y;
      if (vL.x < 0.0) l = -c.x;
      if (vR.x > 1.0) r = -c.x;
      if (vT.y > 1.0) t = -c.y;
      if (vB.y < 0.0) b = -c.y;
      gl_FragColor = vec4(0.5 * (r-l+t-b), 0.0, 0.0, 1.0);
    }`,
  clear: `uniform sampler2D uSource;
    void main() { gl_FragColor = texture2D(uSource, vUv) * 0.8; }`,
  pressure: `uniform sampler2D uPressure, uDivergence;
    void main() {
      float p = texture2D(uPressure, vL).r + texture2D(uPressure, vR).r
              + texture2D(uPressure, vT).r + texture2D(uPressure, vB).r;
      gl_FragColor = vec4((p - texture2D(uDivergence, vUv).r) * 0.25, 0.0, 0.0, 1.0);
    }`,
  gradient: `uniform sampler2D uPressure, uVelocity;
    void main() {
      vec2 dp = vec2(texture2D(uPressure, vR).r - texture2D(uPressure, vL).r,
                     texture2D(uPressure, vT).r - texture2D(uPressure, vB).r);
      gl_FragColor = vec4(texture2D(uVelocity, vUv).xy - dp, 0.0, 1.0);
    }`,
  bloomStart: `uniform sampler2D uSource;
    uniform vec2 sourceTexel;
    void main() {
      vec3 c = sampleAt(uSource, vUv, sourceTexel).rgb;
      float brightness = max(c.r, max(c.g, c.b));
      float soft = clamp(brightness - 0.3, 0.0, 0.7);
      soft = soft * soft / 1.4;
      c *= max(soft, brightness - 0.65) / max(brightness, 0.0001);
      gl_FragColor = vec4(c, 1.0);
    }`,
  bloomBlur: `uniform sampler2D uSource;
    void main() {
      vec3 c = texture2D(uSource, vUv).rgb * 0.4;
      c += (sampleAt(uSource, vL, texelSize).rgb + sampleAt(uSource, vR, texelSize).rgb
           + sampleAt(uSource, vT, texelSize).rgb + sampleAt(uSource, vB, texelSize).rgb) * 0.15;
      gl_FragColor = vec4(c, 1.0);
    }`,
  display: `uniform sampler2D uSource, uBloom;
    uniform vec2 bloomTexel;
    void main() {
      vec3 c = max(sampleAt(uSource, vUv, texelSize).rgb, vec3(0.0));
      float dx = length(sampleAt(uSource, vR, texelSize).rgb) - length(sampleAt(uSource, vL, texelSize).rgb);
      float dy = length(sampleAt(uSource, vT, texelSize).rgb) - length(sampleAt(uSource, vB, texelSize).rgb);
      float light = clamp(normalize(vec3(dx, dy, length(texelSize) * 3.0)).z + 0.7, 0.7, 1.0);
      c *= light;
      c += max(sampleAt(uBloom, vUv, bloomTexel).rgb, vec3(0.0)) * 0.3;
      // A bounded exposure preserves colour instead of clipping a broad white core.
      c = pow(max(vec3(0.0), vec3(1.0) - exp(-c * 1.45)), vec3(0.7));
      // Subpixel dither prevents visible colour bands without blurring the image.
      vec2 noise = fract(gl_FragCoord.xy * vec2(0.754877666, 0.569840291));
      float dither = (fract(dot(noise, vec2(17.23, 53.71))) - 0.5) / 255.0;
      gl_FragColor = vec4(clamp(vec3(5.0/255.0) + c * (250.0/255.0) + dither, 0.0, 1.0), 1.0);
    }`
};

