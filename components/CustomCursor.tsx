"use client";

import { useEffect, useRef } from "react";

const ORBIT_LERP = 0.19;
const SPACECRAFT_LERP = 0.22;
const IDLE_DELAY_MS = 1200;
const DIRECTION_THRESHOLD = 0.5;

const INTERACTIVE_SELECTOR = 'a, button, [role="button"]';
const NATIVE_CURSOR_SELECTOR =
  'input, textarea, select, [contenteditable="true"], [data-native-cursor]';

export default function CustomCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLSpanElement>(null);
  const orbitRef = useRef<HTMLSpanElement>(null);
  const spacecraftRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    const root = rootRef.current;
    const core = coreRef.current;
    const orbit = orbitRef.current;
    const spacecraft = spacecraftRef.current;
    if (!root || !core || !orbit || !spacecraft) return;

    document.documentElement.classList.add("has-custom-cursor");

    let pointerX = window.innerWidth * 0.5;
    let pointerY = window.innerHeight * 0.5;
    let orbitX = pointerX;
    let orbitY = pointerY;
    let spacecraftX = pointerX;
    let spacecraftY = pointerY;
    let previousX = pointerX;
    let previousY = pointerY;
    let spacecraftAngle = 0;
    let targetAngle = 0;
    let orbitAngle = 0;
    let orbitImpulse = 0;
    let speed = 0;
    let lastMoveAt = performance.now();
    let lastFrameAt = performance.now();
    let animationFrame = 0;
    let currentMode = "orbital";

    const setMode = (mode: "orbital" | "interactive" | "spacecraft" | "native") => {
      if (currentMode === mode) return;
      currentMode = mode;
      root.dataset.mode = mode;
    };

    const updateModeFromTarget = (target: EventTarget | null) => {
      const element = target instanceof Element ? target : null;
      if (!element) return setMode("orbital");
      if (element.closest(NATIVE_CURSOR_SELECTOR)) return setMode("native");
      if (element.closest('[data-cursor="spacecraft"]')) return setMode("spacecraft");
      if (element.closest(INTERACTIVE_SELECTOR)) return setMode("interactive");
      if (element.closest('p, article, [data-selectable-text]')) return setMode("native");
      setMode("orbital");
    };

    const handlePointerMove = (event: PointerEvent) => {
      const dx = event.clientX - previousX;
      const dy = event.clientY - previousY;
      speed = Math.hypot(dx, dy);

      pointerX = event.clientX;
      pointerY = event.clientY;
      previousX = pointerX;
      previousY = pointerY;
      lastMoveAt = performance.now();

      if (speed > DIRECTION_THRESHOLD) {
        targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        orbitImpulse = Math.max(-1.2, Math.min(1.2, dx * 0.035));
      }

      core.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
      root.dataset.visible = "true";
      updateModeFromTarget(event.target);
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) root.dataset.visible = "false";
    };

    const handlePointerDown = () => {
      root.dataset.pressed = "true";
    };

    const handlePointerUp = () => {
      root.dataset.pressed = "false";
    };

    const animate = (now: number) => {
      const delta = Math.min(32, now - lastFrameAt);
      lastFrameAt = now;

      orbitX += (pointerX - orbitX) * ORBIT_LERP;
      orbitY += (pointerY - orbitY) * ORBIT_LERP;
      spacecraftX += (pointerX - spacecraftX) * SPACECRAFT_LERP;
      spacecraftY += (pointerY - spacecraftY) * SPACECRAFT_LERP;

      if (now - lastMoveAt > IDLE_DELAY_MS) {
        orbitAngle += delta * 0.004;
      } else {
        orbitAngle += orbitImpulse;
        orbitImpulse *= 0.9;
      }

      const angleDelta = ((targetAngle - spacecraftAngle + 540) % 360) - 180;
      spacecraftAngle += angleDelta * 0.2;

      const tailScale = Math.max(0, Math.min(1, (speed - 0.8) / 12));
      speed *= 0.88;

      orbit.style.transform = `translate3d(${orbitX}px, ${orbitY}px, 0) translate(-50%, -50%) rotate(${orbitAngle}deg)`;
      spacecraft.style.setProperty("--spacecraft-tail", tailScale.toFixed(3));
      spacecraft.style.transform = `translate3d(${spacecraftX}px, ${spacecraftY}px, 0) translate(-50%, -50%) rotate(${spacecraftAngle}deg)`;

      animationFrame = window.requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerout", handlePointerOut);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="custom-cursor"
      data-mode="orbital"
      data-visible="false"
      data-pressed="false"
      aria-hidden="true"
    >
      <span ref={coreRef} className="custom-cursor-core" />

      <span ref={orbitRef} className="custom-cursor-orbit">
        <svg viewBox="0 0 36 36">
          <circle className="custom-cursor-orbit-track" cx="18" cy="18" r="13.5" />
          <g className="custom-cursor-orbit-glow">
            <path d="M10.9 6.5A13.5 13.5 0 0 1 29.2 9.7" />
            <path d="M6.6 13.4A13.5 13.5 0 0 0 12.1 29.1" />
            <path d="M20.8 31.2A13.5 13.5 0 0 0 31.1 21.8" />
          </g>
          <g className="custom-cursor-orbit-segments">
            <path d="M10.9 6.5A13.5 13.5 0 0 1 29.2 9.7" />
            <path d="M6.6 13.4A13.5 13.5 0 0 0 12.1 29.1" />
            <path d="M20.8 31.2A13.5 13.5 0 0 0 31.1 21.8" />
          </g>
          <circle className="custom-cursor-orbit-marker" cx="29.2" cy="9.7" r="1.7" />
          <circle className="custom-cursor-orbit-marker custom-cursor-orbit-marker--secondary" cx="12.1" cy="29.1" r="1.35" />
        </svg>
      </span>

      <span ref={spacecraftRef} className="custom-cursor-spacecraft">
        <svg viewBox="0 0 38 28">
          <g className="custom-cursor-engine">
            <path d="M11.2 11.9 2.7 14l8.5 2.1Z" />
          </g>
          <path className="custom-cursor-body" d="M36 14 11.7 5.3l3.7 6.1L7.8 14l7.6 2.6-3.7 6.1Z" />
          <path className="custom-cursor-spine" d="m33.2 14-17.8-2.6 3.2 2.6-3.2 2.6Z" />
          <path className="custom-cursor-canopy" d="m25.4 10.7 6.7 2.8-8.4.1-4.4-2.2Z" />
          <path className="custom-cursor-highlight" d="m8.8 14 6.6-2.6L35 14" />
          <circle className="custom-cursor-engine-core" cx="11.4" cy="14" r="1.85" />
        </svg>
      </span>
    </div>
  );
}
