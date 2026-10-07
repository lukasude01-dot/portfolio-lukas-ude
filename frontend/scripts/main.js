/**
 * MAIN SCRIPT  (starts all interactions)
 *
 * PURPOSE:
 * Loads every interaction module and starts the ones that the
 * current page needs. Each module looks for its own HTML
 * (e.g. data-contact-form) and does nothing if it is missing,
 * so the same script works on every page.
 *
 * WHICH MODULE DOES WHAT:
 *   navigation.js        header on scroll + mobile menu
 *   reveal.js            scroll-triggered fade/mask/line animations
 *   parallax.js          slow image depth on scroll
 *   cursor-label.js      round "View" label over project images
 *   services-preview.js  hover images in the homepage SERVICES list
 *   filters.js           category filters (Work, Creatives, Design)
 *   creative-views.js    CREATIVE / COPY / COMBINED switch
 *   device-preview.js    scales live funnel demos into device frames
 *   lightbox.js          full-screen image preview
 *   contact-form.js      contact form validation + sending
 *
 * Errors in one module are logged and never stop the others.
 */

import { initNavigation } from "./modules/navigation.js";
import { initReveal } from "./modules/reveal.js";
import { initParallax } from "./modules/parallax.js";
import { initCursorLabel } from "./modules/cursor-label.js";
import { initServicesPreview } from "./modules/services-preview.js";
import { initFilters } from "./modules/filters.js";
import { initCreativeViews } from "./modules/creative-views.js";
import { initDevicePreview } from "./modules/device-preview.js";
import { initLightbox } from "./modules/lightbox.js";
import { initContactForm } from "./modules/contact-form.js";

const modules = {
    navigation: initNavigation,
    reveal: initReveal,
    parallax: initParallax,
    "cursor-label": initCursorLabel,
    "services-preview": initServicesPreview,
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
        console.error(`[${name.toUpperCase()}] Failed to start. Module: scripts/modules/${name}.js`, error);
    }
}
