Coach Lineup v102 — Live Sideline Dashboard

FIXED:
- Rebuilt the five dashboard panels as valid interactive sections instead of buttons containing divs.
  This avoids Safari/iPad parsing and tap issues.
- Players, Play Lines, Stats and Plays refresh from the same live app data used by Game Day.
- Dashboard refreshes after loadTeamData(), renderAll(), and while visible.
- Each section has click + keyboard handlers.

FIELD:
- Center field now renders the actual current line positions and jersey numbers.
- Offense = red outline.
- Defense = blue outline.
- Current line name appears on the mini field.

DESIGN:
- Cleaner Tonka blue / white / black theme.
- Live game status strip.
- Better panel hierarchy.
- Live line marker.
- Playing-time bars.
- Cleaner roster and playbook rows.
- Field remains the dominant center panel.

No database migration required.
