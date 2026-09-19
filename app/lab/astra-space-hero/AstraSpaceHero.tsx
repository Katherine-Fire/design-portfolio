'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import styles from './astra.module.css';
import { applyWebLookdev, WEB_LOOKDEV } from './webLookdev';
  import { reshapeObservationWindow, WINDOW_ORIENTATION, WINDOW_FRAMING } from './windowContour';
import { composeObservatory } from './sceneComposition';

type Lookdev = {
  view: { exposure: number };
  lights: { name: string; type: string; energy: number; color_linear: number[]; matrix_world: number[][]; size: number | null; size_y: number | null }[];
};

export default function AstraSpaceHero() {
  const mountRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLOutputElement>(null);
  useEffect(() => {
    const mount = mountRef.current!;
    const started = performance.now();
    const abort = new AbortController();
    let disposed = false, frame = 0;
    let renderer: THREE.WebGLRenderer;
    const report = (text: string) => { if (metricsRef.current) metricsRef.current.value = text; };
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
    catch { report('WebGL unavailable'); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.setClearColor(0x000000);
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    let textureInventory: THREE.Texture[] = [];
    let camera: THREE.PerspectiveCamera | undefined;
    const resize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      if (camera) { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); }
    };
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();
    const release = (root: THREE.Object3D) => {
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
      root.traverse(object => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
        }
      });
      materials.forEach(m => { Object.values(m).forEach(v => { if (v instanceof THREE.Texture) textures.add(v); }); m.dispose(); });
      geometries.forEach(g => g.dispose()); textures.forEach(t => { t.dispose(); if (t.image instanceof ImageBitmap) t.image.close(); });
    };
    void (async () => {
      const base = '/lab/astra-space-hero/';
      const [response, config] = await Promise.all([
        fetch('/models/astra-space-hero/Hero_SpaceScene_Web_Fixed.glb', { signal: abort.signal }),
        fetch(base + 'Hero_SpaceScene_Web_Lookdev.json', { signal: abort.signal }).then(r => { if (!r.ok) throw Error('Lookdev unavailable'); return r.json() as Promise<Lookdev>; }),
      ]);
      if (!response.ok) throw Error('GLB unavailable');
      const buffer = await response.arrayBuffer();
      const downloadMs = performance.now() - started;
      report('Parsing GLB / textures…');
      const gltf = await new GLTFLoader().parseAsync(buffer, base);
      if (disposed) { release(gltf.scene); return; }
      // GLTFLoader may resolve a scene after a failed image, substituting a null map.
      // Treat any missing texture as a visible load failure, never a valid baseline.
      const loadedTextures = await gltf.parser.getDependencies('texture') as (THREE.Texture | null)[];
      const failedTextures = loadedTextures.flatMap((texture, index) => !texture?.image ? [index] : []);
      if (failedTextures.length) {
        release(gltf.scene);
        throw Error(`Texture loading failed: indices ${failedTextures.join(', ')}`);
      }
      mount.dataset.texturesLoaded = String(loadedTextures.length);
      mount.dataset.textureInventory = JSON.stringify(loadedTextures.map((texture, index) => {
        const image = texture!.image as { width: number; height: number };
        return { index, name: texture!.name, width: image.width, height: image.height };
      }));
      const parseMs = performance.now() - started - downloadMs;
      textureInventory = loadedTextures as THREE.Texture[];
      scene.add(gltf.scene); scene.updateMatrixWorld(true);
      camera = gltf.cameras.find(c => c instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera | undefined;
      if (!camera) throw Error('Exported HeroCamera missing');
      mount.dataset.composition = JSON.stringify(composeObservatory(gltf.scene, camera));
      mount.dataset.windowContour = JSON.stringify(reshapeObservationWindow(gltf.scene));
        mount.dataset.lookdev = JSON.stringify(applyWebLookdev(gltf.scene, [
          ...config.lights.filter(light => light.type === 'AREA').map(light => light.name),
          'Strip_Top', 'Strip_Left', 'Strip_Right',
        ]));
      gltf.scene.traverse(o => {
        if (o instanceof THREE.Mesh && !/Atmosphere|Stars/i.test(o.name)) {
          o.castShadow = true; o.receiveShadow = true;
        }
      });
      camera = gltf.cameras.find(c => c instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera | undefined;
      if (!camera) throw Error('Exported HeroCamera missing');
      // GLB already converts Blender Z-up to glTF Y-up. Only JSON lights need conversion.
      gltf.scene.traverse(o => { if (o instanceof THREE.Light) o.visible = false; });
      RectAreaLightUniformsLib.init();
      const basis = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
      for (const source of config.lights) {
        const color = new THREE.Color().setRGB(source.color_linear[0], source.color_linear[1], source.color_linear[2], THREE.LinearSRGBColorSpace);
        const matrix = new THREE.Matrix4().set(...source.matrix_world.flat() as Parameters<THREE.Matrix4['set']>);
        matrix.premultiply(basis);
        const position = new THREE.Vector3(), rotation = new THREE.Quaternion(), scale = new THREE.Vector3();
        matrix.decompose(position, rotation, scale);
        if (source.type === 'SUN') {
          const light = new THREE.DirectionalLight(color, source.energy);
          light.name = source.name; light.position.copy(position);
          light.castShadow = true;
          light.shadow.mapSize.set(2048, 2048);
          Object.assign(light.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: .1, far: 120 });
          light.shadow.normalBias = .005;
          light.shadow.bias = -.0005;
          light.target.position.copy(position).add(new THREE.Vector3(0, 0, -1).applyQuaternion(rotation));
          // Blender Sun position is irrelevant, but Three starts its shadow frustum
          // there. Place it upstream so the cabin can actually occlude the sunlight.
          light.position.copy(light.target.position).addScaledVector(new THREE.Vector3(0, 0, 1).applyQuaternion(rotation), 40);
          scene.add(light, light.target);
        } else if (source.type === 'AREA') {
          const width = WEB_LOOKDEV.areaWidth[source.name] ?? source.size ?? 1, height = WEB_LOOKDEV.areaHeight[source.name] ?? source.size_y ?? width;
          // Blender power -> Lambertian area radiance; kept explicit for calibration.
          const energy = WEB_LOOKDEV.areaPower[source.name] ?? source.energy;
          const light = new THREE.RectAreaLight(color, energy / (Math.PI * width * height), width, height);
          light.name = source.name; light.position.copy(position); light.quaternion.copy(rotation); scene.add(light);
          if (source.name === 'Window_Close_Bounce') {
            light.position.fromArray(WEB_LOOKDEV.windowBounce.position);
            light.lookAt(new THREE.Vector3().fromArray(WEB_LOOKDEV.windowBounce.target));
          }
          if (source.name === 'Sill_Subtle_Reflection') {
            light.position.fromArray(WEB_LOOKDEV.sillBounce.position);
            light.lookAt(new THREE.Vector3().fromArray(WEB_LOOKDEV.sillBounce.target));
          }
          if (source.name === 'Planet_WarmEdge_Bounce') {
            light.position.fromArray(WEB_LOOKDEV.characterBounce.position);
            light.lookAt(new THREE.Vector3().fromArray(WEB_LOOKDEV.characterBounce.target));
          }
        }
      }
        // Emissive meshes do not illuminate neighbours in this raster renderer.
        // Match three real area emitters to the existing transformed inserts.
        const [wx, wy, wz] = WINDOW_ORIENTATION.pivot;
        const yaw = THREE.MathUtils.degToRad(WINDOW_ORIENTATION.yawDeg);
        const insertTransform = new THREE.Matrix4().makeTranslation(wx + WINDOW_FRAMING.offsetX, 0, wz)
          .multiply(new THREE.Matrix4().makeScale(WINDOW_FRAMING.scale, WINDOW_FRAMING.scale, WINDOW_FRAMING.scale))
          .multiply(new THREE.Matrix4().makeTranslation(0, wy, 0))
          .multiply(new THREE.Matrix4().makeRotationY(yaw))
          .multiply(new THREE.Matrix4().makeTranslation(-wx, -wy, -wz));
        for (const [x, y, width, height] of [[1.32, 3.012, 1.72, 0.025], [-0.430, 1.64, 0.025, 1.16], [2.775, 1.64, 0.025, 1.24]]) {
          const light = new THREE.RectAreaLight(0xffb36a, 0.9, width * WINDOW_FRAMING.scale, height * WINDOW_FRAMING.scale);
          light.position.set(x, y, -0.25).applyMatrix4(insertTransform);
          light.lookAt(new THREE.Vector3(x, y, -0.60).applyMatrix4(insertTransform));
          light.name = 'WindowStrip_LocalSpill'; scene.add(light);
        }
        gltf.scene.traverse(object => {
          if (!(object instanceof THREE.Mesh) || !/Marker/i.test(object.name)) return;
          const light = new THREE.PointLight(0xffa45c, 0.012, 0.50, 2);
          light.position.copy(new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3()))
            .add(new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(0.035));
          light.name = 'Marker_LocalBounce'; scene.add(light);
        });
        renderer.toneMappingExposure = WEB_LOOKDEV.exposure;
      renderer.shadowMap.needsUpdate = true;
      // Atmosphere profiles are evaluated from view/light direction; no baked view mask.
      // No animation mixer: the exported static pose and camera remain untouched.
      resize();
      await renderer.compileAsync(scene, camera);
      if (disposed) return;
      renderer.render(scene, camera);
      renderer.getContext().finish(); // One-time first-frame completion measurement, never in the FPS loop.
      const readyMs = performance.now() - started;
      mount.dataset.ready = 'true';
      mount.dataset.downloadMs = downloadMs.toFixed(1);
      mount.dataset.parseMs = parseMs.toFixed(1);
      mount.dataset.readyMs = readyMs.toFixed(1);
      let count = 0, sampleStart = performance.now();
      const render = () => {
        if (disposed || !camera) return;
        renderer.render(scene, camera);
        const now = performance.now(); count++;
        if (now - sampleStart >= 2000) {
          const fps = count * 1000 / (now - sampleStart);
          mount.dataset.fps = fps.toFixed(1);
          mount.dataset.triangles = String(renderer.info.render.triangles);
          report(`READY ${(readyMs / 1000).toFixed(2)}s · ${fps.toFixed(1)} FPS · DPR ${renderer.getPixelRatio()}`);
          count = 0; sampleStart = now;
        }
        frame = requestAnimationFrame(render);
      };
      render();
    })().catch(error => { if (!disposed) report(`Unable to load scene: ${error.message}`); });
    return () => { disposed = true; abort.abort(); cancelAnimationFrame(frame); observer.disconnect(); release(scene); textureInventory.forEach(texture => { texture.dispose(); if (texture.image instanceof ImageBitmap) texture.image.close(); }); renderer.dispose(); renderer.domElement.remove(); };
  }, []);
  return <main className={styles.page}>
    <div ref={mountRef} className={styles.canvas} />
    <header className={styles.header}><Link href="/lab">BACK TO LAB</Link><span>ASTRA / STATIC LOOKDEV</span></header>
    <output ref={metricsRef} className={styles.metrics} aria-live="off">Loading 344 MiB scene…</output>
  </main>;
}
