# Coach Lineup — Live Game Version

This build is connected to your live Supabase project.

## Included
- Coach sign-in / account creation
- Create a team or join with an invite code
- Shared cloud roster
- Multiple named/color-coded lines
- Editable player position labels
- Full-field game screen
- Names / jersey-number toggle
- Tap a field position to assign/substitute a player
- Start / finish games
- NEXT PLAY records who was on the field
- PREV removes the most recent recorded play
- Playing-time percentages and threshold warnings
- PWA manifest + service worker for phone/tablet installation

## Put it online
The easiest route is GitHub Pages:
1. Create a GitHub repository named `coach-lineup`.
2. Upload all files in this folder to the repository root.
3. GitHub → repository Settings → Pages.
4. Under Build and deployment, choose "Deploy from a branch".
5. Select `main` and `/ (root)`, then Save.
6. GitHub will give you an HTTPS address.

## Install on iPhone
Open the HTTPS address in Safari → Share → Add to Home Screen → enable "Open as Web App" if shown → Add.

## Security
`config.js` contains only a browser-safe Supabase publishable key. Never add a service_role or secret key to this app.
