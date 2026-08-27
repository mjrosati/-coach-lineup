Coach Lineup — Field Visual Upgrade + Next Play Fix

Changes:
- More realistic stadium-style field
- Alternating turf strips and subtle grass texture
- Yard numbers, hash marks, shaded end-zone areas
- Subtle Coach Lineup midfield watermark
- Better depth/shadows on player position cards
- Next Play now records atomically through Supabase
- Prevents duplicate play-number failures
- Keeps games.total_plays synchronized
- Button disables briefly while a play saves
- Clear error message if a play cannot be recorded
- PREV also keeps the database play total synchronized

Upload/replace:
1. app.js
2. styles.css
3. sw.js

The required Supabase Next Play backend function has already been installed.
