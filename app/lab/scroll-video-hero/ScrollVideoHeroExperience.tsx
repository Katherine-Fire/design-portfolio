'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import styles from './scroll-video-hero.module.css';

const VIDEO_SOURCE = '/lab/scroll-video-hero/space-exit.mp4';
const SCROLL_STAGE_VH = 300;
const MOBILE_SCROLL_STAGE_VH = 260;
const SCRUB_SMOOTHING = 0.18;
const SEEK_THRESHOLD_SECONDS = 0.015;

export default function ScrollVideoHeroExperience() {
  const stageRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLOutputElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!stage || !video) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let duration = 0;
    let targetTime = 0;
    let displayTime = 0;
    let frame = 0;

    const writeProgress = (progress: number) => {
      if (progressRef.current) progressRef.current.value = `${Math.round(progress * 100)}%`;
    };

    const measureScroll = () => {
      if (!duration || reducedMotion.matches) {
        targetTime = 0;
        writeProgress(0);
        return;
      }

      const bounds = stage.getBoundingClientRect();
      const scrollDistance = Math.max(1, bounds.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -bounds.top / scrollDistance));
      targetTime = progress * duration;
      writeProgress(progress);
    };

    const handleMetadata = () => {
      duration = Number.isFinite(video.duration) ? video.duration : 0;
      video.pause();
      video.currentTime = 0;
      displayTime = 0;
      measureScroll();
    };

    const handleReady = () => {
      video.pause();
      stage.dataset.videoReady = 'true';
    };

    const handleError = () => {
      stage.dataset.videoReady = 'false';
      setHasError(true);
    };

    const handleMotionChange = () => {
      if (reducedMotion.matches) {
        targetTime = 0;
        displayTime = 0;
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) video.currentTime = 0;
      }
      measureScroll();
    };

    const render = () => {
      if (duration && !reducedMotion.matches) {
        const difference = targetTime - displayTime;
        displayTime = Math.abs(difference) <= SEEK_THRESHOLD_SECONDS
          ? targetTime
          : displayTime + difference * SCRUB_SMOOTHING;

        if (Math.abs(video.currentTime - displayTime) > SEEK_THRESHOLD_SECONDS) {
          video.currentTime = Math.min(duration, Math.max(0, displayTime));
        }
      }
      frame = requestAnimationFrame(render);
    };

    video.addEventListener('loadedmetadata', handleMetadata);
    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('canplay', handleReady);
    video.addEventListener('error', handleError);
    window.addEventListener('scroll', measureScroll, { passive: true });
    window.addEventListener('resize', measureScroll);
    reducedMotion.addEventListener('change', handleMotionChange);
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) handleMetadata();
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) handleReady();
    measureScroll();
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      video.pause();
      video.removeEventListener('loadedmetadata', handleMetadata);
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('canplay', handleReady);
      video.removeEventListener('error', handleError);
      window.removeEventListener('scroll', measureScroll);
      window.removeEventListener('resize', measureScroll);
      reducedMotion.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return (
    <section
      ref={stageRef}
      className={styles.scrollStage}
      style={{
        '--scroll-stage-vh': SCROLL_STAGE_VH,
        '--mobile-scroll-stage-vh': MOBILE_SCROLL_STAGE_VH,
      } as React.CSSProperties}
    >
      <div className={styles.stickyHero}>
        <video
          ref={videoRef}
          className={styles.video}
          src={VIDEO_SOURCE}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />

        {hasError && (
          <p className={styles.error} role="status">
            VIDEO UNAVAILABLE<br />PLACE SPACE-EXIT.MP4 IN THE LAB ASSET DIRECTORY
          </p>
        )}

        <header className={styles.header}>
          <Link href="/">CINDY KAN</Link>
          <span>SCROLL FILM / 01</span>
        </header>

        <h1 className={styles.title}>EXPLORING<br />BEYOND<br />THE EXPECTED</h1>

        <footer className={styles.footer}>
          <span>SCROLL — SCRUB</span>
          <output ref={progressRef} aria-label="Video timeline progress">0%</output>
        </footer>
      </div>
    </section>
  );
}
