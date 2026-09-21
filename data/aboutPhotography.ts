import { withBasePath } from "@/lib/sitePath";

export type AboutPhotographyItem = {
  id: string;
  type: "image" | "video";
  src: string | null;
  alt?: string;
  tone: "light" | "soft" | "mid" | "deep";
};

const aboutPhotographyData: AboutPhotographyItem[] = [
  {
    id: "03",
    type: "image",
    src: "/about-photography/carousel/03.webp",
    tone: "soft",
  },
  {
    id: "04",
    type: "image",
    src: "/about-photography/carousel/04.webp",

    tone: "light",
  },
  {
    id: "05",
    type: "image",
    src: "/about-photography/carousel/05.webp",

    tone: "mid",
  },
  {
    id: "06",
    type: "image",
    src: "/about-photography/carousel/06.webp",

    tone: "deep",
  },
  {
    id: "07",
    type: "image",
    src: "/about-photography/carousel/07.webp",

    tone: "deep",
  }, {
    id: "08",
    type: "image",
    src: "/about-photography/carousel/08.webp",

    tone: "deep",
  }, {
    id: "09",
    type: "image",
    src: "/about-photography/carousel/09.webp",

    tone: "deep",
  }, {
    id: "10",
    type: "image",
    src: "/about-photography/carousel/10.webp",

    tone: "deep",
  }, {
    id: "11",
    type: "image",
    src: "/about-photography/carousel/11.webp",

    tone: "deep",
  }, {
    id: "12",
    type: "image",
    src: "/about-photography/carousel/12.webp",

    tone: "deep",
  }, {
    id: "13",
    type: "image",
    src: "/about-photography/carousel/13.webp",

    tone: "deep",
  }, {
    id: "14",
    type: "image",
    src: "/about-photography/carousel/14.webp",

    tone: "deep",
  }, {
    id: "15",
    type: "image",
    src: "/about-photography/carousel/15.webp",

    tone: "deep",
  }, {
    id: "16",
    type: "image",
    src: "/about-photography/carousel/16.webp",

    tone: "deep",
  }, {
    id: "19",
    type: "image",
    src: "/about-photography/carousel/19.webp",

    tone: "deep",
  },
  {
    id: "20",
    type: "image",
    src: "/about-photography/carousel/20.webp",

    tone: "deep",
  },
  {
    id: "21",
    type: "image",
    src: "/about-photography/carousel/21.webp",

    tone: "deep",
  },
  {
    id: "22",
    type: "image",
    src: "/about-photography/carousel/22.webp",

    tone: "deep",
  },
];

export const aboutPhotography: AboutPhotographyItem[] = aboutPhotographyData.map((photo) => ({
  ...photo,
  src: photo.src ? withBasePath(photo.src) : null,
}));
