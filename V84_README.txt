Coach Lineup v84 — Saved Lineups Tablet Fix

Fixes the white iPad popup shown in the screenshot.

Changes:
- Removed the browser/native window.prompt used to name a saved lineup.
- Replaced it with a dark in-app Save Current Lineup dialog.
- Dark text input designed for iPad/Safari.
- Saved Lineups modal is now tablet-sized and scrollable.
- Saved lineup entries are cleaner and easier to tap.
- Delete buttons are kept narrow.
- Empty-state message is readable.
- Pressing Enter while naming a lineup saves it.
- Existing lineup-template database behavior is unchanged.

No database migration required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.

Build:
v84 • SAVED LINEUPS FIX
