# Estado del proyecto — Muebles a Medida en Vitoria

**Dominio:** mueblesamedidaenvitoria.com.es
**Ruta:** `sites/Muebles a Medida en Vitoria/`
**Actualizado:** 2026-06-02 · tras FASE 1

## Reanudar aquí (pegar en una conversación nueva)

> Proyecto activo: Muebles a Medida en Vitoria. Lee
> `sites/Muebles a Medida en Vitoria/_ESTADO.md` y continúa por el PRÓXIMO PASO.
> Sigue `resources/workflow-fases.md`.

## Sistema global (actualizado 2026-09-25 tras auditoría SEO) — LEER ANTES DE EDITAR

| Qué quieres cambiar | Dónde | Luego |
|---|---|---|
| Teléfono, WhatsApp, email, dirección, horario, NIF/titular, autor | `site.config.json` | `python3 tools/build.py` |
| Cabecera / topbar / menú | `partials/header.html` | build |
| Pie de página | `partials/footer.html` | build |
| Formulario (todas las páginas) | `partials/form-lead.html` | build |
| Barra CTA móvil + WhatsApp flotante | `partials/mobile-bar.html` | build |
| `<head>` (fuentes, CSS crítico, iconos) | `partials/head-assets.html` | build |
| Diseño | `css/style.css` | build (genera `style.min.css` + CSS crítico inline) |

- **Rutas absolutas desde la raíz** (`/css/…`, `/armarios-a-medida/`). Vista previa local: `python3 -m http.server 8090`
  desde la raíz del repo (o `php -S 127.0.0.1:8090` para probar también el formulario).
- **JSON-LD 100 % estático**: lo genera el build en el bloque `<!-- @schema -->` de cada página indexable
  (negocio único `#negocio`, WebSite, WebPage, BreadcrumbList desde las migas visibles, Service + Offers desde
  las `.precio-card`, FAQPage desde `.faq-item`, Person del autor). No escribir JSON-LD de negocio a mano.
  Ya no existe `js/schema.js`.
- **sitemap.xml se genera solo** (solo páginas `index, follow`; `lastmod` cambia cuando cambia el `<main>`).
  Las legales, /gracias/ y 404 son `noindex, follow`: se rastrean pero no se indexan.
- **Formulario**: `mail.php` + PHPMailer (`lib/PHPMailer`) por SMTP autenticado a info@. Credenciales en
  `mail-config.php` (NO está en git; plantilla `mail-config.example.php`). Súbelo al servidor una vez,
  idealmente junto a `public_html` (un nivel por encima). Límites de subida en `.user.ini`.
- **Despliegue**: `python3 tools/build.py --zip` → `dist/mueblesamedidaenvitoria.com.es-AAAAMMDD.zip`
  (excluye tools/, partials/, *.md, config y fuentes CSS). Descomprimir en la raíz pública del hosting.
- Sin testimonios inventados, sin aggregateRating, sin showroom (taller con visitas con cita previa).

## PRÓXIMO PASO EXACTO

GATE FASE 2 ✅ SUPERADO 2026-06-02 (validate.sh 97/100 — solo falla tel:, esperado; serve 8090 → home/css/gracias todos 200; main.js node --check OK).
Arrancar **FASE 3 — Servicios.** Empezar por el PILLAR `/armarios-a-medida/` y sus 2 hijos
(`/armarios-empotrados-a-medida/`, `/vestidores-a-medida/`), luego las 8 money pages restantes.
Leer ANTES: `estructura-paginas.md` (estructura servicio) + `seo-local-schema.md` §Service + `copy-persuasivo.md`.
Patrón de página de servicio: ver `frontend-html-css.md §13` (Página de Servicio, 14 secciones).
Reutilizar el HEADER y FOOTER GLOBAL ya definidos en `index.html` (copiar literal, marcar la página
actual del dropdown con `aria-current="page"`, NUNCA borrarla del menú). Breadcrumb HTML bajo el H1.
Máx 3 "Servicios Relacionados". schema.js ya inyecta nodo Service automáticamente si el slug coincide.

NOTA ENTORNO: `python` = alias roto del Store; usar **`py`**. Puerto 8080 lo ocupa Santander → usar 8090.
Preview MCP NO alcanza serve.py → verificar siempre con `curl 127.0.0.1:8090`.

### Decisiones FASE 2 (no repreguntar)
- header__cta y mobile-cta-bar `--budget` apuntan a `/presupuesto/` (no a ancla on-page) para que el
  header global sea idéntico y funcione en todas las páginas. mobile `--email` = mailto. Sin WhatsApp.
- Home muestra 6 servicios money en grid-3-center (armarios pillar, cocinas, vestidores, dormitorios,
  salón, baños); los 11 viven en dropdown + footer.
- Nav: "Servicios" y "Zonas" son dropdowns con `<button>` (sin hub). main.js actualizado: submenú soporta
  `<button>`, breakpoint mobile 1024px, y nuevo facade de mapa (#map-placeholder data-src → iframe on click).
- Banner "taller" es el LCP (img real + preload + fetchpriority); trabajos = 6 picture reales loading=lazy.
  Resto (service cards, about media) = img-placeholder divs hasta tener fotos.
- JSON-LD inline en home: `["HomeAndConstructionBusiness","LocalBusiness"]` @id #negocio (mismo @id que
  schema.js → Google merge). Satisface grep LocalBusiness + ld+json sin teléfono.
- CSS nuevo: `.btn--light` (botón blanco sobre fondos dark), `.hero__points`, `.hero .badge`.

## Log de fases

- [x] FASE 0 — Arranque · 2026-06-02
- [x] FASE 1 — Cimientos · 2026-06-02 (config services/zones, schema #negocio sin tel, main.js AJAX multi-form, mail.php, gracias/, style.css 18 bloques)
- [x] FASE 2 — Home · 2026-06-02 (index.html 16 secciones, header/footer global + retro-insertado en gracias/, hero__form, JSON-LD inline, map facade, 97/100)
- [ ] FASE 3 — Servicios
- [ ] FASE 4 — Localidades/zonas
- [ ] FASE 5 — Institucionales
- [ ] FASE 6 — Blog (6 posts)
- [ ] FASE 7 — Legal y técnicos
- [ ] FASE 8 — Auditoría y QA

## Páginas (todas ❌ pendientes — ver plan.md §4)

11 servicios (pillar /armarios-a-medida/ + 2 hijos + 8 money) · 6 zonas (slug raíz, sin /localidades/) ·
/trabajos/ /nosotros/ /blog/ (6 posts) /contacto/ /presupuesto/ · 3 legales.

## Decisiones tomadas (no volver a preguntar)

- Paleta industrial-técnica navy #1E2A44 + lima #8DC63F + azul medio #2F4068. NADA rústico/cálido.
- Negocio SIN teléfono ni WhatsApp → CTA = email + formulario presupuesto. Hueco reservado en HTML/Schema.
- Slugs de servicio SIN "-vitoria"; zonas = solo nombre localidad, EN RAÍZ (no /localidades/).
- Vitoria capital EXCLUIDA como landing de zona (la cubre la home → anti-canibalización).
- NINGUNA KW de marca (ikea/leroy merlin/conforama/bauhaus) en ninguna URL.
- Folder humano con espacios (no slug); init_site.py NO usado (slug NICHO+CIUDAD inviable).
- Schema: HomeAndConstructionBusiness, omitir telephone, usar email + contactPoint + areaServed.

## Bloqueos / pendientes de material real

- GTM/GA4 sin ID → `gtmId`/`gtagId` vacíos en config.js.
- Teléfono/WhatsApp reales — hueco reservado.
- Dirección INVENTADA (Portal de Gamarra, 14) — confirmar antes de lanzar.
- Fotos reales de proyectos — placeholders hasta tenerlas.
- Nº de años de garantía + condiciones de financiación por concretar.

## Validación

- `index.html`: validate.sh 97/100 (FASE 2, 2026-06-02). Único 🔴 = tel: (negocio sin teléfono → tope 97).
  serve.py 8090: `/`, `/css/style.css`, `/gracias/` → 200. main.js node --check OK.

## Notas técnicas

- Schema `@id`: `#negocio` (coherente JSON-LD inline y schema.js).
- mapsEmbedUrl ya en config.js. rating placeholder 4.9/47.
- Referencia de LAYOUT (no copy): mobilimont.es.
