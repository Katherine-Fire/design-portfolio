"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import HeroMenu from "./HeroMenu";
import HeroSpatialField from "./HeroSpatialField";

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<"enter" | "welcome" | "statement">("enter");
  const [isBeyondHero, setIsBeyondHero] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  useEffect(() => {
    const showWelcome = window.setTimeout(() => setPhase("welcome"), 100);
    const showStatement = window.setTimeout(() => setPhase("statement"), 1800);

    return () => {
      window.clearTimeout(showWelcome);
      window.clearTimeout(showStatement);
    };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let currentX = 0;
    let targetX = 0;
    let currentReflectionX = 52;
    let targetReflectionX = 52;
    let currentReflectionScale = 1;
    let targetReflectionScale = 1;

    const render = () => {
      frame = 0;
      currentX += (targetX - currentX) * 0.035;
      currentReflectionX += (targetReflectionX - currentReflectionX) * 0.035;
      currentReflectionScale += (targetReflectionScale - currentReflectionScale) * 0.035;

      hero.style.setProperty("--hero-video-parallax-x", `${currentX.toFixed(3)}px`);
      hero.style.setProperty("--hero-reflection-center-x", `${currentReflectionX.toFixed(3)}%`);
      hero.style.setProperty("--hero-reflection-scale-x", currentReflectionScale.toFixed(4));

      if (
        Math.abs(targetX - currentX) > 0.01 ||
        Math.abs(targetReflectionX - currentReflectionX) > 0.01 ||
        Math.abs(targetReflectionScale - currentReflectionScale) > 0.0001
      ) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const requestRender = () => {
      if (frame === 0) frame = window.requestAnimationFrame(render);
    };

    const resetSpatialMotion = () => {
      targetX = 0;
      targetReflectionX = 52;
      targetReflectionScale = 1;
      requestRender();
    };

    const updatePointer = (event: PointerEvent) => {
      if (reducedMotion.matches || !finePointer.matches) return;
      const bounds = hero.getBoundingClientRect();
      if (bounds.width === 0) return;
      const normalizedX = Math.min(1, Math.max(-1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1));

      targetX = normalizedX * 10;
      targetReflectionX = 52 + normalizedX * 10;
      targetReflectionScale = 1 + normalizedX * 0.04;
      requestRender();
    };

    const updateMotionMode = () => {
      if (reducedMotion.matches || !finePointer.matches) resetSpatialMotion();
    };

    hero.addEventListener("pointermove", updatePointer, { passive: true });
    hero.addEventListener("pointerleave", resetSpatialMotion);
    reducedMotion.addEventListener("change", updateMotionMode);
    finePointer.addEventListener("change", updateMotionMode);

    return () => {
      hero.removeEventListener("pointermove", updatePointer);
      hero.removeEventListener("pointerleave", resetSpatialMotion);
      reducedMotion.removeEventListener("change", updateMotionMode);
      finePointer.removeEventListener("change", updateMotionMode);
      if (frame !== 0) window.cancelAnimationFrame(frame);
      hero.style.removeProperty("--hero-video-parallax-x");
      hero.style.removeProperty("--hero-reflection-center-x");
      hero.style.removeProperty("--hero-reflection-scale-x");
    };
  }, []);

  useEffect(() => {
    let frame = 0;

    const updateScrollState = () => {
      frame = 0;
      const heroHeight = document.getElementById("hero")?.offsetHeight ?? window.innerHeight;
      setIsBeyondHero(window.scrollY >= heroHeight - 64);
      setShowBackToTop(window.scrollY > 600);
    };

    const requestUpdate = () => {
      if (frame === 0) frame = window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <>
      <header className={`hero-nav ${isBeyondHero ? "is-beyond-hero" : ""}`}>
        <div className="hero-nav-inner page-container">
          <button
            className="hero-menu-control hero-menu-toggle"
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-expanded={isMenuOpen}
            aria-controls="hero-full-menu"
          >
            <span>MENU</span>
            <span className="hero-menu-icon" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>

          <a className="hero-brand" href="#hero">
            CINDY KAN
          </a>

          <nav className="hero-nav-links" aria-label="Primary navigation">
            <a href="#work">WORK</a>
            <a href="/resume">RESUME</a>
            <a href="#contact">CONTACT</a>
          </nav>
        </div>
      </header>

      <HeroMenu isOpen={isMenuOpen} onClose={closeMenu} />

      <section
        ref={heroRef}
        id="hero"
        className="hero"
      >
        <div className="hero-visual" aria-hidden="true">
          <HeroSpatialField />
        </div>

        <div className="hero-reflection" aria-hidden="true" />

        <div className="hero-content page-container">
          <div
            className={`hero-phase hero-welcome ${phase === "enter" ? "is-pending" : "is-visible"
              }`}
            aria-hidden={phase === "enter"}
          >
            <p className="hero-eyebrow">PRODUCT DESIGN / AI / INTERACTION</p>
            <div
              className={`hero-statement-wrap ${phase === "statement" ? "is-visible" : "is-pending"}`}
              aria-hidden={phase !== "statement"}
            >
              <h1 className="hero-statement hero-focus-copy">
                <span
                  className="hero-statement-line hero-statement-line--lead"
                  data-text="DESIGN"
                >
                  DESIGN
                </span>
                <span
                  className="hero-statement-line hero-statement-line--support"
                  data-text="MY SPACE"
                >
                  MY <span className="home-title-accent"> SPACE</span>
                </span>
                <span
                  className="hero-statement-line hero-statement-line--support"
                  data-text="CINDY K."
                >
                  CINDY K.
                </span>
              </h1>
              <p className="hero-meta hero-supporting">关注产品体验、AI 交互与新的数字体验方式。</p>
            </div>
          </div>
        </div>

        <a className="hero-scroll" href="#work">
          <span>SCROLL TO EXPLORE</span>
          <span className="hero-scroll-line" aria-hidden="true" />
        </a>
      </section>

      <button
        className={`back-to-top ${showBackToTop ? "is-visible" : ""}`}
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        aria-hidden={!showBackToTop}
        tabIndex={showBackToTop ? 0 : -1}
      >
        <span aria-hidden="true">↑</span>
        TOP
      </button>
    </>
  );
}
