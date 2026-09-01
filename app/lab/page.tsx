import type { Metadata } from "next";
import Link from "next/link";

import styles from "./lab.module.css";
import { labs } from "./labs";

export const metadata: Metadata = {
  title: "Lab — Cindy Kan",
  description: "Experiments in motion, space and interaction by Cindy Kan.",
};

export default function LabIndexPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.navigation}>
          <Link className={styles.brand} href="/">
            CINDY KAN
          </Link>
          <Link className={styles.homeLink} href="/">
            RETURN HOME
          </Link>
        </header>

        <section className={styles.intro} aria-labelledby="lab-title">
          <h1 className={styles.title} id="lab-title">
            LAB
          </h1>
          <p className={styles.description}>Experiments in motion, space and interaction.</p>
        </section>

        <ol className={styles.list} aria-label="Lab experiments">
          {labs.map((lab) => (
            <li className={styles.entry} key={lab.href}>
              <Link className={styles.entryLink} href={lab.href}>
                <span className={styles.index}>{lab.index}</span>

                <span className={styles.identity}>
                  <span className={styles.entryTitle}>{lab.title}</span>
                  <span className={styles.tech}>
                    {lab.tech.map((item) => (
                      <span className={styles.techItem} key={item}>
                        {item}
                      </span>
                    ))}
                  </span>
                </span>

                <span className={styles.detail}>
                  <span className={styles.entryDescription}>{lab.description}</span>
                  <span className={styles.action}>
                    OPEN EXPERIMENT
                    <span className={styles.actionLine} aria-hidden="true" />
                  </span>
                </span>

                <span className={styles.status}>{lab.status}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
