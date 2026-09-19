"use client";

import { useEffect, useRef, useState } from "react";

const LOADER_TIMING = {
  // At 1.25x the release begins around 4.54s. Reveal the page while the
  // particles are still travelling outward so the burst becomes the wipe.
  minimumVisibleMs: 4540,
  reducedMotionMinimumVisibleMs: 600,
  maximumVisibleMs: 12000,
  burstLeadMs: 180,
  exitDurationMs: 620,
} as const;

type LoadingPhase = "active" | "exiting" | "hidden";

export default function ParticleLoading() {
  const [phase, setPhase] = useState<LoadingPhase>("active");
  const phaseRef = useRef<LoadingPhase>("active");
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const startedAt = performance.now();
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let exitTimer = 0;
    let removeTimer = 0;
    let maximumTimer = 0;
    let burstLeadTimer = 0;
    let cancelled = false;
    let removeMessageListeners = () => {};

    document.documentElement.dataset.portfolioLoading = "true";

    const removeOverlay = () => {
      if (cancelled) return;
      phaseRef.current = "hidden";
      setPhase("hidden");
      delete document.documentElement.dataset.portfolioLoading;
    };

    const beginExit = () => {
      if (cancelled || phaseRef.current !== "active") return;
      phaseRef.current = "exiting";
      setPhase("exiting");
      removeTimer = window.setTimeout(removeOverlay, LOADER_TIMING.exitDurationMs);
    };

    const afterMinimumVisible = (callback: () => void) => {
      const minimumVisibleMs = prefersReducedMotion
        ? LOADER_TIMING.reducedMotionMinimumVisibleMs
        : LOADER_TIMING.minimumVisibleMs;
      const remaining = Math.max(0, minimumVisibleMs - (performance.now() - startedAt));
      exitTimer = window.setTimeout(callback, remaining);
    };

    const pageReady = document.readyState === "complete"
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          window.addEventListener("load", () => resolve(), { once: true });
        });

    const fontsReady = "fonts" in document
      ? document.fonts.ready.then(() => undefined).catch(() => undefined)
      : Promise.resolve();

    const heroReady = (() => {
      if (!document.getElementById("hero")) return Promise.resolve();
      if (document.documentElement.dataset.heroMediaReady === "true") return Promise.resolve();

      return new Promise<void>((resolve) => {
        window.addEventListener("portfolio:hero-media-ready", () => resolve(), { once: true });
      });
    })();

    const particleReady = prefersReducedMotion
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          const handleParticleReady = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type !== "portfolio:particle-ready") return;
            resolve();
          };

          const handleParticleBurst = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type !== "portfolio:particle-burst") return;
            burstLeadTimer = window.setTimeout(beginExit, LOADER_TIMING.burstLeadMs);
          };

          removeMessageListeners = () => {
            window.removeEventListener("message", handleParticleReady);
            window.removeEventListener("message", handleParticleBurst);
          };
          window.addEventListener("message", handleParticleReady);
          window.addEventListener("message", handleParticleBurst);
        });

    const releaseOrExit = () => {
      if (prefersReducedMotion) {
        beginExit();
        return;
      }
      frameRef.current?.contentWindow?.postMessage(
        { type: "portfolio:particle-release" },
        window.location.origin,
      );
    };

    Promise.all([pageReady, fontsReady, heroReady, particleReady])
      .then(() => afterMinimumVisible(releaseOrExit))
      .catch(() => afterMinimumVisible(releaseOrExit));
    maximumTimer = window.setTimeout(beginExit, LOADER_TIMING.maximumVisibleMs);

    return () => {
      cancelled = true;
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
      window.clearTimeout(maximumTimer);
      window.clearTimeout(burstLeadTimer);
      removeMessageListeners();
      delete document.documentElement.dataset.portfolioLoading;
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={`portfolio-loader${phase === "exiting" ? " is-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      <iframe
        ref={frameRef}
        className="portfolio-loader-frame"
        src="/particle-loading.html?mode=loader"
        title="Interactive particle loading animation"
        tabIndex={-1}
        aria-hidden="true"
      />
      <span className="portfolio-loader-label">LOADING</span>
    </div>
  );
}
