import type { Metadata } from "next";
import Link from "next/link";

import SpatialObjectExperience from "./SpatialObjectExperience";
import styles from "./spatial-object.module.css";

export const metadata: Metadata = {
  title: "Spatial Object Study — Cindy Kan",
  description: "An isolated WebGL study of spatial observation and flowing digital material.",
};

export default function SpatialObjectLabPage() {
  return (
    <main className={styles.page}>
      <section className={styles.stage} aria-label="Interactive spatial object study">
        <SpatialObjectExperience />

        <header className={styles.header}>
          <Link href="/">CINDY KAN</Link>
          <p>WEBGL LAB / SPATIAL OBJECT</p>
        </header>

        <div className={styles.caption}>
          <p>FLOWING MATTER / OBSERVATION STUDY</p>
          <span>MOVE TO OBSERVE · SCROLL TO RETREAT</span>
        </div>
      </section>
    </main>
  );
}
