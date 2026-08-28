Coach Lineup — Suggestions Phase 3

Added:
- Player sorting by JERSEY #, NAME, or POSITION
- Jersey numbers sort numerically
- Position sort groups by primary position, then jersey number
- Sort choice is remembered on the device
- Sort controls appear on the sideline player list and full Roster screen
- CALL PLAY button inside the Playbook during an active game
- Selected play appears above the field as NEXT CALL
- NEXT PLAY records the called play together with the game play
- Current Game History shows the called play
- Saved Game Reports show how many times each play was called
- End-of-Game Report shows play-call usage

No database migration is required for this phase. Called-play information is stored safely inside the existing game-play note field.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
