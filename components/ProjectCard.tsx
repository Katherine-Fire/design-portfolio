import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/projects";

export type ProjectCardVariant = "featured" | "collection";

type ProjectCardProps = {
  project: Project;
  number: string;
  variant?: ProjectCardVariant;
};

export default function ProjectCard({
  project,
  number,
  variant = "collection",
}: ProjectCardProps) {
  const imageSizes = variant === "featured"
    ? "(max-width: 760px) 100vw, 91vw"
    : "(max-width: 760px) 100vw, 46vw";

  return (
    <Link
      href={`/work/${project.slug}`}
      className={`project-card project-card--${variant}`}
    >
      <article className="project-card-inner">
        <div className="project-card-cover">
          <Image
            src={project.cover}
            alt={`${project.titleZh} — ${project.title}`}
            fill
            sizes={imageSizes}
          />
        </div>

        <div className="project-card-content">
          <div className="project-card-meta">
            <span>PROJECT {number}</span>
            <span>{project.year}</span>
          </div>

          <div className="project-card-title-group">
            <h3 className="project-card-title" lang="zh-CN">
              {project.titleZh}
            </h3>

            <p className="project-card-title-en" lang="en">
              {project.title}
            </p>
          </div>

          <div className="project-card-tags" aria-label="Project tags">
            {project.tags.map((tag) => (
              <span key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
}
