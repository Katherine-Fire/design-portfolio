import * as THREE from 'three';

// Web-only art direction. The GLB, camera, maps and topology remain unchanged.
// Only the two existing atmosphere meshes get a larger, concentric shell scale.
export const WEB_LOOKDEV = {
  exposure: 0.95,
  atmosphere: {
    innerScale: 1.034,
    outerScale: 1.085,
    core: { color: '#FFF0D7', intensity: 4.5, opacity: 0.78, fresnel: 1.2 },
    body: { color: '#FFB95E', intensity: 1.62, opacity: 0.84, fresnel: 0.7 },
    halo: { color: '#F5A04D', intensity: 0.94, opacity: 0.37, fresnel: 1.5 },
    coreWidth: 0.75,
    bodyWidth: 1.4,
    haloEnd: 0.085,
    verticalMin: 0.82,
    directionMin: -0.03,
    directionMax: 0.32,
    directionPower: 1.4,
  },
  surface: {
    interiorResponse: 0.76,
    fadeStart: 0.32,
    fadeEnd: 0.78,
    nearLimbResponse: 2.35,
    nearLimbStart: 0.14,
    nearLimbEnd: 0.44,
    limbVisibility: 0.58,
    midVisibility: 0.38,
    midVisibilityEnd: 0.48,
    interiorVisibility: 0.21,
    visibilityFadeEnd: 0.88,
  },
  characterSunResponse: 0.65,
  frameSunResponse: 0.25,
  frameBounceResponse: 0.32,
  areaPower: {
    Cool_Rim: 0.55,
    Weak_Fill: 0.16,
    Planet_WarmEdge_Bounce: 82,
    Window_Close_Bounce: 96,
    Sill_Subtle_Reflection: 6.5,
  } as Record<string, number>,
  areaWidth: { Planet_WarmEdge_Bounce: 0.72, Window_Close_Bounce: 2.4, Sill_Subtle_Reflection: 0.65 } as Record<string, number>,
  areaHeight: { Planet_WarmEdge_Bounce: 2.0, Window_Close_Bounce: 2.4, Sill_Subtle_Reflection: 2.6 } as Record<string, number>,
  characterBounce: { position: [2.4, 2.25, 0.05], target: [0.48, 0.65, 0.20] },
  sillBounce: { position: [1.15, 0.28, -0.02], target: [0.72, 0, 1.65] },
  windowBounce: { position: [1.15, 1.2, 1.2], target: [1.15, 1.5, -0.7] },
};

const LIGHT_DIRECTION = new THREE.Vector3(-0.65, 0.45, 0.35).normalize();
const glsl = (value: number) => value.toFixed(6);

function atmosphere(outer: boolean, center: THREE.Vector3, radius: number) {
  const settings = WEB_LOOKDEV.atmosphere;
  return new THREE.ShaderMaterial({
    name: outer ? 'Web / soft orange halo' : 'Web / hot core + amber body',
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    uniforms: {
      lightDirection: { value: LIGHT_DIRECTION.clone() },
      planetCenter: { value: center.clone() },
      planetRadius: { value: radius },
      coreColor: { value: new THREE.Color(settings.core.color) },
      bodyColor: { value: new THREE.Color(settings.body.color) },
      haloColor: { value: new THREE.Color(settings.halo.color) },
    },
    vertexShader: `
      varying vec3 worldPosition;
      void main() {
        worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 lightDirection;
      uniform vec3 planetCenter;
      uniform float planetRadius;
      uniform vec3 coreColor;
      uniform vec3 bodyColor;
      uniform vec3 haloColor;
      varying vec3 worldPosition;
      void main() {
        vec3 n = normalize(worldPosition - planetCenter);
        vec3 ray = normalize(worldPosition - cameraPosition);
        float fresnel = 1.0 - clamp(dot(n, -ray), 0.0, 1.0);
        float lit = pow(smoothstep(${glsl(settings.directionMin)}, ${glsl(settings.directionMax)},
          dot(n, lightDirection)), ${glsl(settings.directionPower)});
        // Static latitude weighting, never noise or time-varying brightness.
        lit *= mix(${glsl(settings.verticalMin)}, 1.0, smoothstep(-0.3, 0.35, n.y));
        // Signed projected altitude relative to the actual surface silhouette.
        // This anchors the hot line at the planet, not at the expanded shell edge.
        float altitude = length(cross(planetCenter - cameraPosition, ray)) / planetRadius - 1.0;
        ${outer ? `
          float halo = smoothstep(-0.012, 0.003, altitude)
            * pow(1.0 - smoothstep(0.003, ${glsl(settings.haloEnd)}, altitude), 2.0)
            * pow(fresnel, ${glsl(settings.halo.fresnel)}) * ${glsl(settings.halo.opacity)};
          gl_FragColor = vec4(haloColor * ${glsl(settings.halo.intensity)}, halo * lit);
        ` : `
          float core = (1.0 - smoothstep(${glsl(0.0005 * settings.coreWidth)}, ${glsl(0.0045 * settings.coreWidth)}, abs(altitude - 0.0005)))
            * pow(fresnel, ${glsl(settings.core.fresnel)}) * ${glsl(settings.core.opacity)};
          float body = smoothstep(${glsl(-0.042 * settings.bodyWidth)}, ${glsl(-0.004 * settings.bodyWidth)}, altitude)
            * (1.0 - smoothstep(${glsl(0.003 * settings.bodyWidth)}, ${glsl(0.023 * settings.bodyWidth)}, altitude))
            * pow(fresnel, ${glsl(settings.body.fresnel)}) * ${glsl(settings.body.opacity)};
          float weight = core + body;
          vec3 radiance = (coreColor * ${glsl(settings.core.intensity)} * core
            + bodyColor * ${glsl(settings.body.intensity)} * body) / max(weight, 0.00001);
          gl_FragColor = vec4(radiance, min(weight, 1.0) * lit);
        `}
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function applyWebLookdev(root: THREE.Object3D, areaNames: string[]) {
  const characterBounces = areaNames.flatMap((name, index) =>
    /^(Planet_WarmEdge_Bounce|Window_Close_Bounce|Sill_Subtle_Reflection|Strip_.*)$/.test(name) ? [index] : []);
  const planet = root.getObjectByName('Planet');
  if (!(planet instanceof THREE.Mesh)) throw new Error('Planet mesh missing for atmosphere calibration');
  planet.geometry.computeBoundingBox();
  const radius = planet.geometry.boundingBox!.getSize(new THREE.Vector3()).x * planet.getWorldScale(new THREE.Vector3()).x / 2;
  const center = planet.getWorldPosition(new THREE.Vector3());
  const shells: { name: string; radius: number; scale: number[] }[] = [];
  const processed = new Set<THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    if (/PlanetAtmosphere/.test(object.name)) {
      const outer = /SoftFalloff/.test(object.name);
      const original = Array.isArray(object.material) ? object.material : [object.material];
      object.geometry.computeBoundingBox();
      const sourceRadius = object.geometry.boundingBox!.getSize(new THREE.Vector3()).x * object.getWorldScale(new THREE.Vector3()).x / 2;
      const targetRadius = radius * (outer ? WEB_LOOKDEV.atmosphere.outerScale : WEB_LOOKDEV.atmosphere.innerScale);
      object.scale.multiplyScalar(targetRadius / sourceRadius);
      object.updateMatrixWorld(true);
      object.material = atmosphere(outer, center, radius);
      // Outer halo behind the inner body/core. Both remain depth-tested by the cabin.
      object.renderOrder = outer ? 1 : 2;
      shells.push({ name: object.name, radius: targetRadius, scale: object.scale.toArray() });
      // Maps are retained by GLTFParser and released with the texture inventory.
      original.forEach(material => material.dispose());
      return;
    }
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!(material instanceof THREE.MeshStandardMaterial) || processed.has(material)) continue;
      processed.add(material);
      const name = material.name;
      const character = /EXPLORER/i.test(name);
      const floor = /Cabin_Floor/.test(name);
      const wall = /Cabin_.*Wall|Architectural_Wall/.test(name);
      const sill = /Window_Sill/.test(name);
      const surface = /Planet_Geological_Surface/.test(name);
      const frame = /Window_(Bevel|InnerFrame|OuterFrame)/.test(name);
      if (floor) {
        // Preserve the ORM texture: effective roughness is approximately .33–.37.
        material.color.setRGB(0.014, 0.013, 0.012, THREE.LinearSRGBColorSpace);
        material.roughness = 0.74;
        material.metalness = 0.42;
        if (material instanceof THREE.MeshPhysicalMaterial) material.specularIntensity = 0.55;
      } else if (wall) {
        material.color.setRGB(0.018, 0.017, 0.016, THREE.LinearSRGBColorSpace);
        material.roughness = 0.92;
        material.metalness = 0.25;
      } else if (frame || /Window_Sill/.test(name)) {
        material.roughness = sill ? 0.95 : 1.35;
        if (frame) {
          material.metalness = 0.62;
          if (material instanceof THREE.MeshPhysicalMaterial) material.specularIntensity = 0.4;
        }
      } else if (surface) {
        material.color.multiply(new THREE.Color().setRGB(1, 0.88, 0.72, THREE.LinearSRGBColorSpace));
        material.roughness = 1.08;
        if (material instanceof THREE.MeshPhysicalMaterial) material.specularIntensity = 0.12;
      } else if (character) {
        material.roughness = 0.92; // Preserve the original ORM map, especially visor vs suit.
      } else if (/Window_LightStrip/.test(name)) {
        material.emissiveIntensity *= 0.65;
      } else if (/Star_Dim/.test(name)) {
        material.emissiveIntensity *= 0.7;
      }
      // Retain the cabin exclusion. Only the metal frame receives a weak planet bounce.
      // Three light.layers is camera filtering, NOT per-mesh light linking.
      const excluded = characterBounces;
      material.onBeforeCompile = shader => {
        let lights = THREE.ShaderChunk.lights_fragment_begin;
        if (surface) {
          lights = lights.replace('directionalLight = directionalLights[ i ];',
            'directionalLight = directionalLights[ i ]; directionalLight.direction = normalize(mat3(viewMatrix) * vec3(-0.65, 0.45, 0.35));');
        }
        if (character) {
          lights = lights.replace('directionalLight = directionalLights[ i ];',
            `directionalLight = directionalLights[ i ]; directionalLight.color *= ${glsl(WEB_LOOKDEV.characterSunResponse)};`);
        }
        if (frame) {
          lights = lights.replace('directionalLight = directionalLights[ i ];',
            `directionalLight = directionalLights[ i ]; directionalLight.color *= ${glsl(WEB_LOOKDEV.frameSunResponse)};`);
        }
        if (floor) {
          // The cabin floor reads primarily through the broad bounced area light,
          // not a hard sun footprint through the architectural opening.
          lights = lights.replace('directionalLight = directionalLights[ i ];',
            'directionalLight = directionalLights[ i ]; directionalLight.color *= 0.08;');
        }
        if (excluded.length) {
          lights = lights.replace('rectAreaLight = rectAreaLights[ i ];',
            `rectAreaLight = rectAreaLights[ i ];
             ${excluded.map(i => {
               const areaName = areaNames[i];
               if (areaName.startsWith('Strip_')) return `if (UNROLLED_LOOP_INDEX == ${i}) {
                 vec3 delta = -vViewPosition - rectAreaLight.position;
                 float w = length(rectAreaLight.halfWidth), h = length(rectAreaLight.halfHeight);
                 vec3 wx = rectAreaLight.halfWidth / max(w, 0.0001);
                 vec3 hy = rectAreaLight.halfHeight / max(h, 0.0001);
                 vec3 nearest = wx * clamp(dot(delta, wx), -w, w) + hy * clamp(dot(delta, hy), -h, h);
                 rectAreaLight.color *= 1.0 - smoothstep(0.06, 0.40, length(delta - nearest));
               }`;
               if (areaName === 'Planet_WarmEdge_Bounce') {
                 const response = character ? 1.25 : frame ? 0.40 : wall ? 0.018 : sill ? 0.68 : floor ? 0 : 0;
                 return `if (UNROLLED_LOOP_INDEX == ${i}) {
                 float warmDistance = length(-vViewPosition - rectAreaLight.position);
                 rectAreaLight.color *= ${glsl(response)} * (1.0 - smoothstep(1.10, 4.80, warmDistance));
               }`;
               }
               const response = areaName === 'Window_Close_Bounce'
                 ? character ? 0.006 : frame ? 1 : wall ? 0.10 : sill ? 0.10 : 0
                 : areaName === 'Sill_Subtle_Reflection'
                   ? character ? 0.12 : frame ? 0.18 : wall ? 0.02 : sill ? 1 : 0
                   : 1;
               return `if (UNROLLED_LOOP_INDEX == ${i}) rectAreaLight.color *= ${glsl(response)};`;
             }).join('\n')}`);
        }
        shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', lights);
        if (floor) {
          // Coating variation changes PBR roughness, never the output color.
          shader.vertexShader = 'varying vec3 coatingPosition;\n' + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>',
            '#include <worldpos_vertex>\n coatingPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;');
          shader.fragmentShader = 'varying vec3 coatingPosition;\n' + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>',
            `#include <roughnessmap_fragment>
             roughnessFactor = clamp(roughnessFactor + 0.018 * sin(coatingPosition.x * 2.1)
               * sin(coatingPosition.z * 0.8), 0.26, 0.40);`);
          shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_end>', `
            #include <lights_fragment_end>
            // Two low-energy, perspective-aligned coating responses. They are
            // broken by the actual panel seams and vanish before the left bay.
            float reflectionAxis = 1.08 - coatingPosition.z * 0.16;
            float reflectionDepth = smoothstep(-0.25, 0.35, coatingPosition.z)
              * (1.0 - smoothstep(3.2, 4.9, coatingPosition.z));
            float broadStreak = (1.0 - smoothstep(0.12, 0.88,
              abs(coatingPosition.x - reflectionAxis))) * reflectionDepth;
            float narrowStreak = (1.0 - smoothstep(0.035, 0.32,
              abs(coatingPosition.x - reflectionAxis - 0.18))) * reflectionDepth;
            float longitudinalSeams = 1.0 - 0.38 * smoothstep(0.445, 0.50,
              abs(fract((coatingPosition.z + 0.16) * 0.72) - 0.5));
            float crossSeams = 1.0 - 0.24 * smoothstep(0.455, 0.50,
              abs(fract((coatingPosition.x - 0.08) * 0.58) - 0.5));
            float footStreak = (1.0 - smoothstep(0.06, 0.46,
              abs(coatingPosition.x - reflectionAxis + 0.30)))
              * smoothstep(-0.18, 0.24, coatingPosition.z)
              * (1.0 - smoothstep(2.45, 4.35, coatingPosition.z));
            float panelBreak = longitudinalSeams * crossSeams;
            vec3 warmReflection = vec3(0.20, 0.060, 0.018)
              * (broadStreak * 0.18 + narrowStreak * 0.19 + footStreak * 0.16)
              * panelBreak;
            reflectedLight.indirectDiffuse += warmReflection * (1.0 - roughnessFactor) * 0.18;
            reflectedLight.indirectSpecular += warmReflection * (1.0 - roughnessFactor) * 1.18;
          `);
        }
        if (surface) {
          // The exported albedo already contains Blender's very dark terminator.
          // Recover local terrain tonal range without lifting the cabin or exposure.
          shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
            #include <map_fragment>
            float terrainLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
            vec3 copper = terrainLuma * vec3(1.25, 0.82, 0.43);
            diffuseColor.rgb = mix(diffuseColor.rgb, copper, 0.65)
              * min(4.0, pow(max(terrainLuma, 0.001), -0.25));
          `);
          shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_end>', `
            #include <lights_fragment_end>
            float interior = smoothstep(${glsl(WEB_LOOKDEV.surface.fadeStart)}, ${glsl(WEB_LOOKDEV.surface.fadeEnd)},
              abs(dot(nonPerturbedNormal, normalize(vViewPosition))));
            float terrainResponse = mix(1.0, ${glsl(WEB_LOOKDEV.surface.interiorResponse)}, interior);
            // Projected radial depth: 0 at limb, 1 at disc centre. Boost only
            // the outer terrain band, fading fully away before the mid-disc.
            float facing = clamp(abs(dot(nonPerturbedNormal, normalize(vViewPosition))), 0.0, 1.0);
            float radialDepth = 1.0 - sqrt(max(0.0, 1.0 - facing * facing));
            float nearLimb = 1.0 - smoothstep(${glsl(WEB_LOOKDEV.surface.nearLimbStart)}, ${glsl(WEB_LOOKDEV.surface.nearLimbEnd)}, radialDepth);
            float nearLimbResponse = mix(1.0, ${glsl(WEB_LOOKDEV.surface.nearLimbResponse)}, nearLimb);
            reflectedLight.directDiffuse *= terrainResponse * nearLimbResponse;
            reflectedLight.directSpecular *= terrainResponse;
            // A planet-only, texture-preserving visibility floor. It reveals
            // terrain without lifting the cabin or flattening the terminator.
            float surfaceVisibility = mix(${glsl(WEB_LOOKDEV.surface.limbVisibility)},
              ${glsl(WEB_LOOKDEV.surface.midVisibility)},
              smoothstep(${glsl(WEB_LOOKDEV.surface.nearLimbStart)},
                ${glsl(WEB_LOOKDEV.surface.midVisibilityEnd)}, radialDepth));
            surfaceVisibility = mix(surfaceVisibility,
              ${glsl(WEB_LOOKDEV.surface.interiorVisibility)},
              smoothstep(${glsl(WEB_LOOKDEV.surface.midVisibilityEnd)},
                ${glsl(WEB_LOOKDEV.surface.visibilityFadeEnd)}, radialDepth));
            reflectedLight.indirectDiffuse += diffuseColor.rgb * surfaceVisibility;
          `);
        }
      };
      material.customProgramCacheKey = () => `astra-interior-${character}-${frame}-${surface}-${wall}-${sill}-${floor}-${excluded.join('-')}`;
      material.needsUpdate = true;
    }
  });
  return { shells, surfaceRadius: radius, atmosphereBands: 3 };
}
