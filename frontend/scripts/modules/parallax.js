/**
 * PARALLAX
 *
 * PURPOSE:
 * Moves images slightly slower than the page while scrolling,
 * which creates a calm sense of depth.
 *
 * USAGE IN HTML:
 *   <div data-parallax="0.08"> ... </div>
 *   The number is the strength (0.05 = very subtle, 0.15 = strong).
 *
 * Disabled on touch devices, small screens and for visitors
 * who prefer reduced motion.
 *
 * SAFE TO EDIT: MIN_WIDTH.
 * DO NOT CHANGE WITHOUT TESTING: the requestAnimationFrame loop.
 */

import { prefersReducedMotion, hasFinePointer } from "./motion.js";

const MIN_WIDTH = 900;

export function initParallax() {
    const elements = [...document.querySelectorAll("[data-parallax]")];
    if (elements.length === 0) return;
    if (prefersReducedMotion() || !hasFinePointer() || window.innerWidth < MIN_WIDTH) return;

    let ticking = false;

    const update = () => {
        const viewportCenter = window.innerHeight / 2;
        for (const element of elements) {
            const rect = element.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
            const strength = Number.parseFloat(element.dataset.parallax) || 0.08;
            const offset = (rect.top + rect.height / 2 - viewportCenter) * strength * -1;
            element.style.setProperty("translate", `0 ${offset.toFixed(1)}px`);
        }
        ticking = false;
    };

    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    update();
}
