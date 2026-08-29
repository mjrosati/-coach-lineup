Coach Lineup — Offline Sideline Mode

What is now available offline after the app has been opened online at least once:
- app shell / Game Day screen
- roster
- lines and field positions
- current assignments
- current active game
- locally cached playbook metadata
- NEXT LINE and opponent rotation tracker
- substitutions / clearing a position
- RECORD / QUALITY / TD for a selected play
- playing-time counts and percentages
- quarter / clock / possession / down / distance / drive
- local opponent tracking

How sync works:
- Offline substitutions and recorded plays are saved into a local sync queue.
- The top status shows OFFLINE and how many changes are saved.
- When internet returns, Coach Lineup automatically attempts to sync queued changes to Supabase.
- Tap the connection-status badge while online to retry sync manually.

Important:
- Open Coach Lineup while online before going to the field so the latest team/game data is cached.
- Start the game while online when possible. Offline mode is designed primarily to continue an already-loaded/current game.
- Team setup changes that are not game-day actions (creating teams, adding roster players, editing playbook files, etc.) still require internet.
- PDF/image attachments may require internet unless the browser has already cached them.
- Do not clear Safari/browser website data during an offline game because the local queue is stored on the device.

No database migration required.

Replace:
index.html
app.js
styles.css
sw.js
Keep config.js unchanged.
