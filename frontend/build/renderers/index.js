/**
 * RENDERER LIST
 *
 * PURPOSE:
 * Collects all renderers so templates can use them via
 *   <!-- @render name -->
 *
 * Which file contains which renderer:
 *   site.js       navigation, footer, legal links, contact details
 *   work.js       project cards, featured work, /work/ grid
 *   funnels.js    /funnels/ list + funnel case parts
 *   creatives.js  /creatives/ grid, ad mockups, creative case parts
 *   design.js     /design/ grid + design case gallery
 *   ai.js         /ai/ workflow blueprints
 *   career.js     /about/ timeline, certificates, skills
 *   project.js    parts shared by every project page (next project)
 */

import { siteRenderers } from "./site.js";
import { workRenderers } from "./work.js";
import { funnelRenderers } from "./funnels.js";
import { creativeRenderers } from "./creatives.js";
import { designRenderers } from "./design.js";
import { aiRenderers } from "./ai.js";
import { careerRenderers } from "./career.js";
import { projectRenderers } from "./project.js";

export const renderers = {
    ...siteRenderers,
    ...workRenderers,
    ...funnelRenderers,
    ...creativeRenderers,
    ...designRenderers,
    ...aiRenderers,
    ...careerRenderers,
    ...projectRenderers
};
