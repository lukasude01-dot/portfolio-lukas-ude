/**
 * ENTRY FILE FOR HOSTING  (e.g. Hostinger Node.js web app)
 *
 * PURPOSE:
 * Starts the backend, which also delivers the built website.
 * Some hosts load the entry file with require(), which cannot load
 * the backend's ES modules directly. This small CommonJS file loads
 * them with import() instead.
 *
 * SAFETY NET:
 * If the host did not run the build step (or did not install the
 * packages of /frontend and /backend), this file does it once before
 * the server starts. Without it the website would answer with 404.
 *
 * Locally you can still use:  npm start
 * Settings (secrets, e-mail): environment variables of the host,
 * see /backend/.env.example
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const run = (command) => {
    console.log(`[STARTUP] ${command}`);
    execSync(command, { cwd: ROOT, stdio: "inherit" });
};

function prepare() {
    if (!fs.existsSync(path.join(ROOT, "backend", "node_modules", "nodemailer"))) {
        run("npm --prefix backend install --omit=dev");
    }
    const builtSite = path.join(ROOT, "frontend", "dist", "index.html");
    if (!fs.existsSync(builtSite)) {
        if (!fs.existsSync(path.join(ROOT, "frontend", "node_modules"))) run("npm --prefix frontend install");
        run("npm run build");
    }
}

try {
    prepare();
} catch (error) {
    // The server still starts, so the logs show the reason and the API works.
    console.error("[STARTUP] Preparing the website failed:", error.message);
}

import("./backend/src/server.js")
    .then(({ startServer }) => startServer())
    .catch((error) => {
        console.error("Server could not start:", error.message);
        process.exit(1);
    });
