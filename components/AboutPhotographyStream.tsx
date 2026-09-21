"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  aboutPhotography,
  type AboutPhotographyItem,
} from "@/data/aboutPhotography";
import { withBasePath } from "@/lib/sitePath";

type PhotoRowProps = {
  photos: AboutPhotographyItem[];
  row: number;
  direction: "left" | "right";
};

const SHOW_GALLERY_INTRO = false;
const HERO_PHOTO_IDS = ["03", "05", "09", "07", "06"];
const HERO_PHOTO_LABELS: Record<string, string> = {
  "03": "REYKJAVIK",
  "05": "TOLEDO",
  "06": "SEVILLE",
  "07": "LOFOTEN",
  "09": "SAN DIEGO",
};
const HERO_PHOTO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "03": { width: 4096, height: 1832 },
  "04": { width: 6000, height: 3376 },
  "05": { width: 6000, height: 3376 },
  "06": { width: 6000, height: 3376 },
  "07": { width: 6000, height: 3376 },
  "08": { width: 6000, height: 3376 },
  "09": { width: 6000, height: 3376 },
};

function MemoryCard({
  photo,
  index,
}: {
  photo: AboutPhotographyItem;
  index: number;
}) {
  if (!photo.src) return null;

  const dimensions = HERO_PHOTO_DIMENSIONS[photo.id] ?? {
    width: 1600,
    height: 900,
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    event.currentTarget.style.setProperty("--card-rotate-x", `${(0.5 - y) * 10}deg`);
    event.currentTarget.style.setProperty("--card-rotate-y", `${(x - 0.5) * 12}deg`);
    event.currentTarget.style.setProperty("--card-light-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--card-light-y", `${y * 100}%`);
  };

  const resetPointer = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.removeProperty("--card-rotate-x");
    event.currentTarget.style.removeProperty("--card-rotate-y");
    event.currentTarget.style.removeProperty("--card-light-x");
    event.currentTarget.style.removeProperty("--card-light-y");
  };

  return (
    <figure
      className={`about-memory-card about-memory-card--${index + 1}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      aria-hidden="true"
    >
      <Image
        src={photo.src}
        alt=""
        width={dimensions.width}
        height={dimensions.height}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        sizes="(max-width: 760px) 46vw, (max-width: 1100px) 28vw, 22vw"
        className="about-memory-card-image"
      />
      <figcaption className="about-memory-card-caption">
        {HERO_PHOTO_LABELS[photo.id]}
      </figcaption>
      <span className="about-memory-card-light" />
    </figure>
  );
}

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
            preload="none"
          />
        ) : (
          <Image
            src={photo.src}
            alt={duplicate ? "" : (photo.alt ?? "Personal travel observation")}
            fill
            loading="lazy"
            decoding="async"
            fetchPriority="low"
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
  return (
    <div
      className={`about-photography-row about-photography-row--${row} about-photography-row--${direction}`}
    >
      <div className="about-photography-track">
        <div className="about-photo-set">
          {photos.map((photo, index) => (
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
          {photos.map((photo, index) => (
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

const PHOTO_ROWS = buildRows(2);
const HERO_PHOTOS = HERO_PHOTO_IDS.map((id) =>
  aboutPhotography.find(
    (photo) => photo.id === id && photo.type === "image" && photo.src,
  ),
).filter((photo): photo is AboutPhotographyItem => Boolean(photo));

export default function AboutPhotographyStream() {
  const heroRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [revealState, setRevealState] = useState<
    "idle" | "pending" | "revealed" | "complete"
  >("idle");

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        carousel.dataset.active = String(entry.isIntersecting);
        carousel.querySelectorAll("video").forEach((video) => {
          if (entry.isIntersecting) {
            void video.play().catch(() => undefined);
          } else {
            video.pause();
          }
        });
      },
      { rootMargin: "160px 0px", threshold: 0 },
    );

    observer.observe(carousel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const copy = copyRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!copy || reducedMotion.matches) {
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
      { threshold: 0.28 },
    );

    observer.observe(copy);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (revealState !== "revealed") return;

    const completionTimer = window.setTimeout(() => {
      setRevealState("complete");
    }, 1160);

    return () => window.clearTimeout(completionTimer);
  }, [revealState]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    hero.dataset.nearViewport = "true";
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        hero.dataset.nearViewport = String(entry.isIntersecting);
      },
      { rootMargin: "10% 0px", threshold: 0 },
    );
    visibilityObserver.observe(hero);

    const syncScrollbarCompensation = () => {
      const scrollbarWidth = Math.max(
        0,
        window.innerWidth - document.documentElement.clientWidth,
      );
      hero.style.setProperty(
        "--about-scrollbar-compensation",
        `${scrollbarWidth / 2}px`,
      );
    };

    syncScrollbarCompensation();
    window.addEventListener("resize", syncScrollbarCompensation);

    return () => {
      visibilityObserver.disconnect();
      window.removeEventListener("resize", syncScrollbarCompensation);
      hero.style.removeProperty("--about-scrollbar-compensation");
      hero.removeAttribute("data-near-viewport");
    };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!hero || !finePointer.matches || reducedMotion.matches) {
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let frame = 0;

    const cardMotion = [
      { currentX: 0, currentY: 0, x: 9, y: 4, ease: 0.072 },
      { currentX: 0, currentY: 0, x: -6, y: 4, ease: 0.09 },
      { currentX: 0, currentY: 0, x: 7, y: -3, ease: 0.061 },
      { currentX: 0, currentY: 0, x: -5, y: -4, ease: 0.082 },
      { currentX: 0, currentY: 0, x: 4, y: 3, ease: 0.054 },
    ];

    const render = () => {
      let isMoving = false;

      cardMotion.forEach((motion, index) => {
        const cardTargetX = targetX * motion.x;
        const cardTargetY = targetY * motion.y;
        motion.currentX += (cardTargetX - motion.currentX) * motion.ease;
        motion.currentY += (cardTargetY - motion.currentY) * motion.ease;

        hero.style.setProperty(
          `--about-card-${index + 1}-x`,
          `${motion.currentX.toFixed(3)}px`,
        );
        hero.style.setProperty(
          `--about-card-${index + 1}-y`,
          `${motion.currentY.toFixed(3)}px`,
        );

        if (
          Math.abs(cardTargetX - motion.currentX) > 0.02 ||
          Math.abs(cardTargetY - motion.currentY) > 0.02
        ) {
          isMoving = true;
        }
      });

      if (isMoving) {
        frame = window.requestAnimationFrame(render);
      } else {
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
      const normalizedX = (event.clientX - bounds.left) / bounds.width;
      const normalizedY = (event.clientY - bounds.top) / bounds.height;
      targetX = Math.max(-1, Math.min(1, normalizedX * 2 - 1));
      targetY = Math.max(-1, Math.min(1, normalizedY * 2 - 1));
      requestRender();
    };

    const handlePointerLeave = () => {
      targetX = 0;
      targetY = 0;
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
      <header
        className={`about-story-hero about-story-hero--orbital about-story-hero--${revealState}`}
        ref={heroRef}
      >
        <div className="about-memory-scene" aria-hidden="true">
          <Image
            className="about-story-hero-bg-video"
            src={withBasePath("/about-photography/about-orbital-background.png")}
            alt=""
            fill
            sizes="100vw"
            loading="lazy"
            decoding="async"
          />
          <span className="about-orbit-node about-orbit-node--1" />
          <span className="about-orbit-node about-orbit-node--2" />
          <div className="about-memory-cards">
            {HERO_PHOTOS.map((photo, index) => (
              <MemoryCard photo={photo} index={index} key={photo.id} />
            ))}
          </div>
        </div>
        <div className="about-story-hero-shade" aria-hidden="true" />

        <div className="about-story-hero-inner">
          <div
            ref={copyRef}
            className={`about-story-copy about-story-copy--${revealState}`}
          >
            <p className="about-story-kicker">SAME GIRL · BIGGER WORLDS</p>
            <h2 className="about-photography-title">
              <span className="about-line-mask">
                <span className="about-title-line">设计之外，也记录那些</span>
              </span>
              <span className="about-line-mask">
                <span className="about-title-line">让我停下来的瞬间</span>
              </span>
            </h2>
            <p className="about-photography-copy">
              <span className="about-copy-mask">
                <span className="about-copy-group">
                  旅行中的风景、城市、建筑与展览，
                </span>
              </span>
              <span className="about-copy-mask">
                <span className="about-copy-group">
                  光线与材质，也持续影响我观察和理解体验的方式。
                </span>
              </span>
            </p>
            <a className="about-story-scroll" href="#about-photography-gallery">
              <span aria-hidden="true">↓</span>
              EXPLORE MY JOURNEY
            </a>
          </div>


        </div>
      </header>

      {SHOW_GALLERY_INTRO ? (
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
      ) : null}

      <div
        ref={carouselRef}
        className="about-photography-viewport"
        id="about-photography-gallery"
        data-active="false"
      >
        {PHOTO_ROWS.map((photos, index) => (
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


    </section>
  );
}
