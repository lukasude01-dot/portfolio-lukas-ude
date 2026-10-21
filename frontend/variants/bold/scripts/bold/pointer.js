/**
 * POINTER EFFECTS  (bold variant, mouse only)
 *
 * PURPOSE:
 * - [data-tilt]:     card tilts in 3D towards the pointer and gets
 *                    --mx / --my for the light that follows it
 * - [data-magnetic]: button is pulled a little towards the pointer
 * - .cursor-dot:     a small dot follows the pointer and grows on links
 * - stage glow:      the background light drifts with the pointer
 *
 * Nothing happens on touch screens or with "reduce motion".
 */

export function initPointer() {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduced) return;

    // TILT + LIGHT
    for (const card of document.querySelectorAll("[data-tilt]")) {
        const strength = parseFloat(card.dataset.tilt || "6");
        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            card.classList.add("is-tilting");
            card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
            card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
            card.style.setProperty("--ry", `${((x - 0.5) * strength).toFixed(2)}deg`);
            card.style.setProperty("--rx", `${((0.5 - y) * strength).toFixed(2)}deg`);
        });
        card.addEventListener("pointerleave", () => {
            card.classList.remove("is-tilting");
            card.style.setProperty("--rx", "0deg");
            card.style.setProperty("--ry", "0deg");
        });
    }

    // LIGHT ONLY (glass cards without tilt)
    for (const card of document.querySelectorAll(".glass:not([data-tilt])")) {
        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mx", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
            card.style.setProperty("--my", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
        });
    }

    // MAGNETIC BUTTONS
    for (const button of document.querySelectorAll("[data-magnetic]")) {
        button.addEventListener("pointermove", (event) => {
            const rect = button.getBoundingClientRect();
            const x = event.clientX - rect.left - rect.width / 2;
            const y = event.clientY - rect.top - rect.height / 2;
            button.style.transform = `translate(${(x * 0.22).toFixed(1)}px, ${(y * 0.3).toFixed(1)}px)`;
        });
        button.addEventListener("pointerleave", () => {
            button.style.transition = "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
            button.style.transform = "";
            setTimeout(() => { button.style.transition = ""; }, 600);
        });
    }

    // CURSOR DOT + BACKGROUND GLOW
    const dot = document.querySelector("[data-cursor]");
    const root = document.documentElement;
    let x = -100;
    let y = -100;
    let targetX = -100;
    let targetY = -100;

    window.addEventListener("pointermove", (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        dot?.classList.add("is-active");
        const interactive = event.target.closest("a, button, [data-tilt], input, textarea, select, label");
        dot?.classList.toggle("is-hover", Boolean(interactive));
    }, { passive: true });
    document.addEventListener("mouseleave", () => dot?.classList.remove("is-active"));

    (function follow() {
        x += (targetX - x) * 0.2;
        y += (targetY - y) * 0.2;
        if (dot) {
            dot.style.setProperty("--cx", `${x.toFixed(1)}px`);
            dot.style.setProperty("--cy", `${y.toFixed(1)}px`);
        }
        root.style.setProperty("--glow-x", `${((x / window.innerWidth) * 100).toFixed(1)}%`);
        root.style.setProperty("--glow-y", `${((y / window.innerHeight) * 100).toFixed(1)}%`);
        requestAnimationFrame(follow);
    })();
}
