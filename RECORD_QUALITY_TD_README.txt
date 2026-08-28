Coach Lineup — One-Tap Record / Quality / TD Update

Changed the game recording workflow:

- RECORD records the current players/play and advances to the next line.
- QUALITY records the current players/play, marks the called play as a quality play, and advances.
- TD records the current players/play, marks the called play as both Quality and Touchdown, and advances.
- The separate NEXT PLAY button is replaced by these one-tap choices.
- Playing-time totals update when any of the three buttons is pressed.
- The selected NEXT CALL is recorded with the exact play.
- If no playbook call is selected, player participation is still recorded normally.

No new database migration is required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
