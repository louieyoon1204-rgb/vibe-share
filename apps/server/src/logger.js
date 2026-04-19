function serializeError(error) {
  if (!error) {
    return undefined;
  }

  return {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  };
}

function log(level, message, fields = {}) {
  const payload = {
    level,
    service: "vibe-share-server",
    time: new Date().toISOString(),
    message,
    ...fields
  };

  if (payload.error instanceof Error) {
    payload.error = serializeError(payload.error);
  }

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  debug(message, fields) {
    if (process.env.LOG_LEVEL === "debug") {
      log("debug", message, fields);
    }
  },
  info(message, fields) {
    log("info", message, fields);
  },
  warn(message, fields) {
    log("warn", message, fields);
  },
  error(message, fields) {
    log("error", message, fields);
  }
};
