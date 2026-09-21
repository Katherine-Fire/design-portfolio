"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { Project } from "@/data/projects";
import { PROJECT_SCROLL_POSITION_KEY } from "@/components/ProjectVisitContext";

type ProjectCardProps = {
  project: Project;
  sizes?: string;
};

export default function ProjectCard({
  project,
  sizes,
}: ProjectCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const pointerFrameRef = useRef(0);
  const pointerRef = useRef({ currentX: 0, currentY: 0, targetX: 0, targetY: 0 });
  const metadata = [...project.tags.slice(0, 2), project.year].join(" · ");

  const updatePointerCTA = () => {
    const card = cardRef.current;
    if (!card) return;

    const pointer = pointerRef.current;
    pointer.currentX += (pointer.targetX - pointer.currentX) * 0.2;
    pointer.currentY += (pointer.targetY - pointer.currentY) * 0.2;
    card.style.setProperty("--project-pointer-x", `${pointer.currentX}px`);
    card.style.setProperty("--project-pointer-y", `${pointer.currentY}px`);

    const remaining = Math.abs(pointer.targetX - pointer.currentX)
      + Math.abs(pointer.targetY - pointer.currentY);
    if (remaining > 0.15 && card.classList.contains("is-pointer-active")) {
      pointerFrameRef.current = window.requestAnimationFrame(updatePointerCTA);
    } else {
      pointerFrameRef.current = 0;
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLAnchorElement>, enter = false) => {
    if (
      event.pointerType !== "mouse"
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) return;

    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const pointer = pointerRef.current;
    pointer.targetX = event.clientX - rect.left;
    pointer.targetY = event.clientY - rect.top;

    if (enter) {
      pointer.currentX = pointer.targetX;
      pointer.currentY = pointer.targetY;
      card.classList.add("is-pointer-active");
    }
    if (!pointerFrameRef.current) {
      pointerFrameRef.current = window.requestAnimationFrame(updatePointerCTA);
    }
  };

  const handlePointerLeave = () => {
    cardRef.current?.classList.remove("is-pointer-active");
    if (pointerFrameRef.current) window.cancelAnimationFrame(pointerFrameRef.current);
    pointerFrameRef.current = 0;
  };

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      card.classList.add("is-visible");
      return;
    }

    card.classList.add("is-reveal-ready");
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      card.classList.add("is-visible");
      observer.disconnect();
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    observer.observe(card);
    return () => {
      observer.disconnect();
      if (pointerFrameRef.current) window.cancelAnimationFrame(pointerFrameRef.current);
    };
  }, []);

  return (
    <Link
      ref={cardRef}
      href={`/work/${project.slug}`}
      className="project-card"
      onPointerEnter={(event) => handlePointerMove(event, true)}
      onPointerMove={(event) => handlePointerMove(event)}
      onPointerLeave={handlePointerLeave}
      onClick={() => {
        sessionStorage.setItem(
          PROJECT_SCROLL_POSITION_KEY,
          String(window.scrollY)
        );
      }}
    >
      <article className="project-card-inner">
        <div className="project-card-cover" data-cursor="spacecraft">
          <Image
            src={project.cover}
            alt={`${project.titleZh} — ${project.title}`}
            fill
            sizes={sizes ?? "(max-width: 760px) calc(100vw - 32px), (max-width: 1100px) 86vw, 74vw"}
          />
        </div>

        <header className="project-card-content">
          <h3 className="project-card-title" lang="zh-CN">
            {project.titleZh}
          </h3>

          <p className="project-card-meta">
            {metadata}
          </p>
        </header>
      </article>

      <span className="project-card-pointer-cta" aria-hidden="true">
        VIEW PROJECT <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
