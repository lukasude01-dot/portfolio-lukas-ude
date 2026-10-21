/**
 * MAIN SCRIPT  (design variant "bold")
 *
 * PURPOSE:
 * Starts every interactive module. The shared modules come from
 * /frontend/scripts/modules, the bold ones from ./bold/.
 * If one module fails, the others keep working.
 */

import { initNavigation } from "./modules/navigation.js";
import { initReveal } from "./modules/reveal.js";
import { initFilters } from "./modules/filters.js";
import { initCreativeViews } from "./modules/creative-views.js";
import { initDevicePreview } from "./modules/device-preview.js";
import { initLightbox } from "./modules/lightbox.js";
import { initContactForm } from "./modules/contact-form.js";
import { initSplit } from "./bold/split.js";
import { initScenes } from "./bold/scenes.js";
import { initPointer } from "./bold/pointer.js";
import { initParticles } from "./bold/particles.js";
import { initStepper } from "./bold/stepper.js";
import { initScrub } from "./bold/scrub.js";

const modules = {
    split: initSplit,          // must run before reveal (it adds data-reveal)
    navigation: initNavigation,
    reveal: initReveal,
    scrub: initScrub,          // must run before scenes (listens to their progress)
    scenes: initScenes,
    stepper: initStepper,
    pointer: initPointer,
    particles: initParticles,
    filters: initFilters,
    "creative-views": initCreativeViews,
    "device-preview": initDevicePreview,
    lightbox: initLightbox,
    "contact-form": initContactForm
};

for (const [name, init] of Object.entries(modules)) {
    try {
        init();
    } catch (error) {
        console.error(`[${name.toUpperCase()}] Failed to start. Module: scripts/bold/${name}.js`, error);
    }
}
