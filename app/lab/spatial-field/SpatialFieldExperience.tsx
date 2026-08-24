"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import styles from "./spatial-field.module.css";

const IMAGE_ASPECT = 16 / 9;
const PARTICLE_LAYERS = [
  { count: 90, seed: 2014, depth: 0.5, spread: 5.2, size: 0.008, opacity: 0.28 },
  { count: 130, seed: 2018, depth: -0.35, spread: 6.8, size: 0.013, opacity: 0.34 },
  { count: 110, seed: 2026, depth: -1.1, spread: 8.8, size: 0.019, opacity: 0.2 },
] as const;

const artworkVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uInteraction;
  varying vec2 vUv;
  varying float vForce;

  void main() {
    vUv = uv;
    vec3 transformed = position;
    vec2 delta = uv - uPointer;
    float distanceToPointer = length(delta);
    float force = exp(-distanceToPointer * distanceToPointer * 34.0) * uInteraction;
    float idle = sin(position.x * 2.1 + uTime * 0.13) * cos(position.y * 2.6 - uTime * 0.1) * 0.008;
    transformed.z += force * 0.105 + idle;
    transformed.xy += normalize(delta + 0.0001) * force * 0.012;
    vForce = force;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const artworkFragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  varying vec2 vUv;
  varying float vForce;

  vec2 coverUv(vec2 uv) {
    float screenAspect = uResolution.x / max(uResolution.y, 1.0);
    if (screenAspect < ${IMAGE_ASPECT.toFixed(8)}) {
      uv.x = (uv.x - 0.5) * (screenAspect / ${IMAGE_ASPECT.toFixed(8)}) + 0.5;
    } else {
      uv.y = (uv.y - 0.5) * (${IMAGE_ASPECT.toFixed(8)} / screenAspect) + 0.5;
    }
    return uv;
  }

  void main() {
    vec2 uv = coverUv(vUv);
    vec3 color = texture2D(uTexture, uv).rgb;
    float edge = smoothstep(0.82, 0.18, length(vUv - 0.5));
    color *= mix(0.72, 1.0, edge);
    color += vec3(0.12, 0.17, 0.34) * vForce * 0.09;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createPositions(count: number, seed: number, spread: number, depth: number) {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * spread;
    positions[index * 3 + 1] = (random() - 0.5) * spread * 0.56;
    positions[index * 3 + 2] = depth + (random() - 0.5) * 0.45;
  }
  return positions;
}

function ArtworkSurface({ reduceMotion }: { reduceMotion: React.RefObject<boolean> }) {
  const loadedTexture = useLoader(THREE.TextureLoader, "/hero/frame-01-origin.webp");
  const texture = useMemo(() => {
    const preparedTexture = loadedTexture.clone();
    preparedTexture.colorSpace = THREE.SRGBColorSpace;
    preparedTexture.anisotropy = 4;
    preparedTexture.needsUpdate = true;
    return preparedTexture;
  }, [loadedTexture]);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const viewport = useThree((state) => state.viewport);
  const size = useThree((state) => state.size);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    uInteraction: { value: 0 },
    uTexture: { value: texture },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
  }), [size.height, size.width, texture]);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;
    const target = reduceMotion.current
      ? new THREE.Vector2(0.5, 0.5)
      : new THREE.Vector2(state.pointer.x * 0.5 + 0.5, state.pointer.y * 0.5 + 0.5);
    material.uniforms.uPointer.value.lerp(target, 1 - Math.exp(-delta * 5));
    material.uniforms.uInteraction.value = THREE.MathUtils.lerp(
      material.uniforms.uInteraction.value,
      reduceMotion.current ? 0 : 1,
      1 - Math.exp(-delta * 2.5),
    );
    if (!reduceMotion.current) material.uniforms.uTime.value += delta;
    material.uniforms.uResolution.value.set(state.size.width, state.size.height);
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 160, 90]} />
      <shaderMaterial ref={materialRef} vertexShader={artworkVertexShader} fragmentShader={artworkFragmentShader} uniforms={uniforms} />
    </mesh>
  );
}

function ParticleLayer({ layer, reduceMotion }: { layer: (typeof PARTICLE_LAYERS)[number]; reduceMotion: React.RefObject<boolean> }) {
  const pointsRef = useRef<THREE.Points>(null);
  const basePositions = useMemo(() => createPositions(layer.count, layer.seed, layer.spread, layer.depth), [layer]);
  const positions = useMemo(() => basePositions.slice(), [basePositions]);

  useFrame((state, delta) => {
    const points = pointsRef.current;
    if (!points || reduceMotion.current) return;
    const attribute = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const current = attribute.array as Float32Array;
    const pointerX = state.pointer.x * 2.2;
    const pointerY = state.pointer.y * 1.25;
    const response = Math.min(1, delta * 6.5);
    for (let index = 0; index < layer.count; index += 1) {
      const offset = index * 3;
      const dx = current[offset] - pointerX;
      const dy = current[offset + 1] - pointerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - distance / 0.72);
      const force = influence * influence * 0.026;
      current[offset] += (basePositions[offset] - current[offset]) * response + (dx / Math.max(distance, 0.05)) * force;
      current[offset + 1] += (basePositions[offset + 1] - current[offset + 1]) * response + (dy / Math.max(distance, 0.05)) * force;
    }
    attribute.needsUpdate = true;
    points.rotation.z += delta * 0.0008;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#cad6ff" size={layer.size} sizeAttenuation transparent opacity={layer.opacity} depthWrite={false} />
    </points>
  );
}

function DeepBackgroundSlot() {
  return <group name="frame-02-deep-background" position={[0, 0, -1.8]} />;
}

function SpatialScene() {
  const reduceMotion = useRef(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reduceMotion.current = media.matches; };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <>
      <DeepBackgroundSlot />
      <ArtworkSurface reduceMotion={reduceMotion} />
      {PARTICLE_LAYERS.map((layer) => <ParticleLayer key={layer.seed} layer={layer} reduceMotion={reduceMotion} />)}
    </>
  );
}

export default function SpatialFieldExperience() {
  return (
    <div className={styles.experience}>
      <Canvas camera={{ position: [0, 0, 2], fov: 45, near: 0.1, far: 20 }} dpr={[1, 1.4]} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}>
        <SpatialScene />
      </Canvas>
    </div>
  );
}
