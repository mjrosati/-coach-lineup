Coach Lineup — Remove Reset Field

Removed RESET FIELD from the Game Day interface.

This does not change:
- player assignments
- Edit Field
- fullscreen
- Next Line
- substitutions
- play recording

No database migration required.

Replace:
index.html
app.js
sw.js

styles.css is included but unchanged.
Keep config.js unchanged.
