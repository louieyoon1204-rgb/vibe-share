# Architecture

Vibe Share is still a monorepo, but the server now has explicit local fallback and production-oriented foundations.

## Product surfaces

- Official site: `https://vibeshare.app`. This is the planned public marketing/support/beta site. DNS and hosting are not configured in this repo.
- Web app: `https://app.vibeshare.app`. Implemented in `apps/web`; this is the PC screen users open to create a session, show the Vibe Share session QR, and send/receive files.
- API: `https://api.vibeshare.app`. Implemented in `apps/server`; this owns API, relay, status, auth foundation, metadata, storage adapters, health, and admin operator routes.
- Mobile app: `Vibe Share`. Implemented in `apps/mobile`; private beta currently runs through Expo Go, with native store builds left for launch hardening.

The server root page is intentionally a status/connection guide, not the consumer product UI. `/admin/status` and related admin routes are operator surfaces.

The planned site map is documented in `docs/site-map.md`; the static official-site copy prototype is in `docs/site/landing-prototype.html`.

## Apps and packages

- `apps/server`: API/relay/status/auth foundation/metadata server with Express, Socket.IO, PostgreSQL/JSON metadata store, Redis/memory cache, local/S3 storage adapters.
- `apps/web`: Official web app / PC screen. Creates sessions, stores short-lived device trust in browser session storage, shows QR/manual code, uploads through the resumable API, and receives phone transfers.
- `apps/mobile`: Vibe Share mobile app. Scans the PC QR or joins by code, keeps the session device trust token in memory, and keeps the small-file compatibility path so first-run mobile setup stays simple.
- `packages/shared`: Transfer states, locale utilities, partial translations, RTL helpers, locale-aware formatting.

## Runtime modes

Local demo mode:

- `DATABASE_DRIVER=json`
- `CACHE_DRIVER=memory`
- `STORAGE_DRIVER=local`
- Good for beginner setup and integration tests.
- Not commercial-grade for 100GB files.

Production-like local mode:

- `DATABASE_DRIVER=postgres`
- `CACHE_DRIVER=redis`
- `SOCKET_IO_ADAPTER=redis`
- `STORAGE_DRIVER=s3`
- Can be backed by `docker-compose.local-infra.yml` with PostgreSQL, Redis, and MinIO.
- `/health` and `/admin/status` show configured drivers, active drivers, and fallback warnings.

Production mode:

- `APP_MODE=production`
- Requires PostgreSQL, Redis, S3-compatible object storage, device trust secret, and admin token.
- Server startup blocks when required production env is missing.

## Data ownership

The API server owns:

- users and anonymous sessions
- device trust records
- pairing records
- transfer metadata and state
- upload session and part metadata
- locale preferences
- audit log events

Object storage owns:

- file bytes
- multipart upload lifecycle
- signed download objects

Redis owns short-lived operational state:

- rate limit counters
- pairing/session cache entries
- queue hook point for later malware scan, cleanup, notification, and abuse pipelines

Socket.IO can use the Redis adapter when `SOCKET_IO_ADAPTER=redis`. That removes the single-process room fanout assumption for transfer events. Sticky sessions may still be useful for WebSocket upgrade stability at the load balancer, but room broadcasts no longer depend on all peers being attached to the same Node.js process.

## QR role

QR is only for session/device pairing. It carries a versioned pairing payload with server URL, session ID, manual code, and a deep-link-friendly value. Actual file upload/download uses the paired session and role authorization; the PC never scans anything.

Session creation and join responses include role-specific device trust tokens. In `REQUIRE_DEVICE_TRUST=true` mode, the web and mobile clients pass those tokens on Socket.IO joins and protected transfer/upload/download API calls.

There are two QR codes in development:

- Expo Go QR: terminal QR used only to open the mobile app in Expo Go.
- Vibe Share session QR: PC web QR scanned inside the mobile app to join a transfer session.

The phone must not use `localhost` to reach the PC. Pairing QR payloads should carry the PC LAN server URL, such as `http://192.168.x.x:4000`.

## Transfer state model

```text
created
uploading
uploaded
scanning
quarantined
released
failed_scan
pending_accept
accepted
rejected
downloading
completed
failed
expired
cancelled
```

PC -> mobile and mobile -> PC use the same transfer model. Direction is represented by `from` and `to`.

## Why local relay is not enough

The legacy local relay posts the whole file through the API server and stores it as a temporary server file. That is acceptable for a demo and Expo Go compatibility, but it is not suitable for 100GB commercial transfer because API bandwidth, disk pressure, retry semantics, cleanup, and failure recovery all become product risks.

## Large-file architecture

The production-oriented path is resumable multipart upload:

1. Client initiates upload metadata.
2. Server creates an upload session and provider multipart upload.
3. Client requests a signed part URL.
4. Client uploads the part directly to storage in S3 mode or to the local adapter in demo mode.
5. Server records upload part state and checksum metadata.
6. Client completes the upload.
7. Malware scan hook moves through scanning/released/quarantined/failed_scan.
8. Receiver accepts or rejects.
9. Download uses a signed URL or a streaming-safe local download route.

Expo Go mobile keeps a small-file relay path for compatibility. In S3 mode those relay transfers are still downloaded through the API because their bytes are temporary server files, not S3 objects. Browser resumable uploads use the S3-compatible path in production-like mode.

## Operational visibility

The server emits structured JSON logs. Admin status includes:

- configured vs active database/cache/realtime/storage drivers
- fallback warnings
- health for PostgreSQL/JSON metadata, Redis/memory cache, Socket.IO adapter, and S3/local storage
- runtime counts for sessions, transfers, upload sessions, and pairings
- retention and file-size limits

Development mode may fall back from PostgreSQL/Redis to JSON/memory so beginners are not blocked. Production mode treats required infrastructure and secrets as startup blockers.
