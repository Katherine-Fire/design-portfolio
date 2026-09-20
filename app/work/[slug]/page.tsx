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
            <nav className="project-page-nav" aria-label="Project navigation">
                <Link className="project-return" href="/#hero">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M14.5 5 7.5 12l7 7" />
                        <path d="M8 12h10" />
                    </svg>
                    <span>返回作品</span>
                </Link>

                <Link className="project-home-link" href="/#hero">
                    CINDY KAN
                </Link>
            </nav>

            <header className="project-header">
                <h1>{project.title}</h1>

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
            </header>

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
