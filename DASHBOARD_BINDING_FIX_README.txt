Coach Lineup — Dashboard Binding Fix

Fixed:
- Dashboard cards were visible but did nothing when clicked.
- Cause: the removed NEXT PLAY button (nextSide) still had a direct JavaScript binding.
  That JavaScript error stopped the rest of the dashboard click handlers from loading.
- The stale binding is now safe/optional.
- Service-worker cache was bumped so devices receive the corrected app.js.

Replace:
index.html
app.js
styles.css
sw.js

Keep config.js unchanged.
