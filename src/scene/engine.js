import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { animate, createTimeline } from "animejs";
import { assetUrl } from "../lib/assets.js";

const SECTIONS = ["home", "work", "about", "contact"];
const MODEL_URL = assetUrl("models/camera.glb");
const MODEL_SIZE = 2.7;
const CAMERA_Z = 7.4;
const FOV = 38;

// x / y are fractions of the visible half-width / half-height.
// ry keeps growing, so the camera spins a little further in every section.
const POSES = {
  desktop: [
    { x: 0.46, y: 0.02, s: 1.05, rx: 0.1, ry: -0.45, rz: 0.0, o: 1 },
    { x: -0.86, y: 0.12, s: 0.5, rx: 0.2, ry: 1.6, rz: 0.2, o: 0.12 },
    { x: -0.5, y: -0.02, s: 1.2, rx: -0.12, ry: 3.3, rz: -0.12, o: 1 },
    { x: 0.0, y: 0.52, s: 0.8, rx: 0.3, ry: 5.1, rz: 0.06, o: 1 },
  ],
  mobile: [
    { x: 0.0, y: -0.85, s: 0.65, rx: 0.12, ry: -0.45, rz: 0.0, o: 1 },
    { x: 0.55, y: 0.8, s: 0.4, rx: 0.2, ry: 1.6, rz: 0.2, o: 0.1 },
    { x: 0.0, y: 0.62, s: 0.85, rx: -0.1, ry: 3.3, rz: -0.1, o: 1 },
    { x: 0.0, y: 0.58, s: 0.85, rx: 0.25, ry: 5.1, rz: 0.05, o: 1 },
  ],
};

const ACCENTS = ["#ff6b97", "#ffb570", "#66ffe3", "#4da6ff"];
const HEX_COLORS = ["#ff6b97", "#ffb570", "#ffe478", "#cfff70", "#66ffe3", "#4da6ff", "#bd4882", "#8fde5d"];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function tuneMaterials(root) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!material) continue;
      if ("envMapIntensity" in material) material.envMapIntensity = 1.2;
      // The camera body is almost black; lift it slightly so detail reads on dark backgrounds.
      if (material.color && !material.transparent) {
        const { r, g, b } = material.color;
        const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
        if (lum < 0.16) {
          material.color.lerp(new THREE.Color("#3c3c3c"), lum < 0.02 ? 0.24 : 0.16);
          if ("roughness" in material) material.roughness = Math.max(material.roughness, 0.38);
          if ("envMapIntensity" in material) material.envMapIntensity = 1.5;
        }
      }
      material.needsUpdate = true;
    }
  });
}

export function createScene(host, { theme = "dark", reducedMotion = false } = {}) {
  const mobileQuery = window.matchMedia("(max-width: 820px)");
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const canvas = document.createElement("canvas");
  canvas.className = "scene-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !mobileQuery.matches,
    powerPreference: mobileQuery.matches ? "low-power" : "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobileQuery.matches ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAMERA_Z);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.75;
  room.dispose?.();
  pmrem.dispose();

  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  scene.add(new THREE.HemisphereLight(0xffffeb, 0x473b78, 1.1));
  const key = new THREE.DirectionalLight(0xffffeb, 3.2);
  key.position.set(4, 7, 7);
  scene.add(key);
  const front = new THREE.DirectionalLight(0xfff4e8, 2.0);
  front.position.set(-2.5, 2.4, 9);
  scene.add(front);

  const rimA = new THREE.PointLight(ACCENTS[0], 38, 24, 2);
  rimA.position.set(3.8, 2.2, 3.4);
  const rimB = new THREE.PointLight("#66ffe3", 26, 22, 2);
  rimB.position.set(-4.2, -1.2, 2.8);
  const rimC = new THREE.PointLight("#ffb570", 22, 22, 2);
  rimC.position.set(0.4, -3.4, 3.6);
  scene.add(rimA, rimB, rimC);

  // stage = everything that follows the scroll choreography
  const stage = new THREE.Group();
  scene.add(stage);

  const orbit = new THREE.Group();
  stage.add(orbit);
  const disposables = [];

  const ringMat = new THREE.MeshBasicMaterial({ color: "#ff6b97", transparent: true, opacity: 0.35, depthWrite: false });
  const ringMat2 = new THREE.MeshBasicMaterial({ color: "#66ffe3", transparent: true, opacity: 0.22, depthWrite: false });
  const ringGeo = new THREE.TorusGeometry(2.45, 0.01, 6, 160);
  const ringGeo2 = new THREE.TorusGeometry(3.0, 0.008, 6, 160);
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.rotation.set(1.2, 0.35, 0.2);
  const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
  ring2.rotation.set(1.35, -0.5, -0.5);
  orbit.add(ring1, ring2);
  disposables.push(ringMat, ringMat2, ringGeo, ringGeo2);

  const hexGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 6);
  hexGeo.rotateX(Math.PI / 2);
  disposables.push(hexGeo);
  const hexes = [];
  const hexCount = mobileQuery.matches ? 6 : 10;
  for (let i = 0; i < hexCount; i++) {
    const color = new THREE.Color(HEX_COLORS[i % HEX_COLORS.length]);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.15,
      emissive: color.clone().multiplyScalar(0.25),
    });
    disposables.push(mat);
    const mesh = new THREE.Mesh(hexGeo, mat);
    const angle = (i / hexCount) * Math.PI * 2;
    const radius = 2.1 + (i % 3) * 0.42;
    mesh.userData = { angle, radius, speed: 0.12 + (i % 4) * 0.035, bob: i * 1.7, y: ((i % 5) - 2) * 0.32 };
    mesh.scale.setScalar(0.8 + (i % 3) * 0.35);
    hexes.push(mesh);
    orbit.add(mesh);
  }

  const modelHolder = new THREE.Group();
  stage.add(modelHolder);
  let model = null;

  const rig = { ...POSES.desktop[0] };
  const intro = { s: 0.4, ry: -2.6, o: 0 };
  let timeline = null;
  let poses = null;

  const buildTimeline = () => {
    timeline?.revert();
    poses = mobileQuery.matches ? POSES.mobile : POSES.desktop;
    Object.assign(rig, poses[0]);
    timeline = createTimeline({ autoplay: false });
    for (const prop of ["x", "y", "s", "rx", "ry", "rz", "o"]) {
      timeline.add(
        rig,
        {
          [prop]: poses.slice(1).map((pose) => ({ to: pose[prop], duration: 1000, ease: "inOutCubic" })),
        },
        0,
      );
    }
  };
  buildTimeline();

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const ready = new Promise((resolve) => {
    loader.load(
      MODEL_URL,
      (gltf) => {
        model = gltf.scene;
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center);
        const holder = new THREE.Group();
        holder.add(model);
        holder.scale.setScalar(MODEL_SIZE / (Math.max(size.x, size.y, size.z) || 1));
        holder.rotation.y = Math.PI;
        tuneMaterials(model);
        modelHolder.add(holder);
        resolve(true);
      },
      undefined,
      (error) => {
        console.error("Could not load the 3D model", error);
        resolve(false);
      },
    );
  });

  // Layout ------------------------------------------------------------------
  let width = 1;
  let height = 1;
  let halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAMERA_Z;
  let halfW = halfH;
  let fit = 1;
  let tops = [0, 0, 0, 0];
  let maxScroll = 1;

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (w === width && h === height) return;
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfW = halfH * camera.aspect;
    fit = Math.min(1, (halfW * 2 * 0.8) / MODEL_SIZE);
    dirty = true;
  };

  const measure = () => {
    const y = window.scrollY;
    tops = SECTIONS.map((id) => {
      const el = document.getElementById(id);
      return el ? el.getBoundingClientRect().top + y : 0;
    });
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  };

  // Maps scrollY to a float "pose index" so every section change is eased by the Anime.js timeline.
  const sectionProgress = (y) => {
    const span = window.innerHeight * 0.95;
    let p = 0;
    for (let i = 1; i < SECTIONS.length; i++) {
      const end = i === SECTIONS.length - 1 ? Math.min(tops[i], maxScroll) : tops[i];
      const t = clamp((y - (end - span)) / span, 0, 1);
      if (t <= 0) break;
      p = i - 1 + t;
      if (t < 1) break;
    }
    return p;
  };

  // Frame loop ----------------------------------------------------------------
  const tmpColor = new THREE.Color();
  const accentA = new THREE.Color();
  const accentB = new THREE.Color();
  let smoothP = 0;
  let lastY = window.scrollY;
  let velocity = 0;
  let spin = 0;
  let pointerX = 0;
  let pointerY = 0;
  let px = 0;
  let py = 0;
  let lastFrame = performance.now();
  let lastRender = 0;
  let lastOpacity = -1;
  let dirty = true;
  let raf = 0;
  let disposed = false;

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    if (document.hidden || disposed) return;

    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;
    velocity += (dy - velocity) * (1 - Math.exp(-dt * 10));
    spin += dy * 0.0019;

    const target = sectionProgress(y);
    const ease = reducedMotion ? 1 : 1 - Math.exp(-dt * 5.5);
    smoothP += (target - smoothP) * ease;
    const moving = Math.abs(target - smoothP) > 0.0008 || Math.abs(velocity) > 0.05;

    const idleMotion = !reducedMotion && rig.o * intro.o > 0.03;
    // On phones the idle float renders at 30fps; scrolling gets the full refresh rate.
    if (!moving && !dirty && mobileQuery.matches && now - lastRender < 33) return;
    if (!moving && !dirty && !idleMotion) return;

    timeline.seek(smoothP * 1000);

    px += (pointerX - px) * (1 - Math.exp(-dt * 4));
    py += (pointerY - py) * (1 - Math.exp(-dt * 4));
    const t = now / 1000;
    const idleY = idleMotion ? Math.sin(t * 0.45) * 0.07 : 0;
    const idleBob = idleMotion ? Math.sin(t * 0.8) * 0.045 : 0;

    stage.position.set(rig.x * halfW, rig.y * halfH + idleBob, 0);
    stage.scale.setScalar(rig.s * fit * intro.s);
    stage.rotation.set(
      rig.rx + py * 0.18,
      rig.ry + spin * 0.35 + idleY + px * 0.25 + intro.ry,
      rig.rz + clamp(velocity * 0.004, -0.2, 0.2),
    );

    orbit.rotation.z += dt * 0.12;
    for (const hex of hexes) {
      const d = hex.userData;
      d.angle += dt * d.speed;
      hex.position.set(
        Math.cos(d.angle) * d.radius,
        d.y + Math.sin(t * 0.9 + d.bob) * 0.12,
        Math.sin(d.angle) * d.radius * 0.55,
      );
      hex.rotation.x += dt * 0.5;
      hex.rotation.y += dt * 0.35;
    }

    const idx = clamp(Math.floor(smoothP), 0, ACCENTS.length - 2);
    const frac = clamp(smoothP - idx, 0, 1);
    accentA.set(ACCENTS[idx]);
    accentB.set(ACCENTS[idx + 1]);
    tmpColor.copy(accentA).lerp(accentB, frac);
    rimA.color.copy(tmpColor);
    ringMat.color.copy(tmpColor);

    const opacity = Math.round(rig.o * intro.o * 100) / 100;
    if (opacity !== lastOpacity) {
      canvas.style.opacity = String(opacity);
      lastOpacity = opacity;
    }

    renderer.render(scene, camera);
    lastRender = now;
    dirty = false;
  };

  const onPointer = (event) => {
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
  };
  if (!coarse && !reducedMotion) window.addEventListener("pointermove", onPointer, { passive: true });

  const onModeChange = () => {
    buildTimeline();
    measure();
    resize();
    dirty = true;
  };
  mobileQuery.addEventListener("change", onModeChange);

  const resizeObserver = new ResizeObserver(() => {
    resize();
    measure();
  });
  resizeObserver.observe(canvas);
  resizeObserver.observe(document.body);
  window.addEventListener("load", measure);

  const applyTheme = (name) => {
    renderer.toneMappingExposure = name === "light" ? 1.02 : 1.22;
    scene.environmentIntensity = name === "light" ? 0.9 : 0.75;
    dirty = true;
  };
  applyTheme(theme);
  resize();
  measure();
  raf = requestAnimationFrame(frame);

  let introAnim = null;
  ready.then((ok) => {
    if (disposed) return;
    measure();
    dirty = true;
    if (!ok) return;
    if (reducedMotion) {
      Object.assign(intro, { s: 1, ry: 0, o: 1 });
    } else {
      introAnim = animate(intro, { s: 1, ry: 0, o: 1, duration: 1800, ease: "outExpo" });
    }
  });

  return {
    ready,
    setTheme: applyTheme,
    refresh: () => {
      measure();
      dirty = true;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("load", measure);
      mobileQuery.removeEventListener("change", onModeChange);
      resizeObserver.disconnect();
      introAnim?.revert();
      timeline?.revert();
      model?.traverse((child) => {
        if (!child.isMesh) return;
        child.geometry?.dispose();
        for (const m of Array.isArray(child.material) ? child.material : [child.material]) {
          if (!m) continue;
          for (const value of Object.values(m)) if (value?.isTexture) value.dispose();
          m.dispose();
        }
      });
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
