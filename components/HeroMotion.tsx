"use client";

import {
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, type RefObject } from "react";

export type HeroMotionValues = {
  backgroundX: MotionValue<number>;
  backgroundY: MotionValue<number>;
  atmosphereX: MotionValue<number>;
  atmosphereY: MotionValue<number>;
  contentX: MotionValue<number>;
  contentY: MotionValue<number>;
  contentOpacity: MotionValue<number>;
  frame01Opacity: MotionValue<number>;
  frame01Scale: MotionValue<number>;
  frame01Y: MotionValue<number>;
  frame02Opacity: MotionValue<number>;
  frame02Scale: MotionValue<number>;
  frame02Y: MotionValue<number>;
  heroProgress: MotionValue<number>;
};

const PARALLAX_SPRING = {
  stiffness: 42,
  damping: 24,
  mass: 0.7,
};

function useTransitionController(
  heroProgress: MotionValue<number>,
  reduceMotion: boolean | null,
) {
  const contentOpacity = useTransform(
    heroProgress,
    [0, 0.3, 0.58, 0.72, 1],
    [1, 1, 0.46, 0, 0],
  );
  const frame01Opacity = useTransform(
    heroProgress,
    [0, 0.48, 0.68, 0.9, 1],
    [1, 1, 0.92, 0.48, 0.22],
  );
  const frame02Opacity = useTransform(
    heroProgress,
    [0, 0.28, 0.5, 0.78, 1],
    [0, 0, 0.16, 0.7, 1],
  );
  const frame01Scale = useTransform(
    heroProgress,
    [0, 0.42, 0.72, 1],
    reduceMotion ? [1, 1, 1, 1] : [1.12, 1.12, 1.1, 1.085],
  );
  const frame01Y = useTransform(
    heroProgress,
    [0, 0.35, 0.7, 1],
    reduceMotion ? [0, 0, 0, 0] : [0, 0, 4, 8],
  );
  const frame02Scale = useTransform(
    heroProgress,
    [0, 0.28, 0.58, 1],
    reduceMotion ? [1, 1, 1, 1] : [1.18, 1.18, 1.1, 1],
  );
  const frame02Y = useTransform(
    heroProgress,
    [0, 0.28, 0.58, 1],
    reduceMotion ? [0, 0, 0, 0] : [18, 18, 10, 0],
  );

  return {
    contentOpacity,
    frame01Opacity,
    frame01Scale,
    frame01Y,
    frame02Opacity,
    frame02Scale,
    frame02Y,
  };
}

export function useHeroMotionController(
  heroRef: RefObject<HTMLElement | null>,
): HeroMotionValues {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, PARALLAX_SPRING);
  const smoothY = useSpring(pointerY, PARALLAX_SPRING);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const hero = heroRef.current;
    const finePointer = window.matchMedia("(pointer: fine)");

    if (!hero || reduceMotion || !finePointer.matches) {
      pointerX.set(0);
      pointerY.set(0);
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = hero.getBoundingClientRect();
      pointerX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 2);
      pointerY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 2);
    };

    const resetPointer = () => {
      pointerX.set(0);
      pointerY.set(0);
    };

    hero.addEventListener("pointermove", handlePointerMove, { passive: true });
    hero.addEventListener("pointerleave", resetPointer);

    return () => {
      hero.removeEventListener("pointermove", handlePointerMove);
      hero.removeEventListener("pointerleave", resetPointer);
    };
  }, [heroRef, pointerX, pointerY, reduceMotion]);

  const backgroundX = useTransform(smoothX, [-1, 1], [-12, 12]);
  const backgroundY = useTransform(smoothY, [-1, 1], [-8, 8]);
  const atmosphereX = useTransform(smoothX, [-1, 1], [-5, 5]);
  const atmosphereY = useTransform(smoothY, [-1, 1], [-4, 4]);
  const contentX = useTransform(smoothX, [-1, 1], [-3, 3]);
  const contentY = useTransform(smoothY, [-1, 1], [-2, 2]);
  const transition = useTransitionController(heroProgress, reduceMotion);

  return {
    backgroundX,
    backgroundY,
    atmosphereX,
    atmosphereY,
    contentX,
    contentY,
    ...transition,
    heroProgress,
  };
}

type ScrollTimelineProps = {
  heroRef: RefObject<HTMLElement | null>;
  progress: MotionValue<number>;
};

export function ScrollTimeline({ heroRef, progress }: ScrollTimelineProps) {
  useMotionValueEvent(progress, "change", (value) => {
    const hero = heroRef.current;
    if (!hero) return;

    const frame02Focus = Math.min(1, Math.max(0, (value - 0.28) / 0.64));
    hero.style.setProperty("--hero-progress", value.toFixed(4));
    hero.style.setProperty("--hero-frame02-blur", `${(1 - frame02Focus) * 18}px`);
    hero.style.setProperty("--hero-frame02-brightness", (0.84 + frame02Focus * 0.16).toFixed(3));
  });

  return null;
}
