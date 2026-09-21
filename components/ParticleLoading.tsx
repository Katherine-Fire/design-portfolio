"use client";

import { useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/sitePath";

const LOADER_TIMING = {
  minimumVisibleMs: 900,
  maximumVisibleMs: 8000,
  burstLeadMs: 120,
  burstFallbackMs: 700,
  releaseRetryMs: 80,
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
    let burstFallbackTimer = 0;
    let releaseRetryTimer = 0;
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
      window.clearInterval(releaseRetryTimer);
      window.clearTimeout(burstFallbackTimer);
      phaseRef.current = "exiting";
      setPhase("exiting");
      removeTimer = window.setTimeout(removeOverlay, LOADER_TIMING.exitDurationMs);
    };

    const afterMinimumVisible = (callback: () => void) => {
      const remaining = Math.max(
        0,
        LOADER_TIMING.minimumVisibleMs - (performance.now() - startedAt),
      );
      exitTimer = window.setTimeout(callback, remaining);
    };

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

    const handleParticleBurst = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "portfolio:particle-burst") return;
      window.clearInterval(releaseRetryTimer);
      window.clearTimeout(burstFallbackTimer);
      burstLeadTimer = window.setTimeout(beginExit, LOADER_TIMING.burstLeadMs);
    };

    removeMessageListeners = () => {
      window.removeEventListener("message", handleParticleBurst);
    };
    window.addEventListener("message", handleParticleBurst);

    const releaseOrExit = () => {
      if (prefersReducedMotion) {
        beginExit();
        return;
      }
      const requestParticleRelease = () => {
        frameRef.current?.contentWindow?.postMessage(
          { type: "portfolio:particle-release" },
          window.location.origin,
        );
      };

      requestParticleRelease();
      releaseRetryTimer = window.setInterval(
        requestParticleRelease,
        LOADER_TIMING.releaseRetryMs,
      );
      burstFallbackTimer = window.setTimeout(
        beginExit,
        LOADER_TIMING.burstFallbackMs,
      );
    };

    Promise.all([fontsReady, heroReady])
      .then(() => afterMinimumVisible(releaseOrExit))
      .catch(() => afterMinimumVisible(releaseOrExit));
    maximumTimer = window.setTimeout(beginExit, LOADER_TIMING.maximumVisibleMs);

    return () => {
      cancelled = true;
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
      window.clearTimeout(maximumTimer);
      window.clearTimeout(burstLeadTimer);
      window.clearTimeout(burstFallbackTimer);
      window.clearInterval(releaseRetryTimer);
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
        src={withBasePath("/particle-loading.html?mode=loader")}
        title="Interactive particle loading animation"
        tabIndex={-1}
        aria-hidden="true"
      />
      <span className="portfolio-loader-label">LOADING</span>
    </div>
  );
}
