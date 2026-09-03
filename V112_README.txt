Coach Lineup v112 — Button Reset

This version removes the layered button system from v108-v111.

Changes:
- Removed old capture-level pointer/touch handlers.
- Removed old transparent panel overlays.
- Removed old cloned-node listener cleanup.
- Added one visible OPEN button to each dashboard panel.
- Added one clean click listener per button only.
- UNDO PLAY and NEXT LINE remain inside PLAY LINES and use clean click listeners.
- Main Dashboard gets one clean handler.
- No document-level interception.
- No duplicate touch/pointer/click handlers.

No database migration required.
