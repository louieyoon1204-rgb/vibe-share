# Privacy Policy Outline

This is a product/legal outline, not legal advice.

## Data processed

- Session ID
- Device role: PC or mobile
- Pairing code metadata
- File name
- File size
- MIME type
- Transfer status
- Temporary file content for relay/storage
- Basic request metadata such as IP address and timestamps

## Why it is processed

- Pair PC and mobile
- Transfer files
- Show transfer progress
- Let receivers accept or reject files
- Prevent abuse
- Clean up expired files and sessions

## Camera

The mobile app uses the camera only to scan the QR shown on the PC screen.

## File retention

Files are temporary. The current default retention is session/transfer based and should be clearly documented in the public policy before launch.

## Third parties

Production may use:

- Hosting provider
- PostgreSQL provider
- Redis provider
- S3-compatible object storage provider
- Malware scanning provider
- App Store / Google Play

## User controls

Before public launch, define:

- support contact
- account deletion flow if accounts are added
- data deletion request flow
- retention window
- abuse report flow

## Required public URLs

```text
https://vibeshare.app/privacy
https://vibeshare.app/terms
https://vibeshare.app/support
https://vibeshare.app/security
```
