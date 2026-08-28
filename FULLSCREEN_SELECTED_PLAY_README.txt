Coach Lineup — Fullscreen Selected Play Update

When the Game Day field is in FULL SCREEN and a play has been selected:
- The selected play name stays visible at the bottom of the fullscreen field.
- Formation is shown when available.
- VIEW PLAY / VIEW PDF is available directly from fullscreen.
- RECORD / QUALITY / TD are also available there for the selected play.
- The panel disappears when no play is selected.
- NEXT LINE remains separate and is still the only control that changes the lineup.

No database migration is required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
