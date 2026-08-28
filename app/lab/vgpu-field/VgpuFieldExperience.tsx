"use client";

import { useEffect, useRef, useState } from "react";
import { clock, effect, frame, frameLoop, init, surface } from "vgpu";
import type { FrameLoopHandle } from "vgpu";

import spatialFieldShader from "./spatial-field.wgsl";
import styles from "./vgpu-field.module.css";

const DISTORTION_STRENGTH = 0.16;
const POINTER_DAMPING = 0.075;

type RenderStatus = "loading" | "ready" | "fallback";

function startSpatialField(
  canvas: HTMLCanvasElement,
  reduceMotion: boolean,
  onStatusChange: (status: RenderStatus) => void,
) {
  let disposed = false;
  let loop: FrameLoopHandle | undefined;
  let gpu: Awaited<ReturnType<typeof init>> | undefined;
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

      const canvasSurface = surface(gpu, canvas, { dpr: [1, 1.5] });
      const fieldClock = clock(gpu);
      const spatialField = effect(gpu, spatialFieldShader, {
        label: "vgpu-pointer-spatial-field",
        set: {
          params: {
            resolution: canvasSurface.size,
            pointer: [0.5, 0.5],
            time: 0,
            strength: reduceMotion ? 0 : DISTORTION_STRENGTH,
          },
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
        spatialField.set({ params: { resolution: [width, height] } });
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
          smoothedPointer.x += (pointer.x - smoothedPointer.x) * POINTER_DAMPING;
          smoothedPointer.y += (pointer.y - smoothedPointer.y) * POINTER_DAMPING;
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
