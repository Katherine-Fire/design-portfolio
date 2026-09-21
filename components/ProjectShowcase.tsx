"use client";

import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/projects";
import { PROJECT_SCROLL_POSITION_KEY } from "@/components/ProjectVisitContext";

type ProjectShowcaseProps = {
  projects: Project[];
};

export default function ProjectShowcase({ projects }: ProjectShowcaseProps) {
  return (
    <div className="project-index" aria-label="Selected projects">
      {projects.map((project, index) => (
        <Link
          key={project.slug}
          href={`/work/${project.slug}`}
          className="project-index-row"
          aria-label={`View ${project.titleZh}`}
          onClick={() => {
            sessionStorage.setItem(
              PROJECT_SCROLL_POSITION_KEY,
              String(window.scrollY),
            );
          }}
        >
          <div className="project-index-meta">
            <span className="project-index-number">
              {String(index + 1).padStart(2, "0")}
            </span>

            <h3>
              <span lang="zh-CN">{project.titleZh}</span>
              <span lang="en">{project.title}</span>
            </h3>

            <div className="project-index-details">
              <span className="project-index-tag">{project.tags[0]}</span>
              <span>{project.year}</span>
            </div>
          </div>

          <div className="project-index-cover" data-cursor="spacecraft">
            <Image
              src={project.cover}
              alt={`${project.titleZh} — ${project.title}`}
              fill
              priority={index === 0}
              sizes="(max-width: 760px) calc(100vw - 32px), 76vw"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
