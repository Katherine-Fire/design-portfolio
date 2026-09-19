import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// A long upper lintel, asymmetric shoulders and tapered lower jambs.
// All layers use one world-space mapping, including the wall's aperture seam.
export const WINDOW_COMPOSITION = { centerX: 1.15, centerY: 1.62, width: 2.76, height: 2.32 };
// Negative world Y yaw brings the right jamb toward the viewer. Apply to the
// whole architectural aperture, including wall infills, without reparenting.
export const WINDOW_ORIENTATION = { yawDeg: -31, pivot: [1.15, 1.62, -0.70] };
export const WINDOW_FRAMING = { scale: 1.05, offsetX: 0.04 };
export const WINDOW_CONVERGENCE = { leftHeightReduction: 0.08, leftInset: 0.025 };

function orientWindowAssembly(root: THREE.Object3D) {
  const [x, y, z] = WINDOW_ORIENTATION.pivot;
  const orientation = new THREE.Matrix4().makeTranslation(x, y, z)
    .multiply(new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(WINDOW_ORIENTATION.yawDeg)))
    .multiply(new THREE.Matrix4().makeTranslation(-x, -y, -z));
  // Uniform enlargement about the floor datum keeps the plinth grounded.
  const turn = new THREE.Matrix4().makeTranslation(x + WINDOW_FRAMING.offsetX, 0, z)
    .multiply(new THREE.Matrix4().makeScale(WINDOW_FRAMING.scale, WINDOW_FRAMING.scale, WINDOW_FRAMING.scale))
    .multiply(new THREE.Matrix4().makeTranslation(-x, 0, -z))
    .multiply(orientation);
  root.updateMatrixWorld(true);
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    let insideWindow = false;
    for (let parent: THREE.Object3D | null = object; parent; parent = parent.parent) {
      if (parent.name === 'WindowFrame' || parent.name === 'WindowSill') insideWindow = true;
    }
    if (!insideWindow && !/^(OuterFrame|InnerFrame|Bevel|WindowOpening|WindowLightStrip|WindowLightHousing|ArchitecturalWallReveal|ObservationWindowWall|ObservationWallExterior|ObservationWall.*Infill|OuterWallReturn)$/.test(object.name)) return;
    const old = object.geometry;
    const inverse = object.matrixWorld.clone().invert();
    object.geometry = old.clone();
    const wallConnection = /^(ObservationWindowWall|ObservationWallExterior|ObservationWall.*Infill|OuterWallReturn)$/.test(object.name);
    if (wallConnection) {
      // Keep the cabin's remote side/ceiling junctions sealed. The densely
      // sampled aperture wall transitions to the full yaw around the frame.
      const positions = object.geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        const p = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld);
        const weight = THREE.MathUtils.smoothstep(p.x, -3.0, -1.0)
          * (1 - THREE.MathUtils.smoothstep(p.x, 3.3, 3.895))
          * (1 - THREE.MathUtils.smoothstep(p.y, 3.25, 3.6));
        p.lerp(p.clone().applyMatrix4(turn), weight).applyMatrix4(inverse);
        positions.setXYZ(i, p.x, p.y, p.z);
      }
      object.geometry.computeVertexNormals();
    } else {
      object.geometry.applyMatrix4(inverse.multiply(turn).multiply(object.matrixWorld));
    }
    object.geometry.computeBoundingBox(); object.geometry.computeBoundingSphere();
    old.dispose();
  });
}

function softenedContour() {
  const points: THREE.Vector2[] = [];
  // Clockwise quarter-ellipses: broad upper-left shoulder, tighter right shoulder.
  [[0.30, 0.28], [0.34, 0.32], [0.39, 0.36], [0.46, 0.43]].forEach(([rx, ry], corner) => {
    const sx = corner < 2 ? 1 : -1, sy = corner === 0 || corner === 3 ? 1 : -1;
    const cx = sx * (1 - rx), cy = sy * (1 - ry);
    for (let i = 0; i <= 24; i++) {
      const angle = (corner * Math.PI / 2) + i / 24 * Math.PI / 2;
      points.push(new THREE.Vector2(cx + rx * Math.sin(angle), cy + ry * Math.cos(angle)));
    }
  });
  return points.map(p => {
    // Opening, frame courses and wall aperture share this far-side convergence.
    const farSide = 1 - THREE.MathUtils.smoothstep(p.x, -0.85, 0.35);
    return new THREE.Vector2(p.x + WINDOW_CONVERGENCE.leftInset * farSide,
      p.y * (1 - WINDOW_CONVERGENCE.leftHeightReduction * farSide));
  });
}

type Course = { width: number; height: number; z: number };

function frameGeometry(courses: Course[], inverse: THREE.Matrix4) {
  const contour = softenedContour(), count = contour.length;
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  courses.forEach((course, layer) => {
    contour.forEach((p, i) => {
      const world = new THREE.Vector3(WINDOW_COMPOSITION.centerX + p.x * course.width / 2,
        WINDOW_COMPOSITION.centerY + p.y * course.height / 2, course.z).applyMatrix4(inverse);
      positions.push(...world.toArray()); uvs.push(i / count, layer / (courses.length - 1));
      if (layer) {
        const a = (layer - 1) * count + i, b = (layer - 1) * count + (i + 1) % count;
        const c = layer * count + i, d = layer * count + (i + 1) % count;
        indices.push(a, c, b, b, c, d);
      }
    });
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function replaceWindowCourses(root: THREE.Object3D) {
  const profiles: Record<string, Course[]> = {
    OuterFrame: [
      { width: 3.48, height: 2.98, z: -0.62 }, { width: 3.48, height: 2.98, z: -0.43 },
      { width: 3.45, height: 2.95, z: -0.37 }, { width: 3.38, height: 2.88, z: -0.34 },
      { width: 3.23, height: 2.73, z: -0.34 }, { width: 3.17, height: 2.67, z: -0.40 },
    ],
    Bevel: [
      { width: 3.17, height: 2.67, z: -0.40 }, { width: 3.12, height: 2.62, z: -0.45 },
      { width: 3.00, height: 2.50, z: -0.72 }, { width: 2.94, height: 2.44, z: -0.82 },
      { width: 2.89, height: 2.39, z: -0.85 },
    ],
    InnerFrame: [
      { width: 2.89, height: 2.39, z: -0.85 }, { width: 2.87, height: 2.37, z: -0.87 },
      { width: 2.80, height: 2.36, z: -0.87 }, { width: 2.76, height: 2.32, z: -0.92 },
    ],
    WindowOpening: [{ width: 2.76, height: 2.32, z: -0.92 }, { width: 2.76, height: 2.32, z: -1.10 }],
  };
  for (const [name, courses] of Object.entries(profiles)) {
    const mesh = root.getObjectByName(name) as THREE.Mesh;
    mesh.geometry.dispose();
    mesh.geometry = frameGeometry(courses, mesh.matrixWorld.clone().invert());
  }
  const boxes = (name: string, parts: number[][]) => {
    const mesh = root.getObjectByName(name) as THREE.Mesh;
    const geometries = parts.map(([w, h, d, x, y, z]) => new THREE.BoxGeometry(w, h, d).translate(x, y, z).applyMatrix4(mesh.matrixWorld.clone().invert()));
    mesh.geometry.dispose(); mesh.geometry = mergeGeometries(geometries);
    geometries.forEach(g => g.dispose());
  };
  // Three recessed luminous inserts, not an emissive closed ring.
  const inserts = [
    [1.72, 0.018, 0.006, 1.32, 3.012, -0.332],
    [0.015, 1.16, 0.006, -0.430, 1.64, -0.332],
    [0.015, 1.24, 0.006, 2.775, 1.64, -0.332],
  ];
  boxes('WindowLightStrip', inserts);
  const housingParts = inserts.map(([w, h, , x, y, z]) =>
    new THREE.BoxGeometry(w + 0.035, h + 0.025, 0.008).translate(x, y, z - 0.005));
  const housing = new THREE.Mesh(mergeGeometries(housingParts),
    new THREE.MeshStandardMaterial({ color: 0x090807, metalness: 0.45, roughness: 0.48 }));
  housing.name = 'WindowLightHousing'; root.add(housing);
  housingParts.forEach(g => g.dispose());
  boxes('WindowSill', [
    [3.34, 0.29, 0.49, 1.15, 0.145, -0.39],
    [3.02, 0.115, 0.80, 1.15, 0.365, -0.53],
  ]);
  // A broad wall reveal connects the existing frame to the cabin, not another
  // luminous frame. The lower courses meet the plinth and the floor at y = 0.
  const wall = root.getObjectByName('ObservationWindowWall') as THREE.Mesh;
  const sourceMaterial = (Array.isArray(wall.material) ? wall.material[0] : wall.material) as THREE.MeshStandardMaterial;
  const material = sourceMaterial.clone();
  material.name = 'Architectural_Wall_Recess';
  const surround = new THREE.Mesh(frameGeometry([
    { width: 4.02, height: 3.24, z: -0.545 },
    { width: 3.96, height: 3.20, z: -0.49 },
    { width: 3.77, height: 3.13, z: -0.47 },
    { width: 3.55, height: 3.02, z: -0.55 },
    { width: 3.48, height: 2.98, z: -0.62 },
  ], new THREE.Matrix4()), material);
  surround.name = 'ArchitecturalWallReveal';
  root.add(surround);

  // Only two long, non-emissive floor joints; no tiled grid or screen overlay.
  const seamMaterial = new THREE.MeshStandardMaterial({ color: 0x080706, roughness: 0.76, metalness: 0.2 });
  for (const x of [-0.65, 1.95]) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.002, 5.3), seamMaterial);
    seam.position.set(x, 0.001, 2.05); seam.name = 'FloorPanelJoint'; root.add(seam);
  }
}

function area(points: THREE.Vector2[]) {
  return Math.abs(THREE.ShapeUtils.area(points));
}

function radialIntersection(points: THREE.Vector2[], direction: THREE.Vector2) {
  let result = Infinity;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const edge = b.clone().sub(a);
    const denominator = direction.cross(edge);
    if (Math.abs(denominator) < 1e-10) continue;
    const distance = a.cross(edge) / denominator;
    const segment = a.cross(direction) / denominator;
    if (distance > 0 && segment >= -1e-6 && segment <= 1 + 1e-6) result = Math.min(result, distance);
  }
  if (!Number.isFinite(result)) throw new Error('Window contour must enclose its original centre');
  return result;
}

type Vertex = { position: THREE.Vector3; normal: THREE.Vector3; uv: THREE.Vector2 };

// The exported wall/sill have long planar triangles. Subdivide before the nonlinear
// mapping so their interior and the inset strips follow the same boundary.
function sampledGeometry(source: THREE.BufferGeometry, matrix: THREE.Matrix4) {
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [];
  const p = source.getAttribute('position'), n = source.getAttribute('normal'), uv = source.getAttribute('uv');
  const read = (i: number): Vertex => ({ position: new THREE.Vector3().fromBufferAttribute(p, i), normal: new THREE.Vector3().fromBufferAttribute(n, i), uv: uv ? new THREE.Vector2(uv.getX(i), uv.getY(i)) : new THREE.Vector2() });
  const midpoint = (a: Vertex, b: Vertex): Vertex => ({ position: a.position.clone().lerp(b.position, 0.5), normal: a.normal.clone().lerp(b.normal, 0.5).normalize(), uv: a.uv.clone().lerp(b.uv, 0.5) });
  const emit = (a: Vertex, b: Vertex, c: Vertex, depth = 0) => {
    const points = [a, b, c];
    const world = points.map(v => v.position.clone().applyMatrix4(matrix));
    const lengths = world.map((v, i) => v.distanceToSquared(world[(i + 1) % 3]));
    const edge = lengths.indexOf(Math.max(...lengths));
    if (lengths[edge] > 0.04 ** 2 && depth < 20) {
      const start = points[edge], end = points[(edge + 1) % 3], opposite = points[(edge + 2) % 3];
      const middle = midpoint(start, end);
      emit(start, middle, opposite, depth + 1); emit(middle, end, opposite, depth + 1);
      return;
    }
    for (const v of points) { positions.push(...v.position.toArray()); normals.push(...v.normal.toArray()); uvs.push(...v.uv.toArray()); }
  };
  const count = source.index?.count ?? p.count;
  for (let i = 0; i < count; i += 3) emit(read(source.index?.getX(i) ?? i), read(source.index?.getX(i + 1) ?? i + 1), read(source.index?.getX(i + 2) ?? i + 2));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return geometry;
}

export function reshapeObservationWindow(root: THREE.Object3D) {
  const opening = root.getObjectByName('WindowOpening');
  if (!(opening instanceof THREE.Mesh)) throw new Error('WindowOpening missing');
  root.updateMatrixWorld(true);
  const originalBounds = new THREE.Box3().setFromObject(opening);
  const center = originalBounds.getCenter(new THREE.Vector3());
  const positions = opening.geometry.getAttribute('position');
  const unique = new Map<string, THREE.Vector2>();
  for (let i = 0; i < positions.count; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(opening.matrixWorld);
    const v = new THREE.Vector2(p.x - center.x, p.y - center.y);
    unique.set(`${v.x.toFixed(5)},${v.y.toFixed(5)}`, v);
  }
  const source = [...unique.values()].sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
  const target = softenedContour().map(p => p.multiply(new THREE.Vector2(WINDOW_COMPOSITION.width / 2, WINDOW_COMPOSITION.height / 2)));
  const samples = 8192;
  const radii = Array.from({ length: samples + 1 }, (_, i) => {
    const angle = i / samples * Math.PI * 2;
    const d = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
    return [radialIntersection(source, d), radialIntersection(target, d)];
  });

  const changed: string[] = [];
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    if (!/^(ObservationWindowWall|ObservationWallExterior|ObservationWall.*Infill|OuterWallReturn)$/.test(object.name)) return;
    const old = object.geometry;
    const geometry = sampledGeometry(old, object.matrixWorld);
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const inverse = object.matrixWorld.clone().invert();
    const map = (local: THREE.Vector3) => {
      const p = local.clone().applyMatrix4(object.matrixWorld);
      const offset = new THREE.Vector2(p.x - center.x, p.y - center.y);
      const radius = offset.length();
      if (radius < 1e-8) return local.clone();
      const direction = offset.clone().divideScalar(radius);
      const index = ((Math.atan2(direction.y, direction.x) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * samples;
      const low = Math.floor(index), fraction = index - low;
      const oldRadius = THREE.MathUtils.lerp(radii[low][0], radii[low + 1][0], fraction);
      const newRadius = THREE.MathUtils.lerp(radii[low][1], radii[low + 1][1], fraction);
      // Full mapping around all frame courses; unchanged outer cabin boundaries.
      const weight = 1 - THREE.MathUtils.smoothstep(Math.abs(radius - oldRadius), 0.3, 0.7);
      p.x += direction.x * (newRadius - oldRadius) * weight;
      p.y += direction.y * (newRadius - oldRadius) * weight;
      p.x += (WINDOW_COMPOSITION.centerX - center.x) * weight;
      p.y += (WINDOW_COMPOSITION.centerY - center.y) * weight;
      return p.applyMatrix4(inverse);
    };
    for (let i = 0; i < position.count; i++) {
      const original = new THREE.Vector3().fromBufferAttribute(position, i);
      const p = map(original);
      const n = new THREE.Vector3().fromBufferAttribute(normal, i).normalize();
      const tangent = new THREE.Vector3().crossVectors(n, Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize();
      const bitangent = new THREE.Vector3().crossVectors(n, tangent);
      const t = map(original.clone().addScaledVector(tangent, 0.0001)).sub(p);
      const b = map(original.clone().addScaledVector(bitangent, 0.0001)).sub(p);
      n.crossVectors(t, b).normalize();
      position.setXYZ(i, p.x, p.y, p.z);
      normal.setXYZ(i, n.x, n.y, n.z);
    }
    position.needsUpdate = true;
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    object.geometry = geometry;
    old.dispose();
    changed.push(object.name);
  });
  replaceWindowCourses(root);
  orientWindowAssembly(root);
  const bounds = new THREE.Box3().setFromObject(opening);
  const frame = root.getObjectByName('OuterFrame')!;
  return {
    changed,
    orientation: WINDOW_ORIENTATION,
    framing: WINDOW_FRAMING,
    convergence: WINDOW_CONVERGENCE,
    openingCenter: bounds.getCenter(new THREE.Vector3()).toArray(),
    openingSize: bounds.getSize(new THREE.Vector3()).toArray(),
    frameSize: new THREE.Box3().setFromObject(frame).getSize(new THREE.Vector3()).toArray(),
    openingAreaBefore: area(source),
    openingAreaAfter: area(source.map(p => { const d = p.clone().normalize(); return d.multiplyScalar(radialIntersection(target, d)); })),
    depthRange: [originalBounds.min.z, originalBounds.max.z],
  };
}
