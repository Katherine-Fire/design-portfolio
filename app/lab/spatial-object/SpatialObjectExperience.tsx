"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDisplacement;
  varying vec3 vWorldPosition;
  varying vec3 vNormalDirection;
  varying float vFlow;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += noise(p) * amplitude;
      p = p * 2.03 + vec3(1.7, 2.9, 1.1);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 samplePosition = position * 1.15 + vec3(uTime * 0.035, -uTime * 0.025, uTime * 0.018);
    float broadFlow = fbm(samplePosition);
    float fineFlow = noise(position * 3.2 - vec3(uTime * 0.045));
    float displacement = (broadFlow - 0.5) * uDisplacement + (fineFlow - 0.5) * uDisplacement * 0.22;
    vec3 displaced = position + normal * displacement;

    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormalDirection = normalize(mat3(modelMatrix) * normal);
    vFlow = broadFlow * 0.72 + fineFlow * 0.28;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uCore;
  varying vec3 vWorldPosition;
  varying vec3 vNormalDirection;
  varying float vFlow;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormalDirection), viewDirection), 0.0), 2.7);
    float slowBand = 0.5 + 0.5 * sin(vWorldPosition.y * 2.2 + vWorldPosition.x * 1.1 + uTime * 0.12);
    float materialFlow = smoothstep(0.3, 0.82, vFlow * 0.82 + slowBand * 0.18);

    vec3 graphite = vec3(0.004, 0.006, 0.012);
    vec3 deepBlue = vec3(0.012, 0.03, 0.072);
    vec3 mutedViolet = vec3(0.06, 0.04, 0.11);
    vec3 coldWhite = vec3(0.3, 0.39, 0.54);

    vec3 color = mix(graphite, deepBlue, materialFlow * 0.62);
    color = mix(color, mutedViolet, smoothstep(0.62, 0.94, vFlow) * 0.24);
    color = mix(color, coldWhite, fresnel * (0.08 + materialFlow * 0.12));
    color += deepBlue * fresnel * 0.07;
    color *= mix(1.0, 0.22, uCore);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

type SceneProps = {
  pointer: React.RefObject<THREE.Vector2>;
  scrollProgress: React.RefObject<number>;
  reduceMotion: boolean;
};

function FlowMaterial({
  displacement,
  core = false,
  reduceMotion,
}: {
  displacement: number;
  core?: boolean;
  reduceMotion: boolean;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDisplacement: { value: displacement },
    uCore: { value: core ? 1 : 0 },
  }), [core, displacement]);

  useFrame((_, delta) => {
    if (!reduceMotion && materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
    />
  );
}

function OrbitalStructure({ reduceMotion }: Pick<SceneProps, "reduceMotion">) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!reduceMotion && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.012;
      groupRef.current.rotation.z -= delta * 0.004;
    }
  });

  return (
    <group ref={groupRef} position={[0.72, -0.12, -0.18]} rotation={[0.08, -0.18, 0.04]}>
      <mesh position={[-0.55, 0.22, -0.2]} rotation={[1.08, 0.18, 0.56]}>
        <torusGeometry args={[3.15, 0.055, 12, 280]} />
        <FlowMaterial displacement={0.028} reduceMotion={reduceMotion} />
      </mesh>

      <mesh position={[0.35, -0.3, -0.5]} rotation={[-0.58, 0.8, -0.18]}>
        <torusGeometry args={[3.95, 0.04, 10, 320]} />
        <FlowMaterial displacement={0.022} reduceMotion={reduceMotion} />
      </mesh>

      <mesh position={[0.9, 0.42, 0.08]} rotation={[0.28, -0.72, 1.04]}>
        <torusGeometry args={[4.75, 0.028, 8, 360]} />
        <FlowMaterial displacement={0.018} reduceMotion={reduceMotion} />
      </mesh>

      <mesh position={[0.46, -0.08, -0.72]} scale={[1.18, 1.04, 1.12]} rotation={[0.22, -0.38, 0.12]}>
        <icosahedronGeometry args={[0.92, 4]} />
        <FlowMaterial displacement={0.045} core reduceMotion={reduceMotion} />
      </mesh>
    </group>
  );
}

function DepthParticles() {
  const geometry = useMemo(() => {
    const positions = new Float32Array(48 * 3);
    let seed = 9127;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let index = 0; index < 48; index += 1) {
      positions[index * 3] = (random() - 0.5) * 11;
      positions[index * 3 + 1] = (random() - 0.5) * 7;
      positions[index * 3 + 2] = -5 + random() * 7;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return pointsGeometry;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#7184ad" size={0.018} transparent opacity={0.2} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function SpatialScene({ pointer, scrollProgress, reduceMotion }: SceneProps) {
  const target = useMemo(() => new THREE.Vector3(0.55, -0.08, 0), []);

  useFrame(({ camera }, delta) => {
    const targetX = reduceMotion ? 0 : pointer.current.x * 0.4;
    const targetY = reduceMotion ? 0 : pointer.current.y * 0.25;
    const targetZ = reduceMotion ? 4.2 : 4.2 + scrollProgress.current * 2.5;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 2.6, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 2.6, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 2.1, delta);
    camera.lookAt(target);
  });

  return (
    <>
      <DepthParticles />
      <OrbitalStructure reduceMotion={reduceMotion} />
    </>
  );
}

export default function SpatialObjectExperience() {
  const pointer = useRef(new THREE.Vector2());
  const scrollProgress = useRef(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReduceMotion(media.matches);
    const updatePointer = (event: PointerEvent) => {
      pointer.current.set(
        (event.clientX / window.innerWidth - 0.5) * 2,
        -(event.clientY / window.innerHeight - 0.5) * 2,
      );
    };
    const resetPointer = () => pointer.current.set(0, 0);
    const updateScroll = () => {
      const availableScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollProgress.current = THREE.MathUtils.clamp(window.scrollY / availableScroll, 0, 1);
    };

    updateMotionPreference();
    updateScroll();
    media.addEventListener("change", updateMotionPreference);
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("blur", resetPointer);
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });

    return () => {
      media.removeEventListener("change", updateMotionPreference);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("blur", resetPointer);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  }, []);

  return (
    <div className="spatial-object-canvas" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 48, near: 0.1, far: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#000000", 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <SpatialScene pointer={pointer} scrollProgress={scrollProgress} reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  );
}
