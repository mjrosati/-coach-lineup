Coach Lineup v107 — Force Refresh + Real Data

The latest screenshot still visibly showed:
v105 • LIVE DATA MIRROR

That means the iPad was not actually running v106.

v107 forces a fresh app load by:
- unregistering old service workers again
- deleting cached app files again
- using a NEW v107 reset key
- adding ?build=107 to the page URL
- changing every asset query string to v107
- changing the service-worker cache name
- showing a tiny "107" badge in the upper-right corner so the loaded HTML can be verified immediately

After the refresh, the bottom build badge should read:
v107 • FORCE REFRESH + REAL DATA

This package includes the v106 real-data renderer.
No database migration required.
