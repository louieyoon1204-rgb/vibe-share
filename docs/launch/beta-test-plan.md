# Beta Test Plan

## Goal

Test the web-first store-beta flow before public launch:

1. PC opens web app.
2. Phone camera scans the QR.
3. Phone connects to the same session.
4. User chooses send or receive.
5. Transfer completes in both directions.

## Required Setup

- Staging API is live.
- Staging web app is live.
- iOS TestFlight or EAS preview build is available if testing native app.
- Android internal testing or EAS preview build is available if testing native app.

## Test Cases

- QR scan pairing
- 6-digit code fallback
- stale localhost storage recovery
- PC -> phone small file
- PC -> phone larger file
- phone -> PC file
- receiver accepts
- receiver rejects
- download starts only after the user taps download
- session expiration message
- localhost blocked on phone
- app/browser relaunch after pairing loss

## Pass Criteria

- User can complete the happy path without reading operator docs.
- PC first screen clearly prioritizes QR pairing.
- File selection appears after connection.
- Both transfer directions work in one session.
- No debug/operator wording appears in user screens.
- No mobile-facing URL contains loopback host values.

## Report Template

Use `tester-feedback-template.md`.
