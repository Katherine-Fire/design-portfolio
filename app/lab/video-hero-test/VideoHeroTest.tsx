"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import styles from "./video-hero-test.module.css";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4";

export default function VideoHeroTest() {
  const [phase, setPhase] = useState<"enter" | "welcome" | "statement">("enter");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const showWelcome = window.setTimeout(() => setPhase("welcome"), 100);
    const showStatement = window.setTimeout(() => setPhase("statement"), 1800);

    return () => {
      window.clearTimeout(showWelcome);
      window.clearTimeout(showStatement);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPlayback = () => {
      if (motionPreference.matches) {
        video.pause();
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) video.currentTime = 0;
        return;
      }

      void video.play().catch(() => {
        // The black Hero background remains a safe fallback when autoplay is unavailable.
      });
    };

    syncPlayback();
    video.addEventListener("loadedmetadata", syncPlayback);
    motionPreference.addEventListener("change", syncPlayback);

    return () => {
      video.removeEventListener("loadedmetadata", syncPlayback);
      motionPreference.removeEventListener("change", syncPlayback);
    };
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.container}>
          <Link className={styles.brand} href="/">
            CINDY KAN
          </Link>

          <nav className={styles.navLinks} aria-label="Video hero test navigation">
            <Link href="/#work">WORK</Link>
            <Link href="/lab">LAB</Link>
            <Link href="/#about">ABOUT</Link>
            <Link href="/resume">RESUME</Link>
            <Link href="/#contact">CONTACT</Link>
          </nav>
        </div>
      </header>

      <section className={styles.hero} aria-label="Alternate video Hero test">
        <video
          ref={videoRef}
          className={styles.video}
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />

        <div className={`${styles.content} ${styles.container}`}>
          <div
            className={`${styles.phase} ${styles.welcome} ${
              phase === "welcome"
                ? styles.visible
                : phase === "statement"
                  ? styles.exiting
                  : styles.pending
            }`}
            aria-hidden={phase !== "welcome"}
          >
            <p className={styles.welcomeCopy}>欢迎来到</p>
          </div>

          <div
            className={`${styles.phase} ${styles.statementWrap} ${
              phase === "statement" ? styles.visible : styles.pending
            }`}
            aria-hidden={phase !== "statement"}
          >
            <p className={styles.statement}>
              设计产品
              <br />
              也探索数字世界的另一种可能
            </p>
            <p className={styles.meta}>PRODUCT · AI · INTERACTION</p>
          </div>
        </div>

        <Link className={styles.scroll} href="/#work">
          <span>SCROLL TO EXPLORE</span>
          <span className={styles.scrollLine} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
