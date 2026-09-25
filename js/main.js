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
// Todos los campos son obligatorios salvo las fotos. Las fotos se
// reducen en el navegador (máx. 1920 px, JPEG) antes de enviarlas.
// ════════════════════════════════════════════════════════════

(function () {
  var forms = document.querySelectorAll('form[action$="mail.php"]');
  if (!forms.length) return;

  var RESIZABLE = /^image\/(jpeg|png|webp)$/;
  var MAX_SIDE = 1920;

  function fileField(form) { return form.querySelector('input[type="file"]'); }

  function checkFiles(input) {
    if (!input || !input.files) return true;
    var max = parseInt(input.dataset.maxFiles || '6', 10);
    var maxMb = parseFloat(input.dataset.maxMb || '10');
    if (input.files.length > max) return false;
    for (var i = 0; i < input.files.length; i++) {
      var f = input.files[i];
      var okType = /^image\//.test(f.type) || f.type === 'application/pdf' || /\.(heic|heif)$/i.test(f.name);
      // las fotos grandes se comprimen antes de enviar; el límite estricto aplica a PDF/HEIC
      var needsLimit = !RESIZABLE.test(f.type);
      if (!okType || (needsLimit && f.size > maxMb * 1048576)) return false;
    }
    return true;
  }

  function validate(form) {
    var valid = true;
    var first = null;

    form.querySelectorAll('input, textarea, select').forEach(function (field) {
      if (field.type === 'hidden' || field.name === '_gotcha') return;
      var group = field.closest('.form-group') || field.parentNode;
      var error = group.querySelector('.field-error');
      var value = (field.value || '').trim();
      var ok    = true;

      if (field.hasAttribute('required')) {
        ok = field.type === 'checkbox' ? field.checked : value.length > 0;
      }
      if (ok && field.type === 'email' && value) {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      if (ok && field.type === 'tel' && value) {
        ok = /^\+?[\d\s\-().]{9,20}$/.test(value) && value.replace(/\D/g, '').length >= 9;
      }
      if (ok && field.type === 'file') ok = checkFiles(field);

      if (field.type !== 'checkbox') field.setAttribute('aria-invalid', String(!ok));
      if (error) error.textContent = ok ? '' : (field.dataset.error || 'Revisa este campo');
      if (!ok) { valid = false; if (!first) first = field; }
    });

    if (!valid && first) first.focus();
    return valid;
  }

  function resize(file) {
    return new Promise(function (resolve) {
      if (!RESIZABLE.test(file.type) || !window.createImageBitmap) return resolve(file);
      createImageBitmap(file).then(function (bmp) {
        var scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(bmp.width * scale);
        canvas.height = Math.round(bmp.height * scale);
        canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) {
          if (!blob || blob.size >= file.size) return resolve(file);
          resolve(new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.82);
      }).catch(function () { resolve(file); });
    });
  }

  function buildData(form) {
    var data = new FormData(form);
    var input = fileField(form);
    if (!input || !input.files || !input.files.length) return Promise.resolve(data);
    data.delete(input.name);
    return Promise.all(Array.prototype.map.call(input.files, resize)).then(function (files) {
      files.forEach(function (f) { data.append(input.name, f, f.name); });
      return data;
    });
  }

  // Envío sin JS que volvió con error (/contacto/?error=…): mostrar el aviso
  if (/[?&]error=/.test(window.location.search)) {
    var note = forms[0].querySelector('.form-send-error');
    if (note) note.style.display = 'block';
  }

  forms.forEach(function (form) {
    var ts = form.querySelector('[name="_ts"]');
    if (ts) ts.value = String(Date.now());

    var input = fileField(form);
    var list = form.querySelector('.form-files');
    if (input && list) {
      input.addEventListener('change', function () {
        var names = Array.prototype.map.call(input.files, function (f) { return f.name; });
        list.textContent = names.length ? names.length + ' archivo(s): ' + names.join(', ') : '';
        validate(form);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      if (form.querySelector('[name="_gotcha"]') && form.querySelector('[name="_gotcha"]').value) return;

      var btn    = form.querySelector('[type="submit"]');
      var errMsg = form.querySelector('.form-send-error');
      var label  = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
      if (errMsg) errMsg.style.display = 'none';

      buildData(form)
        .then(function (data) {
          return fetch('/mail.php', { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.error || 'server');
          form.dispatchEvent(new CustomEvent('lead:sent', { bubbles: true }));
          setTimeout(function () { window.location.href = '/gracias/'; }, 300);
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
