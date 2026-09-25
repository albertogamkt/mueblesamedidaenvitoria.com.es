// lazy-load.js — Facade pattern para Google Maps e iframes pesados
// Requiere config.js cargado antes que este script.

document.addEventListener('DOMContentLoaded', function () {

  // ── Google Maps facade ───────────────────────────────────────────
  var mapPlaceholder = document.getElementById('map-placeholder');

  if (mapPlaceholder && typeof CONFIG !== 'undefined' && CONFIG.mapsEmbedUrl) {
    var loadMap = function () {
      if (mapPlaceholder.dataset.loaded) return;
      mapPlaceholder.innerHTML =
        '<iframe src="' + CONFIG.mapsEmbedUrl + '"' +
        ' width="100%" height="400" style="border:0" loading="lazy"' +
        ' allowfullscreen referrerpolicy="no-referrer-when-downgrade"' +
        ' title="Ubicación de ' + CONFIG.businessName + '"></iframe>';
      mapPlaceholder.dataset.loaded = 'true';
    };

    var mapObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        loadMap();
        mapObserver.disconnect();
      }
    }, { rootMargin: '200px' });

    mapObserver.observe(mapPlaceholder);
  }

  // ── content-visibility: auto en secciones below-the-fold ────────
  if ('IntersectionObserver' in window) {
    document.querySelectorAll('.section-lazy').forEach(function (section) {
      section.style.contentVisibility = 'auto';
    });
  }

});
