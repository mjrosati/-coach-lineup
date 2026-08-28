Coach Lineup — Fullscreen Bottom Game Strip

Changed fullscreen Game Day:
- NEXT PLAY is now NEXT LINE.
- The fullscreen NEXT LINE button calls nextLineOnly(), so it only changes personnel.
- The quarter / clock / possession / drive / down / distance row is now fixed at the bottom of fullscreen.
- The fullscreen action row (line badge, PICK PLAY, EXIT FULL SCREEN, NAMES, NUMBERS, NEXT LINE) sits directly underneath it.
- If a play is selected, the selected-play line with VIEW / RECORD / QUALITY / TD appears directly above the game-status row.
- The field is resized so these bottom rows do not cover players.

No database migration required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
