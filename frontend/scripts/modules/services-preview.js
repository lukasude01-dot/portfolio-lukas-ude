/**
 * SERVICES PREVIEW
 *
 * PURPOSE:
 * In the homepage SERVICES list, hovering (or focusing) a row
 * cross-fades the matching image on the right (desktop only).
 *
 * HTML:   /frontend/pages/index.html -> SERVICES SECTION
 *         Each row has data-service-image="0", "1", ... matching
 *         the order of the images in .services__preview.
 * STYLES: /frontend/styles/sections/services.css
 */

export function initServicesPreview() {
    const container = document.querySelector("[data-services]");
    if (!container) return;

    const images = container.querySelectorAll(".services__preview-image");
    const rows = container.querySelectorAll("[data-service-image]");

    const show = (index) => {
        images.forEach((image, imageIndex) => image.classList.toggle("is-active", imageIndex === index));
    };

    for (const row of rows) {
        const index = Number(row.dataset.serviceImage);
        row.addEventListener("pointerenter", () => show(index));
        row.addEventListener("focusin", () => show(index));
    }
}
