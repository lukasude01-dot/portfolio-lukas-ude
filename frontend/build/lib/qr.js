/**
 * QR CODE GENERATOR  (build-time, no external QR service)
 *
 * PURPOSE:
 * Creates /assets/qr/site-qr.svg that opens the website.
 *
 * DESTINATION:
 * Always built from siteConfig.url + siteConfig.qr.path
 * (/frontend/config/site.js). Change the domain there and the
 * QR code updates automatically on the next build.
 *
 * SCANNABILITY RULES (EDIT WITH CARE):
 * - dark modules on a light background (obsidian on ivory)
 * - quiet zone ("margin") of 4 modules around the code
 * - error correction level "M"
 * - no tracking parameters are added
 */

import fs from "node:fs";
import path from "node:path";
import { log } from "./logger.js";

export async function createQrCode(site, distDir) {
    const destination = new URL(site.qr.path || "/", site.url).href;

    if (!destination.startsWith("https://")) {
        log.warn("QR CODE", `QR destination "${destination}" does not use https://. Check siteConfig.url.`);
    }

    let QRCode;
    try {
        QRCode = (await import("qrcode")).default;
    } catch {
        log.warn("QR CODE", 'The "qrcode" package is not installed – QR code not generated. Run `npm install` inside /frontend.');
        return null;
    }

    const svg = await QRCode.toString(destination, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 4,
        color: { dark: "#090A09", light: "#EEEAE0" }
    });

    const target = path.join(distDir, "assets", "qr", "site-qr.svg");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, svg.replace("<svg ", '<svg role="img" aria-label="QR code" '));
    log.info(`QR code -> ${destination}`);
    return destination;
}
