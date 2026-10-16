/**
 * RENDERER LIST
 *
 * PURPOSE:
 * Collects all renderers so templates can use them via
 *   <!-- @render name -->
 *
 * Which file contains which renderer:
 *   site.js       navigation, footer, legal links, contact details
 *   work.js       project cards, featured work grid
 *   funnels.js    /portfolio/funnels/ list + funnel case parts
 *   creatives.js  /portfolio/creatives/ grid, ad mockups, case parts
 *   ai.js         /portfolio/ki/ workflow blueprints
 *   career.js     /about/ timeline, certificates, skills
 *   project.js    parts shared by every project page (next project)
 *   portfolio.js  /portfolio/ grid + portfolio project pages
 *   services.js   /leistungen/ package cards
 *   news.js       /news/ article list, homepage news teaser
 */

import { siteRenderers } from "./site.js";
import { workRenderers } from "./work.js";
import { funnelRenderers } from "./funnels.js";
import { creativeRenderers } from "./creatives.js";
import { aiRenderers } from "./ai.js";
import { careerRenderers } from "./career.js";
import { projectRenderers } from "./project.js";
import { portfolioRenderers } from "./portfolio.js";
import { servicesRenderers } from "./services.js";
import { newsRenderers } from "./news.js";

export const renderers = {
    ...siteRenderers,
    ...workRenderers,
    ...funnelRenderers,
    ...creativeRenderers,
    ...aiRenderers,
    ...careerRenderers,
    ...projectRenderers,
    ...portfolioRenderers,
    ...servicesRenderers,
    ...newsRenderers
};
