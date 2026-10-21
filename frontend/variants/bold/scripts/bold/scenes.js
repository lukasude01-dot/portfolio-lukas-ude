/**
 * SCROLL SCENES  (bold variant)
 *
 * PURPOSE:
 * 1. [data-scene]: a tall section with a sticky inner part.
 *    While it scrolls past, its CSS variable --p goes from 0 to 1
 *    and the event "scene:progress" is sent (detail = progress).
 *    CSS and other scripts use it for pinned animations.
 * 2. Sets --scroll-y and --scroll-skew on <html> (grid parallax and
 *    the marquee that leans with the scroll speed).
 * 3. [data-parallax-y="0.2"]: moves an element slower or faster.
 *
 * With "reduce motion" scenes are set to their end state (--p: 1).
 */

export function initScenes() {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scenes = [...document.querySelectorAll("[data-scene]")];
    const parallax = [...document.querySelectorAll("[data-parallax-y]")];

    if (reduced) {
        for (const scene of scenes) {
            scene.style.setProperty("--p", "1");
            scene.dispatchEvent(new CustomEvent("scene:progress", { detail: 1 }));
        }
        return;
    }

    let lastY = window.scrollY;
    let skew = 0;
    let ticking = false;

    function update() {
        ticking = false;
        const y = window.scrollY;
        const viewport = window.innerHeight;

        // scroll speed -> lean (eases back to 0)
        const velocity = y - lastY;
        lastY = y;
        skew += (Math.max(-6, Math.min(6, velocity * 0.12)) - skew) * 0.2;
        root.style.setProperty("--scroll-y", y.toFixed(0));
        root.style.setProperty("--scroll-skew", skew.toFixed(3));

        for (const scene of scenes) {
            const rect = scene.getBoundingClientRect();
            const distance = rect.height - viewport;
            const progress = distance > 0 ? Math.min(Math.max(-rect.top / distance, 0), 1) : (rect.top < viewport ? 1 : 0);
            if (scene._progress !== progress) {
                scene._progress = progress;
                scene.style.setProperty("--p", progress.toFixed(4));
                scene.dispatchEvent(new CustomEvent("scene:progress", { detail: progress }));
            }
        }

        for (const element of parallax) {
            const rect = element.getBoundingClientRect();
            const offset = (rect.top + rect.height / 2 - viewport / 2) * parseFloat(element.dataset.parallaxY);
            element.style.translate = `0 ${offset.toFixed(1)}px`;
        }

        if (Math.abs(skew) > 0.01) requestUpdate();
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
}
