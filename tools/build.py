#!/usr/bin/env python3
"""Aplica site.config.json + partials/ a todas las páginas HTML.

Uso:  python3 tools/build.py
Idempotente: se puede ejecutar tantas veces como se quiera.
"""
import datetime
import hashlib
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "site.config.json"
STATE_PATH = ROOT / "tools" / ".build-state.json"
PARTIALS = ROOT / "partials"

# Valores que pueden aparecer escritos a mano dentro del contenido de las páginas:
# si cambian en site.config.json, el build sustituye el valor antiguo por el nuevo.
TRACKED_KEYS = ["email", "street", "postalCode", "hoursDisplay", "phone", "phoneDisplay", "mapsEmbedUrl"]


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


def short_hash(data):
    return hashlib.sha1(data.encode("utf-8")).hexdigest()[:8]


def update_business_node(node, cfg):
    """Actualiza solo los datos NAP del nodo #negocio; conserva el resto (areaServed, @graph, etc.)."""
    a = cfg["address"]
    node["name"] = cfg["businessName"]
    node["email"] = cfg["email"]
    if cfg["phone"]:
        node["telephone"] = cfg["phone"]
    else:
        node.pop("telephone", None)
    node["priceRange"] = cfg["priceRange"]
    node["address"] = {"@type": "PostalAddress", "streetAddress": a["street"], "addressLocality": a["city"],
                       "addressRegion": a["state"], "postalCode": a["postalCode"], "addressCountry": a["country"]}
    node["geo"] = {"@type": "GeoCoordinates", "latitude": cfg["geo"]["lat"], "longitude": cfg["geo"]["lng"]}
    if "aggregateRating" in node:
        node["aggregateRating"].update({"ratingValue": cfg["rating"]["value"], "reviewCount": cfg["rating"]["count"]})


def sync_jsonld(text, cfg):
    def repl(m):
        try:
            data = json.loads(m.group(2))
        except json.JSONDecodeError:
            return m.group(0)
        nodes = data.get("@graph", [data]) if isinstance(data, dict) else []
        hits = [n for n in nodes if isinstance(n, dict) and str(n.get("@id", "")).endswith("/#negocio")]
        if not hits:
            return m.group(0)
        before = json.dumps(data, sort_keys=True)
        for n in hits:
            update_business_node(n, cfg)
        if json.dumps(data, sort_keys=True) == before:
            return m.group(0)
        return m.group(1) + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + m.group(3)

    return re.sub(r'(<script type="application/ld\+json">\s*)(\{.*?\})(\s*</script>)', repl, text, flags=re.S)


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


def main():
    cfg = load_config()
    values = flat_values(cfg)
    state = json.loads(STATE_PATH.read_text(encoding="utf-8")) if STATE_PATH.exists() else values

    css_src = (ROOT / "css" / "style.css").read_text(encoding="utf-8")
    css_min = minify_css(css_src)
    (ROOT / "css" / "style.min.css").write_text(css_min + "\n", encoding="utf-8")

    (ROOT / "js" / "config.js").write_text(
        "// GENERADO por tools/build.py desde site.config.json — no editar a mano.\n"
        "const CONFIG = " + json.dumps(cfg, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    js_versions = {p.stem: short_hash(p.read_text(encoding="utf-8")) for p in (ROOT / "js").glob("*.js")}

    a = cfg["address"]
    base_ctx = {
        "email": cfg["email"], "phone": cfg["phone"], "phoneDisplay": cfg["phoneDisplay"],
        "whatsapp": cfg["whatsapp"], "whatsappMessage": cfg["whatsappMessage"],
        "hoursDisplay": cfg["hoursDisplay"], "street": a["street"], "postalCode": a["postalCode"],
        "city": a["city"], "state": a["state"], "since": cfg["since"], "domain": cfg["domain"],
        "year": str(datetime.date.today().year),
    }
    base_ctx = {k: html.escape(v, quote=True) for k, v in base_ctx.items()}
    base_ctx["cssVersion"] = short_hash(css_min)

    partials = {n: (PARTIALS / f"{n}.html").read_text(encoding="utf-8")
                for n in ("head-assets", "header", "footer", "mobile-bar")}

    changed = 0

    for page in sorted(ROOT.rglob("*.html")):
        rel = page.relative_to(ROOT)
        if rel.parts[0] in {"partials", ".git", "node_modules"}:
            continue
        depth = len(rel.parts) - 1
        root = "../" * depth if depth else "./"
        text = original = page.read_text(encoding="utf-8")

        ctx = dict(base_ctx, root=root)
        ctx["budgetHref"] = "#presupuesto" if 'id="presupuesto"' in text else root + "presupuesto/"

        head = render(partials["head-assets"], ctx)
        text, found = replace_block(
            text, "head-assets", head,
            r"(?:[ \t]*<!-- Google Fonts: preload trick -->\n)?[ \t]*<link rel=\"preload\" href=\"https://fonts\.googleapis\.com.*?<link rel=\"manifest\"[^>]*>",
        )
        if not found:
            text, _ = replace_block(
                text, "head-assets", head,
                r"[ \t]*<link rel=\"preload\" href=\"(?:\.\./|\./)*css/style\.css\"[^>]*>\s*<noscript>.*?</noscript>"
                r"(?:\s*<link rel=\"(?:icon|apple-touch-icon|manifest)\"[^>]*>)*",
            )
        text = re.sub(r"\n[ \t]*<!-- CSS no-crítico: preload trick -->\n", "\n", text)
        text = re.sub(r"[ \t]*<link rel=\"preconnect\" href=\"https://fonts\.(?:googleapis|gstatic)\.com\"[^>]*>\n", "", text)

        header = render(partials["header"], ctx)
        if depth:
            current = root + "/".join(rel.parts[:-1]) + "/"
            header = header.replace(f'href="{current}"', f'href="{current}" aria-current="page"')
        text, _ = replace_block(text, "header", header, r"<header class=\"site-header\".*?</header>")
        text, _ = replace_block(text, "footer", render(partials["footer"], ctx), r"<footer class=\"footer\".*?</footer>")
        text, _ = replace_block(text, "mobile-bar", render(partials["mobile-bar"], ctx), r"<div class=\"mobile-cta-bar\".*?</div>")

        text = sync_jsonld(text, cfg)
        text = re.sub(r'srcset="/(?!/)', f'srcset="{root}', text)
        text = re.sub(
            r'src="((?:\.\./|\./)+js/)([\w-]+)\.js(?:\?v=\w+)?"',
            lambda m: f'src="{m.group(1)}{m.group(2)}.js?v={js_versions.get(m.group(2), "0")}"', text,
        )

        for key in TRACKED_KEYS:
            old, new = state.get(key, ""), values[key]
            if old and new and old != new:
                text = text.replace(old, new)
                if key != "mapsEmbedUrl":
                    text = text.replace(html.escape(old), html.escape(new))

        if text != original:
            page.write_text(text, encoding="utf-8")
            changed += 1

    STATE_PATH.write_text(json.dumps(values, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Build OK — {changed} páginas actualizadas · css v{base_ctx['cssVersion']} ({len(css_min)//1024} KB min)")


if __name__ == "__main__":
    main()
