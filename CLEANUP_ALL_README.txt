Coach Lineup — v61 Cleanup + Offline

Updated everything from the cleanup recommendation pass:

1. Opponent Rotation
- Added UNDO ROTATION
- Recalculates appearances, percentages, and streaks after undo
- Keeps 11 individual opponent slots
- Added duplicate-record guard for accidental double taps

2. Offline Readiness
- Added OFFLINE READY button
- Shows cached roster, lines, positions, assignments, current game, and playbook status
- Shows pending sync count
- Includes refresh-cache and sync-now controls

3. Game Day Settings
- New GAME DAY SETTINGS button
- Can show/hide:
  - Playbook controls
  - Stats button
  - Opponent button
  - Playing-time alerts
- Optional compact sideline spacing

4. Stats/Opponent cleanup
- More consistent naming around Player Participation and Opponent Participation
- Clearer warning styling

5. Mobile/Tablet cleanup
- Cleaner button spacing
- Better two-column action layout on smaller screens
- Game strip adapts to smaller screens
- Field remains the priority

6. Build/version
- Added small visible build badge:
  v61 • Cleanup + Offline

7. Offline mode remains included
- Local queue + automatic sync when internet returns

No database migration required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
