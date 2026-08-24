import type { Metadata } from "next";
import ResumeContent from "./ResumeContent";

export const metadata: Metadata = {
  title: "Resume — Cindy Kan",
  description: "Product Designer focused on AI and digital experiences.",
};

export default function ResumePage() {
  return <ResumeContent />;
}
