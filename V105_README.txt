Coach Lineup v105 — Live Data Mirror

This version stops using separate dashboard data logic.

Instead, the five-panel dashboard mirrors the SAME already-rendered Game Day DOM:
- PLAYERS clones the working roster list.
- PLAY LINES clones the working line controls.
- STATS clones the working stats/analytics view.
- PLAYS clones the visible playbook/selected-play view when available.
- FIELD clones the actual rendered field itself.

Why:
The regular Game Day screen already proves the roster/field/line data is loaded correctly.
Mirroring that rendered UI removes the second data pipeline that kept failing in v101–v104.

Also:
- Uses a MutationObserver + timed refresh while the dashboard is open.
- Keeps the v104 explicit centered layout.
- No database migration required.
