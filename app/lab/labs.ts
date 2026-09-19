export type LabEntry = {
  index: string;
  title: string;
  href: `/lab/${string}`;
  tech: readonly string[];
  description: string;
  status: "ACTIVE";
};

export const labs: readonly LabEntry[] = [
  {
    index: "10",
    title: "ASTRA SPACE HERO",
    href: "/lab/astra-space-hero",
    tech: ["Three.js", "GLB", "Static Lookdev"],
    description: "Exported Blender scene, reconstructed lights and measured rendering performance.",
    status: "ACTIVE",
  },
  {
    index: "09",
    title: "SCROLL VIDEO HERO",
    href: "/lab/scroll-video-hero",
    tech: ["HTML Video", "Native Scroll", "Timeline Scrub"],
    description: "Scroll-position-controlled forward and reverse video timeline study.",
    status: "ACTIVE",
  },
  {
    index: "08",
    title: "ASTRONAUT PREVIEW",
    href: "/lab/astronaut-preview",
    tech: ["Three.js", "R3F", "GLB QA"],
    description: "Isolated geometry, material and silhouette inspection for the astronaut asset.",
    status: "ACTIVE",
  },
  {
    index: "07",
    title: "SPACE NARRATIVE",
    href: "/lab/space-narrative-test",
    tech: ["Three.js", "GSAP", "Pointer Timeline"],
    description: "Three.js + GSAP pointer-driven cinematic scene test.",
    status: "ACTIVE",
  },
  {
    index: "01",
    title: "HERO LENS",
    href: "/lab/hero-lens",
    tech: ["WebGPU", "WGSL", "Video Texture", "Invisible Lens"],
    description: "Invisible gravitational lens study using the portfolio hero video.",
    status: "ACTIVE",
  },
  {
    index: "02",
    title: "VGPU FIELD",
    href: "/lab/vgpu-field",
    tech: ["WebGPU", "WGSL", "vgpu"],
    description: "Pointer-driven spatial distortion and shader diagnostic study.",
    status: "ACTIVE",
  },
  {
    index: "03",
    title: "SPATIAL FIELD",
    href: "/lab/spatial-field",
    tech: ["WebGL", "R3F", "Vertex Displacement"],
    description: "Distance-driven displacement study using artwork as a responsive surface.",
    status: "ACTIVE",
  },
  {
    index: "04",
    title: "SPATIAL OBJECT",
    href: "/lab/spatial-object",
    tech: ["WebGL", "R3F", "Shader Material"],
    description: "Camera, material and orbital-form study for spatial observation.",
    status: "ACTIVE",
  },
  {
    index: "05",
    title: "BLACK HOLE",
    href: "/lab/black-hole",
    tech: ["WebGL", "R3F", "Hybrid Rendering"],
    description: "Cinematic artwork enhanced with a restrained real-time atmosphere layer.",
    status: "ACTIVE",
  },
  {
    index: "06",
    title: "VIDEO HERO TEST",
    href: "/lab/video-hero-test",
    tech: ["HTML Video", "Hero Composition", "Responsive"],
    description: "Original hero layout with alternate video background.",
    status: "ACTIVE",
  },
];
