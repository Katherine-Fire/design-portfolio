"use client";

import { useEffect } from "react";

export const PROJECT_RETURN_CONTEXT_KEY = "portfolio-return-context";
export const PROJECT_SCROLL_POSITION_KEY = "portfolio-home-scroll-y";

export default function ProjectVisitContext() {
  useEffect(() => {
    sessionStorage.setItem(PROJECT_RETURN_CONTEXT_KEY, "project");
  }, []);

  return null;
}
