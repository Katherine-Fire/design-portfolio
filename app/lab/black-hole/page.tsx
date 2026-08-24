import type { Metadata } from "next";
import Link from "next/link";

import HybridBlackHoleExperience from "./HybridBlackHoleExperience";
import styles from "./black-hole.module.css";

export const metadata: Metadata = {
  title: "Black Hole WebGL Prototype — Cindy Kan",
  description: "An isolated real-time black hole interaction study.",
};

export default function BlackHoleLabPage() {
  return (
    <main className={styles.page}>
      <div className={styles.stage}>
        <HybridBlackHoleExperience />
        <div className={styles.header}>
          <Link href="/">CINDY KAN</Link>
          <p>WEBGL PROTOTYPE / BLACK HOLE</p>
        </div>
        <div className={styles.caption}>
          <p>REAL-TIME GRAVITATIONAL FIELD STUDY</p>
          <span>MOVE TO DISTURB · SCROLL TO RETREAT</span>
        </div>
      </div>
    </main>
  );
}
