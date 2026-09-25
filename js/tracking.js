// tracking.js — Eventos de conversión GTM/gtag + UTM fields
// Requiere config.js cargado antes que este script.

document.addEventListener('DOMContentLoaded', function () {

  // ── Click-to-call tracking ───────────────────────────────────────
  document.querySelectorAll('a[href^="tel:"]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'click_to_call', {
          event_category: 'lead',
          event_label: el.dataset.tracking || 'phone'
        });
      }
      if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
          event: 'click_to_call',
          location: el.dataset.tracking || 'phone'
        });
      }
    });
  });

  // ── WhatsApp click tracking ──────────────────────────────────────
  document.querySelectorAll('a[href*="wa.me"]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'click_whatsapp', {
          event_category: 'lead',
          event_label: el.dataset.tracking || 'whatsapp'
        });
      }
      if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
          event: 'click_whatsapp',
          location: el.dataset.tracking || 'whatsapp'
        });
      }
    });
  });

  // ── Form submit tracking ─────────────────────────────────────────
  // Todos los formularios del sitio envían a /mail.php; main.js emite 'lead:sent' solo si el envío fue correcto.
  document.querySelectorAll('form[action$="mail.php"]').forEach(function (form) {
    form.addEventListener('lead:sent', function () {
      var page = form.querySelector('[name="page"]');
      if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submit', { event_category: 'lead', event_label: page ? page.value : '' });
      }
      if (typeof dataLayer !== 'undefined') {
        dataLayer.push({ event: 'form_submit', form_page: page ? page.value : '' });
      }
    });
  });

  // ── UTM: se guardan en la sesión y se copian a los campos ocultos del formulario ──
  var params = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (param) {
    var value = params.get(param);
    try {
      if (value) sessionStorage.setItem(param, value);
      else value = sessionStorage.getItem(param);
    } catch (e) { /* almacenamiento no disponible */ }
    if (!value) return;
    document.querySelectorAll('form [name="' + param + '"]').forEach(function (field) { field.value = value; });
  });

  // ── GTM / gtag loader (carga tras interacción del usuario) ───────
  if (typeof CONFIG !== 'undefined') {
    var loadAnalytics = function () {
      if (CONFIG.gtmId && !document.getElementById('gtm-script')) {
        var s = document.createElement('script');
        s.id = 'gtm-script';
        s.src = 'https://www.googletagmanager.com/gtm.js?id=' + CONFIG.gtmId;
        s.async = true;
        document.head.appendChild(s);
        window.dataLayer = window.dataLayer || [];
        dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      }
      if (CONFIG.gtagId && !document.getElementById('gtag-script')) {
        var gs = document.createElement('script');
        gs.id = 'gtag-script';
        gs.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.gtagId;
        gs.async = true;
        document.head.appendChild(gs);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', CONFIG.gtagId);
      }
      ['scroll', 'click', 'touchstart'].forEach(function (e) {
        document.removeEventListener(e, loadAnalytics);
      });
    };
    ['scroll', 'click', 'touchstart'].forEach(function (e) {
      document.addEventListener(e, loadAnalytics, { once: true, passive: true });
    });
  }

});
