# Plan: Muebles a medida en Vitoria-Gasteiz

**Fecha de creación:** 2026-06-02
**Estado:** En desarrollo

---

## §1. Configuración del Nicho

```
NICHO:              Muebles a medida / carpintería de mobiliario a medida
CIUDAD:             Vitoria-Gasteiz (Álava + comarcas)
BARRIO/ZONA:        Cobertura Álava (capital excluida como landing)
KEYWORD PRINCIPAL:  muebles a medida vitoria
KEYWORDS 2ARIAS:    - mobiliario a medida · muebles personalizados
                    - muebles hechos a medida · muebles sobre medida
                    - muebles a medida de madera · carpinteria a medida
                    - diseño de muebles a medida · fabricacion de muebles a medida
                    - muebles a medida cerca de mi · armarios a medida vitoria
                    - cocinas a medida vitoria
SCHEMA TYPE:        HomeAndConstructionBusiness (LocalBusiness > Carpenter / FurnitureStore)
DOMINIO:            mueblesamedidaenvitoria.com.es
```

REGLA DE SLUGS: servicios SIN sufijo "-vitoria" (el geo va en el dominio). Zonas = solo nombre de localidad. NINGUNA KW de marca (ikea / leroy merlin / conforama / bauhaus) en ninguna URL.

---

## §2. Datos NAP (Name, Address, Phone)

```
NOMBRE COMERCIAL:   Muebles a medida en Vitoria
DIRECCIÓN:          Calle Portal de Gamarra, 14, nave 3 (polígono Gamarra) [INVENTADA]
CÓDIGO POSTAL:      01013
CIUDAD:             Vitoria-Gasteiz
PROVINCIA:          Álava
TELÉFONO:           (sin teléfono aún — hueco reservado en HTML/Schema)
TELÉFONO DISPLAY:   —
WHATSAPP:           (sin WhatsApp aún — botón flotante comentado en HTML)
EMAIL:              info@mueblesamedidaenvitoria.com.es
COORDENADAS:        lat: 42.8584, lng: -2.6691
HORARIO:            L-V 09:00-13:30 / 16:00-19:30 · Sábado con cita previa · Domingo cerrado
URL MAPA:           https://maps.google.com/maps?q=Calle+Portal+de+Gamarra+14%2C+01013+Vitoria-Gasteiz%2C+%C3%81lava&t=&z=15&ie=UTF8&iwloc=&output=embed
```

---

## §3. Branding

```
COLOR PRIMARIO:     #1E2A44  (navy profundo — header, topbar, footer, titulares)
COLOR SECUNDARIO:   #8DC63F  (verde lima — CTA presupuesto, botones, acentos)
COLOR ACENTO:       #2F4068  (azul medio — badges, iconos SVG, bordes card)
COLOR FONDO ALT:    #F4F6F9  (gris azulado claro — secciones zebra)
COLOR TEXTO:        #232A35
FUENTE:             Titulares Poppins/Sora · Cuerpo Inter (preconnect + preload trick)
GTM ID:             [PENDIENTE]
GTAG ID:            [PENDIENTE]
```

CONCEPTO VISUAL: industrial-técnico, limpio, mucho blanco. Hero ancho completo con overlay navy degradado sobre foto de proyecto + breadcrumb bajo el H1. NADA rústico/artesanal cálido. Referencia de layout (NO copy): mobilimont.es.

---

## §4. Arquitectura de Páginas (Silo)  ← ✅ GATE FASE 0 APROBADO por el usuario (2026-06-02)

| URL | Keyword objetivo | Tipo |
|-----|-----------------|------|
| `/` | muebles a medida vitoria | Home |
| `/armarios-a-medida/` | armarios a medida | **PILLAR** ★★★★★ |
| `/armarios-empotrados-a-medida/` | armarios empotrados a medida | Servicio hijo |
| `/vestidores-a-medida/` | vestidores a medida | Servicio hijo |
| `/cocinas-a-medida/` | cocina a medida | Servicio ★★★★★ |
| `/banos-a-medida/` | muebles de baño a medida | Servicio ★★★ |
| `/muebles-de-salon-a-medida/` | muebles de salon a medida | Servicio ★★★★ |
| `/dormitorios-a-medida/` | dormitorios a medida | Servicio ★★★★ |
| `/habitaciones-juveniles-a-medida/` | habitaciones juveniles a medida | Servicio hijo |
| `/escritorios-y-mobiliario-de-oficina-a-medida/` | escritorio a medida | Servicio ★★★ |
| `/recibidores-a-medida/` | recibidor a medida | Servicio ★★ |
| `/mesas-a-medida/` | mesas a medida | Servicio ★★★ |
| `/laudio-llodio/` | muebles a medida Laudio/Llodio | Zona |
| `/amurrio/` | muebles a medida Amurrio | Zona |
| `/agurain-salvatierra/` | muebles a medida Agurain | Zona |
| `/alegria-dulantzi/` | muebles a medida Alegría-Dulantzi | Zona |
| `/iruna-de-oca/` | muebles a medida Iruña de Oca | Zona |
| `/legutiano/` | muebles a medida Legutiano | Zona |
| `/trabajos/` | — | Portfolio filtrable |
| `/nosotros/` | — | E-E-A-T |
| `/blog/` | informacional | Blog hub (6 posts) |
| `/contacto/` | — | Conversión |
| `/presupuesto/` | precio muebles a medida / presupuesto | Landing conversión |
| `/legal/privacidad/` | — | Legal (noindex) |
| `/legal/cookies/` | — | Legal (noindex) |
| `/legal/aviso-legal/` | — | Legal (noindex) |

NOTA: zonas con slug en raíz (sin `/localidades/`), tal como define el brief. Vitoria capital EXCLUIDA como landing (la cubre la home → evita canibalización).

---

## §5. Servicios del Negocio

| Servicio | URL | Keyword H1 |
|---------|-----|------------|
| Armarios a medida (PILLAR) | `/armarios-a-medida/` | Armarios a medida en Vitoria |
| Armarios empotrados a medida | `/armarios-empotrados-a-medida/` | Armarios empotrados a medida en Vitoria |
| Vestidores a medida | `/vestidores-a-medida/` | Vestidores a medida en Vitoria |
| Cocinas a medida | `/cocinas-a-medida/` | Cocinas a medida en Vitoria |
| Baños a medida | `/banos-a-medida/` | Muebles de baño a medida en Vitoria |
| Muebles de salón a medida | `/muebles-de-salon-a-medida/` | Muebles de salón a medida en Vitoria |
| Dormitorios a medida | `/dormitorios-a-medida/` | Dormitorios a medida en Vitoria |
| Habitaciones juveniles a medida | `/habitaciones-juveniles-a-medida/` | Habitaciones juveniles a medida en Vitoria |
| Escritorios y oficina a medida | `/escritorios-y-mobiliario-de-oficina-a-medida/` | Escritorios a medida en Vitoria |
| Recibidores a medida | `/recibidores-a-medida/` | Recibidores a medida en Vitoria |
| Mesas a medida | `/mesas-a-medida/` | Mesas a medida en Vitoria |

---

## §6. Zonas de Cobertura

| Zona/Localidad | URL | Volumen estimado |
|-------------|-----|-----------------|
| Laudio/Llodio | `/laudio-llodio/` | Medio |
| Amurrio | `/amurrio/` | Medio |
| Agurain/Salvatierra | `/agurain-salvatierra/` | Bajo |
| Alegría-Dulantzi | `/alegria-dulantzi/` | Bajo |
| Iruña de Oca | `/iruna-de-oca/` | Bajo |
| Legutiano | `/legutiano/` | Bajo |

---

## §7. Mapa de Intenciones (Anti-Canibalización)

| Keyword | Página que la ataca | Intención |
|---------|---------------------|-----------|
| muebles a medida vitoria · muebles a medida cerca de mi | `/` | Comercial local |
| armarios empotrados a medida · cocina a medida | Money page del silo | Servicio específico |
| precio armario a medida · precio armario empotrado | Money page (FAQ precio) + `/presupuesto/` + post precio | Comercial precio |
| medidas mesa comedor · muebles bajo escalera | Blog → enlaza a money page | Informacional TOFU |
| muebles a medida [localidad] | Landing de zona | Local |

---

## §8. Checklist de Estado

- [x] `plan.md` creado y completo (§1–§11 rellenos)
- [x] §10 Competencia analizada (4 URLs)
- [x] §11 Brief de contenido relleno antes de generar copy
- [x] `js/config.js` generado
- [x] Estructura de carpetas base creada (boilerplate js/ + técnicos)
- [x] `css/style.css` completado (FASE 1)
- [x] `mail.php` + `gracias/` (FASE 1)
- [x] `index.html` completado (FASE 2) · 97/100
- [ ] Páginas de servicios creadas (FASE 3)
- [ ] Páginas de zonas creadas (FASE 4)
- [ ] `nosotros/` `contacto/` `trabajos/` `presupuesto/` (FASE 5)
- [ ] Blog creado (FASE 6)
- [ ] Páginas legales creadas (FASE 7)
- [ ] `robots.txt` y `sitemap.xml` actualizados (FASE 7)
- [ ] `.htaccess` configurado (FASE 7)
- [ ] Checklist SEO pasado al 100% (FASE 8)
- [ ] `validate.sh` ejecutado sin errores críticos (FASE 8)
- [ ] Subido a hosting
- [ ] Google Search Console verificado
- [ ] Google Business Profile creado/reclamado

---

## §9. Historial y Notas

```
2026-06-02 - Proyecto iniciado (FASE 0). Boilerplate copiado + config.js relleno.
2026-06-02 - Dominio objetivo: mueblesamedidaenvitoria.com.es (sin registrar aún)
2026-06-02 - FASE 1 cerrada. config.js (services[11]+zones[6]); schema.js @id #negocio, telephone omitido si vacío, contactPoint/email, areaServed con zonas, nodos Breadcrumb/Service/FAQ por página; main.js validación + envío AJAX multi-form a /mail.php; mail.php (email obligatorio, $to=albertogamkt@gmail.com); gracias/ noindex CTA email; css/style.css 18 bloques paleta navy/lima. Gate OK (serve+CSS+node --check).
```

---

## §10. Competencia / Referencias

| URL | Por qué es referencia | Qué replicar | Qué superar |
|-----|-----------------------|--------------|-------------|
| carpinteriavitoriasore.com/muebles-a-medida-en-vitoria/ | Competidor local directo Vitoria | Cobertura geo local, tipos de mueble | Velocidad, schema, transparencia de precio |
| mundoarmario.es | Especialista armarios a medida | Profundidad de silo armarios | Localización geo, prueba social local |
| mueblesramos.com/muebles-a-medida/ | Portfolio y catálogo amplio | Cantidad/calidad de trabajos | Copy más localizado, CTA presupuesto |
| mueblesindustria.com/muebles-a-medida-barcelona/ | Estética industrial-técnica | Layout limpio, render 3D | Enfoque CRO anti-riesgo/precio |
| mobilimont.es (referencia de LAYOUT, no copy) | Topbar oscura + hero overlay navy + 2 columnas | Estructura visual, breadcrumb bajo H1 | Copy 100% propio y localizado |

**Notas de análisis:**
```
Tienen Google Business Profile: Mayoría
Usan precios orientativos: Minoría → oportunidad (dolor #1 precio)
```

---

## §11. Brief de Contenido

**Audiencia principal:**
```
PERFIL: Propietario de vivienda en Vitoria/Álava reformando o equipando piso (incl. Casco Viejo, pisos con huecos difíciles, buhardillas)
SITUACIÓN: Planifica mobiliario a medida / compara precios / teme equivocarse en una compra de alto importe
NIVEL TÉCNICO: Bajo-Medio — sabe qué quiere pero no de fabricación/materiales
```

**Puntos de dolor (ordenados por frecuencia — validados OCU/Hispacoop/foros):**
```
1. Incertidumbre de precio (miedo a que se dispare, costes ocultos de montaje/transporte/retirada)
2. Plazos de entrega e incumplimiento (encargos pagados que se retrasan)
3. Desconfianza / miedo a estafa (pagar señal grande y no recibir el mueble)
4. Errores de medición y de quién es la culpa (miedo a medir mal)
5. No poder visualizar el resultado antes de fabricar
```

**Objeciones principales:**
```
1. "¿cuánto va a costar?" → Precio orientativo por m²/módulo visible + presupuesto cerrado, todo incluido, sin sorpresas
2. "¿lo entregarán a tiempo?" → Plazo comprometido por escrito + semáforo de fases (medición→fabricación→montaje)
3. "¿es de fiar?" → Taller/showroom físico en Vitoria, reseñas con nombre+localidad, contrato y pago ligado a hitos
4. "¿y si me equivoco midiendo?" → Visita y medición PROFESIONAL gratuita (quitamos el riesgo de su lado)
5. "¿cómo sé que quedará bien?" → Render 3D / plano antes de fabricar + portfolio real filtrable
```

**Diferenciadores reales del negocio:**
```
1. 18 años diseñando, fabricando e instalando en Vitoria-Gasteiz y Álava
2. Fabricación propia bajo pedido (no venta de catálogo): cada pieza al hueco real
3. Diseño y render 3D previo antes de fabricar
4. Visita y medición gratuitas a domicilio + presupuesto detallado sin compromiso
5. +750 proyectos fabricados (placeholder editable) · garantía por escrito (años por fijar)
6. Montaje y retirada de embalaje incluidos · "nos adaptamos al calendario de tu reforma"
```

**Tono de comunicación:**
```
[x] Confianza técnica (fabricación, carpintería de precisión)
[x] Cercano y local (negocio de Vitoria, trato directo)
[ ] Urgencia
[ ] Profesional-corporativo
```

**Referencias de copy:**
```
mobilimont.es — layout/estructura (NO copiar copy)
Copy 100% propio, localizado a Vitoria/Álava, jerarquía CRO: primero RIESGO/PRECIO, luego diseño.
```

---

## §12. CAMPOS PENDIENTES (rellenar antes de lanzar)

1. GTM container ID + GA4.
2. Teléfono y WhatsApp reales (hueco reservado en HTML/Schema).
3. Nº de años de garantía concreto.
4. Confirmar/ajustar dirección inventada (Portal de Gamarra, 14) → regenerar Maps embed + coordenadas si cambia.
5. Fotos reales de proyectos para `/trabajos/` y heros (ahora placeholders).
6. Condiciones de financiación (importe/entidad) si se concreta más allá de "a consultar".
