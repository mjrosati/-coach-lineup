Coach Lineup v82 — Linked Tap Substitutions

Fixes:
- Tap any player/position box directly on the football field.
- A replacement-player list opens.
- Tap a replacement to change the player immediately.

Linked offense/defense behavior:
- If the outgoing player is also assigned on the OPPOSITE SIDE of the SAME LINE,
  the replacement is automatically made there too.
- Example: replace #20 on Black Line offense. If #20 is also on Black Line defense,
  the selected replacement takes that defensive assignment too.
- Incoming player's saved opposite-side position is preferred when it can be used
  safely; otherwise the outgoing player's existing opposite-side position is used.
- Works online and with the existing offline assignment queue.

No database migration required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.

Build:
v82 • LINKED TAP SUBS
