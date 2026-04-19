import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const COLLECTIONS = {
  users: {},
  devices: {},
  sessions: {},
  pairings: {},
  transfers: {},
  uploadSessions: {},
  uploadParts: {},
  localePreferences: {},
  auditLog: []
};

export async function createMetadataStore(configOrFilePath, logger) {
  if (typeof configOrFilePath === "string") {
    return createJsonMetadataStore(configOrFilePath);
  }

  const config = configOrFilePath;
  if (config.databaseDriver === "postgres") {
    try {
      return await createPostgresMetadataStore(config, logger);
    } catch (error) {
      if (config.appMode === "production") {
        throw error;
      }
      logger?.warn?.("postgres unavailable, using JSON metadata fallback", { error });
      return createJsonMetadataStore(config.metadataFile, { fallbackFrom: "postgres" });
    }
  }

  return createJsonMetadataStore(config.metadataFile);
}

function createJsonMetadataStore(filePath, { fallbackFrom = null } = {}) {
  const empty = structuredClone(COLLECTIONS);

  let data = structuredClone(empty);
  if (fs.existsSync(filePath)) {
    try {
      data = { ...empty, ...JSON.parse(fs.readFileSync(filePath, "utf8")) };
    } catch {
      data = structuredClone(empty);
    }
  }

  let writeQueue = Promise.resolve();

  async function save() {
    writeQueue = writeQueue.then(async () => {
      await fsp.mkdir(path.dirname(filePath), { recursive: true });
      await fsp.writeFile(filePath, JSON.stringify(data, null, 2));
    });
    return writeQueue;
  }

  function ensureCollection(collection) {
    if (!(collection in data)) {
      data[collection] = collection === "auditLog" ? [] : {};
    }
  }

  function upsert(collection, record) {
    ensureCollection(collection);
    const id = record.id || crypto.randomUUID();
    data[collection][id] = {
      ...(data[collection][id] || {}),
      ...record,
      id,
      updatedAt: Date.now()
    };
    void save();
    return data[collection][id];
  }

  function get(collection, id) {
    ensureCollection(collection);
    return data[collection][id] || null;
  }

  function remove(collection, id) {
    ensureCollection(collection);
    delete data[collection][id];
    void save();
  }

  function list(collection, predicate = () => true) {
    ensureCollection(collection);
    return Object.values(data[collection]).filter(predicate);
  }

  function addAudit(event) {
    data.auditLog.push({
      id: event.id || crypto.randomUUID(),
      createdAt: Date.now(),
      ...event
    });
    if (data.auditLog.length > 5000) {
      data.auditLog = data.auditLog.slice(-5000);
    }
    void save();
  }

  async function health() {
    return {
      driver: "json",
      configuredDriver: fallbackFrom || "json",
      fallbackFrom,
      available: true,
      filePath,
      counts: collectionCounts(data)
    };
  }

  return {
    driver: "json",
    configuredDriver: fallbackFrom || "json",
    fallbackFrom,
    data,
    save,
    upsert,
    get,
    remove,
    list,
    addAudit,
    health,
    close: async () => save()
  };
}

async function createPostgresMetadataStore(config, logger) {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: config.databaseUrl,
    application_name: "vibe-share-server"
  });

  await pool.query("select 1");

  async function query(sql, params = []) {
    return pool.query(sql, params);
  }

  async function upsert(collection, record) {
    const id = record.id || crypto.randomUUID();
    const nowDate = new Date(record.updatedAt || Date.now());
    const createdAt = toDate(record.createdAt) || nowDate;

    try {
      if (collection === "users") {
        await query(
          `insert into users (id, email, display_name, anonymous, created_at, updated_at, data)
           values ($1, $2, $3, $4, $5, $6, $7)
           on conflict (id) do update set
             email = excluded.email,
             display_name = excluded.display_name,
             anonymous = excluded.anonymous,
             updated_at = excluded.updated_at,
             data = users.data || excluded.data`,
          [id, record.email || null, record.displayName || null, record.anonymous !== false, createdAt, nowDate, record]
        );
        return { ...record, id };
      }

      if (collection === "devices") {
        await query(
          `insert into devices (id, user_id, session_id, role, trust_token_hash, trusted_until, revoked_at, created_at, updated_at, data)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           on conflict (id) do update set
             user_id = excluded.user_id,
             session_id = excluded.session_id,
             role = excluded.role,
             trust_token_hash = excluded.trust_token_hash,
             trusted_until = excluded.trusted_until,
             revoked_at = excluded.revoked_at,
             updated_at = excluded.updated_at,
             data = devices.data || excluded.data`,
          [
            id,
            record.userId || null,
            record.sessionId || null,
            record.role || null,
            record.trustTokenHash || null,
            toDate(record.trustedUntil),
            toDate(record.revokedAt),
            createdAt,
            nowDate,
            record
          ]
        );
        return { ...record, id };
      }

      if (collection === "sessions") {
        await query(
          `insert into anonymous_sessions (id, code, user_id, expires_at, created_at, updated_at, data)
           values ($1, $2, $3, $4, $5, $6, $7)
           on conflict (id) do update set
             code = excluded.code,
             user_id = excluded.user_id,
             expires_at = excluded.expires_at,
             updated_at = excluded.updated_at,
             data = anonymous_sessions.data || excluded.data`,
          [id, record.code || null, record.userId || record.anonymousUserId || null, toDate(record.expiresAt), createdAt, nowDate, record]
        );
        return { ...record, id };
      }

      if (collection === "pairings") {
        await query(
          `insert into pairings (id, session_id, pc_device_id, mobile_device_id, code_hash, status, created_at, updated_at, data)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           on conflict (id) do update set
             session_id = excluded.session_id,
             pc_device_id = excluded.pc_device_id,
             mobile_device_id = excluded.mobile_device_id,
             code_hash = excluded.code_hash,
             status = excluded.status,
             updated_at = excluded.updated_at,
             data = pairings.data || excluded.data`,
          [
            id,
            record.sessionId || null,
            record.pcDeviceId || null,
            record.mobileDeviceId || null,
            record.codeHash || null,
            record.status || "created",
            createdAt,
            nowDate,
            record
          ]
        );
        return { ...record, id };
      }

      if (collection === "transfers") {
        await query(
          `insert into transfers (id, session_id, from_role, to_role, file_name, mime_type, size_bytes, status, storage_key, storage_driver, expires_at, created_at, updated_at, data)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           on conflict (id) do update set
             session_id = excluded.session_id,
             from_role = excluded.from_role,
             to_role = excluded.to_role,
             file_name = excluded.file_name,
             mime_type = excluded.mime_type,
             size_bytes = excluded.size_bytes,
             status = excluded.status,
             storage_key = excluded.storage_key,
             storage_driver = excluded.storage_driver,
             expires_at = excluded.expires_at,
             updated_at = excluded.updated_at,
             data = transfers.data || excluded.data`,
          [
            id,
            record.sessionId || null,
            record.from || record.fromRole || null,
            record.to || record.toRole || null,
            record.fileName || null,
            record.mimeType || null,
            Number.isFinite(Number(record.size)) ? Number(record.size) : null,
            record.status || null,
            record.storageKey || null,
            record.storageDriver || null,
            toDate(record.expiresAt),
            createdAt,
            nowDate,
            record
          ]
        );
        return { ...record, id };
      }

      if (collection === "uploadSessions" || collection === "uploadParts") {
        await upsertUploadSession(record, createdAt, nowDate);
        return { ...record, id };
      }

      if (collection === "localePreferences") {
        await query(
          `insert into locale_preferences (id, user_id, device_id, locale, created_at, updated_at, data)
           values ($1, $2, $3, $4, $5, $6, $7)
           on conflict (id) do update set
             user_id = excluded.user_id,
             device_id = excluded.device_id,
             locale = excluded.locale,
             updated_at = excluded.updated_at,
             data = locale_preferences.data || excluded.data`,
          [id, record.userId || null, record.deviceId || null, record.locale || null, createdAt, nowDate, record]
        );
        return { ...record, id };
      }

      logger?.warn?.("unknown metadata collection", { collection, id });
    } catch (error) {
      logger?.error?.("postgres metadata upsert failed", { collection, id, error });
      throw error;
    }

    return { ...record, id };
  }

  async function upsertUploadSession(record, createdAt, nowDate) {
    const id = record.id || record.uploadId || crypto.randomUUID();
    await query(
      `insert into upload_sessions (id, transfer_id, session_id, status, provider_upload_id, storage_key, part_size_bytes, total_parts, created_at, updated_at, data)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (id) do update set
         transfer_id = excluded.transfer_id,
         session_id = excluded.session_id,
         status = excluded.status,
         provider_upload_id = excluded.provider_upload_id,
         storage_key = excluded.storage_key,
         part_size_bytes = excluded.part_size_bytes,
         total_parts = excluded.total_parts,
         updated_at = excluded.updated_at,
         data = upload_sessions.data || excluded.data`,
      [
        id,
        record.transferId || null,
        record.sessionId || null,
        record.status || null,
        record.providerUploadId || null,
        record.storageKey || null,
        Number.isFinite(Number(record.partSize)) ? Number(record.partSize) : null,
        Number.isFinite(Number(record.totalParts)) ? Number(record.totalParts) : null,
        createdAt,
        nowDate,
        record
      ]
    );

    for (const part of record.parts || record.uploadedParts || []) {
      await upsertUploadPart(id, part, nowDate);
    }
  }

  async function upsertUploadPart(uploadSessionId, part, nowDate) {
    const id = part.id || `${uploadSessionId}:${part.partNumber}`;
    await query(
      `insert into upload_parts (id, upload_session_id, part_number, etag, checksum_sha256, size_bytes, status, created_at, updated_at, data)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       on conflict (upload_session_id, part_number) do update set
         etag = excluded.etag,
         checksum_sha256 = excluded.checksum_sha256,
         size_bytes = excluded.size_bytes,
         status = excluded.status,
         updated_at = excluded.updated_at,
         data = upload_parts.data || excluded.data`,
      [
        id,
        uploadSessionId,
        part.partNumber,
        part.etag || null,
        part.checksum || part.checksumSha256 || null,
        Number.isFinite(Number(part.size)) ? Number(part.size) : null,
        part.status || "uploaded",
        nowDate,
        nowDate,
        part
      ]
    );
  }

  async function get(collection, id) {
    const table = tableFor(collection);
    if (!table) {
      return null;
    }
    const result = await query(`select data from ${table} where id = $1`, [id]);
    return result.rows[0]?.data || null;
  }

  async function remove(collection, id) {
    const table = tableFor(collection);
    if (!table) {
      return;
    }
    await query(`delete from ${table} where id = $1`, [id]);
  }

  async function list(collection, predicate = () => true) {
    const table = tableFor(collection);
    if (!table) {
      return [];
    }
    const result = await query(`select data from ${table} order by updated_at desc limit 1000`);
    return result.rows.map((row) => row.data).filter(predicate);
  }

  async function addAudit(event) {
    const id = event.id || crypto.randomUUID();
    try {
      await query(
        `insert into audit_logs (id, event_type, session_id, transfer_id, actor, created_at, data)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          event.type || event.eventType || "event",
          event.sessionId || null,
          event.transferId || null,
          event.actor || null,
          toDate(event.createdAt) || new Date(),
          { id, ...event }
        ]
      );
    } catch (error) {
      logger?.error?.("postgres audit insert failed", { eventType: event.type, error });
    }
  }

  async function health() {
    const ping = await query("select 1 as ok");
    const counts = {};
    for (const [name, table] of Object.entries({
      users: "users",
      sessions: "anonymous_sessions",
      devices: "devices",
      pairings: "pairings",
      transfers: "transfers",
      uploadSessions: "upload_sessions",
      uploadParts: "upload_parts",
      localePreferences: "locale_preferences",
      auditLog: "audit_logs"
    })) {
      const result = await query(`select count(*)::int as count from ${table}`);
      counts[name] = result.rows[0]?.count || 0;
    }
    return {
      driver: "postgres",
      configuredDriver: "postgres",
      fallbackFrom: null,
      available: ping.rows[0]?.ok === 1,
      counts
    };
  }

  return {
    driver: "postgres",
    configuredDriver: "postgres",
    fallbackFrom: null,
    upsert,
    get,
    remove,
    list,
    addAudit,
    health,
    close: () => pool.end()
  };
}

function tableFor(collection) {
  return {
    users: "users",
    devices: "devices",
    sessions: "anonymous_sessions",
    pairings: "pairings",
    transfers: "transfers",
    uploadSessions: "upload_sessions",
    uploadParts: "upload_sessions",
    localePreferences: "locale_preferences"
  }[collection] || null;
}

function toDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "number") {
    return new Date(value);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function collectionCounts(data) {
  const counts = {};
  for (const [key, value] of Object.entries(data)) {
    counts[key] = Array.isArray(value) ? value.length : Object.keys(value || {}).length;
  }
  return counts;
}
