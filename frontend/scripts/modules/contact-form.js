/**
 * CONTACT FORM
 *
 * PURPOSE:
 * 1. Checks the fields in the browser (quick feedback).
 * 2. Gets a short-lived anti-spam token from the backend.
 * 3. Sends the message as JSON to the backend (POST /api/contact).
 * 4. Shows a clear success or error message.
 *
 * IMPORTANT - SECURITY:
 * The browser check is only for convenience. The backend checks
 * everything again (/backend/src/routes/contact.js). No e-mail
 * credentials or API keys exist in the frontend.
 *
 * HTML:    /frontend/components/contact-form.html
 * RULES:   /shared/contact-schema.js (same rules as the server)
 * STYLES:  /frontend/styles/components/forms.css
 *
 * SAFE TO EDIT: the MESSAGES texts below.
 * DO NOT CHANGE WITHOUT TESTING: the token + fetch logic.
 */

import { validateContact } from "../shared/contact-schema.js";

// SAFE TO EDIT: messages shown to visitors
const MESSAGES = {
    sending: "Sending …",
    successTitle: "Thank you – your message has arrived.",
    successText: "I'll get back to you personally as soon as I can.",
    errorTitle: "Your message could not be sent.",
    errorText: "Please try again in a moment.",
    rateLimited: "Too many messages in a short time. Please try again later.",
    invalid: "Please check the highlighted fields."
};

export function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    const status = form.querySelector("[data-form-status]");
    const submitButton = form.querySelector("[data-submit]");
    const submitLabel = form.querySelector("[data-submit-label]");
    const defaultLabel = submitLabel.textContent;

    let tokenPromise = null;
    const getToken = () => {
        tokenPromise ??= fetchToken(form.dataset.tokenEndpoint).catch((error) => {
            tokenPromise = null; // allow a new attempt
            throw error;
        });
        return tokenPromise;
    };

    // Ask for the anti-spam token as soon as someone starts typing.
    form.addEventListener("focusin", () => getToken().catch(() => {}), { once: true });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearStatus(status);

        const values = readForm(form);
        const result = validateContact(values);
        showFieldErrors(form, result.errors);

        if (!result.valid) {
            showStatus(status, "error", MESSAGES.invalid);
            form.querySelector('[aria-invalid="true"]')?.focus();
            return;
        }

        setSending(true);
        try {
            const token = await getToken();
            const response = await fetch(form.dataset.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ ...result.values, website: values.website, token })
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok && data.ok) {
                form.reset();
                tokenPromise = null; // a token is valid for one message only
                showStatus(status, "success", MESSAGES.successText, MESSAGES.successTitle);
                return;
            }

            if (response.status === 422 && data.errors) {
                showFieldErrors(form, data.errors);
                showStatus(status, "error", MESSAGES.invalid);
            } else if (response.status === 429) {
                showStatus(status, "error", MESSAGES.rateLimited, MESSAGES.errorTitle);
            } else {
                tokenPromise = null;
                showStatus(status, "error", MESSAGES.errorText, MESSAGES.errorTitle);
            }
        } catch (error) {
            // Detailed reason only in the browser console, never on the page
            console.error("[CONTACT FORM] Failed to submit contact request. Module: scripts/modules/contact-form.js", error);
            tokenPromise = null;
            showStatus(status, "error", MESSAGES.errorText, MESSAGES.errorTitle);
        } finally {
            setSending(false);
        }
    });

    function setSending(sending) {
        submitButton.disabled = sending;
        submitLabel.textContent = sending ? MESSAGES.sending : defaultLabel;
        form.setAttribute("aria-busy", String(sending));
    }
}

async function fetchToken(url) {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Token request failed with status ${response.status}`);
    const data = await response.json();
    return data.token;
}

function readForm(form) {
    const data = new FormData(form);
    return {
        name: data.get("name") || "",
        email: data.get("email") || "",
        company: data.get("company") || "",
        topic: data.get("topic") || "",
        message: data.get("message") || "",
        privacy: data.get("privacy") === "on",
        website: data.get("website") || "" // honeypot
    };
}

function showFieldErrors(form, errors) {
    form.querySelectorAll("[data-error-for]").forEach((element) => {
        const name = element.dataset.errorFor;
        const field = form.elements[name];
        element.textContent = errors[name] || "";
        if (field) field.setAttribute("aria-invalid", errors[name] ? "true" : "false");
    });
}

function showStatus(element, type, text, title) {
    element.className = `contact-form__status is-${type}`;
    element.replaceChildren();
    if (title) {
        const strong = document.createElement("strong");
        strong.textContent = title;
        element.append(strong);
    }
    element.append(document.createTextNode(text));
}

function clearStatus(element) {
    element.className = "contact-form__status";
    element.replaceChildren();
}
