# SOFTSYSTEMS Complete v3
Menu: Home / Daily / Archive / System / Weave / Stats / Data
Includes public/private Daily logs, YouTube video archive, pattern reading, Weave, statistics, CSV/JSON/Max exports, monthly reflection, and monthly storyboard export.
Run supabase/schema.sql, then redeploy with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.

Visitor counter configuration (server-only):
- OWNER_VISITOR_ID: owner browser visitor_id to exclude from all counts.
- OWNER_IPS: optional comma-separated backup exclusion list, example 203.0.113.10,2001:db8::1.

Owner setup notes:
- In local development, sign in as owner and open the browser console.
- A temporary owner-only debug log prints the OWNER_VISITOR_ID candidate.
- After setting OWNER_VISITOR_ID in Vercel, remove the temporary debug log in components/VisitorTracker.js.
