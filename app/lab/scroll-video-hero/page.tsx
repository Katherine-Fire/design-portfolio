import type { Metadata } from 'next';

import ScrollVideoHeroExperience from './ScrollVideoHeroExperience';

export const metadata: Metadata = {
  title: 'Scroll Video Hero | Cindy Kan Lab',
  description: 'Native scroll-driven video timeline experiment.',
};

export default function ScrollVideoHeroPage() {
  return <ScrollVideoHeroExperience />;
}
