"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type HomeScrollStageProps = {
  children: ReactNode;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smoothstep = (start: number, end: number, value: number) => {
  const progress = clamp01((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
};

export default function HomeScrollStage({ children }: HomeScrollStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileLayout = window.matchMedia("(max-width: 760px)");
    let frame = 0;

    const update = () => {
      frame = 0;

      if (motionPreference.matches) {
        stage.classList.remove("is-scroll-enhanced");
        return;
      }

      const stageTop = stage.getBoundingClientRect().top;
      const choreographyDistance = window.innerHeight * (mobileLayout.matches ? 2.2 : 2.8);
      const progress = clamp01(-stageTop / choreographyDistance);

      const copyExit = smoothstep(0.08, mobileLayout.matches ? 0.26 : 0.3, progress);
      const workEntry = smoothstep(mobileLayout.matches ? 0.22 : 0.3, mobileLayout.matches ? 0.4 : 0.46, progress);
      const projectEntry = smoothstep(mobileLayout.matches ? 0.36 : 0.46, mobileLayout.matches ? 0.58 : 0.64, progress);
      const visualExit = smoothstep(mobileLayout.matches ? 0.68 : 0.78, mobileLayout.matches ? 0.92 : 1, progress);

      stage.style.setProperty("--home-hero-copy-y", `${copyExit * -140}px`);
      stage.style.setProperty("--home-hero-copy-opacity", `${1 - copyExit}`);
      stage.style.setProperty("--home-work-entry", `${workEntry}`);
      stage.style.setProperty("--home-work-y", `${(1 - workEntry) * 96}px`);
      stage.style.setProperty("--home-project-entry", `${projectEntry}`);
      stage.style.setProperty("--home-project-y", `${(1 - projectEntry) * 112}px`);
      stage.style.setProperty("--home-hero-visual-opacity", `${1 - visualExit}`);
      stage.style.setProperty("--home-hero-visual-brightness", `${1 - visualExit * 0.4}`);
      stage.classList.add("is-scroll-enhanced");
    };

    const requestUpdate = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    motionPreference.addEventListener("change", requestUpdate);
    mobileLayout.addEventListener("change", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      motionPreference.removeEventListener("change", requestUpdate);
      mobileLayout.removeEventListener("change", requestUpdate);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={stageRef} className="home-scroll-stage">
      {children}
    </div>
  );
}
