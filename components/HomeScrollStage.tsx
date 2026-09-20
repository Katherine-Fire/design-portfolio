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
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const resetScrollPosition = () => {
      window.scrollTo(0, 0);
    };

    resetScrollPosition();

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      resetScrollPosition();
      secondFrame = window.requestAnimationFrame(resetScrollPosition);
    });

    window.addEventListener("pageshow", resetScrollPosition);
    window.addEventListener("beforeunload", resetScrollPosition);

    return () => {
      window.removeEventListener("pageshow", resetScrollPosition);
      window.removeEventListener("beforeunload", resetScrollPosition);
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileLayout = window.matchMedia("(max-width: 760px)");
    const workHeading = stage.querySelector<HTMLElement>(".work-heading");
    const projectCard = stage.querySelector<HTMLElement>(".project-card");
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
      // Reveal against each element's layout position, excluding its animated offset.
      const entryProgress = (element: HTMLElement | null) => {
        if (!element) return 1;
        const translation = new DOMMatrixReadOnly(getComputedStyle(element).transform).m42;
        const top = element.getBoundingClientRect().top - translation;
        return smoothstep(0.02, 0.24, 1 - top / window.innerHeight);
      };
      const workEntry = entryProgress(workHeading);
      const projectEntry = entryProgress(projectCard);
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
