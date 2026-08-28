"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const HERO_VIDEO_URL = "/hero/hero-motion.mp4";
const HERO_TEXTURE_POSITION_X = 0.5;
const HERO_TEXTURE_POSITION_Y = 0.5;
const HERO_PLANE_OVERSCAN = 1.18;
const VIDEO_ZOOM_COMPENSATION = {
  start: 0.8,
  end: 0.8,
} as const;

const VIDEO_TRANSFORM = {
  rotationDeg: 0,
} as const;

// Three.js uses counter-clockwise positive Z rotation; negate it so positive
// degree values feel clockwise when editing the video transform.
const VIDEO_ROTATION_RAD = -THREE.MathUtils.degToRad(
  VIDEO_TRANSFORM.rotationDeg,
);

type SpatialShader = Parameters<THREE.MeshBasicMaterial["onBeforeCompile"]>[0];

function HeroArtworkMesh({
  pointer,
  onReady,
  onVideoError,
}: {
  pointer: React.RefObject<THREE.Vector2>;
  onReady: () => void;
  onVideoError: () => void;
}) {
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [textureAspect, setTextureAspect] = useState(16 / 9);
  const shaderRef = useRef<SpatialShader | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const renderedFrames = useRef(0);
  const heroRef = useRef<HTMLElement | null>(null);
  const overscanPointer = useRef(new THREE.Vector2(0.5, 0.5));
  const viewport = useThree((state) => state.viewport);
  const plane = useMemo(() => {
    const viewportAspect = viewport.width / viewport.height;
    let width = viewport.width;
    let height = viewport.height;

    if (textureAspect > viewportAspect) {
      width = viewport.height * textureAspect;
    } else {
      height = viewport.width / textureAspect;
    }

    width *= HERO_PLANE_OVERSCAN;
    height *= HERO_PLANE_OVERSCAN;

    return {
      width,
      height,
      x: (0.5 - HERO_TEXTURE_POSITION_X) * (width - viewport.width),
      y: (HERO_TEXTURE_POSITION_Y - 0.5) * (height - viewport.height),
    };
  }, [textureAspect, viewport.height, viewport.width]);
  const configureSpatialMaterial = useCallback((shader: SpatialShader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uPointer = { value: new THREE.Vector2(0.5, 0.5) };
    shader.uniforms.uInteraction = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime;
        uniform vec2 uPointer;
        uniform float uInteraction;`,
      )
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3(position);
        vec2 delta = uv - uPointer;
        float distanceToPointer = length(delta);
        float force = exp(-distanceToPointer * distanceToPointer * 34.0) * uInteraction;
        float idle = sin(position.x * 1.7 + uTime * 0.08) * cos(position.y * 2.1 - uTime * 0.06) * 0.0015;
        transformed.z += force * 0.035 + idle;
        transformed.xy += normalize(delta + 0.0001) * force * 0.0035;`,
      );
    shaderRef.current = shader;
  }, []);

  useEffect(() => {
    const video = document.createElement("video");
    let texture: THREE.VideoTexture | null = null;
    let cancelled = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) onVideoError();
    }, 8000);

    video.src = HERO_VIDEO_URL;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    videoRef.current = video;

    const prepareTexture = async () => {
      try {
        await video.play();
        if (cancelled || video.videoWidth === 0 || video.videoHeight === 0) return;

        const publishTexture = () => {
          if (cancelled) return;
          window.clearTimeout(fallbackTimer);
          texture = new THREE.VideoTexture(video);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          setTextureAspect(video.videoWidth / video.videoHeight);
          setVideoTexture(texture);
        };

        if ("requestVideoFrameCallback" in video) {
          video.requestVideoFrameCallback(() => publishTexture());
        } else {
          requestAnimationFrame(publishTexture);
        }
      } catch {
        if (!cancelled) onVideoError();
      }
    };

    const handleError = () => {
      if (!cancelled) onVideoError();
    };

    video.addEventListener("loadeddata", prepareTexture, { once: true });
    video.addEventListener("error", handleError, { once: true });
    video.load();

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      video.removeEventListener("loadeddata", prepareTexture);
      video.removeEventListener("error", handleError);
      video.pause();
      video.removeAttribute("src");
      video.load();
      videoRef.current = null;
      texture?.dispose();
    };
  }, [onVideoError]);

  useEffect(() => {
    heroRef.current = document.getElementById("hero");
    return () => {
      heroRef.current?.style.removeProperty("--hero-space-x");
      heroRef.current?.style.removeProperty("--hero-space-y");
    };
  }, []);

  useFrame((_, delta) => {
    const shader = shaderRef.current;
    const mesh = meshRef.current;
    const video = videoRef.current;
    if (!shader || !mesh || !videoTexture || !video) return;

    const videoProgress = Number.isFinite(video.duration) && video.duration > 0
      ? THREE.MathUtils.clamp(video.currentTime / video.duration, 0, 1)
      : 0;
    const compensationScale = THREE.MathUtils.lerp(
      VIDEO_ZOOM_COMPENSATION.start,
      VIDEO_ZOOM_COMPENSATION.end,
      videoProgress,
    );
    const compensatedWidth = plane.width * compensationScale;
    const compensatedHeight = plane.height * compensationScale;
    const rotationCos = Math.cos(VIDEO_ROTATION_RAD);
    const rotationSin = Math.sin(VIDEO_ROTATION_RAD);
    const rotationSafetyScale = Math.max(
      1,
      (viewport.width * Math.abs(rotationCos) + viewport.height * Math.abs(rotationSin)) /
        viewport.width,
      (viewport.width * Math.abs(rotationSin) + viewport.height * Math.abs(rotationCos)) /
        viewport.height,
    );
    const renderedWidth = compensatedWidth * rotationSafetyScale;
    const renderedHeight = compensatedHeight * rotationSafetyScale;
    const renderedX = (0.5 - HERO_TEXTURE_POSITION_X) * (renderedWidth - viewport.width);
    const renderedY = (HERO_TEXTURE_POSITION_Y - 0.5) * (renderedHeight - viewport.height);

    mesh.scale.set(renderedWidth, renderedHeight, 1);
    mesh.position.set(renderedX, renderedY, 0);
    mesh.rotation.z = VIDEO_ROTATION_RAD;

    const pointerWorldX = (pointer.current.x - 0.5) * viewport.width;
    const pointerWorldY = (pointer.current.y - 0.5) * viewport.height;
    const pointerOffsetX = pointerWorldX - renderedX;
    const pointerOffsetY = pointerWorldY - renderedY;
    const pointerLocalX = rotationCos * pointerOffsetX + rotationSin * pointerOffsetY;
    const pointerLocalY = -rotationSin * pointerOffsetX + rotationCos * pointerOffsetY;
    overscanPointer.current.set(
      0.5 + pointerLocalX / renderedWidth,
      0.5 + pointerLocalY / renderedHeight,
    );
    (shader.uniforms.uPointer.value as THREE.Vector2).lerp(overscanPointer.current, 1 - Math.exp(-delta * 4.5));
    shader.uniforms.uInteraction.value = THREE.MathUtils.lerp(
      shader.uniforms.uInteraction.value as number,
      1,
      1 - Math.exp(-delta * 2.2),
    );
    shader.uniforms.uTime.value = (shader.uniforms.uTime.value as number) + delta;
    const smoothedPointer = shader.uniforms.uPointer.value as THREE.Vector2;
    const smoothedLocalX = (smoothedPointer.x - 0.5) * renderedWidth;
    const smoothedLocalY = (smoothedPointer.y - 0.5) * renderedHeight;
    const smoothedScreenX =
      (renderedX + rotationCos * smoothedLocalX - rotationSin * smoothedLocalY) /
      viewport.width;
    const smoothedScreenY =
      (renderedY + rotationSin * smoothedLocalX + rotationCos * smoothedLocalY) /
      viewport.height;
    heroRef.current?.style.setProperty("--hero-space-x", `${smoothedScreenX * 6}px`);
    heroRef.current?.style.setProperty("--hero-space-y", `${smoothedScreenY * -6}px`);

    renderedFrames.current += 1;
    if (renderedFrames.current === 2) onReady();
  });

  if (!videoTexture) return null;

  return (
    <mesh
      ref={meshRef}
      position={[plane.x, plane.y, 0]}
      rotation={[0, 0, VIDEO_ROTATION_RAD]}
      scale={[plane.width, plane.height, 1]}
    >
      <planeGeometry args={[1, 1, 96, 54]} />
      <meshBasicMaterial
        map={videoTexture}
        toneMapped={false}
        side={THREE.FrontSide}
        onBeforeCompile={configureSpatialMaterial}
        customProgramCacheKey={() => "hero-video-spatial-field-v1"}
      />
    </mesh>
  );
}

export default function HeroSpatialField() {
  const pointer = useRef(new THREE.Vector2(0.5, 0.5));
  const [motionPreference, setMotionPreference] = useState<"unknown" | "full" | "reduce">("unknown");
  const [isReady, setIsReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const revealSpatialField = useCallback(() => setIsReady(true), []);
  const useStaticFallback = useCallback(() => setVideoFailed(true), []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const probe = document.createElement("canvas");
    const webglContext = probe.getContext("webgl2") ?? probe.getContext("webgl");
    const supportsWebGL = webglContext !== null;
    let pointerClientX = window.innerWidth / 2;
    let pointerClientY = window.innerHeight / 2;

    const updateMotionPreference = () => {
      setMotionPreference(media.matches ? "reduce" : "full");
      setIsReady(false);
      setVideoFailed(!media.matches && !supportsWebGL);
    };
    const updatePointerPosition = () => {
      const hero = document.getElementById("hero");
      const bounds = hero?.getBoundingClientRect();
      if (!bounds || bounds.width === 0 || bounds.height === 0) return;

      pointer.current.set(
        THREE.MathUtils.clamp((pointerClientX - bounds.left) / bounds.width, 0, 1),
        THREE.MathUtils.clamp(1 - (pointerClientY - bounds.top) / bounds.height, 0, 1),
      );
    };
    const updatePointer = (event: PointerEvent) => {
      pointerClientX = event.clientX;
      pointerClientY = event.clientY;
      updatePointerPosition();
    };
    updateMotionPreference();
    updatePointerPosition();
    media.addEventListener("change", updateMotionPreference);
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("resize", updatePointerPosition, { passive: true });
    return () => {
      media.removeEventListener("change", updateMotionPreference);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("resize", updatePointerPosition);
    };
  }, []);

  if (motionPreference === "reduce" || videoFailed) {
    return (
      <div className="hero-spatial-fallback">
        <Image
          className="hero-spatial-fallback-image"
          src="/hero/hero-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
    );
  }

  if (motionPreference === "unknown") return null;

  return (
    <div className={`hero-spatial-field ${isReady ? "is-ready" : ""}`}>
      <Canvas
        dpr={[1, 1.25]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <HeroArtworkMesh pointer={pointer} onReady={revealSpatialField} onVideoError={useStaticFallback} />
      </Canvas>
    </div>
  );
}
