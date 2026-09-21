"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import { withBasePath } from "@/lib/sitePath";

const menuItems = [
  { label: "HOME", href: "#hero" },
  { label: "SELECTED WORK", href: "#work" },
  { label: "ABOUT", href: "#about" },
  { label: "RESUME", href: withBasePath("/resume") },
  { label: "CONTACT", href: "#contact" },
] as const;

type HeroMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function HeroMenu({ isOpen, onClose }: HeroMenuProps) {
  const reduceMotion = useReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="hero-full-menu"
          ref={overlayRef}
          className="hero-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          initial={{ clipPath: reduceMotion ? "circle(150% at 80px 40px)" : "circle(0% at 80px 40px)" }}
          animate={{ clipPath: "circle(150% at 80px 40px)" }}
          exit={{ clipPath: reduceMotion ? "circle(150% at 80px 40px)" : "circle(0% at 80px 40px)" }}
          transition={{ duration: reduceMotion ? 0.01 : 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <header className="hero-menu-header page-container">
            <button
              ref={closeButtonRef}
              className="hero-menu-control hero-menu-close"
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <span>CLOSE</span>
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="M3 3L13 13M13 3L3 13" />
              </svg>
            </button>

            <a className="hero-menu-brand" href="#hero" onClick={onClose}>
              CINDY KAN
            </a>

            <ThemeToggle variant="menu" />
          </header>

          <nav className="hero-menu-navigation page-container" aria-label="Full-screen navigation">
            {menuItems.map((item, index) => (
              <motion.a
                className="hero-menu-link"
                href={item.href}
                key={item.href}
                onClick={onClose}
                initial={{ opacity: 0, x: reduceMotion ? 0 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: reduceMotion ? 0.01 : 0.55,
                  delay: reduceMotion ? 0 : 0.15 + index * 0.08,
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                <span>{item.label}</span>
                <svg aria-hidden="true" viewBox="0 0 32 32">
                  <path d="M5 16H27M19 8L27 16L19 24" />
                </svg>
              </motion.a>
            ))}
          </nav>

          <footer className="hero-menu-footer page-container">
            <span>PRODUCT · AI · INTERACTION</span>
            <span>PORTFOLIO / 2026</span>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
