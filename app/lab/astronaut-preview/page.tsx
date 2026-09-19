import type { Metadata } from 'next';
import AstronautPreview from './AstronautPreview';

export const metadata: Metadata = {
  title: 'Astronaut GLB QA | Cindy Kan Lab',
  description: 'Isolated GLB inspection viewport for the Space Narrative experiment.',
};

export default function AstronautPreviewPage() {
  return <AstronautPreview />;
}
