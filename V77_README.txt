Coach Lineup v77 — Mobile / iPad Fit Fix

Fixes the two issues shown in the screenshots:

1. NORMAL iPAD / MOBILE VIEW
- Right-side Game Day controls no longer overlap or get covered.
- On iPad-sized screens the right side becomes a single narrow control rail.
- Desktop Playing Time / Line Stats analytics are hidden at tablet widths so the field and controls fit.
- Tap STATS for the full stats view on tablet/mobile.

2. FULLSCREEN
- Combined offense + defense fit inside the visible screen.
- Player cards shrink at mobile/tablet widths rather than clipping off the right edge.
- Game status strip is kept inside the viewport.
- Bottom fullscreen controls are kept inside the viewport.
- Selected-play banner is prevented from covering the defense.
- Narrow screens scale down further instead of cutting off players.

Desktop layout remains unchanged.

No database migration required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.

Verify:
v77 • MOBILE FIT FIX
