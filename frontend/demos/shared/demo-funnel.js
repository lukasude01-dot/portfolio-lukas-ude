/**
 * DEMO FUNNEL ENGINE  (multi-step forms in the live demos)
 *
 * PURPOSE:
 * Turns a form with several steps into a step-by-step funnel:
 * - one question per step, progress bar, back button
 * - choosing an option moves on automatically
 * - simple validation of the contact step
 * - final screen, optionally personalised with data-show-if
 *
 * IMPORTANT: THIS IS A DEMO.
 * Nothing is sent anywhere. There is no fetch() and no form
 * action – the data stays in the browser and is discarded.
 * To connect a real funnel later, replace finish() with a call
 * to a backend endpoint (see /docs/CONTENT-GUIDE.md -> Funnels).
 *
 * HTML STRUCTURE:
 *   <form data-demo-funnel>
 *     <div data-progress-label></div> <div class="demo-form__bar"><span data-progress-bar></span></div>
 *     <fieldset class="demo-step" data-step> ... radio options ... </fieldset>
 *     <fieldset class="demo-step" data-step data-step-contact> ... inputs ... </fieldset>
 *     <div class="demo-done" data-done hidden>
 *        <p data-show-if="goal=design">Only shown if the answer "goal" was "design"</p>
 *     </div>
 *   </form>
 *
 * Also handles the sticky mobile CTA (data-sticky-cta).
 */

const AUTO_ADVANCE_MS = 280;

function initFunnel(form) {
    const steps = [...form.querySelectorAll("[data-step]")];
    const done = form.querySelector("[data-done]");
    const progressBar = form.querySelector("[data-progress-bar]");
    const progressLabel = form.querySelector("[data-progress-label]");
    const progressArea = form.querySelector("[data-progress]");
    const backButton = form.querySelector("[data-back]");
    const nextButton = form.querySelector("[data-next]");
    const nav = form.querySelector("[data-nav]");
    const error = form.querySelector("[data-error]");
    let current = 0;

    const show = (index, { focus = true } = {}) => {
        current = index;
        steps.forEach((step, stepIndex) => step.classList.toggle("is-active", stepIndex === index));
        const percent = Math.round(((index + 1) / steps.length) * 100);
        progressBar?.parentElement.style.setProperty("--progress", `${percent}%`);
        if (progressLabel) progressLabel.textContent = `Schritt ${index + 1} von ${steps.length}`;
        backButton.hidden = index === 0;
        nextButton.textContent = index === steps.length - 1 ? nextButton.dataset.finalLabel : nextButton.dataset.label;
        error.textContent = "";
        if (focus) steps[index].querySelector("legend, h3")?.focus?.();
    };

    const stepIsValid = (step) => {
        if (!step.hasAttribute("data-step-contact")) {
            const options = step.querySelectorAll('input[type="radio"]');
            if (options.length && ![...options].some((input) => input.checked)) {
                error.textContent = "Bitte wähle eine Antwort.";
                return false;
            }
            return true;
        }
        let valid = true;
        for (const input of step.querySelectorAll("input[required]")) {
            const ok = input.type === "checkbox" ? input.checked : input.checkValidity() && input.value.trim() !== "";
            input.setAttribute("aria-invalid", String(!ok));
            if (!ok) valid = false;
        }
        if (!valid) error.textContent = "Bitte fülle die markierten Felder aus.";
        return valid;
    };

    const finish = () => {
        // DEMO: read the answers only to personalise the final screen.
        const answers = Object.fromEntries(new FormData(form));
        done.querySelectorAll("[data-show-if]").forEach((element) => {
            const [name, value] = element.dataset.showIf.split("=");
            element.hidden = answers[name] !== value;
        });
        done.querySelectorAll("[data-answer]").forEach((element) => {
            element.textContent = answers[element.dataset.answer] || "";
        });

        steps.forEach((step) => step.classList.remove("is-active"));
        nav.hidden = true;
        if (progressArea) progressArea.hidden = true;
        done.hidden = false;
        done.classList.add("is-active");
        done.querySelector("h3")?.focus();
        form.reset(); // the demo keeps nothing
    };

    const next = () => {
        if (!stepIsValid(steps[current])) return;
        current < steps.length - 1 ? show(current + 1) : finish();
    };

    nextButton.addEventListener("click", next);
    backButton.addEventListener("click", () => show(Math.max(0, current - 1)));
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        next();
    });

    // Picking an option moves to the next step automatically.
    form.addEventListener("change", (event) => {
        if (event.target.type === "radio" && !steps[current].hasAttribute("data-step-contact")) {
            error.textContent = "";
            setTimeout(next, AUTO_ADVANCE_MS);
        }
    });

    form.querySelector("[data-restart]")?.addEventListener("click", () => {
        done.hidden = true;
        nav.hidden = false;
        if (progressArea) progressArea.hidden = false;
        show(0);
    });

    show(0, { focus: false });
}

function initStickyCta() {
    const sticky = document.querySelector("[data-sticky-cta]");
    const hero = document.querySelector("[data-hero]");
    const formSection = document.querySelector("[data-form-section]");
    if (!sticky || !hero || !("IntersectionObserver" in window)) return;

    let heroVisible = true;
    let formVisible = false;
    const update = () => sticky.classList.toggle("is-visible", !heroVisible && !formVisible);

    new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; update(); }).observe(hero);
    if (formSection) new IntersectionObserver(([entry]) => { formVisible = entry.isIntersecting; update(); }).observe(formSection);
}

document.querySelectorAll("[data-demo-funnel]").forEach(initFunnel);
initStickyCta();
