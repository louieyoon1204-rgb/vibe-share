# Data Model

The durable production-oriented schema is in `apps/server/migrations/001_init.sql`. Local demo mode uses the same collection names in `.tmp/metadata.json` but is not transactional.

This model belongs to the API service surface planned as `https://api.vibeshare.app`. The web app and mobile app should treat these records as server-owned metadata, not client-owned storage.

Product copy must not imply long-term storage guarantees yet. Private beta metadata supports session pairing, transfer state, upload resume, audit hooks, and cleanup. Paid public launch still needs explicit retention/deletion policy, account ownership rules, and admin audit search.

## users

Stores anonymous and future logged-in users.

- `id`
- `email`
- `display_name`
- `anonymous`
- `created_at`
- `updated_at`
- `data`

## anonymous_sessions

Stores QR/manual-code sessions.

- `id`
- `code`
- `user_id`
- `expires_at`
- `created_at`
- `updated_at`
- `data`

## devices

Stores paired PC/mobile devices and device trust token hash.

- `id`
- `user_id`
- `session_id`
- `role`
- `trust_token_hash`
- `trusted_until`
- `revoked_at`
- `created_at`
- `updated_at`
- `data`

Device rows are critical for `REQUIRE_DEVICE_TRUST=true`. Session creation and mobile join wait for the relevant device row before returning so immediate Socket.IO join does not race PostgreSQL persistence.

## pairings

Stores pairing attempts and paired device relationship.

- `id`
- `session_id`
- `pc_device_id`
- `mobile_device_id`
- `code_hash`
- `status`
- `created_at`
- `updated_at`
- `data`

## transfers

Stores bidirectional transfer metadata. PC -> mobile and mobile -> PC share this table.

- `id`
- `session_id`
- `from_role`
- `to_role`
- `file_name`
- `mime_type`
- `size_bytes`
- `status`
- `storage_key`
- `storage_driver`
- `expires_at`
- `created_at`
- `updated_at`
- `data`

## upload_sessions

Stores resumable upload state.

- `id`
- `transfer_id`
- `session_id`
- `status`
- `provider_upload_id`
- `storage_key`
- `part_size_bytes`
- `total_parts`
- `created_at`
- `updated_at`
- `data`

## upload_parts

Stores individual part completion state.

- `id`
- `upload_session_id`
- `part_number`
- `etag`
- `checksum_sha256`
- `size_bytes`
- `status`
- `created_at`
- `updated_at`
- `data`

`upload_session_id + part_number` is unique so retries can overwrite the same part metadata.

For S3/MinIO direct upload, the browser uploads bytes to the signed part URL and then reports completion to the API. The API persists ETag, checksum, size, and status in `upload_parts`. For local storage mode, the API receives the part and records the same metadata after writing the part file.

## locale_preferences

Stores future user/device locale preference.

- `id`
- `user_id`
- `device_id`
- `locale`
- `created_at`
- `updated_at`
- `data`

## audit_logs

Stores abuse and incident response events.

- `id`
- `event_type`
- `session_id`
- `transfer_id`
- `actor`
- `created_at`
- `data`

## Local JSON fallback vs PostgreSQL

JSON fallback is for development and tests:

- simple setup
- no external service
- no transactions
- not safe for multiple server processes
- not enough for commercial incident response

PostgreSQL mode is the production-oriented path:

- migrations
- indexed queryable records
- durable upload part state
- audit log durability
- better base for admin tooling and cleanup jobs

In development, if PostgreSQL is configured but unavailable, the server may fall back to JSON and reports that in `/health` and `/admin/status`:

```json
{
  "activeDrivers": {
    "database": {
      "configured": "postgres",
      "active": "json",
      "fallbackActive": true
    }
  }
}
```

For production-like beta validation, `fallbackWarnings` should be empty and active drivers should be `postgres`, `redis`, `redis`, and `s3`.

Socket.IO room fanout can use Redis with `SOCKET_IO_ADAPTER=redis`. Live socket connections are still runtime state, so clients must reconnect after a server restart, but transfer events no longer require both paired devices to be connected to the same Node.js process. Durable recovery depends on PostgreSQL records plus client-side upload manifests.
