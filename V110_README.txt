Coach Lineup v110 — Clean Tap Handlers

ROOT CAUSE FOUND:
v108 left document-level pointerup/touchend capture listeners in app.js.
Those listeners fired BEFORE the v109 overlay button's click event and called stopImmediatePropagation().
That prevented the new expand button from ever receiving the tap.

There were also multiple older per-panel click listeners from v97/v102/v106.

v110 fixes this by:
- Removing the v108 document capture interception code.
- Removing old v108 inline panel handlers.
- Cloning the five panel nodes after page load to strip all stale per-panel listeners.
- Wiring only the v110 transparent overlay buttons.
- Supporting click, pointerup, and touchend directly on those buttons.
- Adding an EXPAND indicator to each panel.
- Keeping the in-place full-panel expansion and ALL 5 PANELS return button.

No database migration required.
