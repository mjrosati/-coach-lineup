Coach Lineup — Fullscreen Game Day Play Picker

Added to FULL SCREEN Game Day:
- PICK PLAY button always visible in the fullscreen controls.
- Opens an in-game play drawer without leaving the field.
- Filter by ALL / RUNNING / PASSING / SPECIAL.
- Tap a play name to select it as the current play.
- Tap VIEW beside any play with an attached PDF/image to view the play immediately.
- VIEW FULL PLAYBOOK is available in the picker if the team-wide PDF playbook has been uploaded.
- Selected play remains on the fullscreen field with VIEW PLAY plus RECORD / QUALITY / TD.
- NEXT LINE remains the only control that changes personnel.
- PDF viewing uses authenticated download + local Blob URL for reliability.

No database migration required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
