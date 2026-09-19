import type { Metadata } from "next";

import VideoHeroTest from "./VideoHeroTest";

export const metadata: Metadata = {
  title: "Video Hero Test | Cindy Kan Lab",
  description: "Original hero layout with alternate video background.",
};

export default function VideoHeroTestPage() {
  return <VideoHeroTest />;
}
