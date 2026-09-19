import * as THREE from 'three';

export const SCENE_COMPOSITION = {
  camera: { position: [-1.15, 1.22, 5.10], target: [-0.25, 1.34, -0.80], fov: 41.5 },
  character: { position: [0.48, 0, 0.20], scale: 0.88, rotationY: -0.72 },
  planet: { position: [31, -9, -38] },
};

export function composeObservatory(root: THREE.Object3D, camera: THREE.PerspectiveCamera) {
  const { character, planet } = SCENE_COMPOSITION;
  const actor = root.getObjectByName('Character');
  if (!actor) throw new Error('Character group missing');
  actor.position.fromArray(character.position); actor.scale.setScalar(character.scale); actor.rotation.y = character.rotationY;
  root.updateMatrixWorld(true);
  // Source mesh is untouched; keep the soles exactly on the original floor top.
  actor.position.y -= new THREE.Box3().setFromObject(actor).min.y;
  for (const name of ['Planet', 'PlanetAtmosphere', 'PlanetAtmosphere_SoftFalloff']) {
    const object = root.getObjectByName(name);
    if (!object) throw new Error(`${name} missing`);
    object.position.fromArray(planet.position);
  }
  camera.position.fromArray(SCENE_COMPOSITION.camera.position);
  camera.lookAt(new THREE.Vector3().fromArray(SCENE_COMPOSITION.camera.target));
  camera.fov = SCENE_COMPOSITION.camera.fov; camera.updateProjectionMatrix();
  root.updateMatrixWorld(true);
  return SCENE_COMPOSITION;
}
