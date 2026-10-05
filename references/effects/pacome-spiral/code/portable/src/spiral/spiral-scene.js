import * as THREE from "../vendor/three/three.module.js";
import { artworks } from "./spiral-art.js";
import { CanvasSpiralRenderer } from "./spiral-software.js";
const VERTEX = `
  uniform float uSpeed;
  uniform float uCurve;
  uniform float uSpeedBend;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 bent = position;
    bent.z += sin(uv.x * 3.14159265) * 0.2;
    vec4 world = modelMatrix * vec4(bent, 1.0);
    vec4 view = viewMatrix * world;
    view.x += world.y * world.y * uCurve;
    view.x += sin(uv.y * 3.14159265) * uSpeed * uSpeedBend;
    gl_Position = projectionMatrix * view;
  }
`;
const FRAGMENT = `
  uniform sampler2D uImage;
  uniform float uImageAspect;
  uniform float uCardAspect;
  uniform float uHover;
  uniform float uHasText;
  uniform float uMobile;
  uniform float uPulse;
  uniform float uPulseTime;
  uniform vec2 uResolution;
  varying vec2 vUv;
  vec2 cover(vec2 uv) {
    if (uImageAspect > uCardAspect) uv.x = (uv.x - 0.5) * uCardAspect / uImageAspect + 0.5;
    else uv.y = (uv.y - 0.5) * uImageAspect / uCardAspect + 0.5;
    return uv;
  }
  void main() {
    float h = gl_FrontFacing ? uHover : 0.0;
    // Keep typography at its original size and preserve its margins on hover.
    float cropHover = h * (1.0 - uHasText);
    float maskSize = 1.0 - cropHover * 0.05;
    vec2 d = abs(vUv - 0.5) - (vec2(0.5 * maskSize) - 0.05);
    float distance = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - 0.05;
    if (distance > 0.0) discard;
    vec2 imageUv = cover((vUv - 0.5) / (1.0 + cropHover * 0.05) + 0.5);
    vec3 c;
    if (gl_FrontFacing) {
      c = texture2D(uImage, imageUv).rgb;
      if (uPulse > 0.5) {
        float wave = 0.5 + 0.5 * sin(uPulseTime * 2.61799388);
        vec2 p = (vUv - vec2(0.875, 0.18)) * vec2(uCardAspect, 1.0) / (0.88 + 0.24 * wave);
        float aa = max(fwidth(p.x), fwidth(p.y));
        float horizontal = max(abs(p.x) - 0.054, abs(p.y) - 0.0025);
        float vertical = max(abs(p.x) - 0.0025, abs(p.y) - 0.054);
        float mark = 1.0 - smoothstep(-aa, aa, min(horizontal, vertical));
        c = mix(c, vec3(0.6867, 1.0, 0.0595), mark * (0.72 + 0.28 * wave));
      }
      c *= 1.0 - (0.55 - 0.37 * uHasText) * h;
    } else if (uMobile > 0.5) {
      // Quiet matte backs avoid ghosted text on a small screen.
      c = vec3(0.008, 0.0095, 0.006);
    } else {
      vec2 o = vec2(12.0 / 1024.0);
      c = texture2D(uImage, imageUv).rgb * 4.0;
      c += texture2D(uImage, imageUv + vec2(o.x, 0.0)).rgb * 2.0;
      c += texture2D(uImage, imageUv - vec2(o.x, 0.0)).rgb * 2.0;
      c += texture2D(uImage, imageUv + vec2(0.0, o.y)).rgb * 2.0;
      c += texture2D(uImage, imageUv - vec2(0.0, o.y)).rgb * 2.0;
      c += texture2D(uImage, imageUv + o).rgb;
      c += texture2D(uImage, imageUv - o).rgb;
      c += texture2D(uImage, imageUv + vec2(o.x, -o.y)).rgb;
      c += texture2D(uImage, imageUv + vec2(-o.x, o.y)).rgb;
      c /= 16.0;
    }
    float screenY = gl_FragCoord.y / uResolution.y;
    float edge = max(1.0 - smoothstep(0.0, 0.2, screenY), smoothstep(0.8, 1.0, screenY));
    c = mix(c, vec3(0.0578), edge * 0.5);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`;
const mod = (value, divisor)=>(value % divisor + divisor) % divisor;
const clamp = (value, limit)=>Math.max(-limit, Math.min(limit, value));
export async function createSpiral(options) {
    const { canvas, container, onReady, onFallback, onSelected, onHover, onActivate } = options;
    let renderer;
    let software = false;
    try {
        const context = canvas.getContext("webgl2", {
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        if (context) renderer = new THREE.WebGLRenderer({
            canvas,
            context,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        else {
            renderer = new CanvasSpiralRenderer(canvas);
            software = true;
        }
    } catch  {
        canvas.dataset.renderer = "fallback";
        onFallback();
        return null;
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x0a0a0a, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 8);
    const geometry = new THREE.PlaneGeometry(1, 1, 8, 8);
    const proxyMaterial = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide
    });
    const meshes = [];
    const proxies = [];
    const materials = [];
    const count = 24;
    const pulseEnabled = artworks.some((art)=>art.pulse);
    const hoverValues = new Float32Array(count);
    const pointer = new THREE.Vector2(10, 10);
    const point = new THREE.Vector3();
    const toCamera = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const intersections = [];
    const resolution = new THREE.Vector2();
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    let rect = container.getBoundingClientRect();
    let mobile = rect.width < 768;
    let radius = mobile ? 0.9 : 2;
    let width = mobile ? 1.55 : 1.7;
    let cardHeight = mobile ? 1.55 / 1.7 : 1;
    let gapY = mobile ? 1.1 : 0.5;
    let centerY = mobile ? -1.85 * gapY + 0.06 : -0.8;
    let curve = mobile ? 0.025 : 0.1;
    let speedBend = mobile ? 0.6 : 2;
    let phase = 2.15;
    let previousPhase = phase;
    let renderPhase = phase;
    let targetSpeed = 0;
    let speed = 0;
    let direction = 1;
    let accumulator = 0;
    let lastTime = 0;
    let lastRenderTime = 0;
    let frameHandle = 0;
    let disposed = false;
    let failed = false;
    let contextLost = false;
    let paused = false;
    let covered = false;
    let inView = true;
    let keyboardFocus = false;
    let pointerInside = false;
    let hoveredMesh = -1;
    let lastHoverIndex = null;
    let selectedIndex = -1;
    let hoverAnimating = false;
    let firstFrame = true;
    let activeId = -1;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let startTime = 0;
    let gestureType = "";
    let gestureState = 0;
    let badGesture = false;
    let tapEligible = false;
    const pointers = new Set();
    const samplePosition = new Float64Array(12);
    const sampleTime = new Float64Array(12);
    let sampleCount = 0;
    let sampleCursor = 0;
    let textures = [];
    try {
        const loader = new THREE.TextureLoader();
        const results = await Promise.allSettled(artworks.map((art)=>loader.loadAsync(art.image)));
        textures = results.flatMap((result)=>result.status === "fulfilled" ? [
                result.value
            ] : []);
        if (textures.length !== artworks.length) throw new Error("Artwork could not load");
        textures.forEach((texture)=>{
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
        });
        for(let i = 0; i < count; i++){
            const texture = textures[i % artworks.length];
            const image = texture.image;
            const material = new THREE.ShaderMaterial({
                side: THREE.DoubleSide,
                vertexShader: VERTEX,
                fragmentShader: FRAGMENT,
                uniforms: {
                    uImage: {
                        value: texture
                    },
                    uImageAspect: {
                        value: image.naturalWidth / image.naturalHeight
                    },
                    uCardAspect: {
                        value: width / cardHeight
                    },
                    uHover: {
                        value: 0
                    },
                    uHasText: {
                        value: artworks[i % artworks.length].hasText ? 1 : 0
                    },
                    uMobile: {
                        value: mobile ? 1 : 0
                    },
                    uPulse: {
                        value: artworks[i % artworks.length].pulse ? 1 : 0
                    },
                    uPulseTime: {
                        value: 0
                    },
                    uSpeed: {
                        value: 0
                    },
                    uCurve: {
                        value: curve
                    },
                    uSpeedBend: {
                        value: speedBend
                    },
                    uResolution: {
                        value: resolution
                    }
                }
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.frustumCulled = false;
            scene.add(mesh);
            meshes.push(mesh);
            materials.push(material);
            const proxyGeometry = geometry.clone();
            proxyGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
            const proxy = new THREE.Mesh(proxyGeometry, proxyMaterial);
            proxy.userData.index = i;
            proxies.push(proxy);
        }
    } catch  {
        geometry.dispose();
        proxyMaterial.dispose();
        textures.forEach((texture)=>texture.dispose());
        renderer.dispose();
        canvas.dataset.renderer = "fallback";
        onFallback();
        return null;
    }
    const eligible = ()=>!disposed && !failed && !contextLost && !document.hidden && inView && !covered;
    const idleEnabled = ()=>!keyboardFocus && activeId === -1 && pointers.size === 0;
    const running = ()=>!paused && (idleEnabled() || Math.abs(speed) > 0.00001 || Math.abs(targetSpeed) > 0.00001);
    const requestFrame = ()=>{
        if (eligible() && !frameHandle) frameHandle = requestAnimationFrame(frame);
    };
    const stop = ()=>{
        cancelAnimationFrame(frameHandle);
        frameHandle = 0;
        lastTime = 0;
        lastRenderTime = 0;
        accumulator = 0;
    };
    const setHover = (meshIndex)=>{
        if (hoveredMesh !== meshIndex) {
            hoveredMesh = meshIndex;
            hoverAnimating = true;
        }
        const next = meshIndex < 0 ? null : meshIndex % artworks.length;
        if (next !== lastHoverIndex) {
            lastHoverIndex = next;
            onHover(next);
        }
        canvas.style.cursor = next !== null && artworks[next].href ? "pointer" : "default";
    };
    const updatePointer = (event)=>{
        pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
        pointer.y = -(event.clientY - rect.top) / rect.height * 2 + 1;
    };
    const sample = (x, time)=>{
        samplePosition[sampleCursor] = x;
        sampleTime[sampleCursor] = time;
        sampleCursor = (sampleCursor + 1) % samplePosition.length;
        sampleCount = Math.min(sampleCount + 1, samplePosition.length);
    };
    const place = ()=>{
        let score = -Infinity;
        let nearest = 0;
        for(let i = 0; i < count; i++){
            const q = mod(i - renderPhase, count) - count / 2;
            const angle = q * 0.85;
            const mesh = meshes[i];
            mesh.position.set(Math.cos(angle) * radius, q * gapY + centerY, Math.sin(angle) * radius);
            mesh.rotation.set(0, -angle + Math.PI / 2, 0);
            mesh.scale.set(width, cardHeight, 1);
            mesh.updateMatrixWorld(true);
            mesh.material.uniforms.uSpeed.value = speed;
            const candidateScore = mesh.position.z - Math.abs(mesh.position.y) * 0.3;
            if (candidateScore > score) {
                score = candidateScore;
                nearest = i % artworks.length;
            }
        }
        if (nearest !== selectedIndex) {
            selectedIndex = nearest;
            onSelected(nearest);
        }
    };
    const pick = ()=>{
        for(let i = 0; i < count; i++){
            const mesh = meshes[i];
            const positions = proxies[i].geometry.getAttribute("position");
            const base = geometry.getAttribute("position");
            const uv = geometry.getAttribute("uv");
            for(let j = 0; j < positions.count; j++){
                point.set(base.getX(j), base.getY(j), Math.sin(uv.getX(j) * Math.PI) * 0.2).applyMatrix4(mesh.matrixWorld);
                point.x += point.y * point.y * curve + Math.sin(uv.getY(j) * Math.PI) * speed * speedBend;
                positions.setXYZ(j, point.x, point.y, point.z);
            }
        }
        raycaster.setFromCamera(pointer, camera);
        intersections.length = 0;
        raycaster.intersectObjects(proxies, false, intersections);
        for (const hit of intersections){
            if (!hit.uv || !hit.face) continue;
            const index = hit.object.userData.index;
            const cropHover = hoverValues[index] * (1 - materials[index].uniforms.uHasText.value);
            const mask = 1 - cropHover * 0.05;
            const dx = Math.abs(hit.uv.x - 0.5) - (0.5 * mask - 0.05);
            const dy = Math.abs(hit.uv.y - 0.5) - (0.5 * mask - 0.05);
            const sdf = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - 0.05;
            if (sdf > 0) continue;
            toCamera.copy(camera.position).sub(hit.point);
            return hit.face.normal.dot(toCamera) > 0 ? index : -1;
        }
        return -1;
    };
    function frame(time) {
        frameHandle = 0;
        if (!eligible()) {
            lastTime = 0;
            return;
        }
        const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 1 / 60;
        lastTime = time;
        if (!paused) {
            accumulator += dt;
            let steps = 0;
            while(accumulator >= 1 / 60 && steps < 3){
                previousPhase = phase;
                speed += (targetSpeed - speed) * 0.1;
                phase += speed;
                const idleSpeed = mobile ? 0.0015 : 0.002;
                if (idleEnabled() && Math.abs(targetSpeed) < idleSpeed) targetSpeed = direction * idleSpeed;
                targetSpeed *= 0.9;
                if (!idleEnabled() && Math.abs(targetSpeed) < 0.00001 && Math.abs(speed) < 0.00001) {
                    targetSpeed = 0;
                    speed = 0;
                }
                accumulator -= 1 / 60;
                steps++;
            }
            renderPhase = previousPhase + (phase - previousPhase) * Math.min(1, accumulator * 60);
        } else renderPhase = phase;
        const shouldRender = !mobile && !software || firstFrame || time - lastRenderTime >= 30 || hoverAnimating;
        if (shouldRender) {
            place();
            if (pointerInside && fine.matches && !mobile && gestureState <= 0) setHover(pick());
            const renderDt = lastRenderTime ? Math.min(0.05, (time - lastRenderTime) / 1000) : 1 / 60;
            hoverAnimating = false;
            for(let i = 0; i < count; i++){
                const target = i === hoveredMesh ? 1 : 0;
                const alpha = 1 - Math.pow(target ? 0.91 : 0.93, renderDt * 1000 * 0.2);
                hoverValues[i] += (target - hoverValues[i]) * alpha;
                if (Math.abs(target - hoverValues[i]) > 0.001) hoverAnimating = true;
                materials[i].uniforms.uHover.value = hoverValues[i];
                materials[i].uniforms.uPulseTime.value = time / 1000 % 2.4;
            }
            renderer.render(scene, camera);
            if (firstFrame && !failed) {
                firstFrame = false;
                canvas.dataset.renderer = software ? "canvas2d" : "webgl";
                onReady();
            }
            lastRenderTime = time;
        }
        if (running() || hoverAnimating || pulseEnabled) requestFrame();
    }
    function resize() {
        rect = container.getBoundingClientRect();
        mobile = rect.width < 768;
        radius = mobile ? 0.9 : 2;
        width = mobile ? 1.55 : 1.7;
        cardHeight = mobile ? width / 1.7 : 1;
        gapY = mobile ? 1.1 : 0.5;
        centerY = mobile ? -1.85 * gapY + 0.06 : -0.8;
        curve = mobile ? 0.025 : 0.1;
        speedBend = mobile ? 0.6 : 2;
        camera.fov = rect.width < 900 ? 45 : 35;
        camera.aspect = rect.width / Math.max(rect.height, 1);
        const tangent = Math.tan(camera.fov * Math.PI / 360);
        camera.position.z = mobile ? radius + Math.max(width / (2 * tangent * camera.aspect * 0.78), cardHeight / (2 * tangent * 0.4)) : 8;
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld(true);
        renderer.setPixelRatio(mobile ? Math.min(devicePixelRatio, 2) : Math.min(Math.max(devicePixelRatio, 1.5), 2));
        renderer.setSize(rect.width, rect.height, false);
        renderer.getDrawingBufferSize(resolution);
        materials.forEach((material)=>{
            material.uniforms.uCurve.value = curve;
            material.uniforms.uSpeedBend.value = speedBend;
            material.uniforms.uCardAspect.value = width / cardHeight;
            material.uniforms.uMobile.value = mobile ? 1 : 0;
        });
        firstFrame = true;
        cancelGesture();
        pointerInside = false;
        setHover(-1);
        requestFrame();
    }
    function cancelGesture() {
        if (activeId !== -1 && canvas.hasPointerCapture(activeId)) canvas.releasePointerCapture(activeId);
        activeId = -1;
        gestureState = 0;
        badGesture = true;
        tapEligible = false;
        pointers.clear();
    }
    function wheel(event) {
        if (!eligible() || event.ctrlKey) return;
        event.preventDefault();
        const delta = event.deltaY || event.deltaX;
        const pixels = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1);
        if (!pixels) return;
        direction = Math.sign(pixels);
        if (paused) {
            phase += pixels * 0.0015;
            previousPhase = phase;
        } else targetSpeed = clamp(targetSpeed + pixels * 0.00015, 2);
        requestFrame();
    }
    function pointerDown(event) {
        if (!eligible() || event.button > 0) return;
        pointers.add(event.pointerId);
        if (pointers.size > 1) {
            badGesture = true;
            tapEligible = false;
            gestureState = -1;
            if (activeId !== -1 && canvas.hasPointerCapture(activeId)) canvas.releasePointerCapture(activeId);
            targetSpeed = speed = 0;
            return;
        }
        activeId = event.pointerId;
        startX = lastX = event.clientX;
        startY = lastY = event.clientY;
        startTime = event.timeStamp;
        gestureType = event.pointerType;
        gestureState = 0;
        badGesture = false;
        tapEligible = true;
        sampleCount = sampleCursor = 0;
        if (mobile || gestureType !== "mouse") {
            targetSpeed = speed = 0;
            previousPhase = phase;
        }
        updatePointer(event);
        pointerInside = true;
    }
    function pointerMove(event) {
        updatePointer(event);
        pointerInside = true;
        if (activeId === event.pointerId && !badGesture && pointers.size === 1) {
            const totalX = event.clientX - startX;
            const totalY = event.clientY - startY;
            if (Math.hypot(totalX, totalY) > 8) tapEligible = false;
            if (mobile || gestureType !== "mouse") {
                if (!gestureState && Math.hypot(totalX, totalY) > 8) {
                    gestureState = Math.abs(totalX) >= Math.abs(totalY) ? 1 : 2;
                    sample(gestureState === 1 ? -startX : -startY, startTime);
                    canvas.setPointerCapture(event.pointerId);
                    setHover(-1);
                }
                if (gestureState > 0) {
                    const delta = gestureState === 1 ? lastX - event.clientX : lastY - event.clientY;
                    if (delta) direction = Math.sign(delta);
                    phase += delta * 0.006;
                    previousPhase = renderPhase = phase;
                    targetSpeed = speed = 0;
                    sample(gestureState === 1 ? -event.clientX : -event.clientY, event.timeStamp);
                }
            }
            lastX = event.clientX;
            lastY = event.clientY;
        }
        requestFrame();
    }
    function pointerUp(event) {
        pointers.delete(event.pointerId);
        if (activeId !== event.pointerId) return;
        const wasDrag = gestureState > 0;
        if (wasDrag && !badGesture && !paused) {
            sample(gestureState === 1 ? -event.clientX : -event.clientY, event.timeStamp);
            const latest = (sampleCursor + samplePosition.length - 1) % samplePosition.length;
            let oldest = latest;
            for(let j = 1; j < sampleCount; j++){
                const index = (latest - j + samplePosition.length) % samplePosition.length;
                if (sampleTime[latest] - sampleTime[index] > 80) break;
                oldest = index;
            }
            const duration = sampleTime[latest] - sampleTime[oldest];
            if (duration > 0) targetSpeed = clamp((samplePosition[latest] - samplePosition[oldest]) / duration * 16.6667 * 0.006, 0.07);
        }
        const tap = tapEligible && !badGesture && !wasDrag && Math.hypot(event.clientX - startX, event.clientY - startY) <= 8;
        activeId = -1;
        gestureState = 0;
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        if (tap) {
            updatePointer(event);
            place();
            const hit = pick();
            if (hit >= 0 && artworks[hit % artworks.length].href) onActivate(hit % artworks.length);
        }
        requestFrame();
    }
    function pointerCancel(event) {
        pointers.delete(event.pointerId);
        if (event.pointerId === activeId) {
            cancelGesture();
            targetSpeed = speed = 0;
            setHover(-1);
            requestFrame();
        }
    }
    function pointerLeave() {
        pointerInside = false;
        setHover(-1);
        requestFrame();
        if (gestureType === "mouse" && activeId !== -1 && gestureState <= 0) cancelGesture();
    }
    function visibility() {
        stop();
        cancelGesture();
        pointerInside = false;
        setHover(-1);
        if (!document.hidden) requestFrame();
    }
    function pointerCapability() {
        pointerInside = false;
        setHover(-1);
        stop();
        requestFrame();
    }
    function focusChanged() {
        keyboardFocus = !!document.activeElement?.matches(":focus-visible");
        requestFrame();
    }
    function lostContext(event) {
        event.preventDefault();
        contextLost = true;
        stop();
        canvas.dataset.renderer = "fallback";
        onFallback();
    }
    function restoredContext() {
        contextLost = false;
        firstFrame = true;
        lastTime = 0;
        requestFrame();
    }
    renderer.debug.onShaderError = ()=>{
        failed = true;
        stop();
        canvas.dataset.renderer = "fallback";
        onFallback();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver((entries)=>{
        inView = entries[0].isIntersecting;
        if (!inView) stop();
        else requestFrame();
    }, {
        threshold: 0.01
    });
    intersectionObserver.observe(container);
    const page = container.parentElement;
    canvas.addEventListener("wheel", wheel, {
        passive: false
    });
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerCancel);
    canvas.addEventListener("lostpointercapture", pointerCancel);
    canvas.addEventListener("pointerleave", pointerLeave);
    canvas.addEventListener("webglcontextlost", lostContext);
    canvas.addEventListener("webglcontextrestored", restoredContext);
    document.addEventListener("visibilitychange", visibility);
    fine.addEventListener("change", pointerCapability);
    page.addEventListener("focusin", focusChanged);
    page.addEventListener("focusout", focusChanged);
    resize();
    return {
        setPaused (value) {
            paused = value;
            if (paused) {
                speed = targetSpeed = 0;
                previousPhase = phase;
                stop();
            }
            requestFrame();
        },
        setCovered (value) {
            covered = value;
            pointerInside = false;
            setHover(-1);
            stop();
            if (!value) requestFrame();
        },
        step (value) {
            pointerInside = false;
            setHover(-1);
            direction = Math.sign(value);
            phase += value;
            previousPhase = phase;
            renderPhase = phase;
            speed = targetSpeed = 0;
            requestFrame();
        },
        dispose () {
            disposed = true;
            stop();
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
            canvas.removeEventListener("wheel", wheel);
            canvas.removeEventListener("pointerdown", pointerDown);
            canvas.removeEventListener("pointermove", pointerMove);
            canvas.removeEventListener("pointerup", pointerUp);
            canvas.removeEventListener("pointercancel", pointerCancel);
            canvas.removeEventListener("lostpointercapture", pointerCancel);
            canvas.removeEventListener("pointerleave", pointerLeave);
            canvas.removeEventListener("webglcontextlost", lostContext);
            canvas.removeEventListener("webglcontextrestored", restoredContext);
            document.removeEventListener("visibilitychange", visibility);
            fine.removeEventListener("change", pointerCapability);
            page.removeEventListener("focusin", focusChanged);
            page.removeEventListener("focusout", focusChanged);
            geometry.dispose();
            proxyMaterial.dispose();
            proxies.forEach((proxy)=>proxy.geometry.dispose());
            materials.forEach((material)=>material.dispose());
            textures.forEach((texture)=>texture.dispose());
            renderer.dispose();
            canvas.style.cursor = "";
        }
    };
}
