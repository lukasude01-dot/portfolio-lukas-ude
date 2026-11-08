/**
 * SHOP CART  (flyfishing.lukasude.de)
 *
 * PURPOSE:
 * - "In den Warenkorb" buttons:  <button data-cart-add="fly-slug">
 *   (with data-cart-go="/warenkorb/" the cart opens right away)
 * - Counter in the navigation:   <span data-cart-count>
 * - Cart page /warenkorb/:       <div data-cart> + <form data-order-form>
 *
 * The cart lives only in this browser (localStorage "ff-cart": IDs and
 * quantities). Names and pictures come from /data/katalog.json. Sending
 * the form is a non-binding order request (POST /api/order); the server
 * checks everything again (/backend/src/routes/order.js).
 *
 * Without localStorage (private mode) the cart works until the page is left.
 */

import { validateOrder, ORDER_LIMITS } from "../shared/order-schema.js";

const STORAGE_KEY = "ff-cart";
// Website root, from this file's address (/scripts/flyfishing/cart.js), so it also works in a subfolder
const ROOT = new URL("../../", import.meta.url);
const siteUrl = (path) => new URL(String(path).replace(/^\//, ""), ROOT).href;
let memoryCart = [];

function readCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(saved) ? saved.filter((item) => typeof item?.id === "string" && Number.isInteger(item.quantity)) : [];
    } catch {
        return memoryCart;
    }
}

function writeCart(cart) {
    memoryCart = cart;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
        // storage blocked: keep the cart in memory
    }
    document.dispatchEvent(new CustomEvent("cart:change"));
}

function addItem(id, quantity = 1) {
    const cart = readCart();
    const existing = cart.find((item) => item.id === id);
    if (existing) existing.quantity = Math.min(existing.quantity + quantity, ORDER_LIMITS.maxQuantity);
    else if (cart.length < ORDER_LIMITS.maxItems) cart.push({ id, quantity });
    writeCart(cart);
}

function setQuantity(id, quantity) {
    const cart = readCart()
        .map((item) => (item.id === id ? { ...item, quantity: Math.min(quantity, ORDER_LIMITS.maxQuantity) } : item))
        .filter((item) => item.quantity > 0);
    writeCart(cart);
}

let catalogPromise = null;
const loadCatalog = () => {
    catalogPromise ??= fetch(siteUrl("/data/katalog.json"), { headers: { Accept: "application/json" } })
        .then((response) => (response.ok ? response.json() : {}))
        .catch(() => ({}));
    return catalogPromise;
};

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export function initCart() {
    initButtons();
    initCounter();
    const cartRoot = document.querySelector("[data-cart]");
    if (cartRoot) initCartPage(cartRoot, document.querySelector("[data-order-form]"));
}

function initButtons() {
    const status = element("p", "ff-cart-toast");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    document.body.append(status);
    let timer;

    document.addEventListener("click", (event) => {
        const button = event.target.closest("[data-cart-add]");
        if (!button) return;
        addItem(button.dataset.cartAdd);
        // "Jetzt anmelden": straight to the cart
        if (button.dataset.cartGo) {
            window.location.href = siteUrl(button.dataset.cartGo);
            return;
        }
        status.textContent = `${button.dataset.cartName || "Artikel"} liegt im Warenkorb.`;
        status.classList.add("is-visible");
        clearTimeout(timer);
        timer = setTimeout(() => status.classList.remove("is-visible"), 2600);
    });
}

function initCounter() {
    const counters = document.querySelectorAll("[data-cart-count]");
    const update = () => {
        const count = readCart().reduce((sum, item) => sum + item.quantity, 0);
        counters.forEach((counter) => {
            counter.textContent = String(count);
            counter.hidden = count === 0;
        });
    };
    update();
    document.addEventListener("cart:change", update);
    window.addEventListener("storage", (event) => event.key === STORAGE_KEY && update());
}

function initCartPage(root, form) {
    const list = root.querySelector("[data-cart-list]");
    const empty = root.querySelector("[data-cart-empty]");
    const shipping = form?.querySelector("[data-shipping]");

    async function render() {
        const catalog = await loadCatalog();
        const cart = readCart().filter((item) => catalog[item.id]);
        list.replaceChildren(...cart.map((item) => row(item, catalog[item.id])));
        empty.hidden = cart.length > 0;
        if (form) form.hidden = cart.length === 0;
        const needsShipping = cart.some((item) => catalog[item.id].kind === "fly");
        if (shipping) {
            shipping.hidden = !needsShipping;
            shipping.querySelectorAll("input, select").forEach((field) => { field.required = needsShipping; });
        }
    }

    function row(item, product) {
        const li = element("li", "ff-cart-row");
        const image = element("img", "ff-cart-row__image");
        image.src = siteUrl(product.image);
        image.alt = "";
        image.width = 120;
        image.height = 80;
        image.loading = "lazy";

        const info = element("div", "ff-cart-row__info");
        const name = element("a", "ff-cart-row__name", product.name);
        name.href = siteUrl(product.url);
        info.append(name, element("span", "ff-cart-row__price", product.price || "Preis auf Anfrage"));

        const controls = element("div", "ff-cart-row__controls");
        const minus = element("button", "ff-qty", "−");
        minus.type = "button";
        minus.setAttribute("aria-label", `${product.name}: eins weniger`);
        minus.addEventListener("click", () => setQuantity(item.id, item.quantity - 1));
        const amount = element("span", "ff-qty__value", String(item.quantity));
        amount.setAttribute("aria-label", `Anzahl ${item.quantity}`);
        const plus = element("button", "ff-qty", "+");
        plus.type = "button";
        plus.setAttribute("aria-label", `${product.name}: eins mehr`);
        plus.addEventListener("click", () => setQuantity(item.id, item.quantity + 1));
        const remove = element("button", "ff-cart-row__remove", "Entfernen");
        remove.type = "button";
        remove.addEventListener("click", () => setQuantity(item.id, 0));
        controls.append(minus, amount, plus, remove);

        li.append(image, info, controls);
        return li;
    }

    render();
    document.addEventListener("cart:change", render);
    if (form) initOrderForm(form, loadCatalog);
}

function initOrderForm(form, getCatalog) {
    const status = form.querySelector("[data-form-status]");
    const submit = form.querySelector("[type=submit]");
    let tokenPromise = null;
    const getToken = () => {
        tokenPromise ??= fetch("/api/contact/token", { headers: { Accept: "application/json" } })
            .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`Token ${response.status}`))))
            .then((data) => data.token)
            .catch((error) => { tokenPromise = null; throw error; });
        return tokenPromise;
    };
    form.addEventListener("focusin", () => getToken().catch(() => {}), { once: true });

    const showErrors = (errors) => {
        form.querySelectorAll("[data-error-for]").forEach((node) => {
            const message = errors[node.dataset.errorFor] || "";
            node.textContent = message;
            const field = form.elements.namedItem(node.dataset.errorFor);
            if (field?.setAttribute) field.setAttribute("aria-invalid", message ? "true" : "false");
        });
    };
    const say = (type, text) => {
        status.className = `contact-form__status is-${type}`;
        status.textContent = text;
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const values = Object.fromEntries(["name", "email", "street", "zip", "city", "country", "message"].map((key) => [key, String(data.get(key) || "")]));
        values.privacy = data.get("privacy") === "on";
        const items = readCart().map(({ id, quantity }) => ({ id, quantity }));

        const catalog = await getCatalog();
        const result = validateOrder({ ...values, items }, catalog);
        showErrors(result.errors);
        if (!result.valid) {
            say("error", result.errors.items || "Bitte prüfe die markierten Felder.");
            form.querySelector('[aria-invalid="true"]')?.focus();
            return;
        }

        submit.disabled = true;
        say("info", "Wird gesendet …");
        try {
            const token = await getToken();
            const response = await fetch("/api/order", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ ...values, items, website: String(data.get("website") || ""), token })
            });
            const answer = await response.json().catch(() => ({}));
            if (response.ok && answer.ok) {
                writeCart([]);
                form.reset();
                tokenPromise = null;
                say("success", "Danke! Deine Anmeldung ist angekommen. Ich melde mich innerhalb von zwei Werktagen per E-Mail.");
                return;
            }
            if (response.status === 422 && answer.errors) showErrors(answer.errors);
            tokenPromise = null;
            say("error", typeof answer.error === "string" ? answer.error : "Deine Anfrage konnte nicht gesendet werden. Bitte versuche es noch einmal.");
        } catch (error) {
            console.error("[CART] Failed to send order request. Module: scripts/flyfishing/cart.js", error);
            tokenPromise = null;
            say("error", "Deine Anfrage konnte nicht gesendet werden. Bitte versuche es noch einmal.");
        } finally {
            submit.disabled = false;
        }
    });
}
