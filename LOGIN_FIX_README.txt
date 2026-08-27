Coach Lineup — Login Transition Fix

What was fixed:
- Supabase password login was succeeding, but the app could remain on the Sign In screen.
- The auth-state listener no longer performs awaited database work inside the Supabase auth callback.
- Successful Sign In now explicitly loads the Coach Lineup dashboard.
- Added a loading guard so two auth events cannot try to load the app at the same time.
- Sign In now shows "Signing in..." while it is working and displays a useful error if the app cannot finish loading.

Upload/replace:
1. app.js
2. sw.js

Keep your current styles.css — this fix is compatible with the latest mobile/tablet layout.
No database changes are needed.
