/**
 * DEVICE PREVIEW
 *
 * PURPOSE:
 * The live funnel demos are shown inside a desktop and a phone
 * frame. The demo page has its real size (e.g. 1440px wide);
 * this script calculates how much it must be scaled down to fit
 * the frame and stores it in the CSS variable --preview-scale.
 *
 * HTML:   /frontend/build/renderers/funnels.js -> devicePreview()
 *         <div data-device-screen data-device-width="1440"><iframe></div>
 * STYLES: /frontend/styles/components/device-preview.css
 *
 * DO NOT CHANGE WITHOUT TESTING.
 */

export function initDevicePreview() {
    const screens = document.querySelectorAll("[data-device-screen]");
    if (screens.length === 0) return;

    const updateScale = (screen) => {
        const deviceWidth = Number(screen.dataset.deviceWidth) || 1440;
        const scale = screen.clientWidth / deviceWidth;
        screen.style.setProperty("--preview-scale", scale.toFixed(4));
    };

    if ("ResizeObserver" in window) {
        const observer = new ResizeObserver((entries) => entries.forEach((entry) => updateScale(entry.target)));
        screens.forEach((screen) => observer.observe(screen));
    } else {
        screens.forEach(updateScale);
        window.addEventListener("resize", () => screens.forEach(updateScale));
    }
}
