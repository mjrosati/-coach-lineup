Coach Lineup — Selected Play Recording Workflow

Changed:
- RECORD / QUALITY / TD are hidden until a Playbook play has been selected as NEXT CALL.
- If no play is selected, those three buttons cannot record anything.
- RECORD / QUALITY / TD record the selected play and the players currently on the field.
- Recording a play no longer changes the displayed line.
- NEXT LINE is now the only control that changes the line.
- Selecting or clearing NEXT CALL immediately shows/hides the three recording buttons.

No database migration is required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
