Coach Lineup v117 — Stable Update System

Purpose:
- Restores the working v114 five-section dashboard baseline.
- Adds coach-update.js as the permanent update layer.
- Future UI changes should go into coach-update.js whenever possible.
- Service worker treats coach-update.js network-first, so future single-file uploads can update quickly.
- Avoids repeatedly modifying app.js/styles.css and stacking conflicting fixes.

FIRST INSTALL:
Upload these 5 app files:
1. index.html
2. styles.css
3. app.js
4. sw.js
5. coach-update.js

After v117 is confirmed working, most future changes will require uploading ONLY:
coach-update.js
