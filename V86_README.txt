Coach Lineup v86 — HARD CACHE RESET

The app still showing v83 means the iPad is loading an old cached build.

v86 includes all v85 features PLUS:
- one-time unregister of old service workers
- deletes old browser caches
- reloads with ?build=86
- forces index.html to load styles.css/app.js/config.js/manifest using ?v=86
- new service worker cache name

IMPORTANT:
Replace ALL FOUR files:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.

After deployment:
1. Fully close Safari / the installed app.
2. Reopen Coach Lineup.
3. It may refresh once automatically.
4. Confirm bottom badge says:
   v86 • HARD CACHE RESET

If it still says v83 after that, the new index.html is not the version being served.
