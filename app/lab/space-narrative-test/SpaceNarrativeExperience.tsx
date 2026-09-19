'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { gsap } from 'gsap';
import styles from './space-narrative.module.css';

const PROGRESS_DAMPING = 0.08;
const POINTER_DAMPING = 0.05;
const PORTAL_Z = 0.7;
// Bump this URL when the authored asset changes so a returning browser never
// keeps the former astronaut in its HTTP cache.
const ASTRONAUT_MODEL = '/models/space-narrative/astronaut-modly.glb?v=explorer-pbr-20260908';
const PARALLAX = [0.008, 0.015, 0.025, 0.06, 0.08, -0.12, -0.15];
const KEYS = [
  { p: 0, x: -.8, y: -.65, z: 0, rx: 0, ry: .1, rz: 0, cameraZ: 5.5, ease: 'none' },
  { p: .2, x: -.76, y: -.55, z: -.18, rx: .03, ry: .1, rz: -.08, cameraZ: 4.85, ease: 'power1.in' },
  { p: .55, x: -.6, y: -.05, z: -1.55, rx: .07, ry: .04, rz: -.3, cameraZ: 2.2, ease: 'power1.in' },
  { p: .75, x: -.72, y: .18, z: -3.6, rx: .1, ry: -.1, rz: -.5, cameraZ: .3, ease: 'none' },
  { p: .9, x: -.78, y: .24, z: -4.2, rx: .13, ry: -.16, rz: -.6, cameraZ: -.4, ease: 'power2.out' },
  { p: 1, x: -.8, y: .25, z: -4.3, rx: .14, ry: -.18, rz: -.62, cameraZ: -.5, ease: 'sine.out' },
];

export default function SpaceNarrativeExperience() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLHeadingElement>(null);
  const secondRef = useRef<HTMLParagraphElement>(null);
  const readoutRef = useRef<HTMLOutputElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const mount = mountRef.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
    catch { root.dataset.renderer = 'fallback'; return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // The replacement asset carries calibrated ivory, obsidian and amber PBR maps.
    // Keep the portal cinematic while preserving the material separation.
    renderer.toneMappingExposure = .88;
    renderer.setClearColor('#030405');
    mount.appendChild(renderer.domElement);
    root.dataset.renderer = 'webgl';
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
    camera.position.z = 5.5;
    const groups = ['backgroundGroup', 'spaceGroup', 'characterGroup', 'cabinGroup', 'fxGroup'].map(name => {
      const group = new THREE.Group(); group.name = name; scene.add(group); return group;
    });
    const [background, space, character, cabin, fx] = groups;
    const matte = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: .68, metalness: .25 });
    const suit = new THREE.MeshStandardMaterial({color:'#c1b49d',roughness:.78,metalness:.06});
    const dark = matte('#10171c'), steel = new THREE.MeshStandardMaterial({color:'#252c30',roughness:.34,metalness:.55});
    const visor = new THREE.MeshPhysicalMaterial({color:'#293c48',transmission:.4,roughness:.09,ior:1.45,thickness:.15,metalness:.08});
    let disposed=false;
    const abort=new AbortController();
    const disposeObject=(object:THREE.Object3D)=>{
      const materials=new Set<THREE.Material>(), textures=new Set<THREE.Texture>();
      object.traverse(child=>{if(child instanceof THREE.Mesh || child instanceof THREE.Points){child.geometry.dispose();(Array.isArray(child.material)?child.material:[child.material]).forEach(m=>materials.add(m));}});
      materials.forEach(material=>{Object.values(material).forEach(value=>{if(value instanceof THREE.Texture)textures.add(value);});material.dispose();});
      textures.forEach(texture=>texture.dispose());
    };
    const mesh = (parent: THREE.Object3D, name: string, geometry: THREE.BufferGeometry, material: THREE.Material, x=0, y=0, z=0) => {
      const object = new THREE.Mesh(geometry, material); object.name = name; object.position.set(x,y,z); parent.add(object); return object;
    };
    const layer = (parent: THREE.Object3D, name: string) => { const group=new THREE.Group(); group.name=name; parent.add(group); return group; };
    const stars = layer(background, 'stars');
    const positions = new Float32Array(520 * 3);
    let seed = 37;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i=0;i<520;i++) {
      // Keep the left copy area almost empty; the faint depth belongs to the window side.
      positions[i*3]=-1.5+random()*26;
      positions[i*3+1]=(random()-.5)*18;
      positions[i*3+2]=-10-random()*24;
    }
    const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const starColors=new Float32Array(520*3);
    for(let i=0;i<520;i++){const brightness=i%109===0?.34:.018+random()*.036;starColors.set([brightness*.74,brightness*.82,brightness],i*3);}
    starGeometry.setAttribute('color',new THREE.BufferAttribute(starColors,3));
    stars.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({vertexColors:true,size:.009,transparent:true,opacity:.38,depthWrite:false})));
    mesh(background,'backgroundDepth',new THREE.PlaneGeometry(70,50),new THREE.MeshBasicMaterial({color:'#030405'}),0,0,-40);
    const stationLayer=layer(space,'stationParallax'), planetLayer=layer(space,'planetParallax');
    // Retained as an inert parallax layer so the established interaction hierarchy stays intact.
    const station=layer(stationLayer,'station'); station.visible=false;
    const planetSurfaceTexture=new THREE.TextureLoader().load('/textures/space-narrative/planet-surface.png');
    planetSurfaceTexture.colorSpace=THREE.SRGBColorSpace;
    planetSurfaceTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();
    planetSurfaceTexture.generateMipmaps=true;
    planetSurfaceTexture.minFilter=THREE.LinearMipmapLinearFilter;
    planetSurfaceTexture.magFilter=THREE.LinearFilter;
    const planetPosition=new THREE.Vector3(8.45,2.86,-18);
    const planetRadius=11.3;
    const planetRotation=new THREE.Euler(.11,-1.36,-.045);
    const planetMaterial=new THREE.MeshStandardMaterial({
      map:planetSurfaceTexture,
      color:'#ffffff',
      roughness:.8,
      metalness:0,
      emissive:'#000000',
      emissiveIntensity:0,
    });
    const planet=mesh(
      planetLayer,
      'planet',
      new THREE.SphereGeometry(planetRadius,96,64),
      planetMaterial,
      planetPosition.x,
      planetPosition.y,
      planetPosition.z,
    );
    planet.rotation.copy(planetRotation);
    const atmosphereVertexShader=`
      varying vec3 vWorldNormal;
      varying vec3 vViewDirection;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vViewDirection = normalize(cameraPosition - worldPosition.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;
    const atmosphereFragmentShader=`
      varying vec3 vWorldNormal;
      varying vec3 vViewDirection;
      uniform vec3 uLightDirection;
      uniform vec3 uInnerColor;
      uniform vec3 uOuterColor;
      uniform float uFresnelExponent;
      uniform float uStrength;
      uniform float uMaskStart;
      uniform float uMaskEnd;
      uniform float uAlphaExponent;
      void main() {
        vec3 normal = normalize(vWorldNormal);
        float fresnel = pow(1.0 - max(dot(normal, normalize(vViewDirection)), 0.0), uFresnelExponent);
        float directional = smoothstep(uMaskStart, uMaskEnd, dot(normal, uLightDirection));
        float scattering = fresnel * directional;
        vec3 color = mix(uOuterColor, uInnerColor, smoothstep(0.28, 0.94, scattering));
        gl_FragColor = vec4(color, pow(scattering, uAlphaExponent) * uStrength);
      }
    `;
    const atmosphereLightDirection=new THREE.Vector3(-.58,.34,.74).normalize();
    const softAtmosphereMaterial=new THREE.ShaderMaterial({
      side:THREE.BackSide,
      transparent:true,
      depthWrite:false,
      blending:THREE.AdditiveBlending,
      uniforms:{
        uLightDirection:{value:atmosphereLightDirection},
        uInnerColor:{value:new THREE.Color('#ffc27a')},
        uOuterColor:{value:new THREE.Color('#e88a3e')},
        uFresnelExponent:{value:3.2},
        uStrength:{value:.2},
        uMaskStart:{value:.05},
        uMaskEnd:{value:.68},
        uAlphaExponent:{value:.82},
      },
      vertexShader:atmosphereVertexShader,
      fragmentShader:atmosphereFragmentShader,
    });
    const softAtmosphere=mesh(
      planetLayer,
      'atmosphereSoftFalloff',
      new THREE.SphereGeometry(planetRadius*1.022,96,64),
      softAtmosphereMaterial,
      planetPosition.x,
      planetPosition.y,
      planetPosition.z,
    );
    softAtmosphere.rotation.copy(planetRotation);
    softAtmosphere.renderOrder=1;
    const hotRimMaterial=new THREE.ShaderMaterial({
      side:THREE.BackSide,
      transparent:true,
      depthWrite:false,
      blending:THREE.AdditiveBlending,
      uniforms:{
        uLightDirection:{value:atmosphereLightDirection},
        uInnerColor:{value:new THREE.Color('#fff0d8')},
        uOuterColor:{value:new THREE.Color('#ffc27a')},
        uFresnelExponent:{value:9.5},
        uStrength:{value:.92},
        uMaskStart:{value:.12},
        uMaskEnd:{value:.74},
        uAlphaExponent:{value:.72},
      },
      vertexShader:atmosphereVertexShader,
      fragmentShader:atmosphereFragmentShader,
    });
    const hotRim=mesh(
      planetLayer,
      'atmosphereHotRim',
      new THREE.SphereGeometry(planetRadius*1.008,96,64),
      hotRimMaterial,
      planetPosition.x,
      planetPosition.y,
      planetPosition.z,
    );
    hotRim.rotation.copy(planetRotation);
    hotRim.renderOrder=2;
    const astronautLayer=layer(character,'astronautParallax');
    // Composition lives outside the untouched narrative/parallax transforms.
    const composition=layer(astronautLayer,'astronautComposition');composition.position.x=1.85;
    const astronaut=layer(composition,'astronautTimeline');
    const visual=layer(astronaut,'astronautVisual');
    visual.position.set(.45,.42,0);
    visual.rotation.set(-.1,4.75,.12);
    visual.scale.setScalar(1.2);
    const placeholder=layer(visual,'astronautPlaceholder');
    mesh(placeholder,'helmet',new THREE.SphereGeometry(.18,24,16),suit,0,.47);
    mesh(placeholder,'visor',new THREE.SphereGeometry(.14,24,16),visor,0,.48,.1).scale.set(1,.72,.7);
    mesh(placeholder,'body',new THREE.CapsuleGeometry(.17,.3,6,16),suit,0,.12);
    mesh(placeholder,'backpack',new THREE.BoxGeometry(.3,.4,.18),steel,0,.15,-.2);
    for(const side of [-1,1]) {
      mesh(placeholder,'arm',new THREE.CylinderGeometry(.055,.065,.4,12),suit,side*.25,.1).rotation.z=side*.22;
      mesh(placeholder,'leg',new THREE.CylinderGeometry(.065,.075,.43,12),suit,side*.1,-.33);
      mesh(placeholder,'boot',new THREE.BoxGeometry(.14,.12,.23),dark,side*.1,-.58,.035);
    }
    // Do not show the legacy low-detail figure while the authored GLB parses.
    // The portal remains empty for the short load interval instead.
    placeholder.visible=false;
    // Missing or unsupported models leave the debug figure intact. Meshopt is
    // bundled with Three; Draco is intentionally not fetched from a CDN.
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    void fetch(ASTRONAUT_MODEL,{signal:abort.signal}).then(async response=>{
      if(!response.ok)return;
      const gltf=await loader.parseAsync(await response.arrayBuffer(),'/models/space-narrative/');
      if(disposed){disposeObject(gltf.scene);return;}
      const bounds=new THREE.Box3().setFromObject(gltf.scene),size=bounds.getSize(new THREE.Vector3());
      if(!Number.isFinite(size.y)||size.y<=0){disposeObject(gltf.scene);return;}
      const normalized=layer(visual,'astronautModel');normalized.scale.setScalar(1.25/size.y);
      gltf.scene.position.sub(bounds.getCenter(new THREE.Vector3()));
      gltf.scene.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=false;object.receiveShadow=false;}});
      normalized.add(gltf.scene);
    }).catch(()=>{/* The portal stays empty if this authored asset cannot load. */});
    const companionLayer=layer(character,'companionParallax');
    const companion=layer(companionLayer,'companionPlaceholder'); companion.position.set(.7,-.8,.25);
    companion.visible=false;
    mesh(companion,'shell',new THREE.SphereGeometry(.14,20,16),steel);
    mesh(companion,'eye',new THREE.SphereGeometry(.04,12,8),new THREE.MeshBasicMaterial({color:'#92b7c9'}),0,.02,.13);
    const portalLayer=layer(cabin,'portalParallax'), portal=layer(portalLayer,'portal');
    const portalMat=new THREE.MeshStandardMaterial({color:'#0b0c0d',metalness:.6,roughness:.36});
    const portalGrooveMat=new THREE.MeshStandardMaterial({color:'#040506',metalness:.45,roughness:.48});
    const portalStripMat=new THREE.MeshStandardMaterial({color:'#080604',metalness:.3,roughness:.45,emissive:'#d18a54',emissiveIntensity:.05});
    // The full geometry is deliberately offset to read as a cropped observation hatch on entry.
    portal.position.set(1.9,.32,PORTAL_Z);
    const outer=mesh(portal,'portalOuterFrame',new THREE.TorusGeometry(1.42,.1,16,128),portalMat); outer.scale.set(1.12,1,1);
    const bevel=mesh(portal,'portalBevel',new THREE.TorusGeometry(1.27,.03,12,128),portalGrooveMat); bevel.scale.set(1.12,1,1);
    const recess=mesh(portal,'portalRecess',new THREE.TorusGeometry(1.19,.02,12,128),portalMat); recess.scale.set(1.12,1,1);
    const strip=mesh(portal,'portalEmissiveStrip',new THREE.TorusGeometry(1.225,.005,8,128),portalStripMat); strip.scale.set(1.12,1,1);
    const glowMat=new THREE.MeshBasicMaterial({color:'#efb27b',transparent:true,opacity:.01,depthWrite:false});
    const cabinGlow=mesh(portal,'cabinGlow',new THREE.TorusGeometry(1.235,.003,6,128),glowMat); cabinGlow.scale.set(1.12,1,1);
    const sillMaterial=new THREE.MeshStandardMaterial({color:'#070809',metalness:.42,roughness:.52});
    mesh(portal,'windowSill',new THREE.BoxGeometry(3.1,.12,.22),sillMaterial,0,-1.5,.05);
    const reflection=layer(fx,'glassReflection');
    const glassMat=new THREE.MeshBasicMaterial({color:'#7e9dae',transparent:true,opacity:.025,depthWrite:false});
    mesh(reflection,'reflection',new THREE.PlaneGeometry(.12,2.4),glassMat,-1.65,0,1).rotation.z=-.3;
    mesh(fx,'rimLightPlane',new THREE.PlaneGeometry(.015,1.6),glassMat,1.8,0,.9);
    const dustGeo=new THREE.BufferGeometry(); dustGeo.setAttribute('position',new THREE.BufferAttribute(positions.slice(0,90).map((v,i)=> i%3===2 ? .5 : v*.08),3));
    fx.add(Object.assign(new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#8a9297',size:.009,transparent:true,opacity:.15,depthWrite:false})),{name:'dustParticles'}));
    scene.add(new THREE.AmbientLight('#e3e5e7',.028));
    const key=new THREE.DirectionalLight('#ffd1a0',1.85); key.position.set(8,3.4,7.2); scene.add(key);
    const rim=new THREE.DirectionalLight('#b8d7e8',.72); rim.position.set(-4.2,3.4,-4.5); scene.add(rim);

    // Timeline writes base transforms; parallax and floating use separate parents.
    const timeline=gsap.timeline({paused:true,defaults:{ease:'none'}});
    const initial=KEYS[0];
    astronaut.position.set(initial.x,initial.y,initial.z); astronaut.rotation.set(initial.rx,initial.ry,initial.rz);
    portal.position.z=PORTAL_Z;
    KEYS.slice(1).forEach((k,i)=> {
      const start=KEYS[i].p, duration=k.p-start;
      timeline.addLabel(['awaken','push-through','crossing','deceleration','settle'][i],k.p);
      timeline.to(astronaut.position,{x:k.x,y:k.y,z:k.z,duration},start)
        .to(astronaut.rotation,{x:k.rx,y:k.ry,z:k.rz,duration},start)
        .to(camera.position,{z:k.cameraZ,duration,ease:k.ease},start);
    });
    timeline.to(companion.rotation,{z:.18,y:-.3,duration:.3},.7);
    timeline.to(firstRef.current,{opacity:0,y:-16,duration:.17},.55);
    timeline.fromTo(secondRef.current,{opacity:0,y:20},{opacity:1,y:0,duration:.23,immediateRender:true},.72);
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const state={mouseX:0,mouseY:0,progress:0};
    const pointerTarget={x:0,y:0};
    const resize=()=>{const {width,height}=root.getBoundingClientRect();renderer.setSize(width,height);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));camera.aspect=width/height;camera.fov=width<640?58:40;camera.updateProjectionMatrix();};
    const observer=new ResizeObserver(resize);observer.observe(root);resize();
    const pointer=(event:PointerEvent)=>{if(motion.matches || event.pointerType==='touch')return;const rect=root.getBoundingClientRect();pointerTarget.x=THREE.MathUtils.clamp((event.clientX-rect.left)/rect.width*2-1,-1,1);pointerTarget.y=THREE.MathUtils.clamp(1-(event.clientY-rect.top)/rect.height*2,-1,1);};
    root.addEventListener('pointermove',pointer);root.addEventListener('pointerdown',pointer);
    const layers=[stars,stationLayer,planetLayer,astronautLayer,companionLayer,portalLayer,reflection];
    let frame=0,previous=0,elapsed=0;
    const render=(now:number)=>{
      const dt=previous?Math.min((now-previous)/1000,.05):1/60;previous=now;
      if(!motion.matches)elapsed+=dt;
      const stage=stageRef.current!.getBoundingClientRect();
      const rawScrollProgress=THREE.MathUtils.clamp(-stage.top/Math.max(1,stage.height-root.clientHeight),0,1);
      state.progress=motion.matches?0:state.progress+(rawScrollProgress-state.progress)*(1-Math.pow(1-PROGRESS_DAMPING,dt*60));
      const pointerBlend=1-Math.pow(1-POINTER_DAMPING,dt*60);
      state.mouseX=motion.matches?0:THREE.MathUtils.lerp(state.mouseX,pointerTarget.x,pointerBlend);
      state.mouseY=motion.matches?0:THREE.MathUtils.lerp(state.mouseY,pointerTarget.y,pointerBlend);
      timeline.progress(state.progress);
      layers.forEach((group,i)=>{group.position.x=state.mouseX*PARALLAX[i];group.position.y=state.mouseY*PARALLAX[i]*.35;});
      const floating=motion.matches?0:.25+.75*THREE.MathUtils.smoothstep(state.progress,.15,.85);
      astronautLayer.position.y+=Math.sin(elapsed*.5)*.025*floating;
      astronautLayer.rotation.z=Math.sin(elapsed*.3)*.01*floating;
      camera.rotation.y=motion.matches?0:state.mouseX*.01;
      camera.rotation.x=motion.matches?0:state.mouseY*.005;
      if(readoutRef.current)readoutRef.current.value=`${Math.round(state.progress*100)}%`;
      renderer.render(scene,camera);frame=requestAnimationFrame(render);
    };
    const contextLost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(frame);root.dataset.renderer='fallback';gsap.set(firstRef.current,{opacity:1,y:0});gsap.set(secondRef.current,{opacity:0});};
    renderer.domElement.addEventListener('webglcontextlost',contextLost);
    frame=requestAnimationFrame(render);
    return ()=>{
      disposed=true;abort.abort();
      cancelAnimationFrame(frame);observer.disconnect();timeline.kill();root.removeEventListener('pointermove',pointer);root.removeEventListener('pointerdown',pointer);
      renderer.domElement.removeEventListener('webglcontextlost',contextLost);
      disposeObject(scene);renderer.dispose();renderer.domElement.remove();
    };
  },[]);

  return <div ref={stageRef} className={styles.stage}><main ref={rootRef} className={styles.experience}>
    <div ref={mountRef} className={styles.canvas} aria-hidden="true" />
    <header className={styles.header}><Link href="/lab">BACK TO LAB</Link><span>SPACE NARRATIVE / 01</span></header>
    <div className={styles.copy}>
      <h1 ref={firstRef}>Designing products<br/>for new realities.</h1>
      <p ref={secondRef}>Explore beyond<br/>the interface.</p>
    </div>
    <footer className={styles.footer}><span>POINTER — FLOAT<br/>SCROLL — NARRATIVE</span><output ref={readoutRef} aria-label="Narrative progress">0%</output></footer>
  </main></div>;
}
