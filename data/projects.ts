export type Project = {
    slug: string;
    title: string;
    subtitle: string;
    year: string;
    role: string;
    tags: string[];
    cover: string;
    description: string;
    platform: string;
    content: ProjectContent[];
};
export type ProjectContent =
    | {
        type: "image";
        src: string;
    }
    | {
        type: "video";
        src: string;
    };

export const projects: Project[] = [
    {//project A 通讯流
        slug: "ai-communication",
        title: "AI Communication Experience",
        subtitle: "AI-assisted communication flow for collaborative work.",
        description: "Exploring how AI assistance can improve communication efficiency inside an existing workflow.",
        year: "2024",
        role: "Product Designer",
        platform: "Web Product",
        tags: ["AI", "Product Design", "Interaction"],
        cover: "/projects/ai-communication/cover.webp",
        content: [
            {
                type: "image",
                src: "/projects/ai-communication/AI-project-01.png",
            },
            {
                type: "image",
                src: "/projects/ai-communication/AI-project-02.png",
            },
            {
                type: "image",
                src: "/projects/ai-communication/AI-project-03.png",
            },
            {
                type: "image",
                src: "/projects/ai-communication/AI-project-04.png",
            },
            {
                type: "image",
                src: "/projects/ai-communication/AI-project-05.png",
            },
        ],

    },

    {//project B 直播
        slug: "live-room-redesign",
        title: "Live Room Redesign",
        subtitle: "Redesigning the live room experience for clearer content presentation and more efficient interaction.",
        description:
            "A redesign of the core live room framework, focused on improving information hierarchy, content visibility, and the overall viewing experience.",
        year: "2021–2023",
        role: "UI Designer",
        platform: "iOS / Android",
        tags: ["Live Streaming", "UI Design", "Interaction"],
        cover: "/projects/live-room-redesign/Live-Room-Redesign-01.png",
        content: [
            { type: "image", src: "/projects/live-room-redesign/Live-Room-Redesign-01.png" },
        ],
    },
    {//Project C 直播PK优化
        slug: "live-pk-optimization",
        title: "Live PK Experience Optimization",
        subtitle:
            "Enhancing the PK experience through stronger immersion, competition, and game-like interaction.",
        description:
            "An optimization of the live PK experience focused on improving visual immersion, competitive atmosphere, and the overall sense of play.",
        year: "2021–2023",
        role: "UI Designer",
        platform: "iOS / Android",
        tags: ["Live Streaming", "UI Design", "Gamification"],
        cover:
            "/projects/live-pk-optimization/Live-PK-Optimization-01.png",
        content: [
            {
                type: "image",
                src:
                    "/projects/live-pk-optimization/Live-PK-Optimization-01.png",
            },
        ],
    },
    {//Project D 去中心化交易所
        slug: "decentralized-exchange",
        title: "Decentralized Exchange",
        subtitle:
            "Designing a decentralized trading experience across Web and mobile.",
        description:
            "A UI design project for a decentralized exchange, covering core trading experiences across Web and mobile platforms.",
        year: "2018–2020",
        role: "UI Designer",
        platform: "Web / App",
        tags: ["Web3", "Trading", "UI Design"],
        cover: "/projects/decentralized-exchange/Dextop.png",
        content: [
            {
                type: "image",
                src: "/projects/decentralized-exchange/Dextop.png",
            },
        ],
    },
    {//Project E 活动运营
        slug: "campaign-operations",
        title: "Campaign & Operations Design",
        subtitle:
            "A collection of interactive campaigns and visual experiences for user engagement.",
        description:
            "A selection of campaign and operations design work across interactive H5 experiences, engagement activities, and supporting visual assets.",
        year: "2019–2023",
        role: "UI Designer",
        platform: "H5",
        tags: ["Campaign Design", "UI Design", "Visual Design"],
        cover:
            "/projects/campaign-operations/Campaign-Operations-01.png",
        content: [
            {
                type: "image",
                src:
                    "/projects/campaign-operations/Campaign-Operations-01.png",
            },
        ],
    },
];
