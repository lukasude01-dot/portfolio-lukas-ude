/**
 * CURSOR LABEL
 *
 * PURPOSE:
 * Shows a small round label (e.g. "View") that follows the mouse
 * while it is over a project image.
 *
 * USAGE IN HTML:
 *   <a href="..." data-cursor-label="View"> ... </a>
 *
 * Only on devices with a mouse. Never on touch screens.
 * Purely decorative (aria-hidden) – the link text stays the
 * accessible name.
 *
 * STYLES: /frontend/styles/components/cursor-label.css
 * SAFE TO EDIT: EASING (0.1 = slow and smooth, 1 = instant).
 */

import { prefersReducedMotion, hasFinePointer } from "./motion.js";

const EASING = 0.18;

export function initCursorLabel() {
    const targets = document.querySelectorAll("[data-cursor-label]");
    if (targets.length === 0 || !hasFinePointer()) return;

    const label = document.createElement("div");
    label.className = "cursor-label";
    label.setAttribute("aria-hidden", "true");
    document.body.append(label);

    const position = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let animating = false;

    const animate = () => {
        const easing = prefersReducedMotion() ? 1 : EASING;
        position.x += (target.x - position.x) * easing;
        position.y += (target.y - position.y) * easing;
        label.style.setProperty("transform", `translate3d(${position.x}px, ${position.y}px, 0)`);

        if (Math.abs(target.x - position.x) > 0.3 || Math.abs(target.y - position.y) > 0.3) {
            requestAnimationFrame(animate);
        } else {
            animating = false;
        }
    };

    window.addEventListener("pointermove", (event) => {
        target.x = event.clientX;
        target.y = event.clientY;
        if (!animating) {
            animating = true;
            requestAnimationFrame(animate);
        }
    }, { passive: true });

    for (const element of targets) {
        element.addEventListener("pointerenter", (event) => {
            label.textContent = element.dataset.cursorLabel;
            position.x = target.x = event.clientX;
            position.y = target.y = event.clientY;
            label.classList.add("is-active");
        });
        element.addEventListener("pointerleave", () => label.classList.remove("is-active"));
    }
}
