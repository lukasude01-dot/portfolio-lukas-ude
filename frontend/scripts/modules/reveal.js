/**
 * REVEAL ANIMATIONS
 *
 * PURPOSE:
 * Adds the class "is-revealed" to every element with
 * data-reveal when it scrolls into view. The CSS in
 * /frontend/styles/base/motion.css does the actual animation
 * (fade + move up, image mask, line drawing).
 *
 * WHAT IT CHANGES:
 * Only the class "is-revealed". Each element animates once.
 *
 * SAFE TO EDIT: ROOT_MARGIN / THRESHOLD (how early elements appear).
 * DO NOT CHANGE WITHOUT TESTING: the IntersectionObserver logic.
 */

import { prefersReducedMotion } from "./motion.js";

const ROOT_MARGIN = "0px 0px -8% 0px";
const THRESHOLD = 0.12;

export function initReveal() {
    const elements = document.querySelectorAll("[data-reveal]");
    if (elements.length === 0) return;

    // No animation wanted (or very old browser): show everything immediately.
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
        elements.forEach((element) => element.classList.add("is-revealed"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
        }
    }, { rootMargin: ROOT_MARGIN, threshold: THRESHOLD });

    elements.forEach((element) => observer.observe(element));
}
