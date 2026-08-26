// ---------------------------------------------------------------------
// Model icons
// ---------------------------------------------------------------------
// These are small original abstract glyphs (not Athom's logo or product
// photography) grouped into a handful of device "tiers", matched against
// Homey's standard modelId values (the same ids the Web API's
// system.getInfo().model returns — things like "homey1", "homey1s",
// "shs", "homey5q", "homey6q", "homey7q").
//
// New model ids fall back to the "unknown" tier automatically, so this
// list doesn't need to be exhaustive or kept perfectly in sync with
// every future Homey release — add a pattern below when you care to
// distinguish a new one.

(function () {
  'use strict';

  var TIER_SVG = {
    // Homey Bridge — small relay device, no local logic of its own.
    bridge:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="8" y="10" width="8" height="7" rx="3" fill="currentColor"/>' +
      '<path d="M8.5 9a5 5 0 0 1 7 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '</svg>',

    // Homey Pro "q" generations (homey5q, homey6q, homey7q, ...) — full
    // hub, drawn with two signal arcs.
    pro:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="12" cy="14" rx="6.5" ry="5.5" fill="currentColor"/>' +
      '<path d="M7 8a7 7 0 0 1 10 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M4.3 5.2a11 11 0 0 1 15.4 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity="0.5"/>' +
      '</svg>',

    // Earlier Homey / Homey Pro generations (homey1, homey1s, homey2, ...)
    // — same body, one signal arc.
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

  // Order matters: first matching pattern wins.
  var TIER_RULES = [
    { tier: 'bridge', test: function (id) { return id === 'shs' || id.indexOf('bridge') !== -1; } },
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

  window.HomeyModelIcons = {
    tierFor: tierFor,
    svgFor: function (modelId) {
      return TIER_SVG[tierFor(modelId)];
    },
  };
})();
