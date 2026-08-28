Coach Lineup — Direct Player Replace Runtime Fix

Root cause found in the previous update:
- it referenced currentSide, which does not exist in this app
- it referenced positionLabels, but the app uses positions
- it expected a side column on line_assignments, which the current assignment records do not use
- it referenced playerName(), which also does not exist

Those JavaScript errors stopped the replacement popup from opening.

This version uses the app's actual working variables/functions:
- activeView
- positions
- currentLineAssignments()
- assignPlayer()
- clearAssignment()

Now:
1. Tap a player box.
2. Replace Player opens for that exact position.
3. Tap another player.
4. The existing proven assignment workflow updates the field.

No database migration required.

Replace:
app.js
sw.js

styles.css and index.html are included for convenience.
Keep config.js unchanged.
