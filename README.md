# Anonymous Homey Map — website

A static, single-page site that renders the Google Sheet from the
[Anonymous Homey Map app](../anon-homey-map) as a live map: one beacon per
Homey, with a translucent ring showing the anonymity radius it was
published under. No backend, no build step, no API keys — just HTML/CSS/JS
plus [Leaflet](https://leafletjs.com/) + OpenStreetMap tiles and
[PapaParse](https://www.papaparse.com/) to read the sheet as CSV.

## 1. Publish the Google Sheet as CSV

In the Sheet the Homey app writes to:

1. **File → Share → Publish to web**
2. Under "Link", pick the specific sheet/tab (not "Entire document")
3. Format: **Comma-separated values (.csv)**
4. Click **Publish**, confirm, and copy the URL — it looks like
   `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv`
   https://docs.google.com/spreadsheets/d/e/2PACX-1vSj8NCJSMvO6VpEX3D81RIpS5WY6hNIGBIjYBhLUVh9SPgUzw4gmPYK_OObGzY4agWZn2gSAiTnQwlr/pub?gid=0&single=true&output=csv 

This URL is read-only and only exposes the columns already in the sheet
(pinId, name, model, lat, lon, radiusKm, timestamp, trigger) — no one can
write through it.

## 2. Point the site at your sheet

Edit `config.js`:

```js
window.HOMEY_MAP_CONFIG = {
  SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/YOUR-ID/pub?output=csv',
  REFRESH_MINUTES: 15,
  DEFAULT_CENTER: [50, 10],
  DEFAULT_ZOOM: 4,
};
```

## 3. Put it on GitHub Pages

```bash
cd homey-map-site
git init
git add .
git commit -m "Anonymous Homey Map site"
git branch -M main
git remote add origin https://github.com/Dijker-Homey-Apps/homey-map.git
git push -u origin main
```

Then on GitHub:

1. Go to the repo's **Settings → Pages**
2. Under "Build and deployment", set **Source: Deploy from a branch**
3. Branch: **main**, folder: **/ (root)** → **Save**
4. GitHub gives you a URL like `https://YOUR-USERNAME.github.io/homey-map/` Dijker-Homey-App
4. GitHub gives you a URL like `https://Dijker-Homey-App.github.io/homey-map/` 
   within a minute or two — that's the live map.

No GitHub Actions or build step is needed since this is plain static
HTML/CSS/JS.

## What's new: model icons, bolder radius rings, clustering

- **Model icons**: each beacon shows a small original glyph (not Athom's
  logo/product photo — see below) keyed off the `model` column, which is
  expected to hold Homey's standard `modelId` string (`homey1s`, `homey5q`,
  `shs`, etc. — whatever `system.getInfo().model` reports). The mapping
  lives in `model-icons.js` as a short set of pattern rules (`shs`/`*bridge*`
  → bridge glyph, `*q` → Pro glyph, `homey*` → classic glyph, anything else
  → a muted "unknown" glyph) — extend the patterns there if you want finer
  distinctions between generations.
- **Radius rings are bolder now**: solid 2px stroke at 90% opacity plus a
  visible fill, with a slow breathing pulse (`prefers-reduced-motion`
  respected) so the fuzz radius reads as a real, current signal rather than
  a faint decoration.
- **Clustering**: nearby beacons collapse into a plain numbered circle
  (via [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster))
  with no per-model icon — just a count, styled to match the rest of the
  map. A beacon's radius ring only shows while it's displayed on its own;
  it's hidden while folded into a cluster, and reappears once you zoom in
  enough to split the cluster apart.

**On the icons themselves**: these are small original abstract shapes I
drew for this project (an orb + signal-arc motif), not Athom's trademarked
Homey logo or a rendering of the physical device. If you have rights to
Athom's own icon assets (e.g. as a registered Homey developer) and want to
swap them in, replace the SVG strings in `model-icons.js` — the rest of the
app just calls `HomeyModelIcons.svgFor(modelId)` and doesn't care what's
inside them.

## Notes

- **Why CSV instead of the Sheets API**: a published CSV link needs no
  auth and no API key, and Google serves it with CORS headers that allow
  `fetch()` from any origin (including `github.io`), which keeps this a
  pure static site. The tradeoff is the sheet has to be public-readable —
  fine here since the data is already anonymized/fuzzed by the Homey app
  before it's written.
- **If the fetch fails on GitHub Pages but works locally**: double-check
  you copied the `pub?output=csv` link (not the normal share link), and
  that you published the specific sheet tab the Homey app writes to.
- **Refresh cadence**: the page re-fetches the sheet every
  `REFRESH_MINUTES` (default 15) — there's no live push, it's a periodic
  pull, which matches how infrequently Homeys actually publish.
- **Want a custom domain?** Add a `CNAME` file with your domain to the
  repo root and set it under Settings → Pages — standard GitHub Pages
  flow, nothing map-specific.
