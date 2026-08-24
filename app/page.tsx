import { projects } from "@/data/projects";//项目根目录
import ProjectCard from "../components/ProjectCard";
import type { ProjectCardVariant } from "../components/ProjectCard";
import Hero from "../components/Hero";
import Image from "next/image";
import ContactSection from "../components/ContactSection";

const projectVariants: ProjectCardVariant[] = [
  "featured",
  "collection",
  "collection",
  "collection",
  "collection",
];

const profileCards = [
  {
    number: "01",
    label: "WORK",
    title: "想清楚，再动手",
    detail: "体验 · 结构 · 细节",
    modifier: "work",
    visual: "/about-cards/work.png",
  },
  {
    number: "02",
    label: "FOCUS",
    title: "人与 AI，如何更自然地互动",
    detail: "探索 · 交互 · 数字体验",
    modifier: "focus",
    visual: "/about-cards/focus.png",
  },
  {
    number: "03",
    label: "BEYOND",
    title: "对世界保持好奇",
    detail: "科幻 · 旅行 · 阅读",
    modifier: "beyond",
    visual: "/about-cards/beyond.png",
  },
  {
    number: "04",
    label: "PRACTICE",
    title: "让想法真正发生",
    detail: "设计 · 构建 · 学习",
    modifier: "practice",
    visual: "/about-cards/practice.png",
  },
];

export default function Home() {
  return (
    <main>
      <Hero />

      <section id="about" className="about-section">
        <div className="page-container about-layout">
          <div className="about-copy">
            <p className="about-kicker">ABOUT / 关于我</p>

            <h2 className="about-title">
              喜欢把事情想清楚，
              <br />
              也喜欢想它还能不能不一样
            </h2>

            <p className="about-body">
              我从 UI 与数字产品设计出发，一直关注产品中的用户体验，
              现在，也把更多注意力放在 AI 与新的数字交互方式之上
            </p>
          </div>

          <div className="about-card-cluster" aria-label="Personal profile">
            {profileCards.map((card) => (
              <article
                className={`about-profile-card about-profile-card--${card.modifier}`}
                key={card.number}
                tabIndex={0}
              >
                <header className="about-profile-card-header">
                  <span>{card.number}</span>
                  <span>{card.label}</span>
                </header>

                <div className="about-profile-card-visual" aria-hidden="true">

                  <Image
                    src={card.visual}
                    alt=""
                    fill
                    sizes="260px"
                    className="about-profile-card-image"
                  />
                </div>

                <div className="about-profile-card-content">
                  <h3>{card.title}</h3>
                  <p>{card.detail}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="about-meta">
            <div>
              <p className="about-meta-label">2018 — NOW</p>
              <p>PRODUCT / UI</p>
            </div>

            <div>
              <p className="about-meta-label">FOCUS</p>
              <p>AI / INTERACTION</p>
            </div>

            <div>
              <p className="about-meta-label">BEYOND DESIGN</p>
              <p>SCI-FI · TRAVEL · READING</p>
            </div>
          </div>
        </div>
      </section>

      <section id="work" className="work-section">
        <div className="work-section-inner page-container">
          <h2 className="work-heading">
            <span>SELECTED WORK</span>
            <span className="work-heading-divider" aria-hidden="true">/</span>
            <span lang="zh-CN">精选作品</span>
          </h2>

          <div className="work-grid">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.slug}
                project={project}
                number={String(index + 1).padStart(2, "0")}
                variant={projectVariants[index] ?? "collection"}
              />
            ))}
          </div>
        </div>
      </section>

      <ContactSection />
    </main>
  );
}
