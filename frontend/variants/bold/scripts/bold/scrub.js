/**
 * SCRUB TEXT  (words light up while scrolling, bold variant)
 *
 * PURPOSE:
 * <p data-scrub> inside a [data-scene]: the words start dim and turn
 * bright one after another as the scene scrolls past
 * (progress from scripts/bold/scenes.js). Screen readers get the
 * normal text. Without JS or with "reduce motion" the text is
 * simply fully visible.
 */

export function initScrub() {
    for (const text of document.querySelectorAll("[data-scrub]")) {
        const scene = text.closest("[data-scene]");
        if (!scene) continue;

        const words = text.textContent.trim().split(/\s+/);
        text.setAttribute("aria-label", words.join(" "));
        text.textContent = "";
        const spans = words.map((word) => {
            const span = document.createElement("span");
            span.className = "scrub-word";
            span.setAttribute("aria-hidden", "true");
            span.textContent = word;
            text.append(span, " ");
            return span;
        });
        text.classList.add("is-scrubbing");

        let lit = -1;
        scene.addEventListener("scene:progress", (event) => {
            // finish a little before the end of the scene
            const count = Math.round(Math.min(event.detail / 0.85, 1) * spans.length);
            if (count === lit) return;
            lit = count;
            spans.forEach((span, index) => span.classList.toggle("is-lit", index < count));
        });
    }
}
