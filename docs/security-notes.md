# Security Notes

## Product security wording

Use precise claims:

- Session/permission-based transfer flow.
- Receiver accept/reject before download/save.
- Device trust token foundation for protected join/upload/download paths when enabled.
- Object-storage-oriented large upload architecture.
- Health/status/logging visibility for operators.
- Audit hook and cleanup command foundation.

Do not claim:

- absolute safety
- unhackable transfer
- complete end-to-end encryption
- complete malware blocking
- full compliance readiness
- guaranteed 100GB mobile background upload on all devices

The same wording is captured for launch use in `docs/launch/security-messaging.md`.

## Implemented foundation

- Session expiry and transfer expiry.
- Receiver accept/reject gate before download.
- Configured 100GB file-size policy for the resumable path.
- Smaller legacy relay limit for local/Expo Go compatibility.
- MIME allowlist hook through `ALLOWED_MIME_TYPES`.
- Redis-backed rate limit when `CACHE_DRIVER=redis`, memory fallback in local demo mode.
- Socket.IO Redis adapter foundation when `SOCKET_IO_ADAPTER=redis`.
- Device trust token skeleton for anonymous sessions.
- Web and mobile clients pass device trust tokens on Socket.IO join and protected transfer/upload/download calls when device trust is required.
- Dev-login JWT issuance for private-beta testing. This is not a full public auth product.
- PostgreSQL audit log table plus JSON fallback audit log.
- Signed URL TTL configuration for S3-compatible storage.
- Per-part checksum metadata and local chunk checksum validation.
- Malware scanning webhook hook point.
- Admin health/status endpoints with production admin token gate.
- Production env validation that blocks startup when required services/secrets are missing.
- Admin status reports configured drivers, active drivers, and fallback warnings so accidental JSON/memory fallback is visible.
- Integration smoke now includes negative device-trust checks for Socket.IO join and protected upload initiation.

## Abuse response hook points

- `audit_logs` records session, pairing, upload, accept/reject, complete, failure, and cancellation events.
- `devices` stores role and trust token hash so later blocking can attach to a device identity.
- Redis queue hook can later feed malware scanning, abuse review, retention cleanup, notifications, and billing jobs.
- Admin endpoints report runtime session/transfer/upload counts and storage/db/cache status.

## Retention and deletion

Local demo mode stores files under `.tmp/uploads` and metadata under `.tmp/metadata.json`. Cleanup removes expired in-memory sessions and transfers, but local files should still be treated as disposable development data.

Production must add:

- Object storage lifecycle rule for expired completed objects.
- Abort-incomplete-multipart lifecycle rule.
- Scheduled cleanup job for expired transfer metadata and orphaned upload sessions.
- User-facing retention/deletion policy.
- Audit retention policy separate from file retention.

## Malware scanning

`MALWARE_SCAN_WEBHOOK_URL` is called after upload completion and before receiver download is expected. The server now models `uploaded -> scanning -> pending_accept` for released files, and `quarantined` or `failed_scan` for blocked/failed scan outcomes. The current implementation is still a hook point, not a full scanner. A commercial deployment needs scanner result storage, quarantine UI, retry rules, and admin review.

## Signed URL expiry

`SIGNED_URL_TTL_SECONDS` defaults to 900 seconds. Shorter TTL reduces leakage risk. Very slow uploads may need part URL refresh logic and client-side retry/backoff.

## Remaining security gaps before launch

- Private beta still relies on trusted testers and dev-login/anonymous flows, not a full public account system.
- Full account login and verified identity flows.
- JWT validation and authorization policy for logged-in users.
- Public UX and policy for long-lived device trust beyond a single anonymous session.
- Abuse/reporting UI and admin search.
- Least-privilege S3 IAM policy and KMS/object encryption policy.
- Centralized structured log ingestion and alerting.
- Privacy/legal copy for data retention and deletion.
