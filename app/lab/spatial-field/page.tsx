import type { Metadata } from "next";
import Link from "next/link";

import SpatialFieldExperience from "./SpatialFieldExperience";
import styles from "./spatial-field.module.css";

export const metadata: Metadata = {
  title: "Spatial Field Prototype — Cindy Kan",
  description: "An interactive study of artwork as a responsive spatial field.",
};

export default function SpatialFieldPage() {
  return (
    <main className={styles.page}>
      <SpatialFieldExperience />
      <header className={styles.header}>
        <Link href="/">CINDY KAN</Link>
        <p>INTERACTION STUDY / SPATIAL FIELD</p>
      </header>
      <div className={styles.caption}>
        <p>SPACE RESPONDS TO PRESENCE</p>
        <span>MOVE SLOWLY THROUGH THE FIELD</span>
      </div>
    </main>
  );
}
