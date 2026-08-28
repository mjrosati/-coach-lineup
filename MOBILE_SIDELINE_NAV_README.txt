Coach Lineup — Mobile Sideline Navigation Update

Changed mobile Sideline Mode:
- Added a sticky 2-row quick navigation bar:
  OFFENSE, DEFENSE, SPECIAL, SUB, TIME, PLAYBOOK, SUGGEST, HISTORY
- Game strip stays visible while scrolling.
- Field height is reduced to fit phones better.
- Bottom game controls are sticky and thumb-friendly.
- Only the essential recording controls remain at the bottom:
  RECORD, QUALITY, TD, SUBSTITUTE, LOCK, EXIT SIDELINE
- Duplicate setup/report controls are hidden from the bottom action area on mobile.
- Desktop Sideline Mode is unchanged.

No database migration is required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
