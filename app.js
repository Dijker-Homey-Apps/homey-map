(function () {
  'use strict';

  var cfg = window.HOMEY_MAP_CONFIG;
  var icons = window.HomeyModelIcons;

  var map = L.map('map', {
    zoomControl: false,
    attributionControl: true,
  }).setView(cfg.DEFAULT_CENTER, cfg.DEFAULT_ZOOM);

  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Individual beacon markers live in this cluster group. When several
  // are close together it collapses them into a plain numbered circle
  // (no per-model icon) -- see iconCreateFunction below.
  var clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    maxClusterRadius: 60,
    iconCreateFunction: function (cluster) {
      var count = cluster.getChildCount();
      var sizeClass = count < 10 ? 'small' : count < 50 ? 'medium' : 'large';
      return L.divIcon({
        html: '<div class="cluster-badge cluster-badge--' + sizeClass + '"><span>' + count + '</span></div>',
        className: '',
        iconSize: L.point(40, 40),
      });
    },
  });
  map.addLayer(clusterGroup);

  // Anonymity-radius rings are drawn on their own layer, added straight
  // to the map (not clustered -- a ring belongs to one Homey, not to a
  // cluster bubble). Rings are only shown for beacons currently visible
  // as their own marker; once a beacon is folded into a cluster its ring
  // is hidden so overlapping circles don't turn into visual noise.
  var radiusLayer = L.layerGroup().addTo(map);

  var pinListEl = document.getElementById('pin-list');
  var emptyStateEl = document.getElementById('empty-state');
  var errorStateEl = document.getElementById('error-state');
  var errorDetailEl = document.getElementById('error-detail');
  var pinCountEl = document.getElementById('pin-count');
  var lastUpdatedEl = document.getElementById('last-updated');
  var panel = document.getElementById('panel');
  var panelToggle = document.getElementById('panel-toggle');

  var registry = {}; // pinId -> { marker, circle }

  panelToggle.addEventListener('click', function () {
    var collapsed = panel.getAttribute('data-collapsed') === 'true';
    panel.setAttribute('data-collapsed', collapsed ? 'false' : 'true');
    panelToggle.setAttribute('aria-expanded', String(collapsed));
  });

  function beaconIcon(tier, photoUrl) {
    var inner = photoUrl
      ? '<img class="beacon-marker__photo" src="' + photoUrl + '" alt="" '
        + 'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';" />'
        + '<span class="beacon-marker__fallback">' + icons.svgFor(tier) + '</span>'
      : icons.svgFor(tier);

    return L.divIcon({
      className: '',
      html: '<div class="beacon-marker beacon-marker--' + tier + '">' + inner + '</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  }

  function miniIcon(tier, photoUrl) {
    var inner = photoUrl
      ? '<img class="mini-icon__photo" src="' + photoUrl + '" alt="" '
        + 'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';" />'
        + '<span class="mini-icon__fallback">' + icons.svgFor(tier) + '</span>'
      : icons.svgFor(tier);
    return '<span class="mini-icon mini-icon--' + tier + '">' + inner + '</span>';
  }

  function relativeTime(isoString) {
    var then = new Date(isoString).getTime();
    if (isNaN(then)) return isoString || 'unknown time';
    var diffMs = Date.now() - then;
    var mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    var hours = Math.round(mins / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.round(hours / 24);
    return days + 'd ago';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rowsToPins(rows) {
    return rows
      .map(function (r) {
        var lat = parseFloat(r.lat);
        var lon = parseFloat(r.lon);
        if (isNaN(lat) || isNaN(lon)) return null;
        if (String(r.trigger || '').trim().toLowerCase() === 'tombstone') return null;
        return {
          pinId: (r.pinId || '').trim(),
          name: (r.name || 'Anonymous Homey').trim(),
          model: (r.model || 'unknown').trim(),
          lat: lat,
          lon: lon,
          radiusKm: parseFloat(r.radiusKm) || null,
          timestamp: r.timestamp || '',
        };
      })
      .filter(Boolean);
  }

  // Hide the radius ring for any beacon currently absorbed into a
  // cluster bubble; show it for beacons standing on their own.
  function updateRingVisibility() {
    Object.keys(registry).forEach(function (id) {
      var entry = registry[id];
      if (!entry.circle) return;
      var visibleParent = clusterGroup.getVisibleParent(entry.marker);
      var standsAlone = visibleParent === entry.marker;
      if (standsAlone && !radiusLayer.hasLayer(entry.circle)) {
        radiusLayer.addLayer(entry.circle);
      } else if (!standsAlone && radiusLayer.hasLayer(entry.circle)) {
        radiusLayer.removeLayer(entry.circle);
      }
    });
  }

  function render(pins) {
    clusterGroup.clearLayers();
    radiusLayer.clearLayers();
    pinListEl.innerHTML = '';
    registry = {};

    pinCountEl.textContent = pins.length + (pins.length === 1 ? ' beacon' : ' beacons');
    lastUpdatedEl.textContent = 'checked ' + relativeTime(new Date().toISOString());

    if (pins.length === 0) {
      emptyStateEl.hidden = false;
      errorStateEl.hidden = true;
      return;
    }
    emptyStateEl.hidden = true;
    errorStateEl.hidden = true;

    var newMarkers = [];

    pins.forEach(function (pin) {
      var tier = icons.tierFor(pin.model);
      var photoUrl = icons.photoFor(pin.model);

      var circle = null;
      if (pin.radiusKm) {
        circle = L.circle([pin.lat, pin.lon], {
          radius: pin.radiusKm * 1000,
          className: 'radius-ring',
          color: '#5eead4',
          weight: 2,
          opacity: 0.9,
          fillColor: '#5eead4',
          fillOpacity: 0.14,
        });
      }

      var marker = L.marker([pin.lat, pin.lon], { icon: beaconIcon(tier, photoUrl) });

      var popupHtml =
        '<div class="popup">' +
        '<h3>' + miniIcon(tier, photoUrl) + escapeHtml(pin.name) + '</h3>' +
        '<dl>' +
        '<dt>model</dt><dd>' + escapeHtml(pin.model) + '</dd>' +
        '<dt>radius</dt><dd>' + (pin.radiusKm ? pin.radiusKm + ' km' : '\u2014') + '</dd>' +
        '<dt>updated</dt><dd>' + escapeHtml(relativeTime(pin.timestamp)) + '</dd>' +
        '<dt>pin id</dt><dd>' + escapeHtml(pin.pinId.slice(0, 10)) + '\u2026</dd>' +
        '</dl>' +
        '</div>';
      marker.bindPopup(popupHtml);

      registry[pin.pinId] = { marker: marker, circle: circle };
      newMarkers.push(marker);

      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.className = 'pin-card';
      btn.innerHTML =
        '<div class="pin-card__row">' + miniIcon(tier, photoUrl) +
        '<span class="pin-card__name">' + escapeHtml(pin.name) + '</span>' +
        '</div>' +
        '<div class="pin-card__meta">' +
        '<span>' + escapeHtml(pin.model) + '</span>' +
        '<span>' + (pin.radiusKm ? '\u00b1' + pin.radiusKm + 'km' : '') + '</span>' +
        '<span>' + escapeHtml(relativeTime(pin.timestamp)) + '</span>' +
        '</div>';
      btn.addEventListener('click', function () {
        map.flyTo([pin.lat, pin.lon], Math.max(map.getZoom(), 11), { duration: 0.6 });
        marker.openPopup();
      });
      li.appendChild(btn);
      pinListEl.appendChild(li);
    });

    clusterGroup.addLayers(newMarkers);
    updateRingVisibility();

    if (newMarkers.length > 1) {
      map.fitBounds(clusterGroup.getBounds().pad(0.25));
    } else if (newMarkers.length === 1) {
      map.setView(newMarkers[0].getLatLng(), 10);
    }
  }

  clusterGroup.on('animationend', updateRingVisibility);
  map.on('zoomend', updateRingVisibility);

  function showError(message) {
    emptyStateEl.hidden = true;
    errorStateEl.hidden = false;
    errorDetailEl.textContent = message;
    pinCountEl.textContent = '\u2014 beacons';
    lastUpdatedEl.textContent = 'load failed';
  }

  function load() {
    if (!cfg.SHEET_CSV_URL || cfg.SHEET_CSV_URL.indexOf('YOUR-SHEET-ID') !== -1) {
      showError('Set SHEET_CSV_URL in config.js to your published Google Sheet CSV link.');
      return;
    }

    Papa.parse(cfg.SHEET_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (results.errors && results.errors.length) {
          console.warn('CSV parse warnings:', results.errors);
        }
        render(rowsToPins(results.data));
      },
      error: function (err) {
        console.error(err);
        showError('Fetch failed (' + err.message + '). Confirm the sheet is published to the web as CSV, and that the URL in config.js is exactly the one Google gave you.');
      },
    });
  }

  load();
  setInterval(load, Math.max(1, cfg.REFRESH_MINUTES || 15) * 60 * 1000);
})();
