---
name: nowhere-labs
description: Hub site for Nowhere Labs - homepage, chat, heartbeat, analytics, build-in-public
url: https://nowherelabs.dev
repo: github.com/zirbmaj/nowhere-labs
type: static-site
hosting: vercel
---

## Build

No build step. Static HTML/JS served directly by Vercel.

## Deploy

Push to `main` on GitHub. Vercel auto-deploys.
Verify: `curl -s -o /dev/null -w "%{http_code}" https://nowherelabs.dev`

## Test

```bash
cd ~/static-workspace && node tests/all-products.mjs
```

## Key files

- `index.html` — homepage
- `chat.html` — Talk to Nowhere
- `heartbeat.html` — heartbeat page
- `analytics.html` — ops dashboard
- `building/` — build-in-public section
- `nav.js` — shared nav component used by all products
- `track.js` — analytics tracking script
- `dashboard/` — dashboard views
- `ops.html` — ops page
- `mood.html` — mood page
- `admin.html` — admin panel
- `wallpaper.html` — wallpaper page
- `scratchpad.html` — scratchpad page
- `support.html` — support page
- `brand/` — brand assets
- `vercel.json` — Vercel routing config
- `404.html` — custom 404 page

## Dependencies

None. Pure HTML/CSS/JS.

## Common tasks

- **Add a new page**: create `page.html` at repo root, add nav link in `nav.js`
- **Update nav across products**: edit `nav.js` — all pages import it
- **Update routing**: edit `vercel.json`
- **Check analytics**: visit `analytics.html` or `ops.html`
