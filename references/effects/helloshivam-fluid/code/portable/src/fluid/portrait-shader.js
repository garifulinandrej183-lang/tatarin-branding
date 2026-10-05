export const portraitDisplay = `
  uniform sampler2D uSource, uBloom, uPortrait, uWords;
  uniform vec2 bloomTexel, heroSize;
  uniform vec4 portraitRect;
  uniform float time, burstMode;
  uniform vec4 wordRect0, wordRect1, wordRect2, wordRect3, wordRect4;
  uniform vec4 wordAtlas0, wordAtlas1, wordAtlas2, wordAtlas3, wordAtlas4;
  float energyAt(vec2 uv) {
    vec3 dye = sampleAt(uSource, uv, texelSize).rgb;
    vec3 bloom = sampleAt(uBloom, uv, bloomTexel).rgb;
    return clamp(max(max(dye.r, dye.g), dye.b) + max(max(bloom.r, bloom.g), bloom.b) * 0.7, 0.0, 1.0);
  }
  vec4 wordLayer(vec2 uv, vec4 box, vec4 atlas, float phase) {
    vec2 pixels = vec2(sin(time * 0.47 + phase), cos(time * 0.39 + phase)) * 9.0;
    vec2 wobble = pixels / max(heroSize, vec2(1.0));
    vec2 local = (uv - box.xy - wobble) / max(box.zw, vec2(0.00001));
    if (any(lessThan(local, vec2(0.0))) || any(greaterThan(local, vec2(1.0)))) return vec4(0.0);
    float visible = smoothstep(0.13, 0.34, energyAt(uv));
    vec4 glyph = texture2D(uWords, atlas.xy + local * atlas.zw);
    return vec4(glyph.rgb, glyph.a * visible * 0.82);
  }
  void main() {
    vec3 dye = max(sampleAt(uSource, vUv, texelSize).rgb, vec3(0.0));
    vec3 bloom = max(sampleAt(uBloom, vUv, bloomTexel).rgb, vec3(0.0));
    float dx = length(sampleAt(uSource, vR, texelSize).rgb) - length(sampleAt(uSource, vL, texelSize).rgb);
    float dy = length(sampleAt(uSource, vT, texelSize).rgb) - length(sampleAt(uSource, vB, texelSize).rgb);
    vec3 color;
    if (burstMode > 0.5) {
      vec3 chroma = vec3(1.0) - exp(-(dye + bloom * 0.85) * 2.35);
      vec2 edgePoint = (vUv - vec2(0.5)) * vec2(2.25, 2.0);
      float vignette = 1.0 - smoothstep(0.48, 1.03, length(edgePoint));
      color = vec3(5.0 / 255.0) + chroma * vignette;
    } else {
      float normalLight = clamp(normalize(vec3(dx, dy, length(texelSize) * 3.0)).z + 0.7, 0.7, 1.0);
      vec3 fluid = dye * normalLight + bloom * 0.3;
      fluid = pow(max(vec3(0.0), vec3(1.0) - exp(-fluid * 1.45)), vec3(0.7));
      vec2 noise = fract(gl_FragCoord.xy * vec2(0.754877666, 0.569840291));
      float dither = (fract(dot(noise, vec2(17.23, 53.71))) - 0.5) / 255.0;
      color = clamp(vec3(5.0/255.0) + fluid * (250.0/255.0) + dither, 0.0, 1.0);
    }

    vec2 photoUv = (vUv - portraitRect.xy) / max(portraitRect.zw, vec2(0.00001));
    if (all(greaterThanEqual(photoUv, vec2(0.0))) && all(lessThanEqual(photoUv, vec2(1.0)))) {
      vec4 photo = texture2D(uPortrait, photoUv);
      if (burstMode > 0.5) {
        vec2 photoPoint = vec2((vUv.x - 0.5) * heroSize.x / max(heroSize.y, 1.0) * 0.72,
          (vUv.y - 0.55) * 1.25);
        float reveal = 1.0 - smoothstep(0.035, 0.55, length(photoPoint));
        float light = 0.045 + reveal * 0.835;
        vec3 tint = clamp(dye + bloom * 0.65, vec3(0.0), vec3(0.8)) * reveal * 0.2;
        color = mix(color, photo.rgb * light + tint, photo.a);
      } else {
        float reveal = smoothstep(0.015, 0.24, energyAt(vUv));
        float light = 0.025 + reveal * 0.825;
        vec3 tint = clamp(dye + bloom * 0.5, vec3(0.0), vec3(0.35)) * reveal * 0.12;
        color = mix(color, photo.rgb * light + tint, photo.a);
      }
    }

    if (burstMode < 0.5) {
      vec4 glyph = wordLayer(vUv, wordRect0, wordAtlas0, 0.2);
      color = mix(color, glyph.rgb, glyph.a);
      glyph = wordLayer(vUv, wordRect1, wordAtlas1, 1.4);
      color = mix(color, glyph.rgb, glyph.a);
      glyph = wordLayer(vUv, wordRect2, wordAtlas2, 2.8);
      color = mix(color, glyph.rgb, glyph.a);
      glyph = wordLayer(vUv, wordRect3, wordAtlas3, 4.1);
      color = mix(color, glyph.rgb, glyph.a);
      glyph = wordLayer(vUv, wordRect4, wordAtlas4, 5.5);
      color = mix(color, glyph.rgb, glyph.a);
    }
    gl_FragColor = vec4(color, 1.0);
  }`;
