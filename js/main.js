'use strict';

// ════════════════════════════════════════════════════════════
// MENÚ HAMBURGUESA — Mobile nav con overlay y submenús
// ════════════════════════════════════════════════════════════

(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav    = document.querySelector('.nav-main');
  if (!toggle || !nav) return;

  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    nav.classList.add('is-open');
    document.body.classList.add('menu-open');
    // Foco en primer enlace del menú
    var firstLink = nav.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  }

  toggle.addEventListener('click', function () {
    toggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
  });

  // Cerrar al pulsar fuera del menú
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('is-open') &&
        !nav.contains(e.target) &&
        !toggle.contains(e.target)) {
      closeMenu();
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu();
      toggle.focus();
    }
  });

  // Submenús en mobile: tap para expandir (no hover). Soporta <button> y <a>.
  document.querySelectorAll('.has-dropdown > button, .has-dropdown > a').forEach(function (link) {
    link.setAttribute('aria-haspopup', 'true');
    if (!link.hasAttribute('aria-expanded')) link.setAttribute('aria-expanded', 'false');

    link.addEventListener('click', function (e) {
      if (window.innerWidth < 1024) {
        e.preventDefault();
        var li      = this.parentElement;
        var isOpen  = li.classList.contains('submenu-open');

        // Cierra todos los submenús abiertos
        document.querySelectorAll('.has-dropdown.submenu-open').forEach(function (el) {
          el.classList.remove('submenu-open');
          var trg = el.querySelector(':scope > button, :scope > a');
          if (trg) trg.setAttribute('aria-expanded', 'false');
        });

        // Abre el actual si estaba cerrado
        if (!isOpen) {
          li.classList.add('submenu-open');
          this.setAttribute('aria-expanded', 'true');
        }
      }
    });
  });

  // Cerrar menú al navegar a una página
  nav.querySelectorAll('a:not(.has-dropdown > a)').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Cerrar menú al redimensionar a desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024) closeMenu();
  }, { passive: true });
})();


// ════════════════════════════════════════════════════════════
// MAPA — se incrusta solo al acercarse al viewport (lazy, sin click)
// ════════════════════════════════════════════════════════════

(function () {
  var ph = document.getElementById('map-placeholder');
  if (!ph || !ph.dataset.src) return;

  function loadMap() {
    if (ph.querySelector('iframe')) return;
    var iframe = document.createElement('iframe');
    iframe.src = ph.dataset.src;
    iframe.loading = 'lazy';
    iframe.title = ph.getAttribute('aria-label') || 'Mapa de ubicación en Vitoria-Gasteiz';
    iframe.setAttribute('allowfullscreen', '');
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    ph.innerHTML = '';
    ph.removeAttribute('role');
    ph.removeAttribute('tabindex');
    ph.style.cursor = 'default';
    ph.appendChild(iframe);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { loadMap(); obs.disconnect(); }
      });
    }, { rootMargin: '300px 0px' });
    io.observe(ph);
  } else {
    loadMap();
  }

  // Click/teclado siguen funcionando como carga inmediata
  ph.addEventListener('click', loadMap);
  ph.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadMap(); }
  });
})();


// ════════════════════════════════════════════════════════════
// STICKY HEADER — Sombra al hacer scroll
// ════════════════════════════════════════════════════════════

(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();


// ════════════════════════════════════════════════════════════
// FAQ ACCORDION — aria-expanded + animación
// ════════════════════════════════════════════════════════════

(function () {
  document.querySelectorAll('.faq-item dt button, details summary').forEach(function (trigger) {
    // Para <details> nativo no hace falta JS — ya funciona
    if (trigger.closest('details')) return;

    trigger.addEventListener('click', function () {
      var isExpanded = this.getAttribute('aria-expanded') === 'true';
      var answer     = document.getElementById(this.getAttribute('aria-controls'));

      // Cierra todos
      document.querySelectorAll('.faq-item dt button').forEach(function (btn) {
        btn.setAttribute('aria-expanded', 'false');
        var ans = document.getElementById(btn.getAttribute('aria-controls'));
        if (ans) ans.hidden = true;
      });

      // Abre el actual si estaba cerrado
      if (!isExpanded) {
        this.setAttribute('aria-expanded', 'true');
        if (answer) answer.hidden = false;
      }
    });
  });
})();


// ════════════════════════════════════════════════════════════
// SMOOTH SCROLL para anclas internas
// ════════════════════════════════════════════════════════════

(function () {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      var offset = 80; // altura header sticky
      var top    = target.getBoundingClientRect().top + window.scrollY - offset;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      history.pushState(null, '', this.getAttribute('href'));
    });
  });
})();


// ════════════════════════════════════════════════════════════
// FORMULARIOS — Validación accesible + envío AJAX a /mail.php
// Cubre todos los formularios del sitio (hero compacto + contacto).
// Negocio sin teléfono: el tel es opcional, el email es el canal.
// ════════════════════════════════════════════════════════════

(function () {
  var forms = document.querySelectorAll('form[action$="mail.php"], form#contact-form');
  if (!forms.length) return;

  // Raíz real del sitio (funciona en dominio propio y en subcarpetas de preview)
  var home = document.querySelector('.header__logo');
  var siteRoot = home ? home.href.replace(/[^/]*$/, '') : '/';

  function validate(form) {
    var valid = true;
    var first = null;

    form.querySelectorAll('input, textarea, select').forEach(function (field) {
      if (field.type === 'hidden' || field.name === '_gotcha') return;
      var group = field.closest('.form-group') || field.parentNode;
      var error = group.querySelector('.field-error');
      var ok    = true;

      if (field.hasAttribute('required')) {
        if (field.type === 'checkbox') ok = field.checked;
        else ok = field.value.trim().length > 0;
      }
      if (ok && field.type === 'email' && field.value.trim()) {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
      }
      if (ok && field.type === 'tel' && field.value.trim()) {
        ok = /^[\d\s+\-]{9,15}$/.test(field.value.trim());
      }

      if (field.type !== 'checkbox') field.setAttribute('aria-invalid', String(!ok));
      if (error) error.textContent = ok ? '' : (field.dataset.error || 'Revisa este campo');
      if (!ok) { valid = false; if (!first) first = field; }
    });

    if (!valid && first) first.focus();
    return valid;
  }

  forms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      if (form.querySelector('[name="_gotcha"]') && form.querySelector('[name="_gotcha"]').value) return;

      var btn    = form.querySelector('[type="submit"]');
      var errMsg = form.querySelector('.form-send-error');
      var label  = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
      if (errMsg) errMsg.style.display = 'none';

      fetch(siteRoot + 'mail.php', { method: 'POST', body: new FormData(form) })
        .then(function (r) {
          if (r.ok || r.redirected || r.url.indexOf('gracias') !== -1) {
            window.location.href = siteRoot + 'gracias/';
          } else { throw new Error('server'); }
        })
        .catch(function () {
          if (errMsg) errMsg.style.display = 'block';
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
    });
  });
})();


// ════════════════════════════════════════════════════════════
// FOTOS PENDIENTES — si una imagen no existe, se sustituye por un
// panel de material (sin icono roto) manteniendo su proporción.
// ════════════════════════════════════════════════════════════

(function () {
  function markMissing(img) {
    var box = img.parentElement && img.parentElement.tagName === 'PICTURE' ? img.parentElement : img;
    var holder = box === img ? img.parentElement : box;
    if (!holder || holder.classList.contains('media-missing')) return;
    var w = img.getAttribute('width'), h = img.getAttribute('height');
    if (w && h) holder.style.setProperty('--ar', w + ' / ' + h);
    holder.classList.add('media-missing');
  }

  document.querySelectorAll('main img, .post-figure img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    img.addEventListener('error', function () { markMissing(img); }, { once: true });
  });
})();


// ════════════════════════════════════════════════════════════
// ENTRADA SUAVE AL HACER SCROLL — solo elementos fuera de pantalla,
// para no provocar parpadeos ni afectar al LCP.
// ════════════════════════════════════════════════════════════

(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var selector = [
    '.section-content', '.service-card', '.feature-card', '.precio-card', '.step',
    '.trabajo-card', '.testimonio-card', '.blog-card', '.about__media', '.about__content',
    '.benefit-list li', '.faq-list', '.prose', '.cta-final', '.cta-band > .container', '.zones-grid'
  ].join(',');

  var fold = window.innerHeight * 0.92;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll(selector).forEach(function (el) {
    if (el.getBoundingClientRect().top < fold) return;
    var siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.transitionDelay = Math.min(siblings % 3, 2) * 90 + 'ms';
    el.classList.add('reveal');
    io.observe(el);
  });
})();


// ════════════════════════════════════════════════════════════
// LAZY LOAD FALLBACK (navegadores sin soporte nativo)
// ════════════════════════════════════════════════════════════

(function () {
  if ('loading' in HTMLImageElement.prototype) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var img = entry.target;
        if (img.dataset.src) img.src = img.dataset.src;
        io.unobserve(img);
      }
    });
  });
  document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
    io.observe(img);
  });
})();
