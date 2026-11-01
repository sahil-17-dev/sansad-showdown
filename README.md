# Sansad Showdown — Online Political Parody Fighter

An original browser fighting game inspired by the publicly visible structure and controls of FightKaro's Sansad Showdown. It does not copy FightKaro's private source code, artwork, audio or branding assets.

## Features in this build
- Online private rooms using Socket.IO: 1v1 and 2v2.
- Solo practice versus CPU.
- Room codes and invite copy.
- 11 original caricature-style character treatments: Modi, Rahul, Yogi, Trump, Nitin Gadkari, Mamta, Putin, Xi Jinping, Kim Jong Un, IShowSpeed and Mbapu (boss).
- Three arenas: Sansad, Jantar Mantar and Desi Sadak.
- Punch, kick, grab, block, crouch, jump and super meter.
- Keyboard and mobile touch controls.
- Server-side health, hit resolution, teams, room capacity and round state.
- Health endpoint at `/health`.

## Run locally
Requires Node.js 20+.

```bash
npm install
npm start
```
Open http://localhost:3000. Use two browser tabs for 1v1, four for 2v2.

## Deploy for friends
1. Upload this folder to a GitHub repository.
2. In Render, create a new Web Service and connect that repository.
3. Render detects `render.yaml`; deploy the service.
4. Share the public HTTPS URL with your friends.
5. Host a room and share the room code.

No shared Wi-Fi or router port-forwarding is required. The server is the central multiplayer host.

## Controls
A/D move · W jump · S crouch · hold Q block · J punch · K kick · I grab · L or Space super · Esc pause.

Mobile: tap and hold the on-screen buttons.

## Known limitations / next production steps
This is a substantial playable foundation, not a claim of bug-free production software. The character artwork is original CSS/shape-based placeholder caricature art rather than hand-drawn animated sprite sheets. The current CPU mode is a simple server bot. The game still needs browser/device playtesting, more robust lag compensation, disconnect/rejoin recovery, rate limiting, anti-cheat hardening, automated tests, sound/voice lines, polished frame animations and persistent player stats before a public launch at scale. Room state is in memory and active rooms reset when the service restarts. A free hosting plan may sleep or impose usage limits.

## Public reference analysis
The public FightKaro page exposes: landscape-first presentation; title/start screen; friend room host/join by code; character selection; stage choices (Sansad, Jantar Mantar, Desi Sadak); CPU difficulty; keyboard controls for movement, jump, crouch, block, punch, kick, grab, super; special inputs and combo strings; pause/music; rematch and character select. These are used as product-level reference points, not copied source or assets.
