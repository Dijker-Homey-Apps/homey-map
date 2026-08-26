// ---------------------------------------------------------------------
// Model icons
// ---------------------------------------------------------------------
// Where Athom publishes an official model photo, we hotlink it directly
// from their CDN (etc.athom.com) -- the browser fetches it straight from
// Athom, nothing of theirs is copied into this repo. Any modelId without
// a listed photo (or where the photo fails to load) falls back to a
// small original abstract glyph grouped into a generic "tier", so the
// map never shows a broken image.
//
// modelId values are Homey's standard ids (the same ones the Web API's
// system.getInfo().model returns): "homey1s", "shs", "homey5q", etc.

(function () {
  'use strict';

  // Official Athom model photos. A few modelIds share hardware/photos --
  // homey1s through homey4d are all the same physical device, and
  // homey7q is the same physical device as homey5q -- so they're mapped
  // to the same URL. Only add entries you've actually confirmed --
  // anything else intentionally falls back to the abstract glyphs below
  // rather than guessing at a CDN path.
  var MODEL_PHOTOS = {
    homey1s: 'https://etc.athom.com/models/homey-pro-2016-light.png',
    homey1q: 'https://etc.athom.com/models/homey-pro-2016-light.png',
    homey2s: 'https://etc.athom.com/models/homey-pro-2016-light.png',
    homey2d: 'https://etc.athom.com/models/homey-pro-2016-light.png',
    homey2q: 'https://etc.athom.com/models/homey-pro-2016-light.png',
    homey3s: 'https://etc.athom.com/models/homey-pro-2016-light.png',
    homey3d: 'https://etc.athom.com/models/homey-pro-2016-light.png',
    homey4d: 'https://etc.athom.com/models/homey-pro-2016-light.png',
    homey5q: 'https://etc.athom.com/models/homey-pro-2023-light.png',
    homey7q: 'https://etc.athom.com/models/homey-pro-2023-light.png',
    homey6q: 'https://etc.athom.com/models/homey-pro-mini-light.png',
    cloud: 'https://etc.athom.com/models/homey-cloud-light.png',
    shs: 'https://etc.athom.com/models/homey-shs-light.png',
  };

  var TIER_SVG = {
    // Homey Pro "q" generations without a photo yet (homey2q, homey7q, ...)
    // -- full hub body, two signal arcs.
    pro:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="12" cy="14" rx="6.5" ry="5.5" fill="currentColor"/>' +
      '<path d="M7 8a7 7 0 0 1 10 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M4.3 5.2a11 11 0 0 1 15.4 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity="0.5"/>' +
      '</svg>',

    // Earlier "s"/"d" generations without a photo yet -- same body, one
    // signal arc.
    classic:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="12" cy="14" rx="6.5" ry="5.5" fill="currentColor"/>' +
      '<path d="M7.5 8.3a6.2 6.2 0 0 1 9 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '</svg>',

    // Model wasn't set / not recognised.
    unknown:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="12" cy="13" r="6" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2 2"/>' +
      '<circle cx="12" cy="13" r="1.3" fill="currentColor"/>' +
      '</svg>',
  };

  // Order matters: first matching pattern wins. Only used for modelIds
  // without a photo in MODEL_PHOTOS above.
  var TIER_RULES = [
    { tier: 'pro', test: function (id) { return /q$/.test(id); } },
    { tier: 'classic', test: function (id) { return /^homey/.test(id); } },
  ];

  function tierFor(modelId) {
    var id = String(modelId || '').trim().toLowerCase();
    if (!id || id === 'unknown') return 'unknown';
    for (var i = 0; i < TIER_RULES.length; i++) {
      if (TIER_RULES[i].test(id)) return TIER_RULES[i].tier;
    }
    return 'unknown';
  }

  function photoFor(modelId) {
    var id = String(modelId || '').trim().toLowerCase();
    return MODEL_PHOTOS[id] || null;
  }

  window.HomeyModelIcons = {
    tierFor: tierFor,
    svgFor: function (modelId) {
      return TIER_SVG[tierFor(modelId)];
    },
    photoFor: photoFor,
  };
})();
