Coach Lineup v106 — Real Data Fix

This version fixes the actual cause of the blank dashboard:
- The dashboard renderer is now defined BEFORE showGameScreen().
- showGameScreen calls it directly and unconditionally.
- It uses the same global players, lines, assignments, positions, counts and playbookPlays arrays already used by Game Day.
- Removed the v105 MutationObserver mirror loop.
- Players, Lines, Stats, Plays and Field render independently.
- Field uses currentLineAssignments() and the exact position labels/coordinates.
- No database changes.

Expected result:
- Players panel populated.
- Play Lines panel populated.
- Stats panel populated.
- Plays panel populated.
- Center field populated with current offense/defense assignments.
