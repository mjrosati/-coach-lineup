Coach Lineup v68 — Fixed Field Rails

This version fixes the narrow portrait layout with a simpler approach:

- The football field stays full-width and does NOT move.
- PLAYERS tab is always visible on the LEFT edge.
- MENU tab is always visible on the RIGHT edge.
- PLAYERS opens the existing roster as a scrollable overlay.
- MENU opens the existing Game Day controls as a scrollable overlay.
- Each overlay scrolls independently.
- Tap outside an open side panel to close it.
- On screens wider than 900px the original permanent left/right desktop columns remain.

This does not depend on AUTO device detection.

No database migration required.

Replace all four:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.

Verify the bottom badge says:
v68 • FIXED FIELD RAILS
