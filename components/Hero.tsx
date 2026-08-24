"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import HeroScene from "@/components/HeroScene";
import {
  ScrollTimeline,
  useHeroMotionController,
  type HeroMotionValues,
} from "@/components/HeroMotion";

function HeroContent({
  contentX,
  contentY,
  contentOpacity,
}: Pick<HeroMotionValues, "contentX" | "contentY" | "contentOpacity">) {
  return (
    <motion.div
      className="hero-content page-container"
      style={{ x: contentX, y: contentY, opacity: contentOpacity }}
    >
      <div className="hero-origin-copy">
        <p className="hero-origin-eyebrow">HELLO, I&apos;M</p>
        <h1>CINDY KAN</h1>
        <p className="hero-origin-role">PRODUCT DESIGNER</p>
        <p className="hero-origin-disciplines">AI · DIGITAL EXPERIENCE · SYSTEM THINKING</p>
        <p className="hero-origin-description" lang="zh-CN">
          探索人与产品、智能系统之间的新型数字体验。
        </p>
      </div>
    </motion.div>
  );
}

function ScrollCue() {
  return (
    <a className="hero-scroll-cue page-container" href="#work">
      <span>EXPLORE MY WORK</span>
      <span aria-hidden="true">↓</span>
    </a>
  );
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const [isBeyondHero, setIsBeyondHero] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const heroMotion = useHeroMotionController(heroRef);

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
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <>
      <header className={`hero-nav ${isBeyondHero ? "is-beyond-hero" : ""}`}>
        <div className="hero-nav-inner page-container">
          <a className="hero-brand" href="#hero">CINDY KAN</a>
          <nav className="hero-nav-links" aria-label="Primary navigation">
            <a href="#work">WORK</a>
            <a href="#lab">LAB</a>
            <a href="#about">ABOUT</a>
            <a href="/resume">RESUME</a>
            <a href="#contact">CONTACT</a>
          </nav>
        </div>
      </header>

      <section ref={heroRef} id="hero" className="hero" data-frame="origin">
        <HeroScene {...heroMotion} />
        <HeroContent {...heroMotion} />
        <ScrollCue />
        <ScrollTimeline heroRef={heroRef} progress={heroMotion.heroProgress} />
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
