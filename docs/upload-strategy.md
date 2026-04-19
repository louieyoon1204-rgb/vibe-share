# Upload Strategy

## Goal

Support single files up to 100GB without keeping full files in API server memory.

Product wording must be careful: the 100GB policy and browser resumable/S3-compatible multipart foundation exist, but this is not the same as guaranteeing every mobile device can background-upload 100GB today. Expo Go mobile remains a compatibility path; native background upload and restart recovery are paid public launch gaps.

## Implemented local path

The server exposes:

```text
POST /api/uploads/initiate
POST /api/uploads/:uploadId/parts/:partNumber/url
PUT  /api/uploads/:uploadId/parts/:partNumber
GET  /api/uploads/:uploadId/status
POST /api/uploads/:uploadId/parts/:partNumber/complete
POST /api/uploads/:uploadId/complete
POST /api/uploads/:uploadId/cancel
GET  /api/transfers/:transferId/download-url
```

In local mode, each part is uploaded to the API and written as a part file. Completion streams parts into the final local object. The integration test uploads both directions through this path.

## Production-oriented S3 path

With `STORAGE_DRIVER=s3`, the same initiate and complete flow is used, but part URL requests return presigned S3-compatible `PUT` URLs. The API server manages metadata and does not receive the bytes.

For local production-like testing, MinIO can be used as the S3-compatible backend. `docker-compose.local-infra.yml` starts MinIO and creates the `vibe-share-transfers` bucket. `npm.cmd run smoke:minio` also verifies a standalone MinIO presigned multipart path.

When the browser uploads a part directly to S3/MinIO, it calls `POST /api/uploads/:uploadId/parts/:partNumber/complete` after the `PUT` succeeds. That is how the API records ETag, size, checksum metadata, and durable part completion without proxying the file bytes.

S3-compatible multipart uploads require non-final parts to meet the provider minimum part size, commonly 5MB. The default `UPLOAD_CHUNK_SIZE_MB=16` is intentionally above that. Test-only 1MB chunks are used only in local storage integration mode.

## Resume model

Upload status returns uploaded parts:

```json
{
  "upload": {
    "id": "...",
    "uploadedParts": [
      { "partNumber": 1, "etag": "...", "checksum": "...", "size": 16777216 }
    ]
  }
}
```

A client can restart, call status, skip completed parts, and continue missing parts. The PC web app now persists an upload manifest in IndexedDB, keeps the active session/device trust in browser session storage, detects an unfinished upload after refresh, asks the user whether to resume, and continues missing parts when the same local file is selected again. The browser does not silently retain the raw 100GB file; the user must reselect the same file after a refresh because ordinary browser file handles are not durable without additional File System Access API work.

Mobile remains Expo Go compatible and uses the simpler relay flow for now. Durable mobile resume after app restart, background transfer, and OS-specific file access are native-app milestones.

In S3 mode, Expo Go relay transfers are still API downloads because their bytes live in a temporary server upload file rather than object storage. Browser resumable uploads use signed S3/MinIO URLs.

When `DATABASE_DRIVER=postgres`, upload sessions and parts are written to durable tables:

- `upload_sessions`
- `upload_parts`

Redis-backed Socket.IO fanout is available with `SOCKET_IO_ADAPTER=redis`, so transfer events can cross Node.js workers. Active browser/mobile sockets are still runtime connections, so a server restart still requires clients to reconnect and rejoin the session. Durable upload recovery uses the database upload state plus the browser IndexedDB manifest.

## Integrity

Local mode validates `x-checksum-sha256` per part. S3 mode records ETags and client-supplied checksum metadata for upload parts. A production hardening pass should add whole-file hash verification, scanner result persistence, and object-lock retention if required by product policy.

After upload completion the transfer moves through `uploaded -> scanning`. Without a scanner webhook the local default releases the transfer and moves it to `pending_accept`. With a scanner webhook, blocked files move to `quarantined` or `failed_scan`.

## Downloads

Local mode returns an API download URL. S3 mode returns a signed object URL. Downloads are only available after receiver acceptance.

## Chunk size

Defaults:

```text
MAX_FILE_SIZE_GB=100
UPLOAD_CHUNK_SIZE_MB=16
UPLOAD_CHUNK_MAX_MB=64
SIGNED_URL_TTL_SECONDS=900
```

Trade-off: larger chunks reduce request overhead but increase retry cost. Smaller chunks improve recovery but increase metadata and signed URL operations.

## Cleanup

Production storage needs lifecycle rules:

- abort incomplete multipart uploads after a short window
- delete expired transfer objects according to retention policy
- report orphaned objects and orphaned metadata
- keep audit logs under a separate retention schedule

## Verification

Local adapter:

```powershell
npm.cmd run smoke:integration
```

Configured production-like drivers:

```powershell
$env:INTEGRATION_USE_CONFIG_DRIVERS='true'
npm.cmd run smoke:integration
Remove-Item Env:\INTEGRATION_USE_CONFIG_DRIVERS
```

Standalone or already-running MinIO presigned multipart path:

```powershell
npm.cmd run smoke:minio
```
