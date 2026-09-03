Coach Lineup v103 — Dashboard Layout Fix

What was wrong in v102:
- The new game-status strip added a THIRD row to the dashboard.
- The CSS still defined only TWO rows.
- Safari/iPad created an implicit giant row, which pushed the real five-panel grid to the bottom and collapsed the field/panels.

v103 fixes:
- Dashboard now explicitly uses:
  1. Header
  2. Game status strip
  3. Five-panel dashboard
- Field fills the center vertically.
- Players + Stats fill the left side.
- Play Lines + Plays fill the right side.
- Side panels scroll internally if needed.
- Extra empty lower space is removed.
- Added delayed data refreshes so roster/lines/stats/playbook populate after async team data finishes.
- Keeps Tonka colors and existing Game Day logic.

No database migration required.
