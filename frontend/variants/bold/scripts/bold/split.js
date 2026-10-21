/**
 * SPLIT HEADLINES  (word by word reveal, bold variant)
 *
 * PURPOSE:
 * <h2 data-split>Text</h2> -> every word is wrapped so CSS can slide
 * it in one after another (styles/bold/motion.css). The full text
 * stays readable for screen readers via aria-label.
 * Only plain text and <br>, <em>, <span class> children are supported.
 */

export function initSplit() {
    for (const element of document.querySelectorAll("[data-split]")) {
        let index = 0;
        // data-label: the text screen readers get (e.g. when words switch visually)
        const label = element.dataset.label || element.textContent.replace(/\s+/g, " ").trim();

        const wrapText = (node) => {
            const fragment = document.createDocumentFragment();
            for (const part of node.textContent.split(/(\s+)/)) {
                if (!part) continue;
                if (/^\s+$/.test(part)) {
                    fragment.append(" ");
                    continue;
                }
                const word = document.createElement("span");
                word.className = "split-word";
                word.setAttribute("aria-hidden", "true");
                const inner = document.createElement("span");
                inner.className = "split-word__inner";
                inner.style.setProperty("--i", String(index++));
                inner.textContent = part;
                word.append(inner);
                fragment.append(word);
            }
            node.replaceWith(fragment);
        };

        const walk = (parent) => {
            for (const child of [...parent.childNodes]) {
                if (child.nodeType === Node.TEXT_NODE) wrapText(child);
                else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") walk(child);
            }
        };

        walk(element);
        element.setAttribute("aria-label", label);
        if (!element.hasAttribute("data-reveal")) element.setAttribute("data-reveal", "split");
    }
}
