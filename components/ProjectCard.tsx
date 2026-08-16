import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/projects";


type ProjectCardProps = {
  project: Project;
};


export default function ProjectCard({
  project,
}: ProjectCardProps) {

  return (
    <Link
      href={`/work/${project.slug}`}
    >

      <article>

        <div>
          <Image
            src={project.cover}
            alt={project.title}
            width={1200}
            height={800}
          />
        </div>


        <p>
          {project.year}
        </p>


        <h3>
          {project.title}
        </h3>


        <p>
          {project.subtitle}
        </p>


        <div>
          {project.tags.map((tag) => (
            <span key={tag}>
              {tag}
            </span>
          ))}
        </div>


      </article>

    </Link>
  );
}