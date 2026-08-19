import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";


type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};

export default async function ProjectPage({
    params,
}: PageProps) {
    const { slug } = await params;

    const project = projects.find(
        (project) => project.slug === slug
    );

    if (!project) {
        notFound();
    }
    const currentIndex = projects.findIndex(
        (project) => project.slug === slug
    );

    const nextIndex =
        (currentIndex + 1) % projects.length;

    const nextProject = projects[nextIndex];

    return (
        <main className="project-page">
            <header className="project-header">
                <h1>{project.title}</h1>
                <p>{project.subtitle}</p>

                <dl className="project-meta">
                    <div>
                        <dt>Role</dt>
                        <dd>{project.role}</dd>
                    </div>

                    <div>
                        <dt>Year</dt>
                        <dd>{project.year}</dd>
                    </div>

                    <div>
                        <dt>Platform</dt>
                        <dd>{project.platform}</dd>
                    </div>
                </dl>
                <div className="project-tags">
                    {project.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                    ))}
                </div>
            </header>

            <section className="project-intro">
                <p>{project.description}</p>
            </section>

            <section className="project-gallery">
                {project.content.map((item) => (
                    item.type === "image" ? (
                        <Image
                            key={item.src}
                            src={item.src}
                            alt=""
                            width={1920}
                            height={1080}
                            className="project-image"
                        />
                    ) : (
                        <video
                            key={item.src}
                            src={item.src}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="project-video"
                        />
                    )
                ))}
            </section>
            <nav className="next-project">
                <p>Next Project</p>

                <Link href={`/work/${nextProject.slug}`}>
                    {nextProject.title} →
                </Link>
            </nav>
        </main>
    );
}