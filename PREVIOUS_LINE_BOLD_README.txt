Coach Lineup — Previous Line Player Indicator

Added:
- On the currently displayed OFFENSE or DEFENSE line, a player is shown in bold if that same player was also on the immediately previous line.
- The player's field box also gets a slightly thicker border for quick recognition.
- Offense compares with the previous line's offense.
- Defense compares with the previous line's defense.
- Line 1 compares with the last line, so the rotation wraps naturally.
- Special Teams is unchanged.

No database migration is required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
