Coach Lineup v64 — Tablet Sidebar Fix

Root cause fixed:
AUTO device mode previously did not assign a tablet class, so the portrait mobile CSS kept hiding the player roster even on an iPad/tablet.

Now:
- AUTO detects touch tablets using screen size.
- iPads/tablets automatically use TABLET layout.
- Player roster stays visible on the LEFT.
- Game controls stay visible on the RIGHT.
- Both side panels scroll independently.
- The center field stays fixed.
- Rotation/orientation changes re-detect the layout automatically.
- Phones still keep the compact mobile layout.

No database migration required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
