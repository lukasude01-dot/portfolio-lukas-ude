/**
 * GOAL SWITCH  ("Kunden | Mitarbeiter", bold variant)
 *
 * PURPOSE:
 * A two-way switch (accessible tabs) that shows either the panel
 * for customer acquisition or the one for recruiting. It also
 * changes the section's particle word (data-goal-shape) and asks
 * scripts/bold/particles.js to re-form it.
 *
 * Arrow keys move between the two tabs. Without JavaScript both
 * panels stay visible below each other.
 */

export function initGoalSwitch() {
    for (const section of document.querySelectorAll("[data-goal-switch]")) {
        const tabs = [...section.querySelectorAll("[data-goal]")];
        const panels = [...section.querySelectorAll("[data-goal-panel]")];
        if (tabs.length < 2) continue;
        section.classList.add("is-enhanced");

        const select = (tab, { focus = false } = {}) => {
            const goal = tab.dataset.goal;
            tabs.forEach((item) => {
                const active = item === tab;
                item.setAttribute("aria-selected", String(active));
                item.tabIndex = active ? 0 : -1;
            });
            panels.forEach((panel) => {
                panel.hidden = panel.dataset.goalPanel !== goal;
            });
            section.dataset.goalActive = goal;
            if (tab.dataset.goalShape) {
                section.dataset.shape = tab.dataset.goalShape;
                window.dispatchEvent(new CustomEvent("particles:refresh", { detail: section }));
            }
            if (focus) tab.focus();
        };

        tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => select(tab));
            tab.addEventListener("keydown", (event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                event.preventDefault();
                const next = tabs[(index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
                select(next, { focus: true });
            });
        });

        select(tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0]);
    }
}
