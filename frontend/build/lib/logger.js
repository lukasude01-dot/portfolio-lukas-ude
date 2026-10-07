/**
 * BUILD LOGGER
 *
 * PURPOSE:
 * Consistent, readable messages during `npm run build`.
 * Warnings are collected and printed as a summary at the end,
 * so problems (missing alt text, placeholder content, ...) are
 * never silently ignored.
 */

const warnings = [];

export const log = {
    info(message) {
        console.log(`  ${message}`);
    },

    step(message) {
        console.log(`\n▸ ${message}`);
    },

    /** module: which part of the build, e.g. "CONTENT" or "IMAGES" */
    warn(module, message) {
        warnings.push({ module, message });
    },

    /** Stops the build with a clear explanation. */
    fail(module, message, detail) {
        const error = new Error(`[${module}] ${message}`);
        error.detail = detail;
        throw error;
    },

    printWarnings() {
        if (warnings.length === 0) {
            console.log("\n✓ No warnings.");
            return;
        }
        console.log(`\n⚠ ${warnings.length} warning(s) – please review before going live:`);
        const byModule = new Map();
        for (const warning of warnings) {
            if (!byModule.has(warning.module)) byModule.set(warning.module, []);
            byModule.get(warning.module).push(warning.message);
        }
        for (const [module, messages] of byModule) {
            console.log(`\n  [${module}]`);
            for (const message of messages) console.log(`   - ${message}`);
        }
    },

    resetWarnings() {
        warnings.length = 0;
    }
};
