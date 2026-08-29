Coach Lineup v66 — Layout Rollback

This intentionally rolls the Game Day layout back to the last known-good version
from before the scrollable-sidebar experiments.

Restored:
- Original player roster behavior
- Original Game Day controls behavior
- Original field sizing/layout
- All v61 features remain:
  - larger field position font
  - Stats menu updates
  - 11-slot opponent tracker
  - Offline Sideline Mode
  - Undo Opponent Rotation
  - Offline Ready check
  - Game Day Settings
  - mobile/tablet cleanup
  - app build badge

Removed:
- v62/v63/v64/v65 sidebar/drawer layout experiments

No database migration required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
