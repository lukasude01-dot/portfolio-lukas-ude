/**
 * BOOT
 *
 * PURPOSE:
 * Runs before the page is shown and adds the class "js" to <html>.
 * CSS uses it to prepare scroll animations ONLY when JavaScript
 * works – if scripts fail, all content simply stays visible.
 *
 * This is a separate file (not inline) because the Content
 * Security Policy forbids inline scripts.
 *
 * DO NOT EDIT WITHOUT TESTING.
 */
document.documentElement.classList.add("js");
