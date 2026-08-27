Coach Lineup — FINAL POLISH PACKAGE

Final polish included:
- New Coach Lineup home-screen icons (180, 192 and 512)
- Improved PWA manifest for phone/tablet installation
- Standalone app mode and iPhone/iPad home-screen icon support
- LIVE / OFFLINE connection indicator on the dashboard
- Better touch feedback and keyboard focus states
- Safe-area handling for installed iPhones/iPads
- More robust service worker
- Old caches are removed automatically
- Failed GitHub/error responses are no longer stored in the PWA cache
- Navigation prefers the live site and falls back to the cached Coach Lineup app if needed
- Static files stay fast from cache while updating in the background

Upload/replace:
1. index.html
2. app.js
3. styles.css
4. sw.js
5. manifest.webmanifest
6. icons/icon-180.png
7. icons/icon-192.png
8. icons/icon-512.png

IMPORTANT:
- Keep your existing config.js exactly as it is.
- No Supabase/database changes are needed.
- After GitHub Pages deploys, remove the old Coach Lineup Home Screen icon once, reopen the site in Safari, then Share > Add to Home Screen.
