Coach Lineup v65 — Side Drawer Fix

This changes the narrow/portrait layout approach instead of trying to permanently
fit three columns into a phone-width screen.

On phones and narrow portrait tablets:
- A PLAYERS tab appears on the left edge.
- A MENU tab appears on the right edge.
- Tap PLAYERS to slide in the full player roster.
- Tap MENU to slide in the full Game Day controls.
- Each drawer scrolls independently.
- The center football field does not move when either drawer opens.
- Tap outside the drawer to close it.

On wider tablets/landscape:
- Permanent left/right sidebars still work.

No database migration required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
