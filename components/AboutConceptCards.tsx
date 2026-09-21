import Image from "next/image";
import { withBasePath } from "@/lib/sitePath";

const profileCards = [
  {
    number: "01",
    label: "WORK",
    title: "想清楚，再动手",
    detail: "体验 · 结构 · 细节",
    modifier: "work",
    visual: withBasePath("/about-cards/work.png"),
  },
  {
    number: "02",
    label: "FOCUS",
    title: "人与 AI，如何更自然地互动",
    detail: "探索 · 交互 · 数字体验",
    modifier: "focus",
    visual: withBasePath("/about-cards/focus.png"),
  },
  {
    number: "03",
    label: "BEYOND",
    title: "对世界保持好奇",
    detail: "科幻 · 旅行 · 阅读",
    modifier: "beyond",
    visual: withBasePath("/about-cards/beyond.png"),
  },
  {
    number: "04",
    label: "PRACTICE",
    title: "让想法真正发生",
    detail: "设计 · 构建 · 学习",
    modifier: "practice",
    visual: withBasePath("/about-cards/practice.png"),
  },
];

// Previous About visual version. Keep this component for one-switch rollback.
export default function AboutConceptCards() {
  return (
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
  );
}
