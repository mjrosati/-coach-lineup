Coach Lineup — Lines + Player Availability + Playbook

DATABASE:
The Supabase migration has already been installed.

NEW FEATURES:
1. ADD / DELETE LINES
- Manage Lines now lets you add unlimited lines with a name and color.
- Existing lines can still be renamed/recolored.
- Lines can be deleted with confirmation.
- The final remaining line cannot be deleted.

2. ACTIVE / INJURED / OUT PLAYER STATUS
- Every roster player has a status.
- INJURED and OUT stay on the roster and keep historical stats.
- They are clearly marked in roster, sidebar and on the field.
- They cannot be selected for a new assignment.
- NEXT PLAY is blocked if an unavailable player is still assigned.

3. NO DUPLICATE PLAYER IN THE SAME ACTIVE LINEUP
- A player cannot appear twice on the same offense line.
- A player cannot appear twice on the same defense line.
- A player cannot appear twice in the same special-teams unit.
- The same player may still play offense AND defense.
- Database protection was also added for offense/defense assignments.

4. TEAM PLAYBOOK
- New PLAYBOOK button on Dashboard and Game screen.
- Categories: RUNNING, PASSING, SPECIAL.
- Add, edit, label and delete plays.
- Fields: name, category, code/number, formation, labels and notes.
- PDF PLAYBOOK creates a real PDF from the current play library and opens it.

UPLOAD / REPLACE:
1. index.html
2. app.js
3. styles.css
4. sw.js

Keep config.js unchanged.
Vercel should redeploy automatically after the files are updated in GitHub.
