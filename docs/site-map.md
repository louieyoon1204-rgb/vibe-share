# Vibe Share Site Map

This separates planned public product surfaces from current local demo addresses.

## Planned Public Surfaces

- `https://vibeshare.app`: official site for marketing, download links, pricing, FAQ, support, policy, beta signup.
- `https://app.vibeshare.app`: web app / PC transfer screen.
- `https://api.vibeshare.app`: API, relay, status, auth foundation, metadata, admin health/status.
- Mobile app name: `Vibe Share` for iOS and Android.

DNS, domain purchase, production hosting, and store submission are not performed by this repo.

## Official Site Pages

- `/`: landing page with hero, value proposition, features, how it works, trust, pricing, FAQ, beta CTA.
- `/download`: links to iOS TestFlight, Android internal testing, and web app.
- `/pricing`: Free private beta, Personal, Pro, Team draft plans.
- `/faq`: product FAQ and local setup FAQ.
- `/security`: precise security/trust messaging and current boundaries.
- `/support`: support intake, bug report instructions, known issues.
- `/privacy`: data processed, retention/deletion, storage drivers, audit logs, user rights.
- `/terms`: acceptable use, beta limitations, service terms.
- `/status`: public operational status page after hosting is real.

## Current Local Demo Addresses

- PC web app on PC: `http://localhost:5173`
- Phone Safari web check: `http://<PC_LAN_IP>:5173`
- API on PC: `http://localhost:4000`
- Mobile app pairing server: `http://<PC_LAN_IP>:4000`
- Expo dev server: `http://localhost:8081`

The phone must not use `localhost`. On a phone, localhost means the phone itself.

## User Flow

1. User opens the PC web app.
2. User creates a Vibe Share session.
3. Mobile app scans the Vibe Share session QR shown on the PC screen.
4. Both devices send files inside the same session.
5. Receiver accepts or rejects each transfer.

## Operator Flow

1. Check `/health`.
2. Check `/admin/health`.
3. Check `/admin/status`.
4. Confirm `configuredDrivers`, `activeDrivers`, and `fallbackWarnings`.
5. Run cleanup through `npm.cmd run cleanup` or a scheduled production worker.
