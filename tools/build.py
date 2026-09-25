#!/usr/bin/env python3
"""Aplica site.config.json + partials/ a todas las páginas HTML.

Uso:
  python3 tools/build.py          → regenera páginas, CSS, JSON-LD, sitemap.xml
  python3 tools/build.py --zip    → además crea dist/<dominio>-AAAAMMDD.zip listo para subir al servidor

Idempotente: se puede ejecutar tantas veces como se quiera.
Todas las rutas del sitio son absolutas desde la raíz (/css/…, /armarios-a-medida/…):
para previsualizar en local, sirve la carpeta raíz → `python3 -m http.server 8090`.
"""
import datetime
import hashlib
import html
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "site.config.json"
STATE_PATH = ROOT / "tools" / ".build-state.json"
PARTIALS = ROOT / "partials"
TODAY = datetime.date.today().isoformat()

# Valores que pueden aparecer escritos a mano dentro del contenido de las páginas:
# si cambian en site.config.json, el build sustituye el valor antiguo por el nuevo.
TRACKED_KEYS = ["email", "street", "postalCode", "hoursDisplay", "phone", "phoneDisplay", "mapsEmbedUrl"]

# Secciones de style.css que se incrustan como CSS crítico (lo que se ve sin hacer scroll en
# cualquier plantilla). La hoja completa se carga después sin bloquear el renderizado.
CRITICAL_SECTIONS = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 31, 32}
# Secciones críticas extra solo para las plantillas que las usan arriba del todo.
CRITICAL_BY_MARKER = {'hero--post': {29}, 'gracias-page': {30}}

# Qué se publica en el zip (todo lo demás — tools/, partials/, *.md, config, fuentes CSS — se queda fuera).
ZIP_EXCLUDE_DIRS = {".git", "tools", "partials", "dist", "node_modules", ".github", ".claude"}
ZIP_EXCLUDE_FILES = {"site.config.json", "mail-config.example.php", ".gitignore", "css/style.css"}
ZIP_EXCLUDE_SUFFIXES = {".md", ".py", ".zip"}

NOINDEX_RE = re.compile(r'<meta name="robots" content="[^"]*noindex', re.I)


# ── utilidades ─────────────────────────────────────────────────────────────

def load_config():
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def flat_values(cfg):
    return {
        "email": cfg["email"],
        "street": cfg["address"]["street"],
        "postalCode": cfg["address"]["postalCode"],
        "hoursDisplay": cfg["hoursDisplay"],
        "phone": cfg["phone"],
        "phoneDisplay": cfg["phoneDisplay"],
        "mapsEmbedUrl": cfg["mapsEmbedUrl"],
    }


def render(template, ctx):
    def section(m):
        neg, key, body = m.group(1) == "^", m.group(2), m.group(3)
        return body if bool(ctx.get(key)) != neg else ""

    out = re.sub(r"\{\{([#^])(\w+)\}\}(.*?)\{\{/\2\}\}", section, template, flags=re.S)
    return re.sub(r"\{\{(\w+)\}\}", lambda m: str(ctx.get(m.group(1), "")), out)


def minify_css(src):
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    src = re.sub(r"\s+", " ", src)
    src = re.sub(r"\s*([{};,])\s*", r"\1", src)
    return src.replace(";}", "}").strip()


def critical_css(src, sections):
    """Extrae las secciones numeradas (/* ── N. TÍTULO ── */) indicadas, en su orden original."""
    parts = re.split(r"(?m)^(?=/\* ── \d+\. )", src)
    keep = []
    for p in parts[1:]:
        n = int(re.match(r"/\* ── (\d+)\.", p).group(1))
        if n in sections:
            keep.append(p)
    return minify_css("".join(keep))


def short_hash(data):
    return hashlib.sha1(data.encode("utf-8")).hexdigest()[:8]


def strip_tags(s):
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def replace_block(text, name, content, fallback_re):
    """Sustituye el bloque marcado <!-- @name -->…<!-- /@name -->; la primera vez lo localiza con fallback_re."""
    wrapped = f"<!-- @{name} -->\n  {content.strip()}\n  <!-- /@{name} -->"
    marker_re = re.compile(rf"<!-- @{name} -->.*?<!-- /@{name} -->", re.S)
    if marker_re.search(text):
        return marker_re.sub(lambda _: wrapped, text, count=1), True
    m = re.search(fallback_re, text, re.S)
    if not m:
        return text, False
    return text[:m.start()] + wrapped + text[m.end():], True


def page_url(rel):
    """Ruta pública de una página: index.html → /carpeta/ ; 404.html → /404.html"""
    parts = rel.parts
    if parts[-1] == "index.html":
        return "/" + "/".join(parts[:-1]) + ("/" if len(parts) > 1 else "")
    return "/" + "/".join(parts)


# ── formulario común (partials/form-lead.html) ─────────────────────────────

FORM_RE = re.compile(r'<form action="/mail\.php".*?</form>', re.S)


def form_params(form_html):
    """Lee los parámetros de un formulario ya existente (versión antigua escrita a mano o ya renderizada)."""
    def attr(name, default=""):
        m = re.search(rf'<form[^>]*\s{name}="([^"]*)"', form_html)
        return html.unescape(m.group(1)) if m else default

    cls = attr("class", "form-hero")
    page = attr("data-page") or (re.search(r'name="page" value="([^"]*)"', form_html) or [None, "web"])[1]
    fid = attr("data-fid")
    if not fid:
        m = re.search(r'id="([\w-]*?)nombre"', form_html)
        fid = m.group(1) if m else "f-"
    placeholder = attr("data-placeholder")
    if not placeholder:
        m = re.search(r'<textarea[^>]*placeholder="([^"]*)"', form_html)
        placeholder = html.unescape(m.group(1)) if m else "Ej. armario empotrado de 3 m en dormitorio, en Vitoria…"
    rows = attr("data-rows")
    if not rows:
        m = re.search(r'<textarea[^>]*rows="(\d+)"', form_html)
        rows = m.group(1) if m else "3"
    submit = attr("data-submit")
    if not submit:
        m = re.search(r'<button type="submit"[^>]*>(.*?)</button>', form_html, re.S)
        submit = strip_tags(m.group(1)) if m else "Enviar solicitud"
    return {"formClass": cls, "page": page, "fid": fid, "placeholder": placeholder, "rows": rows,
            "submitLabel": submit}


def service_options(cfg, current_url):
    opts = []
    for s in cfg["services"]:
        url = "/" + s["slug"] + "/"
        sel = ' selected' if url == current_url else ''
        opts.append(f'<option value="{html.escape(s["name"])}"{sel}>{html.escape(s["name"])}</option>')
    opts.append('<option value="Otro / varios muebles">Otro / varios muebles</option>')
    return "\n                ".join(opts)


def apply_forms(text, cfg, template, base_ctx, url):
    def repl(m):
        p = form_params(m.group(0))
        ctx = dict(base_ctx)
        ctx.update({k: html.escape(v, quote=True) for k, v in p.items()})
        ctx["serviceOptions"] = service_options(cfg, url)
        return render(template, ctx).strip()

    return FORM_RE.sub(repl, text)


# ── JSON-LD estático ───────────────────────────────────────────────────────

def business_node(cfg, site):
    a = cfg["address"]
    area = [{"@type": "City", "name": a["city"],
             "containedInPlace": {"@type": "AdministrativeArea", "name": a["state"]}}]
    area += [{"@type": "City", "name": z["name"],
              "containedInPlace": {"@type": "AdministrativeArea", "name": a["state"]}} for z in cfg["zones"]]
    maps_q = f'{a["street"]}, {a["postalCode"]} {a["city"]}'.replace(" ", "+")
    node = {
        "@type": cfg["schemaType"],
        "@id": site + "/#negocio",
        "name": cfg["businessName"],
        "url": site + "/",
        "email": cfg["email"],
        "image": site + "/img/og-image.jpg",
        "logo": {"@type": "ImageObject", "@id": site + "/#logo", "url": site + "/img/logo.png",
                 "width": 512, "height": 512},
        "priceRange": cfg["priceRange"],
        "foundingDate": cfg.get("foundingDate", cfg.get("since", "")),
        "description": "Taller de carpintería y ebanistería en Vitoria-Gasteiz: diseño, fabricación propia e "
                       "instalación de muebles a medida en toda Álava.",
        "address": {"@type": "PostalAddress", "streetAddress": a["street"], "addressLocality": a["city"],
                    "addressRegion": a["state"], "postalCode": a["postalCode"], "addressCountry": a["country"]},
        "geo": {"@type": "GeoCoordinates", "latitude": cfg["geo"]["lat"], "longitude": cfg["geo"]["lng"]},
        "hasMap": "https://www.google.com/maps/search/?api=1&query=" + maps_q,
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification", "dayOfWeek": h["days"], "opens": h["opens"], "closes": h["closes"]}
            for h in cfg["hours"]
        ],
        "areaServed": area,
        "knowsAbout": cfg.get("knowsAbout", []),
        "contactPoint": {"@type": "ContactPoint", "contactType": "customer service", "email": cfg["email"],
                         "areaServed": "ES", "availableLanguage": ["es"]},
        "hasOfferCatalog": {
            "@type": "OfferCatalog", "name": "Muebles a medida",
            "itemListElement": [
                {"@type": "Offer", "itemOffered": {"@type": "Service", "name": s["name"],
                                                   "url": site + "/" + s["slug"] + "/"}}
                for s in cfg["services"]
            ],
        },
    }
    if cfg["phone"]:
        node["telephone"] = cfg["phone"]
        node["contactPoint"]["telephone"] = cfg["phone"]
    if cfg.get("sameAs"):
        node["sameAs"] = cfg["sameAs"]
    legal = cfg.get("legal", {})
    if legal.get("owner"):
        node["legalName"] = legal["owner"]
    if legal.get("nif"):
        node["taxID"] = legal["nif"]
    return node


def person_node(cfg, site):
    au = cfg["author"]
    node = {"@type": "Person", "@id": f'{site}/nosotros/#{au["id"]}', "name": au["name"],
            "jobTitle": au["jobTitle"], "url": f'{site}/nosotros/#{au["id"]}',
            "worksFor": {"@id": site + "/#negocio"},
            "knowsAbout": ["Ebanistería", "Carpintería a medida", "Diseño de mobiliario", "Armarios a medida",
                           "Cocinas a medida"]}
    if au.get("image") and (ROOT / au["image"].lstrip("/")).exists():
        node["image"] = site + au["image"]
    if au.get("sameAs"):
        node["sameAs"] = au["sameAs"]
    return node


def breadcrumb_node(text, site, url):
    m = re.search(r'<nav class="breadcrumb".*?<ol>(.*?)</ol>', text, re.S)
    if not m:
        return None
    items = []
    for li in re.findall(r"<li(?![^>]*breadcrumb__sep)[^>]*>(.*?)</li>", m.group(1), re.S):
        a = re.search(r'href="([^"]+)"', li)
        href = a.group(1) if a else url
        items.append({"@type": "ListItem", "position": len(items) + 1, "name": strip_tags(li),
                      "item": href if href.startswith("http") else site + href})
    if len(items) < 2:
        return None
    return {"@type": "BreadcrumbList", "@id": site + url + "#breadcrumb", "itemListElement": items}


def faq_node(text, site, url):
    qs = re.findall(r'class="faq-question"[^>]*>(.*?)</button>.*?class="faq-answer"[^>]*>(.*?)</(?:dd|div)>', text, re.S)
    if not qs:
        return None
    return {"@type": "FAQPage", "@id": site + url + "#faq", "mainEntity": [
        {"@type": "Question", "name": strip_tags(q),
         "acceptedAnswer": {"@type": "Answer", "text": strip_tags(a)}} for q, a in qs]}


def price_offers(text):
    offers = []
    for card in re.findall(r'<div class="precio-card[^"]*">(.*?)</div>', text, re.S):
        name = re.search(r"<h3[^>]*>(.*?)</h3>", card, re.S)
        price = re.search(r'precio-card__price[^>]*>\s*desde\s*([\d.]+)\s*€', card)
        if not (name and price):
            continue
        offers.append({"@type": "Offer", "name": strip_tags(name.group(1)),
                       "priceSpecification": {"@type": "PriceSpecification", "priceCurrency": "EUR",
                                              "minPrice": int(price.group(1).replace(".", ""))}})
    return offers


def service_node(cfg, site, url, text):
    a = cfg["address"]
    svc = next((s for s in cfg["services"] if "/" + s["slug"] + "/" == url), None)
    zone = next((z for z in cfg["zones"] if "/" + z["slug"] + "/" == url), None)
    if not (svc or zone):
        return None
    node = {"@type": "Service", "@id": site + url + "#servicio", "provider": {"@id": site + "/#negocio"},
            "url": site + url}
    if svc:
        node.update({"name": svc["name"] + " en " + a["city"], "serviceType": svc["name"],
                     "areaServed": [{"@type": "City", "name": a["city"]}] +
                                   [{"@type": "City", "name": z["name"]} for z in cfg["zones"]]})
    else:
        node.update({"name": "Muebles a medida en " + zone["name"], "serviceType": "Muebles a medida",
                     "areaServed": {"@type": "City", "name": zone["name"],
                                    "containedInPlace": {"@type": "AdministrativeArea", "name": a["state"]}}})
    offers = price_offers(text)
    if offers:
        node["offers"] = offers
    return node


def page_meta(text, pattern):
    m = re.search(pattern, text, re.S)
    return html.unescape(m.group(1)).strip() if m else ""


def process_page_scripts(text, site, cfg, lastmod):
    """Limpia los JSON-LD escritos a mano en la página: elimina el nodo #negocio (lo genera el build),
    enlaza el autor por @id y sincroniza dateModified. Devuelve (texto, tipos presentes)."""
    types = set()
    person_ref = {"@id": f'{site}/nosotros/#{cfg["author"]["id"]}'}

    def repl(m):
        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError:
            return m.group(0)
        nodes = data.get("@graph", [data])
        keep = []
        for n in nodes:
            if str(n.get("@id", "")).endswith("/#negocio"):
                continue
            t = n.get("@type")
            types.update(t if isinstance(t, list) else [t])
            if t == "BlogPosting":
                if isinstance(n.get("author"), dict) and n["author"].get("name") == cfg["author"]["name"]:
                    n["author"] = person_ref
                if lastmod and n.get("datePublished", "") <= lastmod:
                    n["dateModified"] = lastmod
            keep.append(n)
        if not keep:
            return ""
        out = {"@context": "https://schema.org", "@graph": keep} if len(keep) > 1 else dict(
            {"@context": "https://schema.org"}, **{k: v for k, v in keep[0].items() if k != "@context"})
        return ('<script type="application/ld+json">\n  ' +
                json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n  </script>")

    text = re.sub(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>', repl, text, flags=re.S)
    text = re.sub(r"\n[ \t]*<!-- JSON-LD inline \(negocio\)[^\n]*-->", "", text)
    text = re.sub(r"\n[ \t]*\n(\s*</head>)", r"\n\1", text)
    return text, types


def schema_block(text, cfg, site, url, types):
    """Grafo JSON-LD generado para la página (sin JS): negocio, web, página, migas, servicio, FAQ, autor."""
    graph = [business_node(cfg, site),
             {"@type": "WebSite", "@id": site + "/#website", "url": site + "/", "name": cfg["businessName"],
              "inLanguage": "es-ES", "publisher": {"@id": site + "/#negocio"}}]
    crumbs = breadcrumb_node(text, site, url)
    if not types & {"WebPage", "Blog", "CollectionPage", "AboutPage", "ContactPage"}:
        wp_type = {"/contacto/": "ContactPage", "/nosotros/": "AboutPage", "/trabajos/": "CollectionPage"}.get(
            url, "WebPage")
        wp = {"@type": wp_type, "@id": site + url + "#webpage", "url": site + url,
              "name": page_meta(text, r"<title>(.*?)</title>"),
              "description": page_meta(text, r'<meta name="description" content="([^"]*)"'),
              "inLanguage": "es-ES", "isPartOf": {"@id": site + "/#website"}, "about": {"@id": site + "/#negocio"}}
        if crumbs:
            wp["breadcrumb"] = {"@id": crumbs["@id"]}
        graph.append(wp)
    if crumbs:
        graph.append(crumbs)
    svc = service_node(cfg, site, url, text)
    if svc:
        graph.append(svc)
    faq = faq_node(text, site, url)
    if faq:
        graph.append(faq)
    if url == "/nosotros/" or "BlogPosting" in types:
        graph.append(person_node(cfg, site))
    data = {"@context": "https://schema.org", "@graph": graph}
    return ('<script type="application/ld+json" id="schema-graph">' +
            json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "</script>")


# ── sitemap ────────────────────────────────────────────────────────────────

def content_hash(text):
    m = re.search(r"<main.*?</main>", text, re.S)
    body = m.group(0) if m else text
    body = re.sub(r"Actualizado \d{2}/\d{2}/\d{4}", "", body)
    body = FORM_RE.sub("", body)
    return short_hash(re.sub(r"\s+", " ", body))


def write_sitemap(entries, site):
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    order = lambda e: (e[0] != "/", e[0].startswith("/blog/"), e[0])
    for url, lastmod in sorted(entries, key=order):
        lines.append(f"  <url><loc>{site}{url}</loc><lastmod>{lastmod}</lastmod></url>")
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")


# ── zip de despliegue ──────────────────────────────────────────────────────

def make_zip(cfg):
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    out = dist / f'{cfg["domain"]}-{datetime.date.today():%Y%m%d}.zip'
    n = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(ROOT.rglob("*")):
            if not p.is_file():
                continue
            rel = p.relative_to(ROOT)
            if rel.parts[0] in ZIP_EXCLUDE_DIRS or rel.as_posix() in ZIP_EXCLUDE_FILES:
                continue
            if p.suffix in ZIP_EXCLUDE_SUFFIXES:
                continue
            z.write(p, rel.as_posix())
            n += 1
    has_secret = (ROOT / "mail-config.php").exists()
    print(f"Zip OK — {out.relative_to(ROOT)} ({n} archivos)"
          + ("" if has_secret else " · AVISO: sin mail-config.php (súbelo aparte al servidor)"))


# ── build ──────────────────────────────────────────────────────────────────

def main():
    cfg = load_config()
    site = "https://" + cfg["domain"]
    values = flat_values(cfg)
    state = json.loads(STATE_PATH.read_text(encoding="utf-8")) if STATE_PATH.exists() else {}
    old_values = {k: state.get(k, values[k]) for k in TRACKED_KEYS}
    pages_state = state.get("pages", {})

    css_src = (ROOT / "css" / "style.css").read_text(encoding="utf-8")
    css_min = minify_css(css_src)
    (ROOT / "css" / "style.min.css").write_text(css_min + "\n", encoding="utf-8")
    crit_cache = {}

    def crit_for(text):
        secs = set(CRITICAL_SECTIONS)
        for marker, extra in CRITICAL_BY_MARKER.items():
            if re.search(rf'class="[^"]*\b{marker}\b', text):
                secs |= extra
        key = frozenset(secs)
        if key not in crit_cache:
            crit_cache[key] = critical_css(css_src, secs)
        return crit_cache[key]

    (ROOT / "js" / "config.js").write_text(
        "// GENERADO por tools/build.py desde site.config.json — no editar a mano.\n"
        "const CONFIG = " + json.dumps(cfg, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    js_versions = {p.stem: short_hash(p.read_text(encoding="utf-8")) for p in (ROOT / "js").glob("*.js")}

    a = cfg["address"]
    base_ctx = {
        "businessName": cfg["businessName"],
        "email": cfg["email"], "phone": cfg["phone"], "phoneDisplay": cfg["phoneDisplay"],
        "whatsapp": cfg["whatsapp"], "whatsappMessage": cfg["whatsappMessage"],
        "hoursDisplay": cfg["hoursDisplay"], "hoursNote": cfg.get("hoursNote", ""),
        "responseTime": cfg.get("responseTime", ""), "workshopNote": cfg.get("workshopNote", ""),
        "areaLabel": cfg.get("areaLabel", a["city"]),
        "street": a["street"], "postalCode": a["postalCode"],
        "city": a["city"], "state": a["state"], "since": cfg["since"], "domain": cfg["domain"],
        "year": str(datetime.date.today().year),
    }
    base_ctx = {k: html.escape(v, quote=True) for k, v in base_ctx.items()}
    base_ctx["cssVersion"] = short_hash(css_min)
    base_ctx["root"] = "/"

    partials = {n: (PARTIALS / f"{n}.html").read_text(encoding="utf-8")
                for n in ("head-assets", "header", "footer", "mobile-bar", "form-lead")}
    legal = cfg.get("legal", {})
    config_spans = {
        "nif": legal.get("nif") or "pendiente de publicar",
        "owner": legal.get("owner") or cfg["businessName"],
    }

    changed = 0
    sitemap = []

    for page in sorted(ROOT.rglob("*.html")):
        rel = page.relative_to(ROOT)
        if rel.parts[0] in {"partials", ".git", "node_modules", "dist"}:
            continue
        url = page_url(rel)
        text = original = page.read_text(encoding="utf-8")

        ctx = dict(base_ctx)
        ctx["budgetHref"] = "#presupuesto" if 'id="presupuesto"' in text else "/presupuesto/"
        ctx["criticalCss"] = crit_for(text)

        text, _ = replace_block(text, "head-assets", render(partials["head-assets"], ctx), r"(?!x)x")
        header = render(partials["header"], ctx)
        if url != "/":
            header = header.replace(f'href="{url}"', f'href="{url}" aria-current="page"')
        text, _ = replace_block(text, "header", header, r"<header class=\"site-header\".*?</header>")
        text, _ = replace_block(text, "footer", render(partials["footer"], ctx), r"<footer class=\"footer\".*?</footer>")
        text, _ = replace_block(text, "mobile-bar", render(partials["mobile-bar"], ctx), r"<div class=\"mobile-cta-bar\".*?</div>")
        text = apply_forms(text, cfg, partials["form-lead"], base_ctx, url)

        for key in TRACKED_KEYS:
            old, new = old_values.get(key, ""), values[key]
            if old and new and old != new:
                text = text.replace(old, new)
                if key != "mapsEmbedUrl":
                    text = text.replace(html.escape(old), html.escape(new))
        for key, val in config_spans.items():
            text = re.sub(rf'(<span data-config="{key}">).*?(</span>)', lambda m: m.group(1) + html.escape(val) + m.group(2), text)

        # scripts: versión por hash; schema.js ya no se usa (el JSON-LD es estático)
        text = re.sub(r'\n[ \t]*<script src="/js/schema\.js[^"]*" defer></script>', "", text)
        text = re.sub(r'src="/js/([\w-]+)\.js(?:\?v=\w+)?"',
                      lambda m: f'src="/js/{m.group(1)}.js?v={js_versions.get(m.group(1), "0")}"', text)

        # lastmod por contenido real de <main>
        h = content_hash(text)
        prev = pages_state.get(url, {})
        lastmod = prev.get("lastmod", TODAY) if prev.get("hash") == h else TODAY
        pages_state[url] = {"hash": h, "lastmod": lastmod}
        text = re.sub(r"Actualizado \d{2}/\d{2}/\d{4}",
                      "Actualizado " + datetime.date.fromisoformat(lastmod).strftime("%d/%m/%Y"), text)

        indexable = not NOINDEX_RE.search(text)
        if indexable:
            text, types = process_page_scripts(text, site, cfg, lastmod)
            block = schema_block(text, cfg, site, url, types)
            text, found = replace_block(text, "schema", block, r"(?!x)x")
            if not found:
                text = text.replace("</head>", f"  <!-- @schema -->\n  {block}\n  <!-- /@schema -->\n</head>", 1)
            if rel.parts[-1] == "index.html":
                sitemap.append((url, lastmod))
        else:
            # páginas noindex (legales, gracias, 404): sin JSON-LD, se rastrean pero no se indexan
            text = re.sub(r"\s*<!-- @schema -->.*?<!-- /@schema -->", "", text, flags=re.S)
            text = re.sub(r'\s*<script type="application/ld\+json"[^>]*>.*?</script>', "", text, flags=re.S)

        if text != original:
            page.write_text(text, encoding="utf-8")
            changed += 1

    write_sitemap(sitemap, site)
    state = dict(values)
    state["pages"] = pages_state
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Build OK — {changed} páginas actualizadas · {len(sitemap)} URLs en sitemap · "
          f"css v{base_ctx['cssVersion']} ({len(css_min)//1024} KB, crítico {min(map(len, crit_cache.values()))//1024}–"
          f"{max(map(len, crit_cache.values()))//1024} KB)")

    if "--zip" in sys.argv:
        make_zip(cfg)


if __name__ == "__main__":
    main()
