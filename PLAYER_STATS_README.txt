ALL PLAYER STATS UPDATE

The existing STATS button now opens one list of every player.

Current game:
- Player name and jersey
- Number of recorded plays
- Percentage of all recorded plays
- Position breakdown from recorded play participants
- Current saved line membership
- Sort by lowest %, highest %, most plays, or name
- Tap a row to expand details

Lowest percentage is the default view.

Important: historical play records currently store player and position, but not line_id.
Because of that, line membership shown here is the player's CURRENT saved line membership.
A future database update can add exact historical plays-per-line.

No database migration required.

Replace app.js, styles.css, sw.js.
index.html included unchanged.
Keep config.js unchanged.
