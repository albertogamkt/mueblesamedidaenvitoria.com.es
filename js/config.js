// config.js — ÚNICO ARCHIVO A MODIFICAR PARA CAMBIAR DE NEGOCIO
// Ver plantilla completa en: .claude/seo_rank_and_rent/resources/nap-config-template.js

const CONFIG = {
  businessName: "Muebles a medida en Vitoria",
  schemaType: "HomeAndConstructionBusiness",
  priceRange: "€€",

  address: {
    street: "Calle Portal de Gamarra, 14, nave 3",
    city: "Vitoria-Gasteiz",
    state: "Álava",
    postalCode: "01013",
    country: "ES"
  },

  // SIN teléfono aún — contacto solo por email y formulario. Hueco reservado.
  phone: "",
  phoneDisplay: "",
  whatsapp: "",
  email: "info@mueblesamedidaenvitoria.com.es",

  geo: { lat: 42.8584, lng: -2.6691 },

  keyword: "muebles a medida vitoria",
  domain: "mueblesamedidaenvitoria.com.es",

  hours: [
    { days: ["Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "09:00", closes: "13:30" },
    { days: ["Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "16:00", closes: "19:30" }
  ],

  primaryColor: "#1E2A44",
  secondaryColor: "#8DC63F",
  accentColor: "#2F4068",
  altBg: "#F4F6F9",
  textColor: "#232A35",

  gtmId: "",
  gtagId: "",
  mapsEmbedUrl: "https://maps.google.com/maps?q=Calle+Portal+de+Gamarra+14%2C+01013+Vitoria-Gasteiz%2C+%C3%81lava&t=&z=15&ie=UTF8&iwloc=&output=embed",
  whatsappMessage: "Hola%2C%20necesito%20un%20presupuesto%20de%20muebles%20a%20medida",
  sameAs: [],
  rating: { value: "4.9", count: "47" },

  // Servicios — slug = carpeta. Subtipos de armario anidados bajo armarios-a-medida/
  services: [
    { name: "Armarios a medida", slug: "armarios-a-medida" },
    { name: "Armarios empotrados a medida", slug: "armarios-a-medida/empotrados" },
    { name: "Vestidores a medida", slug: "armarios-a-medida/vestidores" },
    { name: "Armarios correderos a medida", slug: "armarios-a-medida/correderos" },
    { name: "Armarios abuhardillados a medida", slug: "armarios-a-medida/abuhardillados" },
    { name: "Armarios esquineros a medida", slug: "armarios-a-medida/esquineros" },
    { name: "Cocinas a medida", slug: "cocinas-a-medida" },
    { name: "Muebles de baño a medida", slug: "banos-a-medida" },
    { name: "Muebles de salón a medida", slug: "muebles-de-salon-a-medida" },
    { name: "Dormitorios a medida", slug: "dormitorios-a-medida" },
    { name: "Habitaciones juveniles a medida", slug: "habitaciones-juveniles-a-medida" },
    { name: "Escritorios y mobiliario de oficina a medida", slug: "escritorios-y-mobiliario-de-oficina-a-medida" },
    { name: "Recibidores a medida", slug: "recibidores-a-medida" },
    { name: "Mesas a medida", slug: "mesas-a-medida" }
  ],

  // Zonas — slug en raíz (sin /localidades/). Vitoria capital EXCLUIDA (la cubre la home).
  zones: [
    { name: "Laudio/Llodio", slug: "laudio-llodio" },
    { name: "Amurrio", slug: "amurrio" },
    { name: "Agurain/Salvatierra", slug: "agurain-salvatierra" },
    { name: "Alegría-Dulantzi", slug: "alegria-dulantzi" },
    { name: "Iruña de Oca", slug: "iruna-de-oca" },
    { name: "Legutiano", slug: "legutiano" }
  ]
};
