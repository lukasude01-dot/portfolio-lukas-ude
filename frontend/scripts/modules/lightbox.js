/**
 * LIGHTBOX  (full-screen image preview)
 *
 * PURPOSE:
 * Opens images in a full-screen overlay with previous / next
 * buttons. Works with keyboard (← → Esc) and touch (swipe).
 *
 * USAGE IN HTML:
 *   <div data-lightbox-group>
 *       <a href="/media/design/x/large.jpg" data-lightbox data-caption="Text">
 *           <img ...>
 *       </a>
 *   </div>
 * All [data-lightbox] links in one group can be browsed together.
 * Without JavaScript the link simply opens the image.
 *
 * STYLES: /frontend/styles/components/lightbox.css
 * DO NOT CHANGE WITHOUT TESTING: focus handling (accessibility).
 */

export function initLightbox() {
    const links = document.querySelectorAll("[data-lightbox]");
    if (links.length === 0) return;

    const dialog = createDialog();
    const image = dialog.querySelector(".lightbox__image");
    const caption = dialog.querySelector(".lightbox__caption");
    const counter = dialog.querySelector(".lightbox__counter");
    const previousButton = dialog.querySelector("[data-lightbox-previous]");
    const nextButton = dialog.querySelector("[data-lightbox-next]");

    let group = [];
    let index = 0;
    let opener = null;

    const show = (newIndex) => {
        index = (newIndex + group.length) % group.length;
        const link = group[index];
        image.classList.remove("is-loaded");
        image.onload = () => image.classList.add("is-loaded");
        image.src = link.getAttribute("href");
        image.alt = link.querySelector("img")?.alt || link.dataset.caption || "";
        caption.textContent = link.dataset.caption || "";
        counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(group.length).padStart(2, "0")}`;
        const single = group.length < 2;
        previousButton.hidden = single;
        nextButton.hidden = single;
    };

    const open = (link) => {
        const container = link.closest("[data-lightbox-group]");
        group = container ? [...container.querySelectorAll("[data-lightbox]")] : [link];
        opener = link;
        show(group.indexOf(link));
        dialog.showModal();
        document.body.classList.add("is-lightbox-open");
        requestAnimationFrame(() => dialog.classList.add("is-visible"));
    };

    const close = () => {
        dialog.classList.remove("is-visible");
        document.body.classList.remove("is-lightbox-open");
        dialog.close();
        opener?.focus();
    };

    links.forEach((link) => link.addEventListener("click", (event) => {
        event.preventDefault();
        open(link);
    }));

    dialog.querySelector("[data-lightbox-close]").addEventListener("click", close);
    previousButton.addEventListener("click", () => show(index - 1));
    nextButton.addEventListener("click", () => show(index + 1));

    dialog.addEventListener("cancel", (event) => {
        event.preventDefault(); // Esc: use our own close() so focus returns
        close();
    });

    dialog.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") show(index - 1);
        if (event.key === "ArrowRight") show(index + 1);
    });

    // Click on the dark background closes the lightbox
    dialog.querySelector(".lightbox__stage").addEventListener("click", (event) => {
        if (event.target === event.currentTarget) close();
    });

    // Touch swipe
    let touchStartX = null;
    dialog.addEventListener("touchstart", (event) => { touchStartX = event.touches[0].clientX; }, { passive: true });
    dialog.addEventListener("touchend", (event) => {
        if (touchStartX === null) return;
        const distance = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(distance) > 50) show(index + (distance < 0 ? 1 : -1));
        touchStartX = null;
    });
}

function createDialog() {
    const dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label", "Image preview");
    dialog.innerHTML = `
        <div class="lightbox__top">
            <p class="lightbox__counter"></p>
            <button class="lightbox__button" type="button" data-lightbox-close>Close <span aria-hidden="true">×</span></button>
        </div>
        <div class="lightbox__stage">
            <img class="lightbox__image" alt="">
        </div>
        <div class="lightbox__bottom">
            <p class="lightbox__caption"></p>
            <div class="lightbox__controls">
                <button class="lightbox__button" type="button" data-lightbox-previous aria-label="Previous image">←</button>
                <button class="lightbox__button" type="button" data-lightbox-next aria-label="Next image">→</button>
            </div>
        </div>`;
    document.body.append(dialog);
    return dialog;
}
