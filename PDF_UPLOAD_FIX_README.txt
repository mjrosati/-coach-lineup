Coach Lineup — PDF Upload Fix

Fixed PDF/image attachment uploads, especially on iPhone/iPad:
- Accepts .pdf explicitly from the iOS Files picker.
- Detects PDF by filename if Safari sends a blank or incorrect MIME type.
- Re-wraps the selected file with the correct MIME type before uploading.
- Shows the selected filename and file size before saving.
- Shows UPLOADING… while the file is being sent.
- Provides a specific error message if storage upload or play attachment linking fails.
- Existing 15 MB per-attachment limit remains unchanged.

Supabase bucket and attachment columns were verified and are already configured.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
