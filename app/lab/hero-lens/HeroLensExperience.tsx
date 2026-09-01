"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { effect, frameLoop, init, sampler, surface } from "vgpu";
import type { FrameLoopHandle, Texture } from "vgpu";

import heroLensShader from "./hero-lens.wgsl";
import styles from "./hero-lens.module.css";

const HERO_VIDEO_URL = "/hero/hero-motion.mp4";
const HERO_IMAGE_FALLBACK = "/hero/hero-bg.jpg";
const HERO_TEXTURE_POSITION = [0.5, 0.5] as const;

const LENS_FIELD = {
  strength: 0.105,
  radiusX: 175,
  radiusY: 152,
  coreRadius: 0.22,
  bandPosition: 0.5,
  bandWidth: 0.14,
  outerFalloff: 0.18,
  direction: -1,
  shearStrength: 0,
  damping: 0.075,
} as const;

type RenderStatus = "loading" | "ready" | "video-fallback" | "image-fallback";
type IntroPhase = "enter" | "welcome" | "statement";

function waitForVideo(video: HTMLVideoElement) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Hero Lens video timed out."));
    }, 8000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener("loadeddata", handleLoaded);
      video.removeEventListener("error", handleError);
    };
    const handleLoaded = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Hero Lens video failed to load."));
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      cleanup();
      resolve();
      return;
    }

    video.addEventListener("loadeddata", handleLoaded, { once: true });
    video.addEventListener("error", handleError, { once: true });
  });
}

function waitForDecodedFrame(video: HTMLVideoElement) {
  return new Promise<void>((resolve) => {
    if ("requestVideoFrameCallback" in video) {
      video.requestVideoFrameCallback(() => resolve());
    } else {
      window.requestAnimationFrame(() => resolve());
    }
  });
}

function startHeroLens(
  canvas: HTMLCanvasElement,
  onStatusChange: (status: RenderStatus) => void,
) {
  let disposed = false;
  let loop: FrameLoopHandle | undefined;
  let gpu: Awaited<ReturnType<typeof init>> | undefined;
  let videoTexture: Texture | undefined;
  let video: HTMLVideoElement | undefined;
  let unsubscribeResize: (() => void) | undefined;
  let lastUploadedTime = -1;
  let sampleStartedAt = performance.now();
  let sampledFrames = 0;
  const pointer = { x: 0.5, y: 0.5 };
  const smoothedPointer = { x: 0.5, y: 0.5 };

  const updatePointer = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / Math.max(1, bounds.width)));
    pointer.y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / Math.max(1, bounds.height)));
  };

  const resetPointer = () => {
    pointer.x = 0.5;
    pointer.y = 0.5;
  };

  canvas.addEventListener("pointermove", updatePointer, { passive: true });
  canvas.addEventListener("pointerleave", resetPointer);

  void (async () => {
    if (!("gpu" in navigator)) {
      onStatusChange("video-fallback");
      return;
    }

    try {
      gpu = await init();
      if (disposed) {
        gpu.dispose();
        return;
      }

      video = document.createElement("video");
      video.src = HERO_VIDEO_URL;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";
      video.crossOrigin = "anonymous";
      video.load();

      await waitForVideo(video);
      await video.play();
      await waitForDecodedFrame(video);
      if (disposed || video.videoWidth === 0 || video.videoHeight === 0) return;

      videoTexture = gpu.device.createTexture({
        label: "hero-lens-video-texture",
        size: [video.videoWidth, video.videoHeight],
        format: "rgba8unorm",
        usage: ["copy_dst", "texture_binding", "render_attachment"],
      });

      const canvasSurface = surface(gpu, canvas, { dpr: [1, 1.5] });
      const linearSampler = sampler(gpu, {
        minFilter: "linear",
        magFilter: "linear",
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge",
      });
      const currentRadii = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        return [LENS_FIELD.radiusX * dpr, LENS_FIELD.radiusY * dpr] as const;
      };
      const [radiusX, radiusY] = currentRadii();
      const heroLens = effect(gpu, heroLensShader, {
        label: "hero-video-invisible-lens",
        set: {
          params: {
            resolution: canvasSurface.size,
            pointer: [0.5, 0.5],
            videoSize: [video.videoWidth, video.videoHeight],
            texturePosition: HERO_TEXTURE_POSITION,
            strength: LENS_FIELD.strength,
            radiusX,
            radiusY,
            coreRadius: LENS_FIELD.coreRadius,
            bandPosition: LENS_FIELD.bandPosition,
            bandWidth: LENS_FIELD.bandWidth,
            outerFalloff: LENS_FIELD.outerFalloff,
            direction: LENS_FIELD.direction,
            shearStrength: LENS_FIELD.shearStrength,
          },
          heroVideo: videoTexture,
          heroSampler: linearSampler,
        },
      });

      unsubscribeResize = canvasSurface.onResize(({ width, height }) => {
        const [nextRadiusX, nextRadiusY] = currentRadii();
        heroLens.set({
          params: {
            resolution: [width, height],
            radiusX: nextRadiusX,
            radiusY: nextRadiusY,
          },
        });
      });

      let hasRendered = false;
      loop = frameLoop(gpu, (currentFrame) => {
        if (!video || !videoTexture || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

        if (video.currentTime !== lastUploadedTime) {
          gpu?.gpu.queue.copyExternalImageToTexture(
            { source: video },
            { texture: videoTexture.gpu },
            { width: video.videoWidth, height: video.videoHeight },
          );
          lastUploadedTime = video.currentTime;
        }

        smoothedPointer.x += (pointer.x - smoothedPointer.x) * LENS_FIELD.damping;
        smoothedPointer.y += (pointer.y - smoothedPointer.y) * LENS_FIELD.damping;
        heroLens.set({ params: { pointer: [smoothedPointer.x, smoothedPointer.y] } });
        currentFrame.pass(canvasSurface, heroLens);

        sampledFrames += 1;
        const now = performance.now();
        if (now - sampleStartedAt >= 1000) {
          canvas.dataset.fps = String(Math.round((sampledFrames * 1000) / (now - sampleStartedAt)));
          sampleStartedAt = now;
          sampledFrames = 0;
        }

        if (!hasRendered) {
          hasRendered = true;
          onStatusChange("ready");
        }
      });
    } catch (error) {
      console.warn("WebGPU Hero Lens unavailable; using video fallback.", error);
      onStatusChange("video-fallback");
      loop?.stop();
      unsubscribeResize?.();
      videoTexture?.dispose();
      gpu?.dispose();
      video?.pause();
    }
  })();

  return () => {
    disposed = true;
    canvas.removeEventListener("pointermove", updatePointer);
    canvas.removeEventListener("pointerleave", resetPointer);
    loop?.stop();
    unsubscribeResize?.();
    videoTexture?.dispose();
    gpu?.dispose();
    video?.pause();
    video?.removeAttribute("src");
    video?.load();
  };
}

export default function HeroLensExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<RenderStatus>("loading");
  const [phase, setPhase] = useState<IntroPhase>("enter");

  useEffect(() => {
    const showWelcome = window.setTimeout(() => setPhase("welcome"), 100);
    const showStatement = window.setTimeout(() => setPhase("statement"), 1800);
    return () => {
      window.clearTimeout(showWelcome);
      window.clearTimeout(showStatement);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mount = () => {
      if (media.matches) {
        setStatus("image-fallback");
        return () => undefined;
      }
      setStatus("loading");
      return startHeroLens(canvas, setStatus);
    };
    let dispose = mount();
    const handleMotionPreference = () => {
      dispose();
      dispose = mount();
    };

    media.addEventListener("change", handleMotionPreference);
    return () => {
      media.removeEventListener("change", handleMotionPreference);
      dispose();
    };
  }, []);

  return (
    <section className={styles.hero} aria-label="Hero Invisible Lens experiment">
      <header className={styles.navigation}>
        <div className={styles.navigationInner}>
          <Link className={styles.brand} href="/">
            CINDY KAN
          </Link>
          <nav className={styles.navigationLinks} aria-label="Primary navigation">
            <Link href="/#work">WORK</Link>
            <Link href="/lab">LAB</Link>
            <Link href="/#about">ABOUT</Link>
            <Link href="/resume">RESUME</Link>
            <Link href="/#contact">CONTACT</Link>
          </nav>
        </div>
      </header>

      <div className={styles.visual} aria-hidden="true">
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          data-ready={status === "ready"}
        />
        {status === "video-fallback" && (
          <video
            className={styles.fallbackMedia}
            src={HERO_VIDEO_URL}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setStatus("image-fallback")}
          />
        )}
        {status === "image-fallback" && (
          <Image
            className={styles.fallbackMedia}
            src={HERO_IMAGE_FALLBACK}
            alt=""
            fill
            priority
            sizes="100vw"
          />
        )}
        <div className={styles.edgeFade} />
      </div>

      <div className={styles.content}>
        <div
          className={`${styles.phase} ${styles.welcome} ${
            phase === "welcome"
              ? styles.visible
              : phase === "statement"
                ? styles.exiting
                : styles.pending
          }`}
          aria-hidden={phase !== "welcome"}
        >
          <p className={styles.chineseIntro}>欢迎来到</p>
          <h1 className={styles.title}>MY DIGITAL SPACE</h1>
        </div>

        <div
          className={`${styles.phase} ${styles.statementWrap} ${
            phase === "statement" ? styles.visible : styles.pending
          }`}
          aria-hidden={phase !== "statement"}
        >
          <p className={styles.statement}>
            设计产品
            <br />
            也探索数字世界的另一种可能
          </p>
          <p className={styles.meta}>PRODUCT · AI · INTERACTION</p>
        </div>
      </div>

      <Link className={styles.scrollCue} href="/">
        <span>RETURN TO PORTFOLIO</span>
        <span className={styles.scrollLine} aria-hidden="true" />
      </Link>
    </section>
  );
}
