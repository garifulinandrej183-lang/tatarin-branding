import * as THREE from "three";

// A CPU-projected, triangle-textured canvas keeps the experience usable when
// the browser cannot allocate WebGL. It shares the scene, deformation, and input.
export class CanvasSpiralRenderer {
  readonly isSoftware = true;
  outputColorSpace = THREE.SRGBColorSpace;
  readonly capabilities = { getMaxAnisotropy: () => 1 };
  readonly debug: { onShaderError?: () => void } = {};
  private readonly context: CanvasRenderingContext2D;
  private readonly point = new THREE.Vector3();
  private readonly normal = new THREE.Vector3();
  private readonly viewer = new THREE.Vector3();
  private readonly screen = new Float64Array(81 * 2);
  private readonly source = new Float64Array(81 * 2);
  private readonly ordering: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  private readonly backs = new Map<HTMLImageElement, HTMLCanvasElement>();
  private pixelRatio = 1;
  private pixelWidth = 1;
  private pixelHeight = 1;
  private edge: CanvasGradient | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("Canvas is unavailable");
    this.context = context;
  }
  setClearColor(_color: number, _alpha: number) {}
  setPixelRatio(ratio: number) { this.pixelRatio = Math.min(ratio, 2); }
  setSize(width: number, height: number, _updateStyle: boolean) {
    this.pixelWidth = Math.max(1, Math.round(width * this.pixelRatio));
    this.pixelHeight = Math.max(1, Math.round(height * this.pixelRatio));
    this.canvas.width = this.pixelWidth; this.canvas.height = this.pixelHeight;
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = "high";
    this.edge = this.context.createLinearGradient(0, 0, 0, this.pixelHeight);
    this.edge.addColorStop(0, "#44444480"); this.edge.addColorStop(0.2, "#44444400");
    this.edge.addColorStop(0.8, "#44444400"); this.edge.addColorStop(1, "#44444480");
  }
  getDrawingBufferSize(target: THREE.Vector2) { return target.set(this.pixelWidth, this.pixelHeight); }

  private project(u: number, v: number, mesh: THREE.Mesh, camera: THREE.Camera, speed: number, curve: number, bend: number) {
    this.point.set(u - 0.5, v - 0.5, Math.sin(u * Math.PI) * 0.2).applyMatrix4(mesh.matrixWorld);
    this.point.x += this.point.y * this.point.y * curve + Math.sin(v * Math.PI) * speed * bend;
    this.point.project(camera);
  }
  private roundedPath(mesh: THREE.Mesh, camera: THREE.Camera, speed: number, curve: number, bend: number, maskSize: number) {
    const ctx = this.context;
    const inset = (1 - maskSize) / 2;
    const lo = inset + 0.05, hi = 1 - inset - 0.05;
    ctx.beginPath();
    for (let corner = 0; corner < 4; corner++) {
      const centerU = corner === 0 || corner === 3 ? hi : lo;
      const centerV = corner < 2 ? hi : lo;
      for (let j = 0; j <= 8; j++) {
        const a = corner * Math.PI / 2 + j / 8 * Math.PI / 2;
        this.project(centerU + Math.cos(a) * 0.05, centerV + Math.sin(a) * 0.05, mesh, camera, speed, curve, bend);
        const x = (this.point.x + 1) * this.pixelWidth / 2;
        const y = (1 - this.point.y) * this.pixelHeight / 2;
        if (!corner && !j) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
  }
  private backImage(image: HTMLImageElement) {
    const cached = this.backs.get(image);
    if (cached) return cached;
    const back = document.createElement("canvas");
    back.width = 1024; back.height = Math.round(1024 * image.naturalHeight / image.naturalWidth);
    const ctx = back.getContext("2d")!;
    ctx.filter = "blur(9px)";
    ctx.drawImage(image, -20, -20, back.width + 40, back.height + 40);
    this.backs.set(image, back);
    return back;
  }
  private pulseBar(u: number, v: number, halfU: number, halfV: number, mesh: THREE.Mesh, camera: THREE.Camera, speed: number, curve: number, bend: number) {
    const ctx = this.context;
    ctx.beginPath();
    for (let corner = 0; corner < 4; corner++) {
      this.project(u + (corner === 1 || corner === 2 ? halfU : -halfU), v + (corner >= 2 ? halfV : -halfV), mesh, camera, speed, curve, bend);
      const x = (this.point.x + 1) * this.pixelWidth / 2;
      const y = (1 - this.point.y) * this.pixelHeight / 2;
      if (corner === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
  }
  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    const ctx = this.context;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.pixelWidth, this.pixelHeight);
    this.ordering.length = 0;
    for (const child of scene.children) {
      if (child instanceof THREE.Mesh) this.ordering.push(child as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>);
    }
    this.ordering.sort((a, b) => a.position.z - b.position.z);
    for (const mesh of this.ordering) {
      const uniforms = mesh.material.uniforms;
      const speed = uniforms.uSpeed.value as number;
      const curve = uniforms.uCurve.value as number;
      const bend = uniforms.uSpeedBend.value as number;
      const image = (uniforms.uImage.value as THREE.Texture).image as HTMLImageElement;
      this.normal.set(0, 0, 1).applyQuaternion(mesh.quaternion);
      this.viewer.copy(camera.position).sub(mesh.position);
      const front = this.normal.dot(this.viewer) > 0;
      const matteBack = !front && uniforms.uMobile.value > 0.5;
      const hover = front ? uniforms.uHover.value as number : 0;
      const hasText = uniforms.uHasText.value as number;
      const cropHover = hover * (1 - hasText);
      const zoom = 1 + cropHover * 0.05;
      const uv = mesh.geometry.getAttribute("uv");
      const index = mesh.geometry.index!;
      const imageAspect = uniforms.uImageAspect.value as number;
      const cardAspect = uniforms.uCardAspect.value as number;
      const sourceImage = front || matteBack ? image : this.backImage(image);
      const sourceWidth = front ? image.naturalWidth : (sourceImage as HTMLCanvasElement).width;
      const sourceHeight = front ? image.naturalHeight : (sourceImage as HTMLCanvasElement).height;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i), v = uv.getY(i);
        this.project(u, v, mesh, camera, speed, curve, bend);
        const x = (this.point.x + 1) * this.pixelWidth / 2;
        const y = (1 - this.point.y) * this.pixelHeight / 2;
        this.screen[i * 2] = x; this.screen[i * 2 + 1] = y;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        let su = (u - 0.5) / zoom + 0.5;
        let sv = (v - 0.5) / zoom + 0.5;
        if (imageAspect > cardAspect) su = (su - 0.5) * cardAspect / imageAspect + 0.5;
        else sv = (sv - 0.5) * imageAspect / cardAspect + 0.5;
        this.source[i * 2] = su * sourceWidth; this.source[i * 2 + 1] = (1 - sv) * sourceHeight;
      }
      if (maxX < 0 || minX > this.pixelWidth || maxY < 0 || minY > this.pixelHeight || maxX - minX < 0.8) continue;
      ctx.save();
      this.roundedPath(mesh, camera, speed, curve, bend, 1 - cropHover * 0.05);
      ctx.clip();
      if (matteBack) { ctx.fillStyle = "#161912"; ctx.fillRect(0, 0, this.pixelWidth, this.pixelHeight); }
      for (let j = 0; !matteBack && j < index.count; j += 3) {
        const i0 = index.getX(j) * 2, i1 = index.getX(j + 1) * 2, i2 = index.getX(j + 2) * 2;
        const sx0 = this.source[i0], sy0 = this.source[i0 + 1], sx1 = this.source[i1], sy1 = this.source[i1 + 1], sx2 = this.source[i2], sy2 = this.source[i2 + 1];
        const x0 = this.screen[i0], y0 = this.screen[i0 + 1], x1 = this.screen[i1], y1 = this.screen[i1 + 1], x2 = this.screen[i2], y2 = this.screen[i2 + 1];
        const determinant = sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1);
        if (Math.abs(determinant) < 0.0001) continue;
        ctx.save();
        // Expand every edge by the same subpixel amount, including skinny
        // perspective triangles. Radial vertex padding leaves diagonal seams.
        const side0 = Math.hypot(x1 - x2, y1 - y2);
        const side1 = Math.hypot(x0 - x2, y0 - y2);
        const side2 = Math.hypot(x0 - x1, y0 - y1);
        const perimeter = side0 + side1 + side2;
        const cx = (x0 * side0 + x1 * side1 + x2 * side2) / perimeter;
        const cy = (y0 * side0 + y1 * side1 + y2 * side2) / perimeter;
        const area2 = Math.abs((x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0));
        const expansion = 0.85 / Math.max(0.05, area2 / perimeter);
        ctx.beginPath();
        ctx.moveTo(x0 + (x0 - cx) * expansion, y0 + (y0 - cy) * expansion);
        ctx.lineTo(x1 + (x1 - cx) * expansion, y1 + (y1 - cy) * expansion);
        ctx.lineTo(x2 + (x2 - cx) * expansion, y2 + (y2 - cy) * expansion);
        ctx.closePath(); ctx.clip();
        const a = (x0 * (sy1 - sy2) + x1 * (sy2 - sy0) + x2 * (sy0 - sy1)) / determinant;
        const b = (y0 * (sy1 - sy2) + y1 * (sy2 - sy0) + y2 * (sy0 - sy1)) / determinant;
        const c = (x0 * (sx2 - sx1) + x1 * (sx0 - sx2) + x2 * (sx1 - sx0)) / determinant;
        const d = (y0 * (sx2 - sx1) + y1 * (sx0 - sx2) + y2 * (sx1 - sx0)) / determinant;
        const e = (x0 * (sx1 * sy2 - sx2 * sy1) + x1 * (sx2 * sy0 - sx0 * sy2) + x2 * (sx0 * sy1 - sx1 * sy0)) / determinant;
        const f = (y0 * (sx1 * sy2 - sx2 * sy1) + y1 * (sx2 * sy0 - sx0 * sy2) + y2 * (sx0 * sy1 - sx1 * sy0)) / determinant;
        ctx.setTransform(a, b, c, d, e, f);
        ctx.drawImage(sourceImage, 0, 0);
        ctx.restore();
      }
      if (front && uniforms.uPulse.value) {
        const wave = 0.5 + 0.5 * Math.sin(uniforms.uPulseTime.value * Math.PI * 2 / 2.4);
        const scale = 0.88 + 0.24 * wave;
        ctx.save(); ctx.fillStyle = "#d8ff45"; ctx.globalAlpha = 0.72 + 0.28 * wave;
        this.pulseBar(0.875, 0.18, 0.054 * scale / cardAspect, 0.0025 * scale, mesh, camera, speed, curve, bend);
        this.pulseBar(0.875, 0.18, 0.0025 * scale / cardAspect, 0.054 * scale, mesh, camera, speed, curve, bend);
        ctx.restore();
      }
      if (hover > 0.001) { ctx.fillStyle = `rgba(0,0,0,${(0.55 - 0.37 * hasText) * hover})`; ctx.fillRect(0, 0, this.pixelWidth, this.pixelHeight); }
      if (this.edge) { ctx.fillStyle = this.edge; ctx.fillRect(0, 0, this.pixelWidth, this.pixelHeight); }
      ctx.restore();
    }
  }
  dispose() { this.backs.clear(); this.ordering.length = 0; this.context.clearRect(0, 0, this.pixelWidth, this.pixelHeight); }
}
