"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { GrahaPosition } from "@/lib/panchang/compute";
import type { GrahaKey } from "@/lib/panchang/names";

// Imperative handle the page uses to drive the scene from its own pointer
// handlers (the canvas itself sits behind scrolling content and never
// receives events).
export type SceneControl = {
  pick: (clientX: number, clientY: number) => GrahaKey | null;
  spin: (radians: number) => void;
};

type Props = {
  grahas: GrahaPosition[];
  earthLongitude: number;
  rashiLabels: { glyph: string; name: string }[];
  grahaLabels: Record<GrahaKey, string>;
  earthLabel: string;
  selected: GrahaKey | null;
  hovered: GrahaKey | null;
  controlRef: RefObject<SceneControl | null>;
};

// Seconds since the scene began — drives the Srishti (creation) sequence.
type Clock = RefObject<number>;

// Sun-centred, as the solar system really is: Surya at the heart on the
// lotus, the planets on their orbits at their true heliocentric longitudes,
// and Bhumi carrying Chandra round her — with Rahu and Ketu, the Moon's
// nodes, on the Moon's orbit. Orbits are spaced evenly, not to scale.
const GRAHA_STYLE: Record<GrahaKey, { orbit: number; size: number; color: string; emissive?: string; glow?: string }> = {
  sun: { orbit: 0, size: 1.05, color: "#ffd56a", glow: "#ffb347" },
  mercury: { orbit: 2.3, size: 0.2, color: "#a59a8a" },
  venus: { orbit: 3.25, size: 0.3, color: "#f2e2b6", emissive: "#3a2f12" },
  mars: { orbit: 5.85, size: 0.27, color: "#c4502e" },
  jupiter: { orbit: 7.25, size: 0.58, color: "#d6b48a" },
  saturn: { orbit: 8.6, size: 0.48, color: "#e3cf9a" },
  // Around the Earth.
  moon: { orbit: 0.85, size: 0.15, color: "#dedad2" },
  rahu: { orbit: 1.15, size: 0.13, color: "#120c1c", emissive: "#2a1040", glow: "#8a4cff" },
  ketu: { orbit: 1.15, size: 0.12, color: "#1c0f0a", emissive: "#3a1606", glow: "#ff6a2a" },
};

const EARTH_ORBIT = 4.45;
const EARTH_BOUND: GrahaKey[] = ["moon", "rahu", "ketu"];

const ZODIAC_INNER = 10.1;
const ZODIAC_OUTER = 11.2;

// When each part of the Srishti sequence unfolds: [start, duration] in seconds.
const SRISHTI = {
  stars: [0.2, 2.8],
  chakra: [0.4, 3],
  bindu: [0.6, 1.6],
  lotus: [1.4, 2.6],
  grahas: [3.0, 2.6],
  zodiac: [4.2, 2.0],
} as const;

const ease = (x: number) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
const phase = (t: number, [start, dur]: readonly [number, number]) => ease((t - start) / dur);

// Deterministic pseudo-random numbers (mulberry32), so stars are laid out
// the same on every render.
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Ecliptic longitude → position in the scene's ecliptic (x-z) plane,
// counter-clockwise seen from above, Mesha 0° on the +x axis.
function onEcliptic(longitude: number, radius: number, y = 0) {
  const a = THREE.MathUtils.degToRad(longitude);
  return new THREE.Vector3(Math.cos(a) * radius, y, -Math.sin(a) * radius);
}

export default function BrahmandaScene(props: Props) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 45, near: 0.1, far: 800, position: [0, 10, 24] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <color attach="background" args={["#020108"]} />
      <Cosmos {...props} />
    </Canvas>
  );
}

function Cosmos({ grahas, earthLongitude, rashiLabels, grahaLabels, earthLabel, selected, hovered, controlRef }: Props) {
  const { raycaster, gl, size, get } = useThree();
  const systemRef = useRef<THREE.Group>(null);
  const spinVelocity = useRef(0);
  const planetMeshes = useRef(new Map<GrahaKey, THREE.Mesh>());
  const still = useMemo(() => reducedMotion(), []);
  // Reduced motion skips straight to the finished cosmos.
  const clock = useRef(still ? 60 : 0);
  const fontsReady = useFontsReady();
  // Phones see the system from further away; enlarge bodies and labels.
  const boost = size.width / size.height < 0.8 ? 1.6 : 1;

  // Pull the camera back (and widen the lens) on narrow screens so the
  // whole zodiac ring stays in frame, and shift the picture down so the
  // system sits below the page heading rather than behind it.
  useEffect(() => {
    // Read from the store: three.js cameras are configured by mutation.
    const cam = get().camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const portrait = aspect < 0.8;
    const dist = portrait ? 46 : aspect < 1.2 ? 33 : 27;
    cam.fov = portrait ? 55 : 45;
    cam.position.set(0, dist * 0.42, dist);
    cam.lookAt(0, 0, 0);
    cam.setViewOffset(size.width, size.height, 0, -size.height * (portrait ? 0.2 : 0.19), size.width, size.height);
    cam.updateProjectionMatrix();
  }, [get, size.width, size.height]);

  useEffect(() => {
    controlRef.current = {
      pick(clientX, clientY) {
        const { camera } = get();
        const rect = gl.domElement.getBoundingClientRect();
        const ndc = new THREE.Vector2(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          -((clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects([...planetMeshes.current.values()], false);
        return (hits[0]?.object.userData.key as GrahaKey | undefined) ?? null;
      },
      spin(radians) {
        if (systemRef.current) systemRef.current.rotation.y += radians;
        spinVelocity.current = radians;
      },
    };
    return () => {
      controlRef.current = null;
    };
  }, [get, raycaster, gl, controlRef]);

  useFrame((_, delta) => {
    clock.current += delta;
    const sys = systemRef.current;
    if (!sys) return;
    // Slow drift plus any leftover momentum from a drag.
    spinVelocity.current *= 0.92;
    sys.rotation.y += spinVelocity.current * 0.6 + (still ? 0 : delta * 0.03);
    // Gentle parallax as the page scrolls past.
    const scroll = Math.min(window.scrollY, 1200);
    sys.position.y = THREE.MathUtils.lerp(sys.position.y, scroll * 0.004, 0.08);
  });

  const register = useMemo(
    () => (key: GrahaKey, mesh: THREE.Mesh | null) => {
      if (mesh) planetMeshes.current.set(key, mesh);
      else planetMeshes.current.delete(key);
    },
    [],
  );

  return (
    <>
      <ambientLight intensity={0.18} />
      <hemisphereLight args={["#7a6ad8", "#1a0f05", 0.22]} />

      <Galaxy clock={clock} />
      <GlowingStars clock={clock} />
      <MilkyWay clock={clock} />
      <ShootingStars still={still} />
      <SudarshanaChakra clock={clock} still={still} />
      <KshiraSagara clock={clock} still={still} />

      <group ref={systemRef} rotation={[0.08, 0, 0]}>
        <Bindu clock={clock} />
        <NabhiKamala clock={clock} still={still} />
        <ZodiacRing labels={rashiLabels} fontsReady={fontsReady} boost={boost} clock={clock} />
        {grahas
          .filter((g) => !EARTH_BOUND.includes(g.key))
          .map((g) => (
            <Graha
              key={g.key}
              graha={g}
              angle={g.helioLongitude ?? 0}
              label={grahaLabels[g.key]}
              boost={boost}
              fontsReady={fontsReady}
              active={selected === g.key || hovered === g.key}
              selected={selected === g.key}
              still={still}
              clock={clock}
              register={register}
            />
          ))}
        <EarthSystem longitude={earthLongitude} still={still} clock={clock} boost={boost} fontsReady={fontsReady} label={earthLabel}>
          {grahas
            .filter((g) => EARTH_BOUND.includes(g.key))
            .map((g) => (
              <Graha
                key={g.key}
                graha={g}
                angle={g.longitude}
                label={grahaLabels[g.key]}
                boost={boost}
                fontsReady={fontsReady}
                active={selected === g.key || hovered === g.key}
                selected={selected === g.key}
                still={still}
                clock={clock}
                register={register}
                // Small bodies close together: named only when looked at.
                quiet
              />
            ))}
        </EarthSystem>
      </group>
    </>
  );
}

function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

// ── The heavens ───────────────────────────────────────────────────────────

const STAR_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpike;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vSpike;
  varying float vSharp;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Each star breathes at its own pace.
    vTwinkle = 0.65 + 0.35 * sin(uTime * (0.8 + fract(aPhase * 7.13) * 2.4) + aPhase * 6.2831);
    vColor = aColor;
    vSpike = aSpike;
    // Faint stars are only a few pixels across; never draw them smaller than
    // ~3px or the sprite falls between pixel centres and vanishes.
    float px = max(aSize * uPixelRatio * (0.85 + 0.25 * vTwinkle), 3.0);
    // The core's falloff is in sprite space, so a tiny sprite needs a soft
    // one — otherwise only the exact centre pixel (if any) lights up.
    vSharp = clamp(px / 26.0, 0.07, 1.0);
    gl_PointSize = px;
    gl_Position = projectionMatrix * mv;
  }
`;

const STAR_FRAGMENT = /* glsl */ `
  uniform float uReveal;
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vSpike;
  varying float vSharp;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d2 = dot(p, p);
    // A hot core, a soft halo and, for the brightest stars, the four-point
    // diffraction spikes a lens sees.
    float core = exp(-d2 * 160.0 * vSharp);
    float halo = exp(-d2 * 22.0 * vSharp) * 0.35;
    float spikes = vSpike * (exp(-abs(p.x) * 90.0) * exp(-abs(p.y) * 7.0) + exp(-abs(p.y) * 90.0) * exp(-abs(p.x) * 7.0)) * 0.8;
    float a = (core + halo + spikes) * vTwinkle * uReveal;
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.6), a);
  }
`;

// Real star colours, from hot blue-white to cool orange.
const STAR_COLORS = ["#9bb0ff", "#aabfff", "#cad7ff", "#f8f7ff", "#f8f7ff", "#fff4ea", "#fff4ea", "#ffd2a1", "#ffcc6f"].map(
  (c) => new THREE.Color(c),
);

function starMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uPixelRatio: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

type StarPoint = { pos: THREE.Vector3; size: number; spike: number; color: THREE.Color; phase: number };

function starGeometry(points: StarPoint[]) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(points.flatMap((s) => s.pos.toArray()), 3));
  geo.setAttribute("aSize", new THREE.Float32BufferAttribute(points.map((s) => s.size), 1));
  geo.setAttribute("aSpike", new THREE.Float32BufferAttribute(points.map((s) => s.spike), 1));
  geo.setAttribute("aPhase", new THREE.Float32BufferAttribute(points.map((s) => s.phase), 1));
  geo.setAttribute("aColor", new THREE.Float32BufferAttribute(points.flatMap((s) => s.color.toArray()), 3));
  return geo;
}

function updateStars(points: THREE.Points | null, t: number, pixelRatio: number, revealScale = 1) {
  const mat = points?.material as THREE.ShaderMaterial | undefined;
  if (!mat) return;
  mat.uniforms.uTime.value = t;
  mat.uniforms.uReveal.value = phase(t, SRISHTI.stars) * revealScale;
  mat.uniforms.uPixelRatio.value = pixelRatio;
}

// Thousands of stars on the celestial sphere, a few of them bright enough
// to flare.
function GlowingStars({ clock }: { clock: Clock }) {
  const ref = useRef<THREE.Points>(null);
  const { geometry, material } = useMemo(() => {
    const rand = seeded(11);
    const stars: StarPoint[] = Array.from({ length: 7000 }, () => {
      // Uniform on a sphere.
      const u = rand() * 2 - 1;
      const th = rand() * Math.PI * 2;
      const r = 220 + rand() * 60;
      const s = Math.sqrt(1 - u * u);
      const bright = rand() < 0.01;
      return {
        pos: new THREE.Vector3(s * Math.cos(th) * r, u * r, s * Math.sin(th) * r),
        // Mostly faint, with a long tail of brighter ones.
        size: bright ? 26 + rand() * 18 : 2.2 + Math.pow(rand(), 6) * 12,
        spike: bright ? 1 : 0,
        color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
        phase: rand(),
      };
    });
    return { geometry: starGeometry(stars), material: starMaterial() };
  }, []);
  useFrame(({ gl }) => updateStars(ref.current, clock.current, gl.getPixelRatio()));
  return <points ref={ref} geometry={geometry} material={material} />;
}

// Soft cloud texture (value noise, several octaves) for the Milky Way.
function cloudTexture(rand: () => number, tint: [number, number, number]) {
  const N = 128;
  const grid = Array.from({ length: 17 * 17 }, () => rand());
  const at = (i: number, j: number) => grid[(j % 17) * 17 + (i % 17)];
  const noise = (x: number, y: number, f: number) => {
    const gx = (x / N) * f;
    const gy = (y / N) * f;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const tx = gx - x0;
    const ty = gy - y0;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(at(x0, y0), at(x0 + 1, y0), sx),
      THREE.MathUtils.lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), sx),
      sy,
    );
  };
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(N, N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const n = noise(x, y, 2) * 0.5 + noise(x, y, 4) * 0.3 + noise(x, y, 8) * 0.2;
      const dx = x / N - 0.5;
      const dy = y / N - 0.5;
      const fall = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2);
      const a = Math.pow(Math.max(0, n - 0.35) * 1.6, 1.5) * fall * fall;
      const i = (y * N + x) * 4;
      img.data[i] = tint[0];
      img.data[i + 1] = tint[1];
      img.data[i + 2] = tint[2];
      img.data[i + 3] = Math.min(255, a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// The galaxy itself, painted on the far sky: the glowing band of the Milky
// Way with its warm central bulge, dark dust lanes along its spine and
// faint coloured nebulae — procedural, so it costs one draw call.
// The galactic plane, chosen to arch diagonally across the camera's view.
const GALACTIC_NORMAL = new THREE.Vector3(0.55, -0.92, 0.39).normalize();

const GALAXY_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GALAXY_FRAGMENT = /* glsl */ `
  uniform vec3 uNormal;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform float uReveal;
  varying vec3 vDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.03 + 11.7;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 d = normalize(vDir);
    float lat = asin(clamp(dot(d, uNormal), -1.0, 1.0));
    float lon = atan(dot(d, uB), dot(d, uA));

    float clouds = fbm(d * 3.2);
    float fine = fbm(d * 9.0 + 4.0);
    // The band, wider and brighter towards the galactic centre (lon 0).
    float toCore = 0.5 + 0.5 * cos(lon);
    float width = 0.13 + 0.12 * toCore;
    float band = exp(-pow(lat / width, 2.0)) * (0.25 + 0.6 * clouds);
    float bulge = exp(-(lon * lon) / 0.22 - (lat * lat) / 0.03);
    // Dust lanes splitting the band along its spine.
    float dust = smoothstep(0.42, 0.7, fbm(d * 5.5 + 2.0)) * exp(-pow(lat / (0.05 + 0.04 * toCore), 2.0));

    vec3 starlight = mix(vec3(0.55, 0.62, 0.95), vec3(1.0, 0.86, 0.66), toCore);
    vec3 col = starlight * band * (0.55 + 0.6 * fine);
    col += vec3(1.0, 0.72, 0.42) * bulge * 0.7;
    col *= 1.0 - 0.85 * dust;
    // Emission and reflection nebulae scattered along the band.
    float neb = smoothstep(0.55, 0.85, fbm(d * 2.2 + 7.0)) * exp(-pow(lat / 0.35, 2.0));
    col += mix(vec3(0.85, 0.25, 0.55), vec3(0.25, 0.45, 1.0), fbm(d * 1.5)) * neb * 0.35;
    // A faint glow over the whole sky so it's never flat black.
    col += vec3(0.03, 0.025, 0.07) * (0.6 + clouds);

    gl_FragColor = vec4(col * 0.52 * uReveal, 1.0);
  }
`;

function Galaxy({ clock }: { clock: Clock }) {
  const ref = useRef<THREE.Mesh>(null);
  const material = useMemo(() => {
    // Same plane as the MilkyWay star band, with the bright core turned
    // off to one side, framing the system rather than drowning it.
    const normal = GALACTIC_NORMAL.clone();
    const core = new THREE.Vector3(-0.62, -0.18, -0.76).normalize();
    const coreA = core.clone().sub(normal.clone().multiplyScalar(core.dot(normal))).normalize();
    const coreB = normal.clone().cross(coreA).normalize();
    return new THREE.ShaderMaterial({
      vertexShader: GALAXY_VERTEX,
      fragmentShader: GALAXY_FRAGMENT,
      uniforms: { uNormal: { value: normal }, uA: { value: coreA }, uB: { value: coreB }, uReveal: { value: 0 } },
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);
  useFrame(() => {
    const m = ref.current?.material as THREE.ShaderMaterial | undefined;
    if (m) m.uniforms.uReveal.value = phase(clock.current, SRISHTI.stars);
  });
  return (
    <mesh ref={ref} material={material} renderOrder={-10}>
      <sphereGeometry args={[400, 64, 32]} />
    </mesh>
  );
}

// The Akasha Ganga: a dense river of faint stars with glowing gas clouds,
// arching across the sky.
function MilkyWay({ clock }: { clock: Clock }) {
  const ref = useRef<THREE.Points>(null);
  const cloudsRef = useRef<THREE.Group>(null);

  const { geometry, material, clouds } = useMemo(() => {
    // The band's plane, tilted across the sky.
    const normal = GALACTIC_NORMAL.clone();
    const a = new THREE.Vector3(1, 0, 0).cross(normal).normalize();
    const b = normal.clone().cross(a).normalize();
    const rand = seeded(29);
    const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
    const along = (angle: number, spread: number, r: number) =>
      a
        .clone()
        .multiplyScalar(Math.cos(angle))
        .add(b.clone().multiplyScalar(Math.sin(angle)))
        .add(normal.clone().multiplyScalar(spread))
        .normalize()
        .multiplyScalar(r);
    const stars: StarPoint[] = Array.from({ length: 14000 }, () => ({
      pos: along(rand() * Math.PI * 2, gauss() * 0.12, 230 + rand() * 40),
      size: 1.4 + Math.pow(rand(), 4) * 5,
      spike: 0,
      color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
      phase: rand(),
    }));
    const tints: [number, number, number][] = [
      [150, 120, 255],
      [255, 190, 140],
      [120, 170, 255],
      [255, 150, 210],
    ];
    const clouds = Array.from({ length: 22 }, (_, i) => ({
      pos: along((i / 22) * Math.PI * 2 + rand() * 0.2, gauss() * 0.05, 210),
      scale: 70 + rand() * 60,
      rot: rand() * Math.PI * 2,
      tex: cloudTexture(rand, tints[i % tints.length]),
    }));
    return { geometry: starGeometry(stars), material: starMaterial(), clouds };
  }, []);

  useFrame(({ gl }) => {
    updateStars(ref.current, clock.current, gl.getPixelRatio(), 0.75);
    const reveal = phase(clock.current, SRISHTI.stars);
    cloudsRef.current?.children.forEach((c) => {
      ((c as THREE.Sprite).material as THREE.SpriteMaterial).opacity = 0.42 * reveal;
    });
  });

  return (
    <>
      <points ref={ref} geometry={geometry} material={material} />
      <group ref={cloudsRef}>
        {clouds.map((c, i) => (
          <sprite key={i} position={c.pos} scale={[c.scale, c.scale, 1]}>
            <spriteMaterial map={c.tex} rotation={c.rot} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}
      </group>
    </>
  );
}

const SHOOTING_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const SHOOTING_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    // Bright head at uv.x = 1 fading to a thin tail.
    float across = 1.0 - abs(vUv.y - 0.5) * 2.0;
    float trail = pow(vUv.x, 3.0) * pow(across, 3.0);
    float head = exp(-pow((1.0 - vUv.x) * 18.0, 2.0)) * across;
    float a = (trail + head) * uOpacity;
    gl_FragColor = vec4(mix(vec3(0.75, 0.85, 1.0), vec3(1.0), head), a);
  }
`;

type Meteor = { wait: number; life: number; dur: number; pos: THREE.Vector3; vel: THREE.Vector3 };

// Meteors streaking across the far sky every few seconds.
function ShootingStars({ still }: { still: boolean }) {
  const COUNT = 3;
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const meteors = useRef<Meteor[] | null>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1).translate(-0.5, 0, 0), []);
  const materials = useMemo(
    () =>
      Array.from(
        { length: COUNT },
        () =>
          new THREE.ShaderMaterial({
            vertexShader: SHOOTING_VERTEX,
            fragmentShader: SHOOTING_FRAGMENT,
            uniforms: { uOpacity: { value: 0 } },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
      ),
    [],
  );

  useFrame((_, delta) => {
    if (still) return;
    meteors.current ??= Array.from({ length: COUNT }, (_, i) => ({
      wait: 2.5 + i * 3.5,
      life: 0,
      dur: 1,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
    }));
    meteors.current.forEach((s, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const mat = mesh.material as THREE.ShaderMaterial;
      if (s.wait > 0) {
        s.wait -= delta;
        mat.uniforms.uOpacity.value = 0;
        if (s.wait <= 0) {
          // Launch from the upper sky, falling diagonally left or right.
          const dir = Math.random() < 0.5 ? -1 : 1;
          s.pos.set((Math.random() - 0.5) * 120, 20 + Math.random() * 40, -90 - Math.random() * 30);
          s.vel.set(dir * (55 + Math.random() * 35), -(22 + Math.random() * 20), 0);
          s.dur = 0.7 + Math.random() * 0.6;
          s.life = 0;
          mesh.rotation.z = Math.atan2(s.vel.y, s.vel.x);
          mesh.scale.set(14 + Math.random() * 12, 0.18 + Math.random() * 0.1, 1);
        }
        return;
      }
      s.life += delta;
      s.pos.addScaledVector(s.vel, delta);
      mesh.position.copy(s.pos);
      const k = s.life / s.dur;
      mat.uniforms.uOpacity.value = Math.sin(Math.min(k, 1) * Math.PI) * 0.95;
      if (k >= 1) s.wait = 2.5 + Math.random() * 5;
    });
  });

  return (
    <>
      {materials.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          geometry={geometry}
          material={m}
        />
      ))}
    </>
  );
}

function radialTexture(inner: string, outer = "rgba(0,0,0,0)") {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Lord Vishnu's Sudarshana Chakra, vast and faint, turning slowly behind
// all of creation — the wheel of time that upholds the cosmos.
function SudarshanaChakra({ clock, still }: { clock: Clock; still: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const glow = useMemo(() => radialTexture("rgba(255,190,90,0.35)"), []);

  useEffect(() => {
    // Recolour the line art to luminous gold.
    const img = new Image();
    img.src = "/images/chakra-disc.png";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 512;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 512, 512);
      ctx.globalCompositeOperation = "source-in";
      const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
      g.addColorStop(0, "#fff1c4");
      g.addColorStop(0.6, "#ffc65a");
      g.addColorStop(1, "#e08a2a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
    };
  }, []);

  useFrame((_, delta) => {
    const reveal = phase(clock.current, SRISHTI.chakra);
    if (ref.current) {
      if (!still) ref.current.rotation.z -= delta * 0.025;
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.07 * reveal;
    }
    if (glowRef.current) (glowRef.current.material as THREE.SpriteMaterial).opacity = 0.45 * reveal;
  });

  return (
    <group position={[0, 2, -70]}>
      <sprite ref={glowRef} scale={[110, 110, 1]}>
        <spriteMaterial map={glow} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {texture ? (
        <mesh ref={ref}>
          <planeGeometry args={[72, 72]} />
          <meshBasicMaterial map={texture} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ) : null}
    </group>
  );
}

// The Kshira Sagara — the ocean of milk on which Vishnu reclines — far
// beneath creation, shimmering, with the lotus stalk rising out of it.
function KshiraSagara({ clock, still }: { clock: Clock; still: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vPos;
          void main() {
            vPos = position.xy;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uReveal;
          varying vec2 vPos;
          void main() {
            float r = length(vPos);
            float waves = sin(vPos.x * 0.35 + uTime * 0.6) * sin(vPos.y * 0.42 - uTime * 0.45)
                        + 0.5 * sin(length(vPos * vec2(0.9, 1.1)) * 0.8 - uTime * 0.9);
            float shimmer = smoothstep(0.6, 1.4, waves);
            float fall = smoothstep(70.0, 6.0, r);
            vec3 milk = mix(vec3(0.35, 0.45, 0.8), vec3(1.0, 0.97, 0.9), shimmer);
            // Golden light where the lotus stalk meets the ocean.
            vec3 col = milk + vec3(1.0, 0.75, 0.35) * exp(-r * 0.25) * 0.8;
            gl_FragColor = vec4(col, (0.07 + shimmer * 0.22 + exp(-r * 0.22) * 0.65) * fall * uReveal);
          }
        `,
      }),
    [],
  );
  useFrame((_, delta) => {
    const mat = ref.current?.material as THREE.ShaderMaterial | undefined;
    if (!mat) return;
    if (!still) mat.uniforms.uTime.value += delta;
    mat.uniforms.uReveal.value = phase(clock.current, SRISHTI.chakra);
  });

  return (
    <mesh ref={ref} position={[0, -8, 0]} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[160, 160, 1, 1]} />
    </mesh>
  );
}

// The point of light from which creation begins.
function Bindu({ clock }: { clock: Clock }) {
  const ref = useRef<THREE.Sprite>(null);
  const tex = useMemo(() => radialTexture("rgba(255,240,200,1)"), []);
  useFrame(() => {
    const sprite = ref.current;
    if (!sprite) return;
    const t = clock.current;
    // Swells, flares, then settles as a soft glow in the lotus.
    const flare = Math.sin(phase(t, SRISHTI.bindu) * Math.PI);
    sprite.scale.setScalar(0.5 + flare * 9 + 1.5);
    (sprite.material as THREE.SpriteMaterial).opacity = t < SRISHTI.bindu[0] ? 0 : 0.2 + flare * 0.8;
  });
  return (
    <sprite ref={ref} position={[0, -0.4, 0]}>
      <spriteMaterial map={tex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

// A single lotus petal: tapered, cupped and curling outward at the tip.
function petalGeometry(length: number, width: number) {
  const geo = new THREE.PlaneGeometry(1, 1, 8, 14);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors: number[] = [];
  const base = new THREE.Color("#ffc977");
  const mid = new THREE.Color("#f5a3bd");
  const tip = new THREE.Color("#f7c9da");
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i); // -0.5…0.5 across
    const v = pos.getY(i) + 0.5; // 0…1 along
    // Broad and rounded, drawing to a soft point at the tip.
    const w = Math.pow(Math.sin(Math.PI * Math.pow(Math.min(v, 1), 0.8)), 0.55) * width;
    const x = u * w;
    const y = v * length;
    const z = -x * x * 1.2 + v * v * 0.3 * length; // cupped, curling out
    pos.setXYZ(i, x, y, z);
    if (v < 0.35) c.copy(base).lerp(mid, v / 0.35);
    else c.copy(mid).lerp(tip, (v - 0.35) / 0.65);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

// The lotus from Vishnu's navel (Nabhi Kamala), from which Brahma creates
// the worlds — here it holds Surya, the heart of the solar system. Its
// petals open as creation begins.
function NabhiKamala({ clock, still }: { clock: Clock; still: boolean }) {
  const pivots = useRef<(THREE.Group | null)[]>([]);
  const stalkRef = useRef<THREE.Mesh>(null);
  const petals = useMemo(() => {
    const rings = [
      { count: 8, length: 1.5, width: 1.2, open: 0.5, offset: 0 },
      { count: 8, length: 1.95, width: 1.35, open: 0.9, offset: Math.PI / 8 },
      { count: 12, length: 2.3, width: 1.2, open: 1.25, offset: Math.PI / 12 },
    ].map((r) => ({ ...r, geometry: petalGeometry(r.length, r.width) }));
    return rings.flatMap((r, ring) =>
      Array.from({ length: r.count }, (_, i) => ({ ring, angle: r.offset + (i / r.count) * Math.PI * 2, open: r.open, geometry: r.geometry })),
    );
  }, []);
  // Glows where it holds the flower and fades as it descends to the ocean.
  const stalkGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.05, 0.1, 7, 12, 16, true);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const k = (pos.getY(i) + 3.5) / 7; // 0 at the ocean, 1 at the flower
      const glow = 0.15 + 0.85 * Math.pow(k, 1.6);
      colors.push(1 * glow, 0.82 * glow, 0.48 * glow);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        roughness: 0.55,
        emissive: new THREE.Color("#ff9a6a"),
        emissiveIntensity: 0.18,
        transparent: true,
        opacity: 0.95,
      }),
    [],
  );

  useFrame(() => {
    const t = clock.current;
    const bloom = phase(t, SRISHTI.lotus);
    petals.forEach((p, i) => {
      const pivot = pivots.current[i];
      if (!pivot) return;
      // Closed bud (nearly upright) → open flower; outer rings open wider.
      const breathe = still ? 0 : Math.sin(t * 0.6 + p.ring) * 0.03;
      pivot.children[0].rotation.x = THREE.MathUtils.lerp(0.12, p.open, bloom) + breathe;
      pivot.scale.setScalar(0.25 + 0.75 * bloom);
    });
    if (stalkRef.current) (stalkRef.current.material as THREE.MeshBasicMaterial).opacity = 0.75 * phase(t, SRISHTI.chakra);
  });

  return (
    <group position={[0, -1.75, 0]} scale={0.9}>
      {petals.map((p, i) => (
        <group
          key={i}
          rotation={[0, p.angle, 0]}
          ref={(el) => {
            pivots.current[i] = el;
          }}
        >
          <group>
            <mesh geometry={p.geometry} material={material} position={[0, 0, 0.12 + p.ring * 0.08]} />
          </group>
        </group>
      ))}
      {/* Seed pod at the heart of the flower. */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.55, 0.4, 0.4, 32]} />
        <meshStandardMaterial color="#e3b23c" emissive="#7a4a00" emissiveIntensity={0.5} roughness={0.5} />
      </mesh>
      {/* The stalk, descending to the ocean of milk. */}
      <mesh ref={stalkRef} position={[0, -3.5, 0]} geometry={stalkGeometry}>
        <meshBasicMaterial vertexColors transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function Earth({ still, size }: { still: boolean; size: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => {
    const rand = seeded(5);
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#1d4f8f";
    ctx.fillRect(0, 0, 512, 256);
    // Scattered continents.
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = i % 3 === 0 ? "#8a7a4a" : "#3f7a3a";
      ctx.beginPath();
      ctx.ellipse(rand() * 512, 40 + rand() * 176, 18 + rand() * 40, 10 + rand() * 26, rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(0, 0, 512, 14);
    ctx.fillRect(0, 242, 512, 14);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  const glow = useMemo(() => radialTexture("rgba(90,160,255,0.5)"), []);
  useFrame((_, delta) => {
    if (ref.current && !still) ref.current.rotation.y += delta * 0.25;
  });
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[size, 48, 48]} />
        <meshStandardMaterial map={texture} roughness={0.8} emissive="#0a1a33" />
      </mesh>
      <sprite scale={[size * 3.5, size * 3.5, 1]}>
        <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

// Bhumi on her orbit round the Sun, carrying Chandra, Rahu and Ketu.
function EarthSystem({
  longitude,
  still,
  clock,
  boost,
  fontsReady,
  label,
  children,
}: {
  longitude: number;
  still: boolean;
  clock: Clock;
  boost: number;
  fontsReady: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<THREE.Line>(null);
  const current = useRef(longitude);
  const orbit = useMemo(() => {
    const pts = Array.from({ length: 129 }, (_, i) => onEcliptic((i / 128) * 360, EARTH_ORBIT));
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: "#7fb4ff", transparent: true, opacity: 0 }),
    );
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const emerge = phase(clock.current, [SRISHTI.grahas[0] + EARTH_ORBIT * 0.08, SRISHTI.grahas[1]]);
    const diff = ((longitude - current.current + 540) % 360) - 180;
    current.current += still ? diff : diff * Math.min(1, delta * 3);
    group.position.copy(onEcliptic(current.current, EARTH_ORBIT * emerge));
    group.scale.setScalar(Math.max(emerge * boost, 0.0001));
    (orbitRef.current?.material as THREE.LineBasicMaterial | undefined)?.setValues({ opacity: 0.22 * emerge });
  });

  return (
    <>
      <primitive ref={orbitRef} object={orbit} />
      <group ref={groupRef} scale={0.0001}>
        <Earth still={still} size={0.36} />
        {boost === 1 ? (
          <Label
            parts={[{ text: label, font: bodyFont() }]}
            color="#bcd6ff"
            height={0.34}
            position={new THREE.Vector3(0, -0.72, 0)}
            fontsReady={fontsReady}
          />
        ) : null}
        {children}
      </group>
    </>
  );
}

// ── Labels ────────────────────────────────────────────────────────────────

type LabelPart = { text: string; font: string };

// Renders text to a texture, cropped to the pixels actually drawn. Safari
// under-measures Kannada (vowel signs and conjuncts), so we draw on a
// generous canvas and trim by alpha rather than trusting measureText.
function labelTexture(parts: LabelPart[], color: string) {
  const px = 64;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  const guess = parts.reduce((w, p) => {
    ctx.font = p.font;
    return w + ctx.measureText(p.text).width;
  }, 0);
  c.width = Math.ceil(guess * 1.6 + px * 2);
  c.height = Math.ceil(px * 2.4);
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  let x = px * 0.5;
  for (const p of parts) {
    ctx.font = p.font;
    ctx.fillText(p.text, x, c.height / 2);
    x += ctx.measureText(p.text).width * 1.25 + px * 0.2;
  }
  // Trim to the drawn pixels.
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  let minX = c.width;
  let minY = c.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < c.height; y++) {
    for (let xx = 0; xx < c.width; xx++) {
      if (data[(y * c.width + xx) * 4 + 3] > 8) {
        if (xx < minX) minX = xx;
        if (xx > maxX) maxX = xx;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) {
    minX = minY = 0;
    maxX = maxY = 1;
  }
  const pad = 6;
  const out = document.createElement("canvas");
  out.width = maxX - minX + pad * 2;
  out.height = maxY - minY + pad * 2;
  out.getContext("2d")!.drawImage(c, minX - pad, minY - pad, out.width, out.height, 0, 0, out.width, out.height);
  const tex = new THREE.CanvasTexture(out);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, aspect: out.width / out.height };
}

function bodyFont(weight = 600) {
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  return `${weight} 64px ${family}`;
}
const GLYPH_FONT = `76px "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Noto Sans Symbols", "DejaVu Sans", sans-serif`;

function Label({
  parts,
  color,
  height,
  position,
  fontsReady,
  materialRef,
}: {
  parts: LabelPart[];
  color: string;
  height: number;
  position: THREE.Vector3;
  fontsReady: boolean;
  materialRef?: (m: THREE.SpriteMaterial | null) => void;
}) {
  const key = parts.map((p) => p.text + p.font).join("|");
  // Rebuilt once web fonts load so Kannada and display text render in the
  // site's own typefaces.
  const { tex, aspect } = useMemo(() => labelTexture(parts, color), [key, color, fontsReady]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <sprite position={position} scale={[height * aspect, height, 1]}>
      <spriteMaterial ref={materialRef} map={tex} transparent depthWrite={false} />
    </sprite>
  );
}

// The 12 rashis (glyph and name) and 27 nakshatras laid around the ecliptic.
function ZodiacRing({
  labels,
  fontsReady,
  boost,
  clock,
}: {
  labels: { glyph: string; name: string }[];
  fontsReady: boolean;
  boost: number;
  clock: Clock;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lines = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const circle = (r: number) => {
      for (let i = 0; i < 180; i++) pts.push(onEcliptic(i * 2, r), onEcliptic((i + 1) * 2, r));
    };
    circle(ZODIAC_INNER);
    circle(ZODIAC_OUTER);
    for (let i = 0; i < 12; i++) pts.push(onEcliptic(i * 30, ZODIAC_INNER), onEcliptic(i * 30, ZODIAC_OUTER));
    for (let i = 0; i < 27; i++) pts.push(onEcliptic(i * (360 / 27), ZODIAC_INNER - 0.22), onEcliptic(i * (360 / 27), ZODIAC_INNER));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  const lineMat = useMemo(() => new THREE.LineBasicMaterial({ color: "#f3cf7a", transparent: true, opacity: 0 }), []);
  const bandMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#e8b04a", transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    [],
  );
  const labelMats = useRef<(THREE.SpriteMaterial | null)[]>([]);

  useFrame(() => {
    const k = phase(clock.current, SRISHTI.zodiac);
    const group = groupRef.current;
    if (!group) return;
    // Line and band materials are reached through the scene graph.
    ((group.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.06 * k;
    ((group.children[1] as THREE.LineSegments).material as THREE.LineBasicMaterial).opacity = 0.5 * k;
    labelMats.current.forEach((m) => {
      if (m) m.opacity = k;
    });
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={bandMat}>
        <ringGeometry args={[ZODIAC_INNER, ZODIAC_OUTER, 128]} />
      </mesh>
      <lineSegments geometry={lines} material={lineMat} />
      {labels.map((l, i) => (
        <Label
          key={i}
          parts={[
            { text: l.glyph, font: GLYPH_FONT },
            { text: l.name, font: bodyFont() },
          ]}
          color="#f6dd9c"
          height={boost > 1 ? 0.7 : 0.62}
          position={onEcliptic(i * 30 + 15, (ZODIAC_INNER + ZODIAC_OUTER) / 2, 0.35)}
          fontsReady={fontsReady}
          materialRef={(m) => {
            labelMats.current[i] = m;
          }}
        />
      ))}
    </group>
  );
}

// ── The grahas ────────────────────────────────────────────────────────────

function bandedTexture(colors: string[]) {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  for (let y = 0; y < 128; y++) {
    ctx.fillStyle = colors[Math.floor((Math.sin(y * 0.35) * 0.5 + 0.5 + Math.sin(y * 0.11) * 0.3) * colors.length) % colors.length];
    ctx.fillRect(0, y, 4, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Mottled, limb-darkened photosphere.
function sunTexture() {
  const rand = seeded(11);
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const base = ctx.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, "#ff9a1f");
  base.addColorStop(0.5, "#ffd24a");
  base.addColorStop(1, "#ff9a1f");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 256);
  // Granulation and a few bright faculae.
  for (let i = 0; i < 2600; i++) {
    const hot = rand() > 0.5;
    ctx.fillStyle = hot ? `rgba(255,246,190,${0.08 + rand() * 0.18})` : `rgba(214,96,10,${0.06 + rand() * 0.16})`;
    ctx.beginPath();
    ctx.arc(rand() * 512, rand() * 256, 1 + rand() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Layered glow round the Sun, breathing slowly.
function SunCorona({ size, still }: { size: number; still: boolean }) {
  const inner = useMemo(() => radialTexture("rgba(255,236,170,0.95)"), []);
  const outer = useMemo(() => radialTexture("rgba(255,140,40,0.55)"), []);
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && !still) ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 0.9) * 0.04);
  });
  return (
    <group ref={ref}>
      <sprite scale={[size * 3.4, size * 3.4, 1]}>
        <spriteMaterial map={inner} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <sprite scale={[size * 9, size * 9, 1]}>
        <spriteMaterial map={outer} transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

function Graha({
  graha,
  angle,
  quiet = false,
  label,
  boost,
  fontsReady,
  active,
  selected,
  still,
  clock,
  register,
}: {
  graha: GrahaPosition;
  // Where it's drawn on its orbit: heliocentric for planets, geocentric
  // round the Earth for Chandra, Rahu and Ketu.
  angle: number;
  quiet?: boolean;
  label: string;
  boost: number;
  fontsReady: boolean;
  active: boolean;
  selected: boolean;
  still: boolean;
  clock: Clock;
  register: (key: GrahaKey, mesh: THREE.Mesh | null) => void;
}) {
  const style = GRAHA_STYLE[graha.key];
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Line>(null);
  const scaleTarget = useRef(new THREE.Vector3());
  // Animated longitude: glides to the new position when the date changes.
  const current = useRef(angle);

  const map = useMemo(() => {
    if (graha.key === "sun") return sunTexture();
    if (graha.key === "jupiter") return bandedTexture(["#d9b98f", "#b98d62", "#efd9b5", "#a8754d"]);
    if (graha.key === "saturn") return bandedTexture(["#e8d6a4", "#cdb57d", "#f2e4bd"]);
    return null;
  }, [graha.key]);
  const glow = useMemo(() => (style.glow && graha.key !== "sun" ? radialTexture(style.glow) : null), [style.glow, graha.key]);
  const orbit = useMemo(() => {
    const pts = Array.from({ length: 129 }, (_, i) => onEcliptic((i / 128) * 360, style.orbit));
    const material = new THREE.LineBasicMaterial({
      color: graha.key === "rahu" ? "#9a6cff" : graha.key === "moon" ? "#cfd6ea" : "#8fa6d8",
      transparent: true,
      opacity: 0,
    });
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material);
  }, [style.orbit, graha.key]);

  useEffect(() => {
    const mesh = bodyRef.current;
    if (mesh) mesh.userData.key = graha.key;
    register(graha.key, mesh);
    return () => register(graha.key, null);
  }, [graha.key, register]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    // Srishti: each graha emerges from the lotus and travels out to its
    // orbit, the inner ones first.
    const emerge = phase(clock.current, [SRISHTI.grahas[0] + style.orbit * 0.08, SRISHTI.grahas[1]]);
    const diff = ((angle - current.current + 540) % 360) - 180;
    current.current += still ? diff : diff * Math.min(1, delta * 3);
    group.position.copy(onEcliptic(current.current, style.orbit * emerge));
    if (bodyRef.current && !still) bodyRef.current.rotation.y += delta * 0.4;
    const target = (active ? 1.35 : 1) * boost * emerge;
    group.scale.lerp(scaleTarget.current.setScalar(Math.max(target, 0.0001)), 0.15);
    if (orbitRef.current) (orbitRef.current.material as THREE.LineBasicMaterial).opacity = 0.16 * emerge;
    if (haloRef.current) haloRef.current.rotation.z += delta * 0.8;
  });

  return (
    <>
      {graha.key !== "ketu" && style.orbit > 0 ? <primitive ref={orbitRef} object={orbit} /> : null}
      <group ref={groupRef} scale={0.0001}>
        <mesh ref={bodyRef}>
          <sphereGeometry args={[style.size, 40, 40]} />
          {graha.key === "sun" ? (
            // Unlit and outside tone mapping, so it burns rather than greys.
            <meshBasicMaterial map={map} toneMapped={false} />
          ) : (
            <meshStandardMaterial
              color={map ? "#ffffff" : style.color}
              map={map}
              roughness={0.85}
              emissive={style.emissive ?? "#000000"}
              emissiveIntensity={style.emissive ? 0.8 : 0}
            />
          )}
        </mesh>
        {graha.key === "saturn" ? (
          <mesh rotation={[-Math.PI / 2.4, 0, 0]}>
            <ringGeometry args={[style.size * 1.35, style.size * 2.1, 64]} />
            <meshStandardMaterial color="#d8c08a" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        ) : null}
        {glow ? (
          <sprite scale={[style.size * 7, style.size * 7, 1]}>
            <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ) : null}
        {graha.key === "sun" ? <SunCorona size={style.size} still={still} /> : null}
        {graha.key === "sun" ? <pointLight intensity={38} distance={0} decay={1.5} color="#ffe2b0" /> : null}
        {selected ? (
          <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[style.size * 1.9, 0.025, 8, 64]} />
            <meshBasicMaterial color="#ffd77a" />
          </mesh>
        ) : null}
        {/* On phones the grahas sit close together, so only the one being
            looked at is named. */}
        {(boost === 1 && !quiet) || active ? (
          <Label
            parts={[{ text: label, font: bodyFont() }]}
            color={active ? "#ffe9b0" : "#d6d9f2"}
            height={quiet ? 0.3 : 0.4}
            position={new THREE.Vector3(0, style.size + 0.42, 0)}
            fontsReady={fontsReady}
          />
        ) : null}
      </group>
    </>
  );
}
