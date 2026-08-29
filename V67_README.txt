Coach Lineup v67 — CLEAN LAYOUT RESET

Why this build exists:
The screenshot showing "v65 • Side Drawer Fix" proves the device is still loading the old v65 files.
The v66 rollback was not actually reaching the browser.

This build:
- Uses the known-good v61 Game Day layout (no drawer tabs).
- Removes the v62-v65 sidebar/drawer experiments.
- Adds a one-time browser cache + service-worker reset.
- Cache-busts styles.css/app.js/config.js/manifest with ?v=67.
- Reloads once with ?build=67 so it is obvious the new index loaded.
- Shows: "v67 • CLEAN LAYOUT RESET"

IMPORTANT:
Replace ALL FOUR files in GitHub:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.

After deployment, close the app completely and reopen the website.
The first load may refresh itself once while old caches are cleared.

No database migration required.
