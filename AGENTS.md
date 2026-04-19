# AGENTS.md

## Goal
Build a beginner-friendly MVP that lets a PC web page and a mobile app send files in both directions after QR pairing.

Important: the PC may not have a camera.
Therefore QR is only required for the phone to scan the PC screen once.
After pairing, the same session must support both:
- PC -> phone file transfer
- phone -> PC file transfer

## User profile
- The user is non-technical.
- Prioritize simple local setup over perfect architecture.
- Do not ask the user follow-up questions unless truly blocked.
- Make reasonable decisions and document them clearly.

## Product requirements
Create the project from an empty repository.

Use a monorepo with npm workspaces.

Required apps:
- apps/server: Node.js + Express + Socket.IO relay server
- apps/web: desktop-friendly web UI
- apps/mobile: Expo managed React Native app

Default UI language:
- Korean

## Core flows
1. PC web page creates a session and shows:
   - QR code
   - 6-digit manual pairing code
2. Mobile app can:
   - scan the QR code
   - or manually enter the 6-digit code
3. After pairing, both directions must work in the same session:
   - PC sends file to phone
   - phone sends file to PC
4. PC must never require camera scanning.
5. Receiving side must support:
   - accept
   - reject
6. Show:
   - progress
   - pending / success / failure states
   - file metadata
   - clear download or save action

## Architecture constraints
- Use server relay for v1, not WebRTC.
- Use current stable packages.
- Prefer JavaScript over TypeScript unless there is a strong reason not to.
- Keep dependencies lean.
- Keep the mobile app compatible with Expo Go if reasonably possible.
- Avoid native modules that make first-run difficult.
- Use temporary file storage on the server.
- Add cleanup for expired files and sessions.
- Add sensible file size limits and validation.
- Document all limits in README.

## UX requirements
- Make the web UI simple and obvious for desktop use.
- Make the mobile UI simple and touch-friendly.
- Include connection state indicators.
- Include clear error messages in Korean.
- Include fallback text explaining LAN IP / same Wi-Fi requirements for local development.

## Required deliverables
Create all code and files needed for a runnable MVP, including:
- root package.json
- npm workspaces
- apps/server
- apps/web
- apps/mobile
- .gitignore
- .env.example
- README.md for absolute beginners
- any helper scripts needed for local development

## Root scripts
Create root scripts so the user can run:
- npm install
- npm run dev:server
- npm run dev:web
- npm run dev:mobile

Optional but preferred:
- npm run dev
- npm run lint
- npm run test or npm run smoke

## README requirements
The README must explain, step by step, for an absolute beginner:
1. what this project does
2. required installs
3. how to install dependencies
4. how to run server
5. how to run web
6. how to run mobile
7. how to find the PC LAN IP
8. how to test PC -> phone transfer
9. how to test phone -> PC transfer
10. common errors and fixes

## Quality bar
- Do not leave the project half-scaffolded.
- Do not stop after generating boilerplate.
- Install dependencies, run scripts, fix errors, and reach a working local MVP.
- If package versions differ, choose versions that work now.
- Prefer practical implementation over theoretical perfection.

## Final response format
When done, report:
1. project tree
2. what was created
3. key architectural decisions
4. exact install commands
5. exact run commands
6. any environment variables
7. how QR pairing works
8. how phone -> PC works without a PC camera
9. demo steps
10. known limitations