"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  aboutPhotography,
  type AboutPhotographyItem,
} from "@/data/aboutPhotography";

type PhotoRowProps = {
  photos: AboutPhotographyItem[];
  row: number;
  direction: "left" | "right";
};

function Photo({
  photo,
  duplicate = false,
}: {
  photo: AboutPhotographyItem;
  duplicate?: boolean;
}) {
  return (
    <figure
      className={`about-photo about-photo--${photo.tone}`}
      aria-hidden={duplicate || undefined}
    >
      {photo.src ? (
        photo.type === "video" ? (
          <video
            src={photo.src}
            className="about-photo-image"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <Image
            src={photo.src}
            alt={duplicate ? "" : (photo.alt ?? "Personal travel observation")}
            fill
            sizes="(max-width: 760px) 44vw, (max-width: 1100px) 22vw, 18vw"
            className="about-photo-image"
          />
        )
      ) : (
        <span
          className="about-photo-placeholder"
          aria-hidden="true"
        />
      )}
    </figure>
  );
}

function PhotoRow({
  photos,
  row,
  direction,
}: PhotoRowProps) {
  const loopPhotos = [
    ...photos,
    ...photos,
    ...photos,
  ];

  return (
    <div
      className={`about-photography-row about-photography-row--${row} about-photography-row--${direction}`}
    >
      <div className="about-photography-track">
        <div className="about-photo-set">
          {loopPhotos.map((photo, index) => (
            <Photo
              photo={photo}
              key={`${photo.id}-primary-${index}`}
            />
          ))}
        </div>

        <div
          className="about-photo-set"
          aria-hidden="true"
        >
          {loopPhotos.map((photo, index) => (
            <Photo
              photo={photo}
              duplicate
              key={`${photo.id}-duplicate-${index}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function buildRows(count: number) {
  return Array.from(
    { length: count },
    (_, rowIndex) =>
      aboutPhotography.filter(
        (_, index) => index % count === rowIndex,
      ),
  );
}

export default function AboutPhotographyStream() {
  const rows = buildRows(3);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!hero || !finePointer.matches || reducedMotion.matches) {
      return;
    }

    let current = 0;
    let target = 0;
    let frame = 0;

    const render = () => {
      current += (target - current) * 0.075;

      hero.style.setProperty("--about-bg-shift", `${current * -7}px`);
      hero.style.setProperty("--about-subject-shift", `${current * 17}px`);

      if (Math.abs(target - current) > 0.002) {
        frame = window.requestAnimationFrame(render);
      } else {
        current = target;
        frame = 0;
      }
    };

    const requestRender = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = hero.getBoundingClientRect();
      const normalized = (event.clientX - bounds.left) / bounds.width;
      target = Math.max(-1, Math.min(1, normalized * 2 - 1));
      requestRender();
    };

    const handlePointerLeave = () => {
      target = 0;
      requestRender();
    };

    hero.addEventListener("pointermove", handlePointerMove, { passive: true });
    hero.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      hero.removeEventListener("pointermove", handlePointerMove);
      hero.removeEventListener("pointerleave", handlePointerLeave);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      className="about-photography"
      aria-label="Personal observations photography stream"
    >
      <header className="about-story-hero" ref={heroRef}>
        <Image
          src="/about-photography/about-portrait-v1.png"
          alt="Cindy sitting beneath warm orbital light"
          fill
          sizes="100vw"
          className="about-story-hero-image about-story-hero-image--background"
        />
        <Image
          src="/about-photography/about-portrait-v1.png"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="about-story-hero-image about-story-hero-image--subject"
        />
        <div className="about-story-hero-shade" aria-hidden="true" />

        <div className="about-story-hero-inner">
          <div className="about-story-copy">
            <p className="about-story-kicker">SAME GIRL · BIGGER WORLDS</p>
            <h2 className="about-photography-title">
              <span className="about-title-line">设计之外，也记录让我</span>
              <span className="about-title-line about-title-accent">
                停下来的瞬间。
              </span>
            </h2>
            <p className="about-photography-copy">
              旅行中的风景、城市、建筑、展览、光线与材质，
              <br className="about-copy-break" />
              都在不断影响我观察和理解体验的方式。
            </p>
            <a className="about-story-scroll" href="#about-photography-gallery">
              <span aria-hidden="true">↓</span>
              探索我的影像记录
            </a>
          </div>

          <p className="about-story-note" aria-hidden="true">
            CAPTURE
            <br />
            A BETTER ME
          </p>
        </div>
      </header>

      <div className="about-gallery-intro" id="about-photography-gallery">
        <p className="about-gallery-label">PLACES I&apos;VE BEEN</p>
        <h3>
          走过的地方，
          <br />
          <span>一直在给我新的灵感。</span>
        </h3>
        <p>
          每一座城市都有不同的节奏与情绪，
          镜头记录的不只是风景，更是当下的感受。
        </p>
      </div>

      <div className="about-photography-viewport">
        {rows.map((photos, index) => (
          <PhotoRow
            key={index}
            photos={photos}
            row={index + 1}
            direction={
              index % 2 === 0
                ? "left"
                : "right"
            }
          />
        ))}
      </div>

      <footer className="about-story-outro">
        <Image
          src="/about-photography/about-outro-v2.png"
          alt="A traveler watching a golden sunrise over a mountain lake"
          fill
          sizes="100vw"
          className="about-story-outro-image"
        />
        <div className="about-story-outro-shade" aria-hidden="true" />
        <div className="about-story-outro-content">
          <p className="about-story-outro-label">MORE THAN A DESTINATION</p>
          <h3>
            去看更大的世界
            <br />
            <span>也找回更真实的自己</span>
          </h3>
          <p className="about-story-outro-caption">
            生活，是关于美好瞬间的收藏。
          </p>
        </div>
      </footer>
    </section>
  );
}
