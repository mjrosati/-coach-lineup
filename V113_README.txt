Coach Lineup v113 — Direct Button Fix

This version uses no window.load button bindings and no transparent tap overlays.

Each dashboard button directly calls the same already-working Game Day controls:
FIELD -> setFieldFullscreen(true)
PLAYERS -> openRosterManager()
PLAY LINES -> click #linesBtn
STATS -> click #statsBtn
PLAYS -> click #playbookBtn
UNDO PLAY -> click #prevBtn
NEXT LINE -> click #nextBtn
MAIN DASHBOARD -> showDashboard()

The whole panel also forwards to its OPEN button.

No database migration required.
