Coach Lineup v75 — Desktop Stats + Combined O/D

Desktop update based on the approved reference:

LEFT ROSTER
- Dedicated # / Player / POS / ST columns.
- Position is visible for every player.
- Status column is narrow: OK / INJ / OUT.
- Injured/out states remain color coded.

CENTER FIELD
- OFFENSE and DEFENSE are combined into one default field view.
- Red offense cards and blue defense cards appear together.
- SPECIAL TEAMS remains separate.
- One EDIT LINEUP button lets you:
  - edit offense assignments
  - edit defense assignments
  - move offense position boxes
  - move defense position boxes
- While editing one side, BACK TO BOTH returns to the combined field.

RIGHT SIDE
- Narrow Game Day control rail.
- Playing Time table for the current game.
- Player play counts and percentages.
- Status displayed in the stats table.
- Line Stats graph showing each line's percentage of recorded game plays.
- Line graph uses actual game_plays.line_id data, so it reflects real recorded line usage.

RECORDING
- In combined view, OUR BALL records offense players.
- Their ball records defense players.
- Special Teams recording remains separate.

No database migration required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.

Verify:
v75 • DESKTOP STATS + COMBINED O/D
