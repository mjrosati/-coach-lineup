Coach Lineup v85 — Fullscreen XL + Next Line Highlight

Changes:
- Tablet fullscreen player boxes are larger again.
- Position labels and player names are larger.
- Bottom fullscreen buttons are much larger and easier to read/tap.
- Fullscreen game strip buttons are also larger.
- Highlight logic changed:
  OLD: players who were on the previous line.
  NEW: players who are scheduled on the NEXT line.
- NEXT-line players get a strong white/blue outline plus a small NEXT badge.
- Works for offense and defense.
- No database migration required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.

Build:
v85 • FULLSCREEN XL + NEXT LINE
