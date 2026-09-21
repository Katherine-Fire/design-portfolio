"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { withBasePath } from "@/lib/sitePath";

export default function HomeAboutIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const [revealState, setRevealState] = useState<
    "idle" | "pending" | "revealed" | "complete"
  >("idle");

  useEffect(() => {
    const section = sectionRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!section || reducedMotion.matches) {
      setRevealState("complete");
      return;
    }

    setRevealState("pending");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRevealState("revealed");
        observer.disconnect();
      },
      { threshold: 0.24 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (revealState !== "revealed") return;

    const completionTimer = window.setTimeout(() => {
      setRevealState("complete");
    }, 1220);

    return () => window.clearTimeout(completionTimer);
  }, [revealState]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const rangeProgress = (progress: number, start: number, end: number) =>
      Math.min(1, Math.max(0, (progress - start) / (end - start)));

    const updateProgress = () => {
      frame = 0;

      if (reducedMotion.matches) {
        section.removeAttribute("data-scroll-reveal");
        return;
      }

      const bounds = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress = Math.min(
        1,
        Math.max(0, (viewportHeight - bounds.top) / (viewportHeight + bounds.height)),
      );

      const revealRanges = [
        ["--about-headline-1", 0.1, 0.35],
        ["--about-headline-2", 0.18, 0.45],
        ["--about-headline-3", 0.26, 0.55],
        ["--about-body-1", 0.38, 0.65],
        ["--about-body-2", 0.5, 0.78],
        ["--about-body-3", 0.58, 0.86],
      ] as const;

      revealRanges.forEach(([property, start, end]) => {
        section.style.setProperty(property, rangeProgress(progress, start, end).toFixed(4));
      });
      section.setAttribute("data-scroll-reveal", "active");
    };

    const requestUpdate = () => {
      if (frame === 0) frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    reducedMotion.addEventListener("change", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      reducedMotion.removeEventListener("change", requestUpdate);
      if (frame !== 0) window.cancelAnimationFrame(frame);
      section.removeAttribute("data-scroll-reveal");
      [
        "--about-headline-1",
        "--about-headline-2",
        "--about-headline-3",
        "--about-body-1",
        "--about-body-2",
        "--about-body-3",
      ].forEach((property) => section.style.removeProperty(property));
    };
  }, []);

  const handlePortraitMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (revealState !== "complete" || event.pointerType === "touch") return;
    if (
      !window.matchMedia("(pointer: fine) and (hover: hover)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));

    event.currentTarget.style.setProperty("--portrait-tilt-x", `${(0.5 - y) * 8}deg`);
    event.currentTarget.style.setProperty("--portrait-tilt-y", `${(x - 0.5) * 10}deg`);
    event.currentTarget.style.setProperty("--portrait-pointer-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--portrait-pointer-y", `${y * 100}%`);
  };

  const resetPortrait = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.removeProperty("--portrait-tilt-x");
    event.currentTarget.style.removeProperty("--portrait-tilt-y");
    event.currentTarget.style.removeProperty("--portrait-pointer-x");
    event.currentTarget.style.removeProperty("--portrait-pointer-y");
  };

  return (
    <section
      ref={sectionRef}
      className={`home-about-intro home-about-intro--${revealState}`}
      aria-labelledby="home-about-title"
    >
      <div className="page-container home-about-intro-shell">
        <div className="home-about-intro-inner">
          <div className="home-about-portrait-column">
            <div className="home-about-portrait-reveal">
              <div
                className="home-about-portrait-frame"
                onPointerMove={handlePortraitMove}
                onPointerLeave={resetPortrait}
              >
                <video
                  src={withBasePath("/about-photography/Home-X.mp4")}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="home-about-portrait-video"
                />
              </div>
            </div>
          </div>

          <div className="home-about-content">
            <div className="home-about-heading">
              <p className="home-about-label">ABOUT ME</p>
              <h2 id="home-about-title">
                <span className="home-about-line-mask">
                  <span className="home-about-heading-line">
                    I explore how AI can enhance
                  </span>
                </span>
                <span className="home-about-line-mask">
                  <span className="home-about-heading-line">
                    creative workflows and help shape
                  </span>
                </span>
                <span className="home-about-line-mask">
                  <span className="home-about-heading-line">
                    more thoughtful digital experiences.
                  </span>
                </span>
              </h2>
            </div>

            <p lang="zh-CN">
              <span className="home-about-copy-mask">
                <span className="home-about-copy-group">
                  <strong>Hi，我是 Cindy。</strong>
                  我是一名关注用户体验与视觉表达的设计师，希望通过清晰、自然且有温度的设计，
                  让人与产品之间的连接更加顺畅。
                </span>
              </span>
              <span className="home-about-copy-mask">
                <span className="home-about-copy-group">
                  我也持续关注 AI 在设计中的实际应用，探索它如何融入创意与设计工作流，
                </span>
              </span>
              <span className="home-about-copy-mask">
                <span className="home-about-copy-group">
                  帮助提升效率、拓展表达方式，并为用户带来更好的体验。
                </span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
