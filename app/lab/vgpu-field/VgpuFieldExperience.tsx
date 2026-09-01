"use client";

import { useEffect, useRef, useState } from "react";
import { clock, effect, frame, frameLoop, init, surface } from "vgpu";
import type { FrameLoopHandle, Texture } from "vgpu";

import spatialFieldShader from "./spatial-field.wgsl";
import styles from "./vgpu-field.module.css";

const LENS_FIELD = {
  strength: 0.14,
  radiusX: 165,
  radiusY: 145,
  coreRadius: 0.2,
  bandPosition: 0.48,
  bandWidth: 0.11,
  outerFalloff: 0.14,
  // -1 = inward gravitational bending; 1 = outward refraction.
  direction: -1,
  shearStrength: 0,
  damping: 0.075,
} as const;
const DEBUG_FIELD = false;
const PROJECT_TEXTURE_URL = "/projects/ai-communication/Cover-v11.png";

type RenderStatus = "loading" | "ready" | "fallback";

function startSpatialField(
  canvas: HTMLCanvasElement,
  reduceMotion: boolean,
  onStatusChange: (status: RenderStatus) => void,
) {
  let disposed = false;
  let loop: FrameLoopHandle | undefined;
  let gpu: Awaited<ReturnType<typeof init>> | undefined;
  let projectTexture: Texture | undefined;
  let unsubscribeResize: (() => void) | undefined;
  const pointer = { x: 0.5, y: 0.5 };
  const smoothedPointer = { x: 0.5, y: 0.5 };

  const updatePointer = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - bounds.left) / Math.max(1, bounds.width);
    pointer.y = (event.clientY - bounds.top) / Math.max(1, bounds.height);
  };

  const resetPointer = () => {
    pointer.x = 0.5;
    pointer.y = 0.5;
  };

  canvas.addEventListener("pointermove", updatePointer, { passive: true });
  canvas.addEventListener("pointerleave", resetPointer);

  void (async () => {
    if (!("gpu" in navigator)) {
      onStatusChange("fallback");
      return;
    }

    try {
      gpu = await init();
      if (disposed) {
        gpu.dispose();
        return;
      }

      const projectImage = new Image();
      projectImage.src = PROJECT_TEXTURE_URL;
      await projectImage.decode();
      if (disposed) {
        gpu.dispose();
        return;
      }

      projectTexture = gpu.device.createTexture({
        label: "vgpu-diagnostic-project-image",
        size: [projectImage.naturalWidth, projectImage.naturalHeight],
        format: "rgba8unorm",
        usage: ["copy_dst", "texture_binding", "render_attachment"],
      });
      gpu.gpu.queue.copyExternalImageToTexture(
        { source: projectImage },
        { texture: projectTexture.gpu },
        { width: projectImage.naturalWidth, height: projectImage.naturalHeight },
      );
      const projectAspect = projectImage.naturalWidth / projectImage.naturalHeight;

      const canvasSurface = surface(gpu, canvas, { dpr: [1, 1.5] });
      const fieldClock = clock(gpu);
      const lensRadii = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        return [LENS_FIELD.radiusX * dpr, LENS_FIELD.radiusY * dpr] as const;
      };
      const [radiusX, radiusY] = lensRadii();
      const spatialField = effect(gpu, spatialFieldShader, {
        label: "vgpu-pointer-spatial-field",
        set: {
          params: {
            resolution: canvasSurface.size,
            pointer: [0.5, 0.5],
            time: 0,
            strength: reduceMotion ? 0 : LENS_FIELD.strength,
            radiusX,
            radiusY,
            coreRadius: LENS_FIELD.coreRadius,
            bandPosition: LENS_FIELD.bandPosition,
            bandWidth: LENS_FIELD.bandWidth,
            outerFalloff: LENS_FIELD.outerFalloff,
            direction: LENS_FIELD.direction,
            shearStrength: LENS_FIELD.shearStrength,
            projectAspect,
            debugField: DEBUG_FIELD ? 1 : 0,
          },
          projectImage: projectTexture,
        },
      });

      const prepareFrame = (time: number) => {
        spatialField.set({
          params: {
            pointer: [smoothedPointer.x, smoothedPointer.y],
            time: reduceMotion ? 0 : time,
          },
        });
      };

      unsubscribeResize = canvasSurface.onResize(({ width, height }) => {
        const [nextRadiusX, nextRadiusY] = lensRadii();
        spatialField.set({
          params: {
            resolution: [width, height],
            radiusX: nextRadiusX,
            radiusY: nextRadiusY,
          },
        });
      });

      if (reduceMotion) {
        prepareFrame(0);
        frame(gpu, (currentFrame) => {
          currentFrame.pass(canvasSurface, spatialField);
        });
        onStatusChange("ready");
      } else {
        let hasRendered = false;
        loop = frameLoop(gpu, (frame) => {
          smoothedPointer.x += (pointer.x - smoothedPointer.x) * LENS_FIELD.damping;
          smoothedPointer.y += (pointer.y - smoothedPointer.y) * LENS_FIELD.damping;
          prepareFrame(fieldClock.time);
          frame.pass(canvasSurface, spatialField);
          if (!hasRendered) {
            hasRendered = true;
            onStatusChange("ready");
          }
        });
      }
    } catch (error) {
      console.warn("VGPU spatial field unavailable; using static fallback.", error);
      onStatusChange("fallback");
      loop?.stop();
      unsubscribeResize?.();
      projectTexture?.dispose();
      projectTexture = undefined;
      gpu?.dispose();
      gpu = undefined;
    }
  })();

  return () => {
    disposed = true;
    canvas.removeEventListener("pointermove", updatePointer);
    canvas.removeEventListener("pointerleave", resetPointer);
    loop?.stop();
    unsubscribeResize?.();
    projectTexture?.dispose();
    gpu?.dispose();
  };
}

export default function VgpuFieldExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<RenderStatus>("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mount = () => startSpatialField(canvas, media.matches, setStatus);
    let dispose = mount();

    const handleMotionPreference = () => {
      dispose();
      setStatus("loading");
      dispose = mount();
    };

    media.addEventListener("change", handleMotionPreference);
    return () => {
      media.removeEventListener("change", handleMotionPreference);
      dispose();
    };
  }, []);

  return (
    <section className={styles.stage} aria-label="VGPU pointer spatial field experiment">
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        data-ready={status === "ready"}
        aria-hidden="true"
      />

      <h1 className={styles.title}>
        <span>SELECTED</span>
        <span>WORK</span>
      </h1>

      <p className={styles.status} role="status" aria-live="polite">
        {status === "fallback" ? "WebGPU unavailable. Static mode active." : ""}
      </p>
    </section>
  );
}
