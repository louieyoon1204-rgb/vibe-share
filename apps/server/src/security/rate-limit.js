export function createRateLimit({ windowMs, max, cache, logger }) {
  const buckets = new Map();

  return async function rateLimit(req, res, next) {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const current = Date.now();
    const bucketKey = `rate:${key}`;
    let usedCache = false;
    let bucket;

    if (cache?.incrementRateLimit) {
      try {
        bucket = await cache.incrementRateLimit(bucketKey, windowMs);
        usedCache = true;
      } catch (error) {
        logger?.warn?.("rate limit cache failed, using memory fallback", { error });
      }
    }

    bucket ||= buckets.get(key) || { count: 0, resetAt: current + windowMs };

    if (bucket.resetAt <= current) {
      bucket.count = 0;
      bucket.resetAt = current + windowMs;
    }

    if (!usedCache) {
      bucket.count += 1;
      buckets.set(key, bucket);
    }

    if (bucket.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - current) / 1000)));
      res.status(429).json({ error: "Too many requests. Try again shortly." });
      return;
    }

    next();
  };
}
