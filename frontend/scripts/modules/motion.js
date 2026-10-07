/**
 * MOTION PREFERENCES  (helper used by other modules)
 *
 * PURPOSE:
 * Answers two questions so animations can be switched off
 * when they are not wanted:
 * - Does the visitor prefer reduced motion (system setting)?
 * - Is this a device with a real mouse (not touch)?
 */

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

export function prefersReducedMotion() {
    return reducedMotionQuery.matches;
}

export function hasFinePointer() {
    return finePointerQuery.matches;
}
