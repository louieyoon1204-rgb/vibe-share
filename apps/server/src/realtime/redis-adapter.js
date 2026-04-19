export async function configureRealtimeAdapter({ io, config, logger }) {
  if (config.realtimeAdapter !== "redis") {
    return { driver: "memory", available: true };
  }

  try {
    const { createAdapter } = await import("@socket.io/redis-adapter");
    const { createClient } = await import("redis");
    const pubClient = createClient({
      url: config.redisUrl,
      socket: {
        connectTimeout: 1500,
        reconnectStrategy: false
      }
    });
    const subClient = pubClient.duplicate();

    pubClient.on("error", (error) => logger.warn("socket redis pub error", { error }));
    subClient.on("error", (error) => logger.warn("socket redis sub error", { error }));

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    logger.info("socket.io redis adapter attached");

    return {
      driver: "redis",
      available: true,
      close: async () => {
        await Promise.allSettled([pubClient.quit(), subClient.quit()]);
      }
    };
  } catch (error) {
    if (config.appMode === "production") {
      throw error;
    }
    logger.warn("socket.io redis adapter unavailable, using memory adapter", { error });
    return { driver: "memory", available: true, fallbackFrom: "redis" };
  }
}
