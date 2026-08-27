Coach Lineup — Coach/Admin Role Fix

Problem fixed:
- A newly joined coach could see TEAM ADMIN because the app did not explicitly filter team_members to the signed-in user's own membership.
- The owner's membership could be loaded first, making a regular coach appear to have admin/owner controls.

Fix:
- Coach Lineup now loads team_members only for the CURRENT signed-in user.
- TEAM ADMIN appears only for OWNER or ADMIN.
- Regular COACH users can still edit lineups, substitutions and game data.
- OWNER-only controls remain owner-only.

Upload/replace:
1. app.js
2. sw.js

Keep your current index.html, styles.css, manifest and icons.
No database changes are needed for this fix.
