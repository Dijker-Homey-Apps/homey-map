(function () {
  'use strict';

  var cfg = window.HOMEY_MAP_CONFIG;

  var map = L.map('map', {
    zoomControl: false,
    attributionControl: true,
  }).setView(cfg.DEFAULT_CENTER, cfg.DEFAULT_ZOOM);

  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  var markersLayer = L.layerGroup().addTo(map);
  var pinListEl = document.getElementById('pin-list');
  var emptyStateEl = document.getElementById('empty-state');
  var errorStateEl = document.getElementById('error-state');
  var errorDetailEl = document.getElementById('error-detail');
  var pinCountEl = document.getElementById('pin-count');
  var lastUpdatedEl = document.getElementById('last-updated');
  var panel = document.getElementById('panel');
  var panelToggle = document.getElementById('panel-toggle');

  panelToggle.addEventListener('click', function () {
    var collapsed = panel.getAttribute('data-collapsed') === 'true';
    panel.setAttribute('data-collapsed', collapsed ? 'false' : 'true');
    panelToggle.setAttribute('aria-expanded', String(collapsed));
  });

  function beaconIcon() {
    return L.divIcon({
      className: '',
      html: '<div class="beacon-icon"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -7],
    });
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
        return {
          pinId: (r.pinId || '').trim(),
          name: (r.name || 'Anonymous Homey').trim(),
          model: (r.model || 'Unknown').trim(),
          lat: lat,
          lon: lon,
          radiusKm: parseFloat(r.radiusKm) || null,
          timestamp: r.timestamp || '',
        };
      })
      .filter(Boolean);
  }

  function render(pins) {
    markersLayer.clearLayers();
    pinListEl.innerHTML = '';

    pinCountEl.textContent = pins.length + (pins.length === 1 ? ' beacon' : ' beacons');
    lastUpdatedEl.textContent = 'checked ' + relativeTime(new Date().toISOString());

    if (pins.length === 0) {
      emptyStateEl.hidden = false;
      errorStateEl.hidden = true;
      return;
    }
    emptyStateEl.hidden = true;
    errorStateEl.hidden = true;

    var markerById = {};

    pins.forEach(function (pin) {
      if (pin.radiusKm) {
        L.circle([pin.lat, pin.lon], {
          radius: pin.radiusKm * 1000,
          color: '#5eead4',
          weight: 1,
          opacity: 0.35,
          fillColor: '#5eead4',
          fillOpacity: 0.06,
          dashArray: '4 6',
        }).addTo(markersLayer);
      }

      var marker = L.marker([pin.lat, pin.lon], { icon: beaconIcon() }).addTo(markersLayer);

      var popupHtml =
        '<div class="popup">' +
        '<h3>' + escapeHtml(pin.name) + '</h3>' +
        '<dl>' +
        '<dt>model</dt><dd>' + escapeHtml(pin.model) + '</dd>' +
        '<dt>radius</dt><dd>' + (pin.radiusKm ? pin.radiusKm + ' km' : '—') + '</dd>' +
        '<dt>updated</dt><dd>' + escapeHtml(relativeTime(pin.timestamp)) + '</dd>' +
        '<dt>pin id</dt><dd>' + escapeHtml(pin.pinId.slice(0, 10)) + '…</dd>' +
        '</dl>' +
        '</div>';
      marker.bindPopup(popupHtml);

      markerById[pin.pinId] = marker;

      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.className = 'pin-card';
      btn.innerHTML =
        '<div class="pin-card__name">' + escapeHtml(pin.name) + '</div>' +
        '<div class="pin-card__meta">' +
        '<span>' + escapeHtml(pin.model) + '</span>' +
        '<span>' + (pin.radiusKm ? '±' + pin.radiusKm + 'km' : '') + '</span>' +
        '<span>' + escapeHtml(relativeTime(pin.timestamp)) + '</span>' +
        '</div>';
      btn.addEventListener('click', function () {
        map.flyTo([pin.lat, pin.lon], Math.max(map.getZoom(), 11), { duration: 0.6 });
        marker.openPopup();
      });
      li.appendChild(btn);
      pinListEl.appendChild(li);
    });

    var group = L.featureGroup(Object.values(markerById));
    if (Object.keys(markerById).length > 1) {
      map.fitBounds(group.getBounds().pad(0.25));
    } else if (Object.keys(markerById).length === 1) {
      map.setView(group.getBounds().getCenter(), 10);
    }
  }

  function showError(message) {
    emptyStateEl.hidden = true;
    errorStateEl.hidden = false;
    errorDetailEl.textContent = message;
    pinCountEl.textContent = '— beacons';
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
