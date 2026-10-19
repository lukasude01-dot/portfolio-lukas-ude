/**
 * ENTRY FILE FOR HOSTING  (e.g. Hostinger Node.js web app)
 *
 * PURPOSE:
 * Starts the backend, which also delivers the built website.
 * Some hosts load the entry file with require(), which cannot load
 * the backend's ES modules directly. This small CommonJS file loads
 * them with import() instead.
 *
 * Locally you can still use:  npm start
 * Settings (secrets, e-mail): environment variables of the host,
 * see /backend/.env.example
 */

import("./backend/src/server.js")
    .then(({ startServer }) => startServer())
    .catch((error) => {
        console.error("Server could not start:", error.message);
        process.exit(1);
    });
