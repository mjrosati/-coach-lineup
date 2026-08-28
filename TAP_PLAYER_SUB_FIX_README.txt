Coach Lineup — Tap Player Substitution Fix

Fixed the issue shown in the screenshot:
- Tap any player box on the offense or defense field to open that position's substitution list.
- This now works even when Game Mode Lock is enabled.
- Game Mode Lock still protects field/setup editing; it no longer blocks normal game-day substitutions.
- Quick Sub also remains available while Game Mode Lock is enabled.
- Works in normal Game Day and fullscreen.

No database migration required.

Replace:
app.js
styles.css
sw.js

index.html is included but unchanged from the previous package.
Keep config.js unchanged.
