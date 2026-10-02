import { CAMC } from "../config.mjs";
import { entrada } from "../content/catalogo.mjs";
import { proezasIniciales, saludMaxima } from "../rules/reglas.mjs";
import { CAPITULOS, repartosValidos, maximo as maximoPunto } from "../rules/comunidad.mjs";
import { mulberry32, hashSeed, pick } from "../utils/random.mjs";

const clone = value => JSON.parse(JSON.stringify(value));

const uniquePicks = (list, count, rng) => {
  const pool = [...list];
  const result = [];
  while (result.length < count && pool.length) {
    const index = Math.floor(rng() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }
  return result;
};

const title = value => String(value ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const normalized = value => String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const CAMCGeneratorTables = {
  nombres: [
    "Einar", "Astrid", "Runa", "Sigrid", "Bjorn", "Kara", "Ivar", "Hilda", "Ulf", "Solveig",
    "Gunnar", "Liv", "Skadi", "Njal", "Yrsa", "Ragnar", "Helga", "Torsten", "Freydis", "Vidar",
    "Arne", "Thyra", "Sten", "Bodil", "Leif", "Ingrid", "Ketil", "Dagny", "Sven", "Eira",
    "Viktor", "Mara", "Bruno", "Vega", "Nico", "Greta", "Lobo", "Hache", "Val", "Noa",
    "Aina", "Alrik", "Ansel", "Arvid", "Asger", "Audhild", "Bjarte", "Brand", "Brynja", "Dag",
    "Disa", "Egil", "Eivor", "Elof", "Embla", "Erik", "Estrid", "Finn", "Frode", "Geir",
    "Gerd", "Gisli", "Gudrun", "Halfdan", "Halvar", "Harald", "Hedda", "Hrafn", "Jorunn", "Knut",
    "Kol", "Lagertha", "Magnus", "Mikkel", "Odd", "Olaf", "Rakel", "Rikke", "Rune", "Signe",
    "Sigrun", "Siv", "Stig", "Tora", "Tove", "Trygve", "Viggo", "Ylva", "Aitor", "Ariadna",
    "Biel", "Candela", "Dario", "Elia", "Gael", "Iria", "Lara", "Leo", "Maia", "Mateo",
    "Nerea", "Oriol", "Roi", "Saul", "Selene", "Teo", "Ulises", "Vera", "Zaira", "Zoe",
    "Risco", "Navaja", "Brea", "Kora", "Nilo", "Tizne", "Sombra", "Cobre", "Astilla", "Duna"
  ],
  apodos: [
    "Cuervo Negro", "Viejo Motor", "Diente Roto", "Mano de Humo", "La Sorda", "Ojo de Hielo",
    "Rompepuentes", "Santa Chatarra", "Piel de Asfalto", "La Devota", "Martillo Bajo", "Rueda Fria",
    "Tres Clavos", "Lengua de Plata", "Hueso Limpio", "La Ultima", "Cicatriz", "Trueno Seco",
    "Mala Senal", "Guardafaro", "Pluma Roja", "Hierro Dulce", "Sangre de Brea", "Norte",
    "Motor Frio", "Boca de Clavo", "Puño de Sal", "Ojo de Cuervo", "La Bujia", "Cadena Negra",
    "Muerdepolvo", "Rompehielo", "La Llave", "Humo Azul", "Ceniza Viva", "Diente de Perro",
    "Cromo Viejo", "La Silenciosa", "El Faro", "Pierna de Acero", "Trapo Rojo", "Piston",
    "La Que Vuelve", "Runa Torcida", "Clavo Santo", "Gasolina Mala", "La Sin Norte", "Mano de Grasa",
    "Cortacables", "Reina del Oxido", "El Zurdo", "La Tuerca", "Hierro Negro", "Cuello de Lobo",
    "La Centella", "Bala Mojada", "Ojo de Brea", "Nido de Hugin", "La Profeta", "Cazarrutas",
    "Rueda Sagrada", "La Chispa", "Mordisco", "Viento Seco", "Siete Runas", "La Despierta",
    "Barro Bendito", "Doble Escape", "Noche de Thor", "Hueso de Motor", "Vieja Promesa", "La Deuda"
  ],
  conceptos: [
    "veterano del Viejo Mundo", "exploradora de rutas muertas", "mecanico de frontera", "negociadora de asentamientos",
    "tirador de escolta", "recuperadora de reliquias", "sanadora de carretera", "mensajero entre comunidades",
    "exiliada de otro capitulo", "guardian de convoy", "piloto de persecucion", "cazadora de amenazas",
    "archivista de juramentos", "rompebloqueos", "protector de peregrinos", "contrabandista arrepentido",
    "piloto de vanguardia", "recadera de malas noticias", "cobrador de deudas del capitulo", "guardiana de combustible",
    "ex mecanico de una comunidad rival", "explorador de tuneles de autopista", "negociador de treguas imposibles",
    "cazador de desertores", "aprendiz de sacerdote de carretera", "veterana de una guerra de pozos",
    "rastreadora de ruedas en ceniza", "custodio de mapas plastificados", "campeon de carreras rituales",
    "tiradora de sidecar", "rescatador de caravanas perdidas", "guia de rutas contaminadas",
    "sanador sin licencia", "ladrona reformada por juramento", "vigia de torre de peaje",
    "mensajera entre santuarios", "negociante de piezas imposibles", "superviviente de una banda exterminada",
    "mecanica de motores dvergar", "portavoz de un refugio quemado", "infiltrada entre forajidos",
    "cazadora de criaturas nocturnas", "buscador de agua bajo ruinas", "arbitro de duelos de carretera",
    "recuperador de reliquias medicas", "escolta de peregrinos de Freya", "saboteadora de convoyes enemigos",
    "vigia de tormentas de ceniza", "custodia de las faltas del capitulo"
  ],
  motivaciones: [
    "mantener con vida al capitulo aunque haya que pagar un precio",
    "encontrar una ruta segura hacia una comunidad perdida",
    "demostrar que merece portar el parche",
    "recuperar una deuda de sangre del Viejo Mundo",
    "convertir el asentamiento en un refugio real",
    "mantener su moto funcionando hasta el ultimo dia",
    "honrar a quienes murieron en la carretera",
    "impedir que otra comunidad caiga por falta de recursos",
    "encontrar al hermano que desaparecio durante una persecucion",
    "levantar un garaje seguro para todos los cuervos",
    "pagar una falta antigua antes de que la reclame el capitulo",
    "demostrar que su deidad no la abandono",
    "recuperar una pieza unica robada a su montura",
    "cerrar una ruta que solo trae muerte",
    "abrir comercio con una comunidad que odia a los moteros",
    "proteger a una criatura o persona que nadie mas aceptaria",
    "mantener vivo el recuerdo de un mentor caido",
    "ganar reputacion suficiente para cambiar una norma del club",
    "acabar con una banda que marca a sus victimas con runas falsas",
    "encontrar combustible limpio antes de que llegue el invierno",
    "recuperar un juramento roto con una hazaña imposible",
    "convertir su moto en una leyenda que sobreviva a su nombre"
  ],
  citas: [
    "La carretera no perdona, pero escucha los juramentos.",
    "Si el motor arranca, todavia queda esperanza.",
    "No prometas nada que no puedas sellar con gasolina y sangre.",
    "Un hermano no se abandona en la cuneta.",
    "Las runas no salvan a los cobardes.",
    "Primero el capitulo, luego el resto del mundo.",
    "El que guarda gasolina guarda futuro.",
    "No hay camino muerto si queda una rueda girando.",
    "Las deudas pesan mas que una armadura mojada.",
    "Mi moto no ruge: avisa.",
    "No entierres una promesa si aun puedes arrancar.",
    "Si dudas, escucha al motor.",
    "El miedo corre menos que nosotros.",
    "No necesito suerte; necesito una bujia limpia.",
    "La paz tambien se negocia con el casco puesto.",
    "Los dioses miran, pero nosotros empujamos.",
    "Quien no respeta la carretera, alimenta la cuneta.",
    "Una runa vale poco sin alguien dispuesto a cumplirla.",
    "Los cobardes preguntan cuanto falta; los cuervos preguntan quien guia.",
    "No hay chatarra inutil, solo manos sin fe."
  ],
  nacimientos: [
    "refugio bajo una gasolinera", "caravana de sal", "mina abandonada", "barco varado en el polvo",
    "bunker de autopista", "comunidad agricola fortificada", "ruinas de un centro comercial",
    "taller dvergar", "puesto de peaje convertido en fortin", "hospital saqueado",
    "autobus varado usado como guarderia", "subterraneo de metro inundado", "azotea de un hotel fortificado",
    "capilla de carretera", "deposito municipal rodeado de alambradas", "estacion de radio abandonada",
    "granja hidropónica", "cementerio de camiones", "vieja fabrica de conservas", "puente colgante defendido",
    "parque eolico saqueado", "refineria apagada", "observatorio de montaña", "tunel con aire filtrado",
    "mercado bajo una autopista", "silo convertido en torre", "campo de chatarra sagrado", "terminal de ferry seca",
    "bodega subterranea", "escuela fortificada", "mina de sal", "planta solar rota"
  ],
  defectosGraves: [
    "jura venganza antes de medir el peligro", "no abandona una moto aunque sea suicida",
    "desconfia de toda autoridad externa", "oculta una deuda con un enemigo del capitulo",
    "pierde el control cuando amenazan a la comunidad", "ha roto un juramento importante",
    "prefiere mentir antes que admitir miedo", "no perdona a quien abandona a un herido",
    "se obsesiona con perseguir a quien huye", "guarda un secreto que podria romper una alianza",
    "cree que las visiones justifican cualquier precio", "ha vendido informacion una vez y teme que se sepa",
    "odia tanto a un clan rival que pone en riesgo misiones", "no sabe retirarse aunque la carretera este perdida",
    "confunde orgullo con honor", "tiene panico a quedarse sin combustible",
    "protege a una persona buscada por el capitulo", "su fe se tambalea cuando falla una promesa"
  ],
  defectosLeves: [
    "duerme con una herramienta en la mano", "habla con su moto", "colecciona matriculas viejas",
    "nunca tira una pieza rota", "se santigua con runas antes de arrancar", "odia viajar en silencio",
    "cuenta los litros en voz alta", "guarda clavos de cada batalla", "no soporta que toquen su casco",
    "tararea cuando miente", "pone nombre a cada arma improvisada", "limpia la cadena antes de dormir",
    "deja runas dibujadas en las mesas", "masca cuero viejo para concentrarse", "apunta deudas en la piel",
    "odia el agua estancada", "se rie en los funerales para no llorar", "guarda mapas que ya no sirven",
    "discute con radios apagadas", "nunca atraviesa una puerta sin mirar el techo",
    "se niega a conducir sin una pluma negra", "mide la confianza por herramientas prestadas"
  ],
  npcTipos: [
    "Bandido", "Mercader de chatarra", "Emisaria", "Juez de carretera", "Cazador", "Mecanica errante",
    "Portavoz de asentamiento", "Cultista", "Escolta", "Exploradora", "Saboteador", "Vidente",
    "Contrabandista", "Medico de frontera", "Campeon local", "Carroñero"
  ],
  npcRasgos: [
    "Codicia", "Lealtad rota", "Fanatismo", "Cobardia calculada", "Honor antiguo", "Hambre",
    "Pragmatismo", "Crueldad", "Deuda pendiente", "Miedo a los dioses", "Orgullo", "Paranoia",
    "Valentia absurda", "Mentiras faciles", "Memoria prodigiosa", "Odio al 1%"
  ],
  razas: ["Mortales", "Dvergar", "Elfos oscuros", "Tocados por Muspelheim", "Forajidos de Midgard", "Errantes"],
  reinos: ["Midgard", "Nidavellir", "Jotunheim", "Muspelheim", "Niflheim", "Alfheim"],
  comunidades: {
    prefijos: ["Puerto", "Fuerte", "Refugio", "Santuario", "Cruce", "Pozo", "Taller", "Bastion", "Garaje", "Puesto"],
    nucleos: ["Hugin", "Munin", "Brea", "Ceniza", "Clavo", "Motor", "Norte", "Acero", "Runas", "Gasolina", "Cuervo", "Trueno"],
    tipos: ["asentamiento fortificado", "parada de convoy", "garaje comunal", "mercado de chatarra", "refugio agricola", "puerto seco", "puesto de vigilancia", "monasterio de carretera"],
    defensas: [
      "empalizada de chapa y torres de neumáticos", "zanjas con pinchos y focos de largo alcance",
      "portón de camion blindado", "milicia de vecinos con radios de manivela",
      "barreras moviles hechas con remolques", "perros entrenados y campanas de alarma",
      "runa de advertencia pintada en cada entrada", "un viejo puente que puede levantarse"
    ],
    aliados: [
      "un taller dvergar que intercambia piezas por favores", "una caravana de agua que visita cada luna",
      "un capitulo menor que debe una deuda", "un santuario de Freya que ofrece curacion",
      "cazadores de la sierra cercana", "una familia de agricultores protegida por juramento"
    ],
    amenazas: [
      "bandidos que conocen una ruta secundaria", "una averia en el pozo principal",
      "un brote de enfermedad entre los niños", "un grupo rival busca combustible",
      "criaturas que cazan de noche", "una tormenta de ceniza que se acerca",
      "un traidor vende informacion", "el generador principal consume demasiado"
    ],
    notas: [
      "La comunidad mide la confianza en litros de combustible prestados.",
      "Cada visitante deja una pieza util en la puerta.",
      "Los muertos importantes se recuerdan colgando llaves del muro norte.",
      "Nadie puede entrar con el deposito vacio sin explicar por que."
    ]
  }
};

export const CAMCCharacterArchetypes = {
  lider: ["car", "int", "per", "des", "fue"],
  ruta: ["des", "per", "int", "car", "fue"],
  combate: ["des", "fue", "per", "car", "int"],
  mecanica: ["int", "des", "per", "fue", "car"],
  supervivencia: ["per", "fue", "des", "int", "car"],
  social: ["car", "per", "int", "des", "fue"]
};

const cargoArchetype = {
  presidente: "lider",
  vicepresidente: "social",
  secretario: "mecanica",
  tesorero: "supervivencia",
  sargento_armas: "combate",
  capitan_rutas: "ruta",
  mecanico_jefe: "mecanica",
  full_patch: "ruta"
};

/** Favorecidas del cargo: las fijas y, si el cargo lo permite, las libres elegidas al azar (pp. 43, 49-55). */
function favoritasPorCargo(cargo, rng) {
  const fijas = [...(cargo.habilidades ?? [])];
  const libres = uniquePicks(Object.keys(CAMC.habilidades).filter(k => !fijas.includes(k)), cargo.libres ?? 0, rng);
  return [...fijas, ...libres];
}

function buildAttributes(order) {
  const values = [6, 4, 2, 1, 0];
  return Object.fromEntries(order.map((key, index) => [key, { value: values[index] ?? 0 }]));
}

// Reparto de creación (reglas-resumen.json): 4 habilidades a 3D, 8 a 2D, el resto a 1D.
// Es un reparto de dados independiente de qué habilidades sean favorecidas (esas suman
// +3 aparte al tirar, no dados extra), pero para que un PJ generado tenga sentido se
// prioriza que sus habilidades favorecidas caigan en el tramo de 3D siempre que sea posible.
function buildSkills(favored = [], rng = Math.random) {
  const keys = Object.keys(CAMC.habilidades);
  const favoredKeys = keys.filter(key => favored.includes(key));
  const otherKeys = keys.filter(key => !favored.includes(key));
  const ordered = [...uniquePicks(favoredKeys, favoredKeys.length, rng), ...uniquePicks(otherKeys, otherKeys.length, rng)];
  const threeD = new Set(ordered.slice(0, 4));
  const twoD = new Set(ordered.slice(4, 12));
  const skills = {};
  for (const [key, cfg] of Object.entries(CAMC.habilidades)) {
    const value = threeD.has(key) ? 3 : (twoD.has(key) ? 2 : 1);
    skills[key] = { value, atributo: cfg.atributo ?? "int" };
  }
  return skills;
}

function derivedFor(attributes, skills) {
  const attr = key => Number(attributes[key]?.value ?? 0);
  const skill = key => Number(skills[key]?.value ?? 1);
  return {
    agilidad: (skill("atletismo") * 3) + attr("des"),
    evasion: (skill("conducir") * 3) + attr("des"),
    aplomo: attr("car") + attr("int") + 5,
    perspicacia: attr("int") + attr("per") + 5
  };
}

function combatFor(attributes, skills, npc = false, options = {}) {
  const attr = key => Number(attributes[key]?.value ?? 0);
  const healthRoll = npc ? 0 : Number(options.saludRoll ?? 1);
  const health = npc ? 14 + (attr("fue") * 2) : saludMaxima(attr("fue"), healthRoll);
  const proezasMax = proezasIniciales(attr("fue"), attr("int"), options.talento === "Líder nato" ? 2 : 0);
  return {
    salud: { value: health, max: health, roll_inicial: healthRoll },
    proezas: npc ? { value: 0, max: 0 } : { value: proezasMax, max: proezasMax },
    resistencia_fisica: Math.max(0, 12 - attr("fue")),
    iniciativa: attr("des") + attr("int"),
    dano_bonus: 0,
    tiradas_iniciales_hechas: !npc && healthRoll > 0
  };
}

const starterFlag = () => ({ [CAMC.systemId]: { generatedStarter: true } });
const deityIcon = deity => CAMC.itemIcons.dones[normalized(deity)] ?? CAMC.itemIcons.donFallback;

// Daño según la tabla de concreción del manual: fijo (sin dados) + bonificador de
// atributo. cuerpo_a_cuerpo e improvisada usan 3 + FUE; distancia_no_fuego, 3 + PER;
// fuego_cortas, 7 + PER. La categoría es siempre la clave exacta de CAMC.categoriasArma.
const melee = [
  {
    name: "Cuchillo de carretera",
    img: "icons/weapons/daggers/dagger-simple.webp",
    system: { tipo: "cuerpo_a_cuerpo", categoria: "cuerpo_a_cuerpo", alcance: "cuerpo_a_cuerpo", dano_fijo: 3, especial: "Herramienta de supervivencia y arma discreta.", descripcion: "Hoja corta útil para trabajo de campamento, intimidación y combate cercano.", equipada: true, carga: { ubicacion: "mochila", espacios: 0.5 } }
  },
  {
    name: "Llave pesada",
    img: "icons/tools/hand/wrench-steel-grey.webp",
    system: { tipo: "cuerpo_a_cuerpo", categoria: "improvisada", alcance: "cuerpo_a_cuerpo", dano_fijo: 3, especial: "Cuenta también como herramienta de mecánica.", descripcion: "Llave de taller grande, marcada con hollín y runas de uso.", equipada: true, carga: { ubicacion: "mochila", espacios: 1 } }
  },
  {
    name: "Cadena de arrastre",
    img: "icons/tools/fasteners/chain-steel.webp",
    system: { tipo: "cuerpo_a_cuerpo", categoria: "cuerpo_a_cuerpo", alcance: "cuerpo_a_cuerpo", dano_fijo: 3, especial: "Puede servir para bloquear, atar o remolcar.", descripcion: "Cadena de acero recuperada de un portón de carretera.", equipada: true, carga: { ubicacion: "mochila", espacios: 1 } }
  },
  {
    name: "Bate con clavos",
    img: "icons/weapons/clubs/club-spiked-brown.webp",
    system: { tipo: "cuerpo_a_cuerpo", categoria: "improvisada", alcance: "cuerpo_a_cuerpo", dano_fijo: 3, especial: "Intimidante y fácil de conseguir.", descripcion: "Bate de madera reforzado con clavos oxidados.", equipada: true, carga: { ubicacion: "mochila", espacios: 1 } }
  },
  {
    name: "Machete de matarife",
    img: "icons/weapons/swords/sword-worn-brown.webp",
    system: { tipo: "cuerpo_a_cuerpo", categoria: "cuerpo_a_cuerpo", alcance: "cuerpo_a_cuerpo", dano_fijo: 3, especial: "Hoja larga, útil también para abrirse paso entre maleza o chatarra.", descripcion: "Machete pesado de hoja mellada, propio de talleres y mataderos.", equipada: true, carga: { ubicacion: "mochila", espacios: 1 } }
  }
];
const ranged = [
  {
    name: "Arpón",
    img: "icons/weapons/polearms/spear-hooked-brown.webp",
    system: { tipo: "distancia_no_fuego", categoria: "distancia_no_fuego", alcance: "distancia", dano_fijo: 3, municion: { value: 0, max: 0 }, especial: "Recuperable si la escena permite recogerlo.", descripcion: "Arpón pesado usado para cazar, intimidar y detener objetivos a corta distancia.", equipada: false, carga: { ubicacion: "mochila", espacios: 2 } }
  },
  {
    name: "Pistola reciclada",
    img: "icons/weapons/guns/gun-pistol-brass.webp",
    system: { tipo: "fuego_cortas", categoria: "fuego_cortas", alcance: "distancia", dano_fijo: 7, municion: { value: 6, max: 6 }, especial: "Munición escasa; declarar recarga cuando se agote.", descripcion: "Arma corta reconstruida con piezas no coincidentes.", equipada: false, carga: { ubicacion: "mochila", espacios: 1 } }
  },
  {
    name: "Ballesta de taller",
    img: "icons/weapons/crossbows/crossbow-simple-brown.webp",
    system: { tipo: "distancia_no_fuego", categoria: "distancia_no_fuego", alcance: "distancia", dano_fijo: 3, municion: { value: 5, max: 5 }, especial: "Silenciosa y fácil de reparar con piezas comunes.", descripcion: "Ballesta sencilla fabricada con acero de suspensión.", equipada: false, carga: { ubicacion: "mochila", espacios: 2 } }
  },
  {
    name: "Escopeta recortada",
    img: "icons/weapons/guns/gun-shotgun-worn.webp",
    system: { tipo: "fuego_cortas", categoria: "fuego_cortas", alcance: "distancia", dano_fijo: 7, municion: { value: 2, max: 2 }, especial: "Munición muy escasa; devastadora a corta distancia.", descripcion: "Escopeta de cañones recortados, ruidosa y temida en cualquier capítulo.", equipada: false, carga: { ubicacion: "mochila", espacios: 2 } }
  }
];
const useful = [
  { name: "Kit de herramientas", img: "icons/tools/hand/hammer-and-wrench.webp", tipo: "herramienta", especial: "Permite justificar reparaciones y trabajos de Mecánica.", descripcion: "Llaves, bridas, cable, cinta, grasa y recambios pequeños.", espacios: 1 },
  { name: "Botiquín de ruta", img: "icons/containers/bags/pack-leather-white.webp", tipo: "suministro", especial: "Apoyo narrativo para Auxilio y curas improvisadas.", descripcion: "Vendas limpias, alcohol, aguja, hilo y analgésicos de dudosa fecha.", espacios: 1 },
  { name: "Raciones y cantimplora", img: "icons/consumables/food/bowl-stew-tofu-potato-red.webp", tipo: "suministro", especial: "Comida y agua para una salida corta.", descripcion: "Lo justo para sobrevivir a una ruta sin depender de nadie.", espacios: 1 },
  { name: "Mapa plastificado", img: "icons/sundries/documents/document-map-yellow.webp", tipo: "general", especial: "Ayuda a justificar rutas, atajos y memoria del territorio.", descripcion: "Mapa del Viejo Mundo lleno de marcas nuevas del capítulo.", espacios: 0 }
];

// Mismos niveles y penalizaciones reales del manual (ver _data/armaduras/armaduras.json),
// usados aquí para poder repartirlos al azar entre los PNJ generados.
const armorPool = [
  { name: "Armadura de cuero / Ropa acolchada", nivel: 1, penalizacion: 0 },
  { name: "Armadura de caucho", nivel: 2, penalizacion: 1 },
  { name: "Casco de fútbol americano", nivel: 2, penalizacion: 1 },
  { name: "Cota de malla de anilla gruesa", nivel: 3, penalizacion: 1 },
  { name: "Armadura de placas o cota de malla de anilla fina", nivel: 4, penalizacion: 2 },
  { name: "Chaleco de kevlar", nivel: 4, penalizacion: 0 },
  { name: "Traje antidisturbios del Viejo Mundo", nivel: 5, penalizacion: 2 }
];
const shieldPool = [
  { name: "Escudo pequeño", nivel: 1, penalizacion: 1 },
  { name: "Escudo mediano", nivel: 2, penalizacion: 2 },
  { name: "Escudo grande", nivel: 3, penalizacion: 3 }
];

/**
 * Equipo inicial según el cargo (cap. 3, pp. 49-55). `n` = días de raciones; `objetos` = objetos libres.
 * `armadura` pisa nivel y penalización de la entrada base del catálogo (el manual da el nivel por cargo).
 */
export const EQUIPO_CARGO = {
  presidente: { dias: 3, objetos: 2, armadura: { nombre: "Armadura de cuero", nivel: 2 } },
  vicepresidente: { dias: 5, objetos: 2, armadura: { nombre: "Armadura liviana de cuero", nivel: 1 } },
  secretario: { dias: 5, objetos: 2, extra: ["Cuaderno de tapa dura"] },
  tesorero: { dias: 5, objetos: 3, extra: ["Llave del botiquín"] },
  sargento_armas: { dias: 3, objetos: 1, armadura: { nombre: "Armadura de mallas con casco y brazales", nivel: 5 }, escudo: "Escudo mediano", armaFuego: true },
  capitan_rutas: { dias: 7, objetos: 1, armadura: { nombre: "Armadura de cuero", nivel: 2 }, fijos: ["Prismáticos"] },
  mecanico_jefe: { dias: 3, objetos: 4, manufacturados: true },
  full_patch: { dias: 3, objetos: 2 }
};

export const OBJETOS_LIBRES = ["Linterna", "Brújula", "Cuerda", "Ganzúas", "Herramientas", "Botiquín de primeros auxilios", "Medicamentos", "Máscara antigás", "Saco de dormir", "Equipo de soldar", "Pilas", "Hornillo de camping"];
const ES_MOD = item => item.system?.tipo === "modificacion_moto";

function conBandera(item, extra = {}) {
  const copia = clone(item);
  copia.flags = starterFlag();
  copia.system = { ...copia.system, ...extra };
  return copia;
}

function armaduraInicial(catalogo, def) {
  const base = entrada(catalogo.armaduras, "Armadura de cuero / Ropa acolchada") ?? { type: "armadura", system: {} };
  const copia = conBandera(base, { nivel: def.nivel, penalizacion: Math.floor(def.nivel / 2), equipada: true });
  copia.name = def.nombre;
  copia.img = CAMC.itemIcons.armadura;
  return copia;
}

export function starterEquipmentFor({ cargo, deidad, talento, arma, objetos, rng = Math.random, catalogo = CAMC.catalogo } = {}) {
  if (!catalogo) return [];
  const cargoData = CAMC.cargos[cargo] ?? CAMC.cargos.full_patch;
  const def = EQUIPO_CARGO[cargo] ?? EQUIPO_CARGO.full_patch;
  const dios = CAMC.dioses[deidad] ?? {};
  const items = [];

  const nombreTalento = talento || pick(cargoData.talentos?.length ? cargoData.talentos : ["Interponerse"], rng);
  const talent = entrada(catalogo.talentos, nombreTalento);
  if (talent) items.push(conBandera(talent));

  const don = (catalogo.dones ?? []).find(d => normalized(d.system?.deidad) === normalized(dios.label));
  if (don) items.push(conBandera(don, {}));

  // Un arma que no sea de fuego a elección; el Sargento de armas añade además una de fuego.
  const noFuego = catalogo.armas.filter(a => ["cuerpo_a_cuerpo", "cuerpo_a_cuerpo_dos_manos", "distancia_no_fuego"].includes(a.system?.categoria) && a.name !== "Lanza");
  items.push(conBandera(noFuego.find(a => a.name === arma) ?? pick(noFuego, rng), { equipada: true }));
  if (def.armaFuego) {
    const fuego = catalogo.armas.filter(a => ["fuego_cortas", "fuego_largas"].includes(a.system?.categoria));
    items.push(conBandera(pick(fuego, rng), { equipada: false }));
    const municion = entrada(catalogo.objetos, "Munición");
    if (municion) items.push(conBandera(municion));
  }
  if (def.armadura) items.push(armaduraInicial(catalogo, def.armadura));
  if (def.escudo) {
    const escudo = entrada(catalogo.armaduras, def.escudo);
    if (escudo) items.push(conBandera(escudo, { equipado: true }));
  }

  const racion = Math.ceil(def.dias / 5);
  for (const nombre of ["Raciones de comida", "Raciones de agua potable"]) {
    const o = entrada(catalogo.objetos, nombre);
    if (o) items.push(conBandera(o, { cantidad: racion, carga: { ubicacion: "alforjas", espacios: itemSpaces(o) } }));
  }
  for (const nombre of def.extra ?? []) {
    items.push({ name: nombre, type: "objeto", img: CAMC.itemIcons.objeto, flags: starterFlag(), system: { tipo: "general", tamano: "pequeno", deterioro: "M", disponibilidad: "frecuente", cantidad: 1, especial: "Objeto propio del cargo.", descripcion: "" } });
  }
  const fijos = (def.fijos ?? []).map(n => entrada(catalogo.objetos, n)).filter(Boolean);
  const pool = def.manufacturados
    ? catalogo.objetos.filter(o => !ES_MOD(o) && o.system?.deterioro === "M")
    : OBJETOS_LIBRES.map(n => entrada(catalogo.objetos, n)).filter(Boolean);
  const elegidos = (objetos ?? []).map(n => entrada(catalogo.objetos, n)).filter(Boolean).slice(0, def.objetos);
  const libres = elegidos.length ? elegidos : uniquePicks(pool.filter(o => !fijos.some(f => f.name === o.name)), def.objetos, rng);
  for (const o of [...fijos, ...libres]) items.push(conBandera(o));

  // Mochila: máximo seis líneas a pie; lo que no cabe va a las alforjas (cap. 5, p. 101).
  let usado = 0;
  for (const item of items) {
    if (!["arma", "armadura", "escudo", "objeto"].includes(item.type)) continue;
    const espacios = itemSpaces(item) * (item.type === "objeto" ? Number(item.system?.cantidad ?? 1) : 1);
    const destino = item.system?.carga?.ubicacion === "alforjas" ? "alforjas" : (usado + espacios <= 6 ? "mochila" : "alforjas");
    if (destino === "mochila") usado += espacios;
    item.system.carga = { ubicacion: destino, espacios: itemSpaces(item) };
  }
  return items;
}

const ESPACIOS_TAMANO = { pequeno: 0.5, mediano: 1, grande: 2, no_equipable: 0 };
const itemSpaces = item => ESPACIOS_TAMANO[item.system?.tamano] ?? 1;

export function generateRandomCharacter(options = {}) {
  const rng = mulberry32(hashSeed(options.seed));
  const cargos = Object.keys(CAMC.cargos).filter(key => key !== "full_patch");
  const cargo = options.cargo || pick(cargos, rng);
  const deidad = options.deidad || pick(Object.keys(CAMC.dioses), rng);
  const cargoData = CAMC.cargos[cargo] ?? CAMC.cargos.full_patch;
  const talento = options.talento || pick(cargoData.talentos?.length ? cargoData.talentos : [""], rng);
  const favored = Array.isArray(options.favored) && options.favored.length
    ? options.favored.slice(0, 4)
    : favoritasPorCargo(cargoData, rng);
  const archetype = options.archetype || cargoArchetype[cargo] || "ruta";
  const attributes = buildAttributes(CAMCCharacterArchetypes[archetype] ?? CAMCCharacterArchetypes.ruta);
  const skills = buildSkills(favored, rng);
  const name = options.name || `${pick(CAMCGeneratorTables.nombres, rng)} «${pick(CAMCGeneratorTables.apodos, rng)}»`;

  return {
    name,
    type: "personaje",
    img: CAMC.assets.personajeDefaultImg,
    system: {
      atributos: attributes,
      valores_pasivos: derivedFor(attributes, skills),
      combate: combatFor(attributes, skills, false, { saludRoll: options.saludRoll, talento }),
      proteccion: { armadura_nivel: 0, armadura_penalizacion: 0, escudo_nivel: 0, escudo_penalizacion: 0 },
      habilidades: skills,
      habilidades_favorecidas: favored,
      biografia: {
        jugador: options.jugador ?? "",
        concepto: "",
        edad: options.edad ?? "",
        cargo,
        talento,
        deidad,
        virtud: CAMC.dioses[deidad]?.virtud ?? "",
        don_principal: "",
        motivacion: pick(CAMCGeneratorTables.motivaciones, rng),
        cita: pick(CAMCGeneratorTables.citas, rng),
        entorno_nacimiento: pick(CAMCGeneratorTables.nacimientos, rng),
        defecto_grave: pick(CAMCGeneratorTables.defectosGraves, rng),
        defecto_leve: pick(CAMCGeneratorTables.defectosLeves, rng),
        descripcion: `Cuervo generado como ${cargoData.label}; sus habilidades favorecidas son ${favored.map(key => CAMC.habilidades[key]?.label ?? key).join(", ")}.`,
        historia: `Sobrevivió en ${pick(CAMCGeneratorTables.nacimientos, rng)} antes de ganarse el parche en la carretera.`
      },
      faltas: { value: 0, max: 3 },
      reputacion: { value: 6 },
      experiencia: { total: 0, gastada: 0 },
      vehiculo: { nombre: "", tipo: "moto", estructura: { value: 15, max: 15 }, dados_dano: "2D", maniobrabilidad: 2, modificaciones: "" },
      mount: { uuid: "", name: "", img: "" },
      carga: { mochila_max: 6, alforjas_base: 8, alforjas_extra: false },
      chaleco: {},
      nivel: 1,
      notas: "Generado automáticamente siguiendo el reparto base de creación: atributos 6/4/2/1/0 y habilidades repartidas en 4 a 3D, 8 a 2D y el resto a 1D (las favorecidas del cargo, cuando es posible, caen en el tramo de 3D)."
    },
    items: starterEquipmentFor({ cargo, deidad, talento, rng, catalogo: options.catalogo })
  };
}

// Probabilidades de equipo por dificultad: cuanto más duro el PNJ, más probable que
// venga armado y protegido, y con protección de mayor nivel. Un PNJ "menor" puede
// perfectamente venir desarmado (pelea desarmado, ver ficha de combate).
const npcGearOdds = {
  menor: { weapon: 0.55, secondWeapon: 0, armor: 0.15, shield: 0, maxArmorNivel: 1, minTools: 0, maxTools: 1 },
  normal: { weapon: 0.75, secondWeapon: 0.15, armor: 0.4, shield: 0.05, maxArmorNivel: 2, minTools: 0, maxTools: 2 },
  duro: { weapon: 0.9, secondWeapon: 0.3, armor: 0.7, shield: 0.15, maxArmorNivel: 4, minTools: 1, maxTools: 2 },
  elite: { weapon: 1, secondWeapon: 0.5, armor: 0.9, shield: 0.3, maxArmorNivel: 5, minTools: 1, maxTools: 2 }
};

function npcArmorItem(entry) {
  return {
    name: entry.name,
    type: "armadura",
    img: CAMC.itemIcons.armadura,
    flags: starterFlag(),
    system: {
      nivel: entry.nivel,
      penalizacion: entry.penalizacion,
      tamano: "mediano",
      deterioro: "M",
      disponibilidad: "frecuente",
      compatible: false,
      descripcion: entry.name,
      equipada: true,
      carga: { ubicacion: "mochila", espacios: 1 }
    }
  };
}

function npcShieldItem(entry) {
  return {
    name: entry.name,
    type: "escudo",
    img: CAMC.itemIcons.escudo,
    flags: starterFlag(),
    system: {
      nivel: entry.nivel,
      penalizacion: entry.penalizacion,
      tamano: "mediano",
      deterioro: "M",
      disponibilidad: "frecuente",
      descripcion: entry.name,
      equipado: true,
      carga: { ubicacion: "mochila", espacios: 1 }
    }
  };
}

function npcGearFor(difficulty, rng) {
  const odds = npcGearOdds[difficulty] ?? npcGearOdds.normal;
  const items = [];
  const meleeFirst = rng() < 0.55;
  if (rng() < odds.weapon) {
    const primary = clone(pick(meleeFirst ? melee : ranged, rng));
    primary.type = "arma";
    primary.img = CAMC.itemIcons.arma;
    primary.flags = starterFlag();
    primary.system.equipada = true;
    items.push(primary);
    if (rng() < odds.secondWeapon) {
      const second = clone(pick(meleeFirst ? ranged : melee, rng));
      second.type = "arma";
      second.img = CAMC.itemIcons.arma;
      second.flags = starterFlag();
      second.system.equipada = false;
      items.push(second);
    }
  }
  if (rng() < odds.armor) {
    const candidates = armorPool.filter(entry => entry.nivel <= odds.maxArmorNivel);
    items.push(npcArmorItem(pick(candidates.length ? candidates : armorPool, rng)));
  }
  if (rng() < odds.shield) {
    items.push(npcShieldItem(pick(shieldPool, rng)));
  }
  const toolCount = odds.minTools + Math.floor(rng() * (odds.maxTools - odds.minTools + 1));
  if (toolCount > 0) {
    for (const tool of uniquePicks(useful, Math.min(toolCount, useful.length), rng)) {
      items.push({
        name: tool.name,
        type: "objeto",
        img: CAMC.itemIcons.objeto,
        flags: starterFlag(),
        system: {
          tipo: tool.tipo,
          tamano: tool.espacios >= 2 ? "grande" : tool.espacios <= 0 ? "no_equipable" : "mediano",
          deterioro: "M",
          disponibilidad: "frecuente",
          cantidad: 1,
          especial: tool.especial,
          descripcion: tool.descripcion,
          equipada: false,
          carga: { ubicacion: "mochila", espacios: tool.espacios }
        }
      });
    }
  }
  return items;
}

export function generateRandomNpc(options = {}) {
  const rng = mulberry32(hashSeed(options.seed));
  const difficulty = options.difficulty || pick(["menor", "normal", "duro", "elite"], rng);
  const arrays = {
    menor: [3, 2, 2, 1, 1],
    normal: [4, 3, 2, 2, 1],
    duro: [5, 4, 3, 2, 2],
    elite: [6, 5, 4, 3, 2]
  };
  const order = pick(Object.values(CAMCCharacterArchetypes), rng);
  const attributes = Object.fromEntries(order.map((key, index) => [key, { value: arrays[difficulty][index] ?? 1 }]));
  const keySkills = uniquePicks(Object.keys(CAMC.habilidades), difficulty === "elite" ? 8 : 6, rng);
  const habilidadesClave = {};
  for (const key of keySkills) {
    habilidadesClave[key] = {
      value: difficulty === "elite" ? 4 : difficulty === "duro" ? 3 : 2,
      atributo: CAMC.habilidades[key]?.atributo ?? "int"
    };
  }
  const skillsForDerived = buildSkills(keySkills, rng);
  for (const [key, value] of Object.entries(habilidadesClave)) skillsForDerived[key] = value;
  const tipo = pick(CAMCGeneratorTables.npcTipos, rng);

  return {
    name: `${tipo} ${pick(CAMCGeneratorTables.apodos, rng)}`,
    type: "pnj",
    img: CAMC.assets.pnjDefaultImg,
    system: {
      biografia: {
        nombre: tipo,
        descripcion: `PNJ ${difficulty}. ${pick(CAMCGeneratorTables.conceptos, rng)}.`,
        raza: pick(CAMCGeneratorTables.razas, rng),
        reino: pick(CAMCGeneratorTables.reinos, rng),
        rasgos: uniquePicks(CAMCGeneratorTables.npcRasgos, 3, rng).join(", ")
      },
      atributos: attributes,
      valores_pasivos: derivedFor(attributes, skillsForDerived),
      combate: combatFor(attributes, skillsForDerived, true),
      habilidades_clave: habilidadesClave,
      especial: pick(CAMCGeneratorTables.motivaciones, rng)
    },
    items: npcGearFor(difficulty, rng)
  };
}

export function generateRandomCommunity(options = {}) {
  const rng = mulberry32(hashSeed(options.seed));
  const c = CAMCGeneratorTables.comunidades;
  const name = `${pick(c.prefijos, rng)} ${pick(c.nucleos, rng)}`;
  // Capítulo, reparto inicial de 6 puntos y capacidad especial (cap. 7, pp. 124-126).
  const capitulo = options.capitulo || pick(Object.keys(CAPITULOS), rng);
  const reparto = pick(repartosValidos(capitulo), rng);
  const bono = CAPITULOS[capitulo].bono === "elegir" ? { [pick(["moral", "poblacion", "recursos"], rng)]: 1 } : CAPITULOS[capitulo].bono;
  const puntos = Object.fromEntries(["moral", "poblacion", "recursos"].map(k => [k, Math.min(maximoPunto(k, capitulo), reparto[k] + (bono[k] ?? 0))]));

  return {
    name,
    type: "comunidad",
    img: options.img || "systems/cuervos-de-asgard-mc/assets/ui/system-cover.png",
    system: {
      nombre: name,
      capitulo: CAPITULOS[capitulo].label,
      capitulo_clave: capitulo,
      bono_este: capitulo === "este" ? Object.keys(bono)[0] : "",
      puntos: { ...puntos, castigoMoral: false },
      descripcion: `${pick(c.tipos, rng)}. ${pick(c.notas, rng)}`,
      defensas: `Protegido por ${pick(c.defensas, rng)}.`,
      aliados: uniquePicks(c.aliados, 2, rng).join("\n"),
      amenazas: uniquePicks(c.amenazas, 2, rng).join("\n"),
      notas: ""
    }
  };
}

// Reemplaza el equipo generado automáticamente (marcado con el flag "generatedStarter")
// por uno nuevo, y fuerza un recálculo de datos derivados: en la creación en lote de
// varios ítems de golpe, Foundry no siempre repreparara el Actor antes del primer render.
export async function applyGeneratedStarterItems(actor, items = []) {
  const current = actor.items
    .filter(item => item.getFlag(CAMC.systemId, "generatedStarter"))
    .map(item => item.id);
  if (current.length) await actor.deleteEmbeddedDocuments("Item", current);
  if (!items.length) return;
  const docs = items.map(item => {
    const data = foundry.utils.deepClone(item);
    delete data._id;
    data.flags ??= {};
    data.flags[CAMC.systemId] = {
      ...(data.flags[CAMC.systemId] ?? {}),
      generatedStarter: true
    };
    return data;
  });
  await actor.createEmbeddedDocuments("Item", docs);
  actor.prepareData();
}
