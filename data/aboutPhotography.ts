export type AboutPhotographyItem = {
  id: string;
  type: "image" | "video";
  src: string | null;
  alt?: string;
  tone: "light" | "soft" | "mid" | "deep";
};

export const aboutPhotography: AboutPhotographyItem[] = [
  {
    id: "03",
    type: "image",
    src: "/about-photography/03.jpg",
    tone: "soft",
  },
  {
    id: "04",
    type: "image",
    src: "/about-photography/04.jpg",

    tone: "light",
  },
  {
    id: "05",
    type: "image",
    src: "/about-photography/05.jpg",

    tone: "mid",
  },
  {
    id: "06",
    type: "image",
    src: "/about-photography/06.jpg",

    tone: "deep",
  },
  {
    id: "07",
    type: "image",
    src: "/about-photography/07.jpg",

    tone: "deep",
  }, {
    id: "08",
    type: "image",
    src: "/about-photography/08.jpg",

    tone: "deep",
  }, {
    id: "09",
    type: "image",
    src: "/about-photography/09.jpg",

    tone: "deep",
  }, {
    id: "10",
    type: "image",
    src: "/about-photography/10.jpg",

    tone: "deep",
  }, {
    id: "11",
    type: "image",
    src: "/about-photography/11.jpg",

    tone: "deep",
  }, {
    id: "12",
    type: "image",
    src: "/about-photography/12.jpg",

    tone: "deep",
  }, {
    id: "13",
    type: "image",
    src: "/about-photography/13.jpg",

    tone: "deep",
  }, {
    id: "14",
    type: "image",
    src: "/about-photography/14.jpg",

    tone: "deep",
  }, {
    id: "15",
    type: "image",
    src: "/about-photography/15.jpg",

    tone: "deep",
  }, {
    id: "16",
    type: "image",
    src: "/about-photography/16.jpg",

    tone: "deep",
  }, {
    id: "19",
    type: "image",
    src: "/about-photography/19.jpg",

    tone: "deep",
  },
  {
    id: "20",
    type: "image",
    src: "/about-photography/20.jpg",

    tone: "deep",
  },
  {
    id: "21",
    type: "image",
    src: "/about-photography/21.jpg",

    tone: "deep",
  },
  {
    id: "22",
    type: "image",
    src: "/about-photography/22.jpg",

    tone: "deep",
  },
];
