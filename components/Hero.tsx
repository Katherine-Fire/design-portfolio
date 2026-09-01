"use client";

import { useEffect, useState } from "react";

import HeroSpatialField from "./HeroSpatialField";

export default function Hero() {
    const [phase, setPhase] = useState<
        "enter" | "welcome" | "statement"
    >("enter");
    const [isBeyondHero, setIsBeyondHero] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const showWelcome = setTimeout(() => {
            setPhase("welcome");
        }, 100);

        const showStatement = setTimeout(() => {
            setPhase("statement");
        }, 1800);

        return () => {
            clearTimeout(showWelcome);
            clearTimeout(showStatement);
        };
    }, []);

    useEffect(() => {
        let frame = 0;

        const updateScrollState = () => {
            frame = 0;
            const heroHeight = document.getElementById("hero")?.offsetHeight ?? window.innerHeight;

            setIsBeyondHero(window.scrollY >= heroHeight - 64);
            setShowBackToTop(window.scrollY > 600);
        };

        const requestUpdate = () => {
            if (frame === 0) {
                frame = window.requestAnimationFrame(updateScrollState);
            }
        };

        updateScrollState();
        window.addEventListener("scroll", requestUpdate, { passive: true });
        window.addEventListener("resize", requestUpdate);

        return () => {
            window.removeEventListener("scroll", requestUpdate);
            window.removeEventListener("resize", requestUpdate);

            if (frame !== 0) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, []);

    const scrollToTop = () => {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion ? "auto" : "smooth",
        });
    };

    return (
        <>
            <header className={`hero-nav ${isBeyondHero ? "is-beyond-hero" : ""}`}>
                <div className="hero-nav-inner page-container">
                    <a className="hero-brand" href="#hero">
                        CINDY KAN
                    </a>

                    <nav className="hero-nav-links" aria-label="Primary navigation">
                        <a href="#work">WORK</a>
                        <a href="/lab">LAB</a>
                        <a href="#about">ABOUT</a>
                        <a href="/resume">RESUME</a>
                        <a href="#contact">CONTACT</a>
                    </nav>
                </div>
            </header>

            <section id="hero" className="hero">
                <div className="hero-visual" aria-hidden="true">
                    <HeroSpatialField />
                </div>

                <div className="hero-content page-container">
                    <div
                        className={`hero-phase hero-welcome ${phase === "welcome"
                            ? "is-visible"
                            : phase === "statement"
                                ? "is-exiting"
                                : "is-pending"
                            }`}
                        aria-hidden={phase !== "welcome"}
                    >
                        <p className="hero-cn">
                            欢迎来到
                        </p>

                        <h1 className="hero-title hero-focus-copy">
                            MY DIGITAL SPACE
                        </h1>
                    </div>

                    <div
                        className={`hero-phase hero-statement-wrap ${phase === "statement"
                            ? "is-visible"
                            : "is-pending"
                            }`}
                        aria-hidden={phase !== "statement"}
                    >
                        <p className="hero-statement hero-focus-copy">
                            设计产品
                            <br />
                            也探索数字世界的另一种可能
                        </p>

                        <p className="hero-meta">
                            PRODUCT · AI · INTERACTION
                        </p>
                    </div>
                </div>

                <a className="hero-scroll" href="#work">
                    <span>SCROLL TO EXPLORE</span>
                    <span className="hero-scroll-line" aria-hidden="true" />
                </a>
            </section>

            <button
                className={`back-to-top ${showBackToTop ? "is-visible" : ""}`}
                type="button"
                onClick={scrollToTop}
                aria-label="Back to top"
                aria-hidden={!showBackToTop}
                tabIndex={showBackToTop ? 0 : -1}
            >
                <span aria-hidden="true">↑</span>
                TOP
            </button>
        </>
    );
}
