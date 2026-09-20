import { projects } from "@/data/projects";//项目根目录
import ProjectCard from "../components/ProjectCard";
import Hero from "../components/Hero";
import ContactSection from "../components/ContactSection";
import HomeScrollStage from "../components/HomeScrollStage";
import AboutConceptCards from "../components/AboutConceptCards";
import AboutPhotographyStream from "../components/AboutPhotographyStream";
import HomeAboutIntro from "../components/HomeAboutIntro";

type AboutVisualMode = "photography" | "concept";

// Change this single value to "concept" to restore the previous About visual.
const ABOUT_VISUAL_MODE: AboutVisualMode = "photography";

export default function Home() {
  return (
    <main>
      <HomeScrollStage>
        <Hero />

        <div className="hero-marquee-band" aria-label="Cindy Kan">
          <div className="hero-marquee-track" aria-hidden="true">
            {[0, 1].map((group) => (
              <div className="hero-marquee-group" key={group}>
                {Array.from({ length: 4 }, (_, item) => (
                  <span className="hero-marquee-item" key={item}>
                    CINDY KAN
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <HomeAboutIntro />

        <section id="work" className="work-section">
          <div className="work-section-inner page-container">
            <header className="work-heading">
              <h2>SELECTED <span className="home-title-accent">WORK</span></h2>
              <span className="work-heading-divider" aria-hidden="true">/</span>
              <span lang="zh-CN">精选作品</span>
            </header>

            <div className="work-grid work-grid--three-column">
              {projects.map((project) => (
                <ProjectCard
                  key={project.slug}
                  project={project}
                  sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1100px) 46vw, 31vw"
                />
              ))}
            </div>
          </div>
        </section>
      </HomeScrollStage>

      <section id="about" className="about-section">
        <div className={`page-container about-layout about-layout--${ABOUT_VISUAL_MODE}`}>
          <div className="about-copy">
          </div>

          {ABOUT_VISUAL_MODE === "photography" ? (
            <AboutPhotographyStream />
          ) : (
            <AboutConceptCards />
          )}


        </div>
      </section>

      <ContactSection />
    </main>
  );
}
