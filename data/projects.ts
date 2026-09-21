import { withBasePath } from "@/lib/sitePath";

export type Project = {
    slug: string;
    titleZh: string;
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

const projectData: Project[] = [
    {//project A 通讯流
        slug: "ai-communication",
        titleZh: "AI 助手体验升级",
        title: "AI ASSISTANT EXPERIENCE REDESIGN",
        subtitle: "AI-assisted communication flow for collaborative work.",
        description: "Exploring how AI assistance can improve communication efficiency inside an existing workflow.",
        year: "2024—2025",
        role: "Product Designer",
        platform: "Web Product",
        tags: ["AI", "Product Design", "Interaction"],
        cover: "/projects/ai-communication/Cover-v12.png",
        content: [
            {
                type: "image",
                src: "/projects/ai-communication/AI-project-01-v2.png",
            },
            {
                type: "image",
                src: "/projects/ai-communication/AI-project-02-v2.png",
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
        titleZh: "Blued 直播间设计改版",
        title: "BLUED LIVE EXPERIENCE REDESIGN",
        subtitle: "Redesigning the live room experience for clearer content presentation and more efficient interaction.",
        description:
            "A redesign of the core live room framework, focused on improving information hierarchy, content visibility, and the overall viewing experience.",
        year: "2021—2023",
        role: "UI Designer",
        platform: "iOS / Android",
        tags: ["Live Streaming", "UI Design", "Interaction"],
        cover: "/projects/live-room-redesign/Cover-v3.png",
        content: [
            { type: "image", src: "/projects/live-room-redesign/Live-Room-Redesign-02.jpg" },
        ],
    },

    {//Project C 直播PK优化
        slug: "live-pk-optimization",
        titleZh: "直播 PK 体验优化",
        title: "LIVE PK EXPERIENCE REDESIGN",
        subtitle:
            "Enhancing the PK experience through stronger immersion, competition, and game-like interaction.",
        description:
            "An optimization of the live PK experience focused on improving visual immersion, competitive atmosphere, and the overall sense of play.",
        year: "2021—2023",
        role: "UI Designer",
        platform: "iOS / Android",
        tags: ["Live Streaming", "UI Design", "Gamification"],
        cover: "/projects/live-pk-optimization/Cover-v32.png",
        content: [
            {
                type: "image",
                src:
                    "/projects/live-pk-optimization/Live-PK-Optimization-02.jpg",
            },
        ],
    },
    {//Project D Coinpark 设计改版
        slug: "coinpark-redesign",
        titleZh: "Coinpark 设计改版",
        title: "COINPARK REDESIGN",
        subtitle: "项目内容整理中。",
        description: "Coinpark 设计改版，项目封面与案例内容待补充。",
        year: "2018-2020",
        role: "UI Designer",
        platform: "Web / App",
        tags: ["UI Design"],
        cover: "/projects/coinpark-redesign/coinpark-cover.png",
        content: [
            {
                type: "image",
                src: "/projects/coinpark-redesign/coinpark-1-3.jpg",
            },
        ],
    },
    {//Project E 去中心化交易所
        slug: "decentralized-exchange",
        titleZh: "去中心化交易所",
        title: "DECENTRALIZED EXCHANGE",
        subtitle:
            "Designing a decentralized trading experience across Web and mobile.",
        description:
            "A UI design project for a decentralized exchange, covering core trading experiences across Web and mobile platforms.",
        year: "2018—2020",
        role: "UI Designer",
        platform: "Web / App",
        tags: ["Web3", "Trading", "UI Design"],
        cover: "/projects/decentralized-exchange/Cover-v42.png",
        content: [
            {
                type: "image",
                src: "/projects/decentralized-exchange/d1.webp",
            },
            {
                type: "image",
                src: "/projects/decentralized-exchange/d2.png",
            },
            {
                type: "image",
                src: "/projects/decentralized-exchange/d3.jpg",
            },
            {
                type: "image",
                src: "/projects/decentralized-exchange/d4.jpg",
            },
        ],
    },
    {//Project F 活动运营
        slug: "campaign-operations",
        titleZh: "运营活动设计",
        title: "CAMPAIGN & OPERATIONS DESIGN",
        subtitle:
            "A collection of interactive campaigns and visual experiences for user engagement.",
        description:
            "A selection of campaign and operations design work across interactive H5 experiences, engagement activities, and supporting visual assets.",
        year: "2019—2023",
        role: "UI Designer",
        platform: "H5",
        tags: ["Campaign Design", "UI Design", "Visual Design"],
        cover: "/projects/campaign-operations/Cover-v52.png",
        content: [
            {
                type: "image",
                src:
                    "/projects/campaign-operations/Campaign-Operations-02.jpg",
            },
        ],
    },
];

export const projects: Project[] = projectData.map((project) => ({
    ...project,
    cover: withBasePath(project.cover),
    content: project.content.map((item) => ({
        ...item,
        src: withBasePath(item.src),
    })),
}));
