/**
 * RATE LIMIT
 *
 * PURPOSE:
 * Limits how many requests one visitor (IP address) can send in a
 * time window – protects the contact form against spam and abuse.
 *
 * Example: max 5 messages per 15 minutes per IP
 * (RATE_LIMIT_MAX / RATE_LIMIT_WINDOW_MINUTES in .env).
 *
 * NOTE:
 * Counts are kept in memory. That is enough for one server. With
 * several servers behind a load balancer, use a shared store
 * (e.g. Redis) – see /docs/SECURITY.md.
 */

export function createRateLimiter({ max, windowMs, now = () => Date.now() }) {
    const hits = new Map(); // ip -> [timestamps]

    // Remove old entries regularly so memory does not grow forever.
    const cleanup = setInterval(() => {
        const cutoff = now() - windowMs;
        for (const [key, timestamps] of hits) {
            const recent = timestamps.filter((time) => time > cutoff);
            recent.length ? hits.set(key, recent) : hits.delete(key);
        }
    }, Math.min(windowMs, 60_000));
    cleanup.unref();

    return {
        /** Returns { allowed, retryAfterSeconds } and records the hit if allowed. */
        check(key) {
            const current = now();
            const recent = (hits.get(key) || []).filter((time) => time > current - windowMs);
            if (recent.length >= max) {
                const retryAfterSeconds = Math.ceil((recent[0] + windowMs - current) / 1000);
                hits.set(key, recent);
                return { allowed: false, retryAfterSeconds };
            }
            recent.push(current);
            hits.set(key, recent);
            return { allowed: true, retryAfterSeconds: 0 };
        },
        stop() {
            clearInterval(cleanup);
        }
    };
}
