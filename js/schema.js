// schema.js — Generación dinámica de JSON-LD desde CONFIG
// Requiere config.js cargado antes que este script.

(function () {
  if (typeof CONFIG === 'undefined') return;

  var baseUrl = 'https://' + CONFIG.domain;

  function inject(data) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  var openingHours = CONFIG.hours.map(function (h) {
    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes
    };
  });

  // areaServed: ciudad principal + todas las zonas de cobertura
  var areaServed = [{ '@type': 'City', name: CONFIG.address.city }];
  (CONFIG.zones || []).forEach(function (z) {
    areaServed.push({ '@type': 'City', name: z.name });
  });

  // ── LocalBusiness (#negocio) — SIEMPRE ────────────────────────────
  var business = {
    '@type': CONFIG.schemaType,
    '@id': baseUrl + '/#negocio',
    name: CONFIG.businessName,
    url: baseUrl + '/',
    email: CONFIG.email,
    image: baseUrl + '/img/og-image.jpg',
    logo: {
      '@type': 'ImageObject',
      url: baseUrl + '/img/logo.webp',
      width: 300,
      height: 100
    },
    priceRange: CONFIG.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONFIG.address.street,
      addressLocality: CONFIG.address.city,
      addressRegion: CONFIG.address.state,
      postalCode: CONFIG.address.postalCode,
      addressCountry: CONFIG.address.country
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: CONFIG.geo.lat,
      longitude: CONFIG.geo.lng
    },
    openingHoursSpecification: openingHours,
    areaServed: areaServed,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: CONFIG.email,
      areaServed: 'ES',
      availableLanguage: ['es']
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: CONFIG.rating.value,
      reviewCount: CONFIG.rating.count,
      bestRating: '5',
      worstRating: '1'
    },
    sameAs: CONFIG.sameAs
  };

  // telephone solo si existe (negocio sin teléfono → se omite)
  if (CONFIG.phone) business.telephone = CONFIG.phone;

  var graph = [business];

  var clean = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
  var isHome = clean === '' || clean === '/index';

  // ── WebSite — solo home ───────────────────────────────────────────
  if (isHome) {
    graph.push({
      '@type': 'WebSite',
      '@id': baseUrl + '/#website',
      url: baseUrl + '/',
      name: CONFIG.businessName,
      publisher: { '@id': baseUrl + '/#negocio' }
    });
  }

  // ── BreadcrumbList — todas excepto home ───────────────────────────
  // Se reconstruye desde el breadcrumb visible (.breadcrumb) para reflejar
  // la jerarquía real (2 niveles en servicios/zonas, 3 en posts de blog).
  if (!isHome) {
    var crumbLis = document.querySelectorAll('.breadcrumb ol > li:not(.breadcrumb__sep)');
    var items = [];
    if (crumbLis.length) {
      Array.prototype.forEach.call(crumbLis, function (li, i) {
        var a = li.querySelector('a');
        var url = a ? a.getAttribute('href') : window.location.pathname;
        if (url && url.indexOf('http') !== 0) {
          url = baseUrl + (url.charAt(0) === '/' ? url : '/' + url);
        }
        items.push({
          '@type': 'ListItem',
          position: i + 1,
          name: li.textContent.trim(),
          item: url
        });
      });
    } else {
      var h1 = document.querySelector('h1');
      items = [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: baseUrl + '/' },
        { '@type': 'ListItem', position: 2,
          name: (h1 && h1.textContent.trim()) || document.title,
          item: baseUrl + window.location.pathname }
      ];
    }
    graph.push({ '@type': 'BreadcrumbList', itemListElement: items });
  }

  // ── Service — páginas que coincidan con CONFIG.services ───────────
  var matched = (CONFIG.services || []).find(function (s) { return clean.endsWith('/' + s.slug); });
  if (matched) {
    graph.push({
      '@type': 'Service',
      name: matched.name,
      serviceType: matched.name,
      provider: { '@id': baseUrl + '/#negocio' },
      areaServed: areaServed,
      url: baseUrl + '/' + matched.slug + '/'
    });
  }

  inject({ '@context': 'https://schema.org', '@graph': graph });

  // ── FAQPage — si hay .faq-item en el DOM ──────────────────────────
  var faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length) {
    inject({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: Array.prototype.map.call(faqItems, function (item) {
        var q = item.querySelector('.faq-question');
        var a = item.querySelector('.faq-answer');
        return {
          '@type': 'Question',
          name: q ? q.textContent.trim() : '',
          acceptedAnswer: { '@type': 'Answer', text: a ? a.textContent.trim() : '' }
        };
      })
    });
  }
})();
