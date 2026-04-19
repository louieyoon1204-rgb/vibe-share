# Security Messaging

## Safe claims

- PC does not need a camera.
- The phone scans the QR shown on the PC screen.
- The receiver can accept or reject a transfer.
- Files are stored temporarily for transfer.
- Production uses PostgreSQL, Redis, and S3-compatible storage.
- Admin health/status endpoints are separate from user screens.

## Avoid these claims

- "완전 안전"
- "해킹 불가"
- "모든 파일을 자동으로 악성 검사 완료"
- "end-to-end encryption"
- "모든 환경에서 100GB 모바일 background upload 보장"

## Review-safe beta wording

```text
Vibe Share is a beta file transfer app. It pairs a PC web page and a mobile app with a QR code. Receivers can accept or reject files before saving them.
```

## Operational note

Before public launch, attach the real malware scanner and finalize retention/deletion policy.
