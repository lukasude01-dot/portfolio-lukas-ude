/**
 * DEVELOPMENT MODE  (npm run dev)
 *
 * PURPOSE:
 * Starts everything you need to work on the website locally:
 *   1. builds the website and rebuilds it on every change
 *   2. starts the backend, which serves the website + contact API
 *
 * Then open http://localhost:3000
 * Stop with Ctrl+C.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const processes = [
    spawn(process.execPath, ["build/build.js", "--watch"], { cwd: path.join(ROOT, "frontend"), stdio: "inherit" }),
    spawn(process.execPath, ["--env-file-if-exists=.env", "--watch-path=src", "--watch-path=../shared", "src/server.js"], { cwd: path.join(ROOT, "backend"), stdio: "inherit" })
];

const stopAll = () => {
    for (const child of processes) child.kill("SIGTERM");
    process.exit(0);
};

process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);
for (const child of processes) child.on("exit", (code) => { if (code) stopAll(); });
