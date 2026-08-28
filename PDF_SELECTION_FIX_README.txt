Coach Lineup — PDF Selection Fix

This update fixes the issue where selecting a PDF immediately caused:
"Failed to load PDF document."

New behavior:
- Selecting a PDF does NOT attempt to preview/open it.
- The app only shows:
  filename selected • file size
- The PDF is uploaded only after pressing SAVE PLAY.
- Basic type and 15 MB validation still happens immediately.
- Existing attached PDFs can still be viewed after they have successfully uploaded.

No database migration is required.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
