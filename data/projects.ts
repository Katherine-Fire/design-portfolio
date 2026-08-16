export type Project = {
    slug: string;
    title: string;
    subtitle: string;
    year: string;
    role: string;
    tags: string[];
    cover: string;
    images: string[];
    description: string;
    platform: string;
};

export const projects: Project[] = [
    {
        slug: "ai-communication",
        title: "AI Communication Experience",
        subtitle: "AI-assisted communication flow for collaborative work.",
        description: "Exploring how AI assistance can improve communication efficiency inside an existing workflow.",
        year: "2024",
        role: "Product Designer",
        platform: "Web Product",
        tags: ["AI", "Product Design", "Interaction"],
        cover: "/projects/ai-communication/cover.webp",
        images: [
            "/projects/ai-communication/cover.webp",
            "/projects/ai-communication/AI-project-01.png", ,],
    },

    {
        slug: "live-homepage",
        title: "Live Homepage Redesign",
        subtitle: "A redesign exploration for a live streaming product.",
        description: "Improving content discovery and the browsing experience of a live streaming homepage.",
        year: "2024",
        role: "Product Designer",
        platform: "Mobile App",
        tags: ["Product Design", "Live Streaming", "UX"],
        cover: "/projects/ai-communication/cover.webp",
        images: [
            "/projects/ai-communication/AI-project-01.png", ,],
    },
];