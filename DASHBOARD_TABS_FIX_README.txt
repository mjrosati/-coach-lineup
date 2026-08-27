Coach Lineup — Dashboard Tabs Fix

Cause found:
- app.js was trying to attach a click handler to ROTATE FIELD.
- The live index.html did not contain that button.
- That JavaScript error stopped execution before the dashboard card handlers were attached.
- Result: login worked, but Resume Game, Roster, Lines, Saved Lineups, Positions and Team Settings did nothing.

Fix:
- Restores the ROTATE FIELD button.
- Makes optional button bindings safe so one missing control cannot break the whole dashboard.
- Keeps the login transition fix.
- Bumps the service-worker cache.

Upload/replace:
1. index.html
2. app.js
3. sw.js

Keep your current styles.css.
No database changes are needed.
