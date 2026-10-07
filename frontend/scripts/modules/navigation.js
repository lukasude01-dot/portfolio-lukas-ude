/**
 * NAVIGATION
 *
 * PURPOSE:
 * 1. Header gets a solid background after scrolling a little
 *    (class "is-scrolled").
 * 2. Header hides while scrolling down and returns when
 *    scrolling up (class "is-hidden").
 * 3. Opens / closes the mobile menu (button "Menu").
 *
 * HTML:   /frontend/components/navigation.html
 * STYLES: /frontend/styles/components/navigation.css
 *
 * SAFE TO EDIT: SCROLL_THRESHOLD (pixels before the header changes).
 * DO NOT CHANGE WITHOUT TESTING: focus handling of the mobile menu
 * (keyboard users must be able to close it with Escape).
 */

const SCROLL_THRESHOLD = 40;
const MENU_ANIMATION_MS = 600;

export function initNavigation() {
    const header = document.querySelector("[data-site-header]");
    if (!header) return;

    initScrollState(header);
    initMobileMenu(header);
}

function initScrollState(header) {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const update = () => {
        const currentY = window.scrollY;
        header.classList.toggle("is-scrolled", currentY > SCROLL_THRESHOLD);

        const scrollingDown = currentY > lastScrollY;
        const menuOpen = header.classList.contains("is-menu-open");
        header.classList.toggle("is-hidden", scrollingDown && currentY > 400 && !menuOpen);

        lastScrollY = currentY;
        ticking = false;
    };

    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    // Show the header again when keyboard focus moves into it
    header.addEventListener("focusin", () => header.classList.remove("is-hidden"));
    update();
}

function initMobileMenu(header) {
    const toggle = header.querySelector("[data-menu-toggle]");
    const menu = header.querySelector("[data-mobile-menu]");
    const label = header.querySelector("[data-menu-label]");
    if (!toggle || !menu) return;

    let closeTimer;

    const open = () => {
        clearTimeout(closeTimer);
        menu.hidden = false;
        // Wait one frame so the CSS transition can run
        requestAnimationFrame(() => menu.classList.add("is-open"));
        header.classList.add("is-menu-open");
        toggle.setAttribute("aria-expanded", "true");
        if (label) label.textContent = "Schließen";
        document.body.classList.add("is-menu-locked");
        menu.querySelector("a")?.focus();
    };

    const close = ({ returnFocus = true } = {}) => {
        menu.classList.remove("is-open");
        header.classList.remove("is-menu-open");
        toggle.setAttribute("aria-expanded", "false");
        if (label) label.textContent = "Menü";
        document.body.classList.remove("is-menu-locked");
        closeTimer = setTimeout(() => { menu.hidden = true; }, MENU_ANIMATION_MS);
        if (returnFocus) toggle.focus();
    };

    toggle.addEventListener("click", () => {
        toggle.getAttribute("aria-expanded") === "true" ? close() : open();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") close();
    });

    // Close the menu when a link inside it is used
    menu.addEventListener("click", (event) => {
        if (event.target.closest("a")) close({ returnFocus: false });
    });

    // Close it if the window becomes wide enough for the desktop menu
    window.matchMedia("(min-width: 1080px)").addEventListener("change", (event) => {
        if (event.matches && toggle.getAttribute("aria-expanded") === "true") close({ returnFocus: false });
    });
}
