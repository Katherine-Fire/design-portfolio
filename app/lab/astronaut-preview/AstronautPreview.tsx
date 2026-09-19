'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import styles from './astronaut-preview.module.css';

const MODEL_URL = '/models/astronaut-preview/astronaut.glb';
const MODEL_HEIGHT = 0.808890909;
const MODEL_WIDTH = 0.497187689;
const DISPLAY_HEIGHT = 2.2;
const DISPLAY_SCALE = DISPLAY_HEIGHT / MODEL_HEIGHT;
type ShadingMode = 'original' | 'smooth';

function CameraControls() {
  const { camera, gl, invalidate, size } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controlsRef.current = controls;
    controls.target.set(0, DISPLAY_HEIGHT / 2, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = 1.4;
    controls.maxDistance = 8;
    controls.enablePan = false;
    const handleChange = () => invalidate();
    controls.addEventListener('change', handleChange);
    controls.update();
    return () => {
      controls.removeEventListener('change', handleChange);
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl, invalidate]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const perspective = camera as THREE.PerspectiveCamera;
    const verticalFov = THREE.MathUtils.degToRad(perspective.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * perspective.aspect);
    const fitHeight = DISPLAY_HEIGHT / (2 * Math.tan(verticalFov / 2));
    const fitWidth = (MODEL_WIDTH * DISPLAY_SCALE) / (2 * Math.tan(horizontalFov / 2));
    const distance = Math.max(fitHeight, fitWidth) * 1.16;
    camera.position.set(0, DISPLAY_HEIGHT / 2, distance);
    controls.minDistance = distance * 0.42;
    controls.maxDistance = distance * 2.4;
    controls.update();
    invalidate();
  }, [camera, invalidate, size.height, size.width]);

  useFrame(() => {
    if (controlsRef.current?.update()) invalidate();
  });
  return null;
}

function AstronautModel({ mode }: { mode: ShadingMode }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL);
  const originalNormalsRef = useRef(new Map<THREE.BufferGeometry, THREE.BufferAttribute | THREE.InterleavedBufferAttribute | null>());
  const smoothNormalsRef = useRef(new Map<THREE.BufferGeometry, THREE.BufferAttribute | THREE.InterleavedBufferAttribute>());
  const { invalidate } = useThree();

  useEffect(() => {
    gltf.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = false;
      object.receiveShadow = false;
      const sourceNormal = object.geometry.getAttribute('normal');
      originalNormalsRef.current.set(object.geometry, sourceNormal ?? null);
    });
    invalidate();
  }, [gltf, invalidate]);

  useEffect(() => {
    gltf.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const geometry = object.geometry;
      if (mode === 'smooth') {
        let smoothNormal = smoothNormalsRef.current.get(geometry);
        if (!smoothNormal) {
          geometry.computeVertexNormals();
          const computedNormal = geometry.getAttribute('normal');
          if (!computedNormal) return;
          const clonedNormal = computedNormal.clone() as THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
          smoothNormalsRef.current.set(geometry, clonedNormal);
          smoothNormal = clonedNormal;
        }
        geometry.setAttribute('normal', smoothNormal);
      } else {
        const sourceNormal = originalNormalsRef.current.get(geometry);
        if (sourceNormal) geometry.setAttribute('normal', sourceNormal);
        else geometry.deleteAttribute('normal');
      }
    });
    invalidate();
  }, [gltf, invalidate, mode]);

  return (
    <group scale={DISPLAY_SCALE} position={[0, 0.4052982032 * DISPLAY_SCALE, 0]}>
      <primitive object={gltf.scene} />
    </group>
  );
}

function LoadingReference() {
  return (
    <mesh position={[0, 1.05, 0]}>
      <boxGeometry args={[0.7, 2.1, 0.45]} />
      <meshBasicMaterial color="#111315" wireframe transparent opacity={0.32} />
    </mesh>
  );
}

export default function AstronautPreview() {
  const [mode, setMode] = useState<ShadingMode>('original');

  return (
    <main className={styles.preview}>
      <Canvas
        className={styles.canvas}
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.05, 3.45], fov: 38, near: 0.05, far: 50 }}
        gl={{ antialias: true, powerPreference: 'high-performance', outputColorSpace: THREE.SRGBColorSpace }}
      >
        <color attach="background" args={['#020303']} />
        <ambientLight color="#c4ccd2" intensity={0.18} />
        <directionalLight color="#f2ede5" intensity={2.1} position={[3.5, 4.5, 4]} />
        <directionalLight color="#9fc8ef" intensity={0.75} position={[-4, 2.5, -3]} />
        <Suspense fallback={<LoadingReference />}>
          <AstronautModel mode={mode} />
        </Suspense>
        <CameraControls />
      </Canvas>

      <aside className={styles.metrics} aria-label="GLB inspection summary">
        <p>ASTRONAUT / GLB QA</p>
        <dl>
          <div><dt>Triangles:</dt><dd>9,200,941</dd></div>
          <div><dt>Meshes:</dt><dd>1</dd></div>
          <div><dt>Materials:</dt><dd>1</dd></div>
          <div><dt>File:</dt><dd>157.95 MB</dd></div>
          <div><dt>Scale:</dt><dd>{DISPLAY_SCALE.toFixed(3)}× preview</dd></div>
          <div><dt>Normal:</dt><dd>{mode === 'original' ? 'Missing / source' : 'Recomputed smooth'}</dd></div>
          <div><dt>Indexed:</dt><dd>Yes</dd></div>
        </dl>
      </aside>

      <div className={styles.comparison} aria-label="Shading comparison">
        <button type="button" aria-pressed={mode === 'original'} onClick={() => setMode('original')}>A — ORIGINAL</button>
        <button type="button" aria-pressed={mode === 'smooth'} onClick={() => setMode('smooth')}>B — SMOOTH NORMALS</button>
      </div>

      <p className={styles.instructions}>DRAG — ROTATE<br />SCROLL — ZOOM</p>
    </main>
  );
}
