"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import styles from "./black-hole.module.css";

const PARTICLE_LAYERS = [
  { count: 150, seed: 2187, spread: 7.2, depth: -1.5, size: 0.012, opacity: 0.28 },
  { count: 220, seed: 7042, spread: 10.5, depth: -4.5, size: 0.018, opacity: 0.38 },
  { count: 170, seed: 9321, spread: 14.5, depth: -8, size: 0.026, opacity: 0.22 },
] as const;

const lightFieldVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const lightFieldFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  varying vec2 vUv;

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    float d = fract(sin(dot(i + vec2(1.0), vec2(127.1, 311.7))) * 43758.5453);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 pointerUv = uPointer * 0.5 + 0.5;
    vec2 pointerDelta = vUv - pointerUv;
    float pointerField = smoothstep(0.2, 0.0, length(pointerDelta));
    vec2 uv = vUv + normalize(pointerDelta + 0.0001) * pointerField * 0.004;
    vec2 field = uv - vec2(0.735, 0.49);
    field.x *= 1.72;
    float radius = length(field);
    float angle = atan(field.y, field.x);
    float drift = noise(vec2(angle * 2.2, radius * 11.0 - uTime * 0.045));
    float ring = exp(-abs(radius - 0.285 - (drift - 0.5) * 0.012) * 46.0);
    float outerField = exp(-abs(radius - 0.36) * 18.0) * 0.32;
    float breathing = 0.88 + sin(uTime * 0.16) * 0.08;
    vec3 color = mix(vec3(0.28, 0.20, 0.72), vec3(0.67, 0.80, 1.0), ring * 0.72 + drift * 0.12);
    float alpha = (ring * 0.12 + outerField * 0.055) * breathing;
    gl_FragColor = vec4(color, alpha);
  }
`;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createParticlePositions(count: number, seed: number, spread: number, depth: number) {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * spread;
    positions[index * 3 + 1] = (random() - 0.5) * spread * 0.56;
    positions[index * 3 + 2] = depth + (random() - 0.5) * 2.8;
  }
  return positions;
}

function useScrollProgress() {
  const progress = useRef(0);
  useEffect(() => {
    const update = () => {
      const distance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progress.current = Math.min(1, Math.max(0, window.scrollY / distance));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return progress;
}

function ParticleLayer({ layer, reduceMotion }: { layer: (typeof PARTICLE_LAYERS)[number]; reduceMotion: React.RefObject<boolean> }) {
  const pointsRef = useRef<THREE.Points>(null);
  const basePositions = useMemo(() => createParticlePositions(layer.count, layer.seed, layer.spread, layer.depth), [layer]);
  const positions = useMemo(() => basePositions.slice(), [basePositions]);

  useFrame((state, delta) => {
    const points = pointsRef.current;
    if (!points || reduceMotion.current) return;
    const attribute = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const current = attribute.array as Float32Array;
    const pointerX = state.pointer.x * 3.8;
    const pointerY = state.pointer.y * 2.2;
    const response = Math.min(1, delta * 5.5);
    for (let index = 0; index < layer.count; index += 1) {
      const offset = index * 3;
      const dx = current[offset] - pointerX;
      const dy = current[offset + 1] - pointerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - distance / 1.15);
      const repel = influence * influence * 0.035;
      current[offset] += (basePositions[offset] - current[offset]) * response + (dx / Math.max(distance, 0.08)) * repel;
      current[offset + 1] += (basePositions[offset + 1] - current[offset + 1]) * response + (dy / Math.max(distance, 0.08)) * repel;
    }
    attribute.needsUpdate = true;
    points.rotation.z += delta * (0.0007 + Math.abs(layer.depth) * 0.00008);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#c4d2ff" size={layer.size} sizeAttenuation transparent opacity={layer.opacity} depthWrite={false} />
    </points>
  );
}

function LightField({ reduceMotion }: { reduceMotion: React.RefObject<boolean> }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() } }), []);
  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material || reduceMotion.current) return;
    material.uniforms.uTime.value += delta;
    material.uniforms.uPointer.value.lerp(state.pointer, 1 - Math.exp(-delta * 2.2));
  });
  return (
    <mesh position={[0, 0, 1.1]} scale={[4.36, 2.45, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={materialRef} vertexShader={lightFieldVertexShader} fragmentShader={lightFieldFragmentShader} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function CameraController({ scrollProgress, reduceMotion }: { scrollProgress: React.RefObject<number>; reduceMotion: React.RefObject<boolean> }) {
  useFrame((state, delta) => {
    const damping = 1 - Math.exp(-delta * 2.4);
    const retreat = THREE.MathUtils.smootherstep(scrollProgress.current, 0, 1);
    const targetZ = THREE.MathUtils.lerp(5.7, 13.2, retreat);
    const targetX = reduceMotion.current ? 0 : state.pointer.x * 0.24;
    const targetY = reduceMotion.current ? 0.18 : 0.18 + state.pointer.y * 0.14;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, damping);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, damping);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, damping);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

function EnhancementScene() {
  const scrollProgress = useScrollProgress();
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
      <CameraController scrollProgress={scrollProgress} reduceMotion={reduceMotion} />
      {PARTICLE_LAYERS.map((layer) => <ParticleLayer key={layer.seed} layer={layer} reduceMotion={reduceMotion} />)}
      <LightField reduceMotion={reduceMotion} />
    </>
  );
}

export default function HybridBlackHoleExperience() {
  return (
    <div className={styles.hybridVisual}>
      <Image className={styles.staticArtwork} src="/hero/frame-01-origin.webp" alt="" fill priority sizes="100vw" />
      <div className={styles.artworkTreatment} aria-hidden="true" />
      <Canvas className={styles.enhancementCanvas} camera={{ position: [0, 0.18, 5.7], fov: 42, near: 0.1, far: 40 }} dpr={[1, 1.35]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <EnhancementScene />
      </Canvas>
    </div>
  );
}
