import type { Metadata } from "next";

import HeroLensExperience from "./HeroLensExperience";
import styles from "./hero-lens.module.css";

export const metadata: Metadata = {
  title: "Hero Invisible Lens — Cindy Kan",
  description: "An isolated WebGPU study applying an invisible gravitational lens to the portfolio hero.",
};

export default function HeroLensLabPage() {
  return (
    <main className={styles.page}>
      <HeroLensExperience />
    </main>
  );
}
