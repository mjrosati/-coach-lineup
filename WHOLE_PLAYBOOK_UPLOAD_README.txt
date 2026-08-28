Coach Lineup — Whole PDF Playbook Upload

The old PDF PLAYBOOK button only generated/exported a PDF list. It did not upload a playbook.

This update changes the Team Playbook toolbar:
- UPLOAD PLAYBOOK opens a PDF file picker.
- Selecting the PDF uploads the entire team playbook immediately.
- The uploaded PDF is saved for the team and available on other devices/coaches.
- VIEW PLAYBOOK appears once a team playbook is uploaded.
- VIEW PLAYBOOK opens the full PDF with OPEN PDF, FULL SCREEN, and CLOSE.
- Uploading another team playbook replaces the previous one.
- EXPORT PLAY LIST keeps the old generated play-list PDF feature.
- Individual play PDFs/images continue to work separately.

Database migration installed:
teams.playbook_pdf_path
teams.playbook_pdf_name
teams.playbook_pdf_updated_at

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
