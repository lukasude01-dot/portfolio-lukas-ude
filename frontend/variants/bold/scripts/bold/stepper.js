/**
 * STEPPER  (pinned step-by-step scene, bold variant)
 *
 * PURPOSE:
 * A [data-stepper] inside a [data-scene] shows one step at a time.
 * The scroll progress of the scene (scripts/bold/scenes.js) decides
 * which step is active. The round buttons in the rail jump to a step.
 *
 * HTML:
 *   <section data-scene data-stepper style="--steps: 6">
 *     <button data-step-button="0"> ... </button>
 *     <article data-step="0"> ... </article>
 *
 * Without JavaScript all steps are simply listed below each other.
 */

export function initStepper() {
    // pinned version only on larger screens and with motion allowed
    const pinned = window.matchMedia("(min-width: 900px) and (prefers-reduced-motion: no-preference)").matches;
    if (!pinned) return;

    for (const stepper of document.querySelectorAll("[data-stepper]")) {
        const panels = [...stepper.querySelectorAll("[data-step]")];
        const buttons = [...stepper.querySelectorAll("[data-step-button]")];
        const count = panels.length;
        if (!count) continue;
        stepper.classList.add("is-enhanced");

        let active = -1;
        const show = (index) => {
            if (index === active) return;
            active = index;
            stepper.dataset.active = String(index);
            panels.forEach((panel, i) => {
                panel.classList.toggle("is-active", i === index);
                panel.classList.toggle("is-done", i < index);
            });
            buttons.forEach((button, i) => {
                button.classList.toggle("is-active", i === index);
                button.classList.toggle("is-done", i < index);
                if (i === index) button.setAttribute("aria-current", "step");
                else button.removeAttribute("aria-current");
            });
        };

        stepper.addEventListener("scene:progress", (event) => {
            show(Math.min(count - 1, Math.floor(event.detail * count * 0.999)));
        });

        buttons.forEach((button, index) => {
            button.addEventListener("click", () => {
                const rect = stepper.getBoundingClientRect();
                const distance = rect.height - window.innerHeight;
                const top = window.scrollY + rect.top + distance * ((index + 0.5) / count);
                window.scrollTo({ top, behavior: "smooth" });
            });
        });

        show(0);
    }
}
