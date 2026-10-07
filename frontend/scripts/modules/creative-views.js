/**
 * CREATIVE VIEWS  (CREATIVE / COPY / COMBINED)
 *
 * PURPOSE:
 * Switches how the cards on /creatives/ are shown:
 *   creative  -> only the visual
 *   copy      -> only the text (hook, primary text, headline, CTA)
 *   combined  -> the full ad mockup
 *
 * HOW IT WORKS:
 * Sets data-view="creative|copy|combined" on the grid.
 * The CSS in /frontend/styles/pages/creatives.css shows the
 * matching part of each card. The choice is remembered for
 * the visit (sessionStorage) – nothing is sent anywhere.
 */

const STORAGE_KEY = "creative-view";

export function initCreativeViews() {
    const switcher = document.querySelector("[data-view-switch]");
    if (!switcher) return;

    const grid = document.getElementById(switcher.dataset.viewTarget);
    const buttons = [...switcher.querySelectorAll("[data-view]")];
    if (!grid) return;

    const setView = (view) => {
        grid.dataset.view = view;
        buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === view)));
        try {
            sessionStorage.setItem(STORAGE_KEY, view);
        } catch {
            /* storage can be blocked (private mode) - the switch still works */
        }
    };

    buttons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));

    try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved && buttons.some((button) => button.dataset.view === saved)) setView(saved);
    } catch {
        /* ignore */
    }
}
