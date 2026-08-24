"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { projects as portfolioProjects } from "@/data/projects";
import styles from "./resume.module.css";

const navItems = [
  ["ABOUT", "about"],
  ["EXPERIENCE", "experience"],
  ["PROJECTS", "projects"],
  ["EDUCATION", "education"],
] as const;

const experiences = [
  { period: "2024 — 2025", company: "Baidu Era Network Technology", role: "UI / Product Designer", description: "Designing product experiences across AI-assisted workflows, interface systems and interaction patterns, in close collaboration with product and engineering partners.", tags: ["Product Design", "AI Experience", "Interaction Design", "UI System"] },
  { period: "2021 — 2023", company: "BlueCity", role: "UI Designer", description: "Created cross-platform social and live experiences with a focus on information hierarchy, interaction clarity and scalable interface patterns.", tags: ["Cross-platform", "UI Design", "Interaction", "Design System"] },
  { period: "2018 — 2021", company: "Independent Design Practice", role: "UI / UX Designer", description: "Translated early product concepts into structured digital experiences, aligning visual direction with product requirements and technical constraints.", tags: ["Product Thinking", "UX Design", "Prototyping", "Collaboration"] },
];

const skills = [
  ["DESIGN", "Figma · Photoshop · Illustrator"],
  ["AI", "Midjourney · AI Product Exploration"],
  ["MOTION", "After Effects · Interaction Prototyping"],
] as const;

const selectedProjects = portfolioProjects.slice(0, 5).map((project) =>
  project.slug === "campaign-operations"
    ? {
        ...project,
        titleZh: "增长与活动体验设计",
        title: "GROWTH & CAMPAIGN EXPERIENCE DESIGN",
        description:
          "围绕产品运营活动进行视觉与交互设计，包括活动页面、运营视觉、用户参与体验优化。",
        tags: ["Product Design", "Campaign Design", "Visual Design"],
      }
    : project,
);

export default function ResumeContent() {
  const [activeSection, setActiveSection] = useState("about");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>("section[id]") ?? [],
    );
    const trackedIds = new Set(navItems.map(([, id]) => id));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handleScroll = () => {
      if (window.scrollY < 120) setActiveSection("about");
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (window.scrollY >= 120 && trackedIds.has(entry.target.id as (typeof navItems)[number][1])) {
            setActiveSection(entry.target.id);
          }
          if (!reduceMotion && !entry.target.hasAttribute("data-revealed")) {
            entry.target.setAttribute("data-revealed", "true");
            entry.target.animate(
              [
                { opacity: 0, transform: "translateY(20px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { duration: 600, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" },
            );
          }
        });
      },
      { rootMargin: "-20% 0px -62%", threshold: 0.01 },
    );

    sections.forEach((section) => observer.observe(section));
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar} id="about">
          <div>
            <Link href="/" className={styles.back}>← BACK TO PORTFOLIO</Link>
            <h1>CINDY KAN</h1>
            <p className={styles.role}>Product Designer</p>
            <p className={styles.focus}>AI · DIGITAL EXPERIENCE</p>
            <p className={styles.summaryZh} lang="zh-CN">我关注产品体验、AI交互和新的数字体验方式。</p>
            <p className={styles.summary}>I design digital products and experiences at the intersection of AI, interaction and technology.</p>
          </div>

          <nav className={styles.sectionNav} aria-label="Resume sections">
            {navItems.map(([label, id]) => (
              <a key={id} href={`#${id}`} className={activeSection === id ? styles.active : undefined} aria-current={activeSection === id ? "location" : undefined}>
                <span aria-hidden="true" />{label}
              </a>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <p>SOCIAL</p>
            <div className={styles.socials}>
              <a href="#">LinkedIn</a><a href="#">Behance</a><a href="#">Dribbble</a><a href="mailto:name@email.com">Email</a>
            </div>
            <a className={styles.download} href="/resume.pdf" target="_blank" rel="noopener noreferrer">
              DOWNLOAD RESUME PDF <span aria-hidden="true">↗</span>
            </a>
          </div>
        </aside>

        <div className={styles.content} ref={contentRef}>
          <section className={styles.section} id="experience" aria-labelledby="experience-title">
            <h2 id="experience-title">EXPERIENCE</h2>
            <div className={styles.timeline}>
              {experiences.map((item) => (
                <article className={styles.experience} key={item.period} tabIndex={0}>
                  <p className={styles.period}><span aria-hidden="true" />{item.period}</p>
                  <div className={styles.experienceBody}>
                    <h3>{item.company}</h3><p className={styles.company}>{item.role}</p>
                    <p className={styles.description}>{item.description}</p>
                    <ul className={styles.tags} aria-label={`${item.role} skills`}>{item.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section} id="projects" aria-labelledby="projects-title">
            <h2 id="projects-title">PROJECTS</h2>
            <div className={styles.projects}>
              {selectedProjects.map((project, index) => (
                <article className={styles.project} key={project.slug}>
                  <Link href={`/work/${project.slug}`} className={styles.projectThumbnail} aria-label={`View ${project.titleZh} case study`}>
                    <Image src={project.cover} alt="" fill sizes="(max-width: 760px) 100vw, 180px" className={styles.projectImage} />
                  </Link>
                  <div className={styles.projectInfo}>
                    <p className={styles.projectIndex}>PROJECT {String(index + 1).padStart(2, "0")}</p>
                    <div className={styles.projectHeading}>
                      <h3>{project.titleZh}</h3>
                      <p className={styles.projectYear}>{project.year}</p>
                    </div>
                    <p className={styles.projectRole}>{project.title}</p>
                    <p className={styles.description}>{project.description}</p>
                    <ul className={styles.projectTags} aria-label={`${project.titleZh} tags`}>
                      {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
                    </ul>
                    <Link href={`/work/${project.slug}`} className={styles.projectLink}>VIEW CASE <span aria-hidden="true">→</span></Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section} id="education" aria-labelledby="education-title">
            <h2 id="education-title">EDUCATION</h2>
            <div className={styles.educationList}>
              <article className={styles.education}>
                <p className={styles.period}>2018 — 2020</p>
                <div>
                  <h3>北方工业大学</h3>
                  <p className={styles.educationDegree}>Industrial Design Engineering · 研究生</p>
                  <p className={styles.educationDescription}>Focused on industrial design research, user experience and innovation methodology.</p>
                </div>
              </article>
              <article className={styles.education}>
                <p className={styles.period}>2014 — 2018</p>
                <div>
                  <h3>北方工业大学</h3>
                  <p className={styles.educationDegree}>Industrial Design · Bachelor</p>
                  <p className={styles.educationDescription}>Studied product design, interaction design, human factors, visual communication and design thinking.</p>
                </div>
              </article>
            </div>
          </section>

          <section className={styles.section} id="skills" aria-labelledby="skills-title">
            <h2 id="skills-title">SKILLS</h2>
            <div className={styles.skillGroups}>{skills.map(([label, values]) => <div key={label}><h3>{label}</h3><p>{values}</p></div>)}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
