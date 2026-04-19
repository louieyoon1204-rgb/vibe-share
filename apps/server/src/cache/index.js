export async function createCache(config, logger) {
  if (config.cacheDriver === "redis") {
    try {
      return await createRedisCache(config, logger);
    } catch (error) {
      if (config.appMode === "production") {
        throw error;
      }
      logger?.warn?.("redis unavailable, using memory cache fallback", { error });
      return createMemoryCache({ fallbackFrom: "redis" });
    }
  }

  return createMemoryCache();
}

function createMemoryCache({ fallbackFrom = null } = {}) {
  const values = new Map();
  const queues = new Map();

  function isExpired(entry) {
    return entry?.expiresAt && entry.expiresAt <= Date.now();
  }

  function getEntry(key) {
    const entry = values.get(key);
    if (isExpired(entry)) {
      values.delete(key);
      return null;
    }
    return entry || null;
  }

  return {
    driver: "memory",
    configuredDriver: fallbackFrom || "memory",
    fallbackFrom,
    isAvailable: true,

    async get(key) {
      const entry = getEntry(key);
      return entry ? entry.value : null;
    },

    async set(key, value, ttlSeconds) {
      values.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
      });
    },

    async del(key) {
      values.delete(key);
    },

    async incrementRateLimit(key, windowMs) {
      const entry = getEntry(key) || {
        value: { count: 0, resetAt: Date.now() + windowMs },
        expiresAt: Date.now() + windowMs
      };
      entry.value.count += 1;
      values.set(key, entry);
      return entry.value;
    },

    async enqueue(name, payload) {
      const queue = queues.get(name) || [];
      queue.push({ id: cryptoRandomId(), createdAt: Date.now(), payload });
      queues.set(name, queue);
      return queue.length;
    },

    async health() {
      return {
        driver: "memory",
        configuredDriver: fallbackFrom || "memory",
        fallbackFrom,
        available: true,
        keys: values.size,
        queues: Object.fromEntries([...queues.entries()].map(([name, queue]) => [name, queue.length]))
      };
    },

    async close() {}
  };
}

async function createRedisCache(config, logger) {
  const { createClient } = await import("redis");
  const client = createClient({
    url: config.redisUrl,
    socket: {
      connectTimeout: 1500,
      reconnectStrategy: false
    }
  });

  client.on("error", (error) => {
    logger?.warn?.("redis error", { error });
  });

  await client.connect();

  return {
    driver: "redis",
    configuredDriver: "redis",
    fallbackFrom: null,
    isAvailable: true,

    async get(key) {
      const raw = await client.get(key);
      return raw ? JSON.parse(raw) : null;
    },

    async set(key, value, ttlSeconds) {
      const raw = JSON.stringify(value);
      if (ttlSeconds) {
        await client.set(key, raw, { EX: ttlSeconds });
      } else {
        await client.set(key, raw);
      }
    },

    async del(key) {
      await client.del(key);
    },

    async incrementRateLimit(key, windowMs) {
      const count = await client.incr(key);
      if (count === 1) {
        await client.pExpire(key, windowMs);
      }
      const ttl = await client.pTTL(key);
      return {
        count,
        resetAt: Date.now() + Math.max(ttl, 0)
      };
    },

    async enqueue(name, payload) {
      return client.lPush(`queue:${name}`, JSON.stringify({
        id: cryptoRandomId(),
        createdAt: Date.now(),
        payload
      }));
    },

    async health() {
      const pong = await client.ping();
      return {
        driver: "redis",
        configuredDriver: "redis",
        fallbackFrom: null,
        available: pong === "PONG",
        ping: pong
      };
    },

    async close() {
      await client.quit();
    }
  };
}

function cryptoRandomId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
