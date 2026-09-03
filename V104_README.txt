Coach Lineup v104 — Hard Dashboard Fix

This version fixes two specific problems visible in v103:
1. The center FIELD was only occupying the top row because an older grid-row:auto rule overrode the intended row span.
2. The side panel renderer could fail as one large operation; v104 renders Players, Lines, Stats, Plays and Field independently so one section cannot blank the others.

Layout is now explicit:
- Players = upper left
- Stats = lower left
- Field = full-height center (spans BOTH rows)
- Play Lines = upper right
- Plays = lower right

The dashboard refreshes live while visible.
No database migration required.
