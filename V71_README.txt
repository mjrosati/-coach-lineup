Coach Lineup v71 — Forced 3-Column Current Screen

Why v70 did not change:
The screenshot is about 700 physical pixels wide, but the browser's CSS viewport is much narrower.
The v70 rule only started at 600 CSS pixels, so it never activated.

v71 deliberately applies the requested layout down to a 340px CSS viewport:

LEFT
- Players are permanently visible.
- Left roster scrolls independently.

CENTER
- Football field stays fixed.
- Center automatically shrinks to make room for both rails.

RIGHT
- Game Day menu is permanently visible.
- Right menu scrolls independently.

No drawers.
No hidden player list.
No action grid underneath the field at this screen width.

No database migration required.

Replace all four:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.

Verify:
v71 • FORCED 3-COLUMN CURRENT SCREEN
