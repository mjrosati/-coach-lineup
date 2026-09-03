Coach Lineup v100 — Five Panel Game Day Home

Major navigation change:
- The app's actual showGameScreen() function now opens the 5-panel dashboard automatically.
- This means Resume Game, Game Day, and any other path that opens the game screen will land on the 5-panel dashboard.
- No dependency on the old MENU / DASHBOARD / 5-PANEL button handlers to reach the primary Game Day view.

Five sections remain:
1. FIELD — largest
2. PLAYERS
3. PLAY LINES
4. STATS
5. PLAYS

Navigation:
- RETURN TO FIELD reveals the traditional field screen.
- MAIN DASHBOARD returns to the team dashboard.
- Tonka blue / white / black theme preserved.

No database migration required.
