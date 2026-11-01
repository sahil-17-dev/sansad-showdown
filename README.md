# Sansad Showdown — Anime Arena Edition

A browser-based, anime-inspired 3D arena fighting prototype using Three.js, Express and Socket.IO.

## Local run
Node.js 20+, then `npm install`, `npm start`, open `http://localhost:3000`.

## Deploy
Push the contents of this folder to the root of your GitHub repository. In Render use the existing Web Service and deploy the latest commit, or use the included Blueprint.

## Controls
- Desktop: A/D move left/right, W jump, Q guard, J punch, K kick, U heavy, I grab, L ultimate.
- Mobile: use the on-screen analog joystick and action buttons. Landscape orientation is recommended.
- Multiplayer: create a private room, share the code, friends join from their own phones. 1v1 and 2v2 rooms.

## Implemented prototype systems
- 3D perspective arena with stylised procedural anime-inspired fighters.
- Server-authoritative movement, jump, stamina, attack cooldowns, hit range, blocking, damage, knockback, combo counter events, and best-of-three rounds.
- Private room matchmaking using Socket.IO.

## Important limitations
This is a development prototype, not a finished commercial game. Character models are procedural placeholder meshes rather than bespoke high-detail anime models; character likenesses are stylised and non-photorealistic. There is no sophisticated rollback netcode, matchmaking/ranking, CPU opponent AI, reconnect recovery, persistent accounts, voice acting, or comprehensive device/load testing. Multiplayer room state is in memory and designed for one server instance. Test with two separate devices before sharing widely. External Three.js CDN and Google Fonts need internet access.
