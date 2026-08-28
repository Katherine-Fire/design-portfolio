import type { Metadata } from "next";

import VgpuFieldExperience from "./VgpuFieldExperience";
import styles from "./vgpu-field.module.css";

export const metadata: Metadata = {
  title: "VGPU Spatial Field — Cindy Kan",
  description: "An isolated WebGPU study of a pointer-responsive spatial field.",
};

export default function VgpuFieldLabPage() {
  return (
    <main className={styles.page}>
      <VgpuFieldExperience />
    </main>
  );
}
