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
];
