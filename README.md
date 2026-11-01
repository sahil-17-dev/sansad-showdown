# Sansad Showdown — Rebuild v2

A mobile-friendly browser arena fighter using Phaser 3 for rendering and Socket.IO for real-time rooms.

## Run locally
- Install Node.js 20+
- `npm install`
- `npm start`
- Open `http://localhost:3000`

## Deploy on Render
1. Push the contents of this project to the root of a GitHub repository.
2. In Render choose **New → Blueprint** and select the repository.
3. Render reads `render.yaml`; apply the service.
4. Share the HTTPS service URL and room code.

## Controls
Keyboard: A/D move, W jump, Q guard, J punch, K kick, L/Space super, heavy button on mobile.
Mobile: use the on-screen controls; landscape is recommended.

## Notes
- This is a playable development build, not a finished commercial fighting game.
- Fighter visuals are procedural stylized placeholders; custom character art, frame-based animations, audio, combo balancing, rollback/lag compensation and extensive device testing are next production milestones.
- Multiplayer rooms are held in memory by one server instance. Do not horizontally scale without shared room state / Socket.IO adapter.
- CPU mode currently creates a private room shell; an actual CPU opponent AI is not yet implemented.
- Public figures are represented as fictional, non-photorealistic arcade avatars. This is a fan-made parody project, not endorsed by them.
