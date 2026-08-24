"use client";

import Image from "next/image";
import { motion, type MotionStyle, type MotionValue } from "framer-motion";
import type { ReactNode } from "react";

import type { HeroMotionValues } from "@/components/HeroMotion";

const FRAME_01 = "/hero/frame-01-origin.webp";
const FRAME_02 = "/hero/frame-02-origin.webp";

type HeroSceneProps = Pick<
  HeroMotionValues,
  | "backgroundX"
  | "backgroundY"
  | "atmosphereX"
  | "atmosphereY"
  | "frame01Opacity"
  | "frame01Scale"
  | "frame01Y"
  | "frame02Opacity"
  | "frame02Scale"
  | "frame02Y"
>;

type FrameLayerProps = {
  className: string;
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  y: MotionValue<number>;
  children: ReactNode;
};

function FrameLayer({ className, opacity, scale, y, children }: FrameLayerProps) {
  return (
    <motion.div
      className={`hero-frame-layer ${className}`}
      style={{ scale, y }}
    >
      <motion.div
        className="hero-frame-visual"
        style={{ "--hero-frame-opacity": opacity } as MotionStyle}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function BackgroundLayer({
  src,
  imageClassName,
  priority = false,
  backgroundX,
  backgroundY,
}: Pick<HeroSceneProps, "backgroundX" | "backgroundY"> & {
  src: string;
  imageClassName: string;
  priority?: boolean;
}) {
  return (
    <motion.div
      className="hero-background-layer"
      style={{ x: backgroundX, y: backgroundY }}
    >
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className={`hero-frame-image ${imageClassName}`}
      />
    </motion.div>
  );
}

function AtmosphereLayer({
  atmosphereX,
  atmosphereY,
}: Pick<HeroSceneProps, "atmosphereX" | "atmosphereY">) {
  return (
    <motion.div
      className="hero-atmosphere-layer"
      style={{ x: atmosphereX, y: atmosphereY }}
    >
      <div className="hero-origin-glow" />
      <div className="hero-particles" aria-hidden="true" />
    </motion.div>
  );
}

export default function HeroScene(motionValues: HeroSceneProps) {
  return (
    <div className="hero-visual hero-scene" aria-hidden="true">
      <FrameLayer
        className="hero-frame hero-frame--02"
        opacity={motionValues.frame02Opacity}
        scale={motionValues.frame02Scale}
        y={motionValues.frame02Y}
      >
        <BackgroundLayer
          src={FRAME_02}
          imageClassName="hero-frame-02-image"
          {...motionValues}
        />
      </FrameLayer>
      <FrameLayer
        className="hero-frame hero-frame--01"
        opacity={motionValues.frame01Opacity}
        scale={motionValues.frame01Scale}
        y={motionValues.frame01Y}
      >
        <BackgroundLayer
          src={FRAME_01}
          imageClassName="hero-origin-image"
          priority
          {...motionValues}
        />
      </FrameLayer>
      <AtmosphereLayer {...motionValues} />
    </div>
  );
}
