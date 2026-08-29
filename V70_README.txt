Coach Lineup v70 — Locked 3-Column Tablet

This implements the exact requested layout for portrait widths between 600px and 900px:

LEFT
- Player roster is permanently visible.
- Scrolls up/down independently.

CENTER
- Game Day controls + football field.
- Field stays fixed in the center.
- Field shrinks to fit the available center width.

RIGHT
- Game Day menu is permanently visible.
- Scrolls up/down independently.

No drawers.
No disappearing sidebars.
No moving the field when either side is scrolled.

Phone widths under 600px keep the existing phone layout.
Desktop widths over 900px keep the existing desktop layout.

No database migration required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.

Verify:
v70 • LOCKED 3-COLUMN TABLET
