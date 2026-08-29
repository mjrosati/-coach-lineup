Coach Lineup v69 — Original Layout + Tablet Scroll

This starts over from v61, the last version BEFORE all of the side-rail/sidebar experiments.

PHONE:
- Exactly the original v61 phone layout.
- No PLAYERS rail.
- No MENU rail.
- No overlay shade.
- Original action buttons remain below the field.

TABLET / DESKTOP (768px and wider):
- Original left player roster is visible.
- Original right Game Day menu is visible.
- Left roster scrolls independently.
- Right menu scrolls independently.
- Center field stays fixed instead of scrolling with either side panel.

No database migration required.

Replace all four:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.

Verify the bottom says:
v69 • ORIGINAL LAYOUT + TABLET SCROLL
