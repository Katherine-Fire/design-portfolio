import { projects } from "@/data/projects";//项目根目录
import ProjectCard from "../components/ProjectCard";

export default function Home() {
  return (
    <main>
      <section id="hero">
        <h1>Cindy Kan</h1>
        <p>Product Designer</p>
      </section>

      <section id="about">
        <h2>About</h2>
      </section>

      <section id="work">
        <h2>Selected Work</h2>
        {projects.map((project) => (
          <ProjectCard
            key={project.slug}
            project={project}
          />
        ))}
      </section>

      <section id="contact">
        <h2>Contact</h2>
      </section>
    </main>
  );
}