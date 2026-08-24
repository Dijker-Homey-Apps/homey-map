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
git remote add origin https://github.com/YOUR-USERNAME/homey-map.git
git push -u origin main
```

Then on GitHub:

1. Go to the repo's **Settings → Pages**
2. Under "Build and deployment", set **Source: Deploy from a branch**
3. Branch: **main**, folder: **/ (root)** → **Save**
4. GitHub gives you a URL like `https://YOUR-USERNAME.github.io/homey-map/`
   within a minute or two — that's the live map.

No GitHub Actions or build step is needed since this is plain static
HTML/CSS/JS.

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
