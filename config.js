// ---------------------------------------------------------------------
// Configuration — this is the only file most people need to edit.
// ---------------------------------------------------------------------

window.HOMEY_MAP_CONFIG = {
  // Your Google Sheet, published to the web as CSV.
  // In the Sheet: File → Share → Publish to web → select the data tab →
  // format "Comma-separated values (.csv)" → Publish. Paste the URL it
  // gives you here (it ends in "output=csv").
  // SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/YOUR-SHEET-ID/pub?output=csv',
  SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSj8NCJSMvO6VpEX3D81RIpS5WY6hNIGBIjYBhLUVh9SPgUzw4gmPYK_OObGzY4agWZn2gSAiTnQwlr/pub?gid=0&single=true&output=csv',


  // How often to re-fetch the sheet and refresh the map, in minutes.
  REFRESH_MINUTES: 15,

  // Default map view before any pins have loaded (roughly centers on Europe).
  DEFAULT_CENTER: [50, 10],
  DEFAULT_ZOOM: 4,
};
