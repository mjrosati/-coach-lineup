Coach Lineup v76 — Resume Game Fix

Root cause fixed:
v75 removed the standalone OFFENSE and DEFENSE buttons from the HTML, but app.js
still tried to assign .onclick directly to those missing buttons during startup.
That JavaScript error happened BEFORE the dashboard Resume Game handler was attached,
so the dashboard appeared normal but clicking RESUME GAME did nothing.

Fixes:
- Missing tab bindings are now safe.
- Combined OFFENSE / DEFENSE button is wired correctly.
- EDIT LINEUP now opens the side chooser correctly.
- RESUME GAME opens directly into the combined O/D view.
- Added a defensive Game Day error message instead of silently failing.
- All v75 roster status/position and desktop analytics changes remain.

No database migration required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.

Verify:
v76 • RESUME GAME FIX
