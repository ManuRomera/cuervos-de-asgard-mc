import { CAMC } from "../config.mjs";

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const clone = value => JSON.parse(JSON.stringify(value));

function mulberry32(seed) {
  let t = Number(seed) || Date.now();
  return function rng() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(seed) {
  if (seed === undefined || seed === null || seed === "") return Date.now();
  const value = String(seed);
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

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

function buildAttributes(order) {
  const values = [6, 4, 2, 1, 0];
  return Object.fromEntries(order.map((key, index) => [key, { value: values[index] ?? 0 }]));
}

function buildSkills(favored = [], rng = Math.random) {
  const skills = {};
  for (const [key, cfg] of Object.entries(CAMC.habilidades)) {
    const value = favored.includes(key) ? 4 : (rng() > 0.82 ? 2 : 1);
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
  const health = npc ? 14 + (attr("fue") * 2) : 10 + (attr("fue") * 2) + healthRoll;
  const proezasMax = Math.max(3, Math.floor((attr("fue") + attr("int")) / 2) + 3);
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

const starterTalents = [
  { name: "Autoridad de carretera", type: "talento", img: `systems/${CAMC.systemId}/assets/patches/presidente.webp`, system: { cargo: "Presidente", efecto: "Cuando el capítulo actúa unido bajo tus órdenes, puedes declarar una prioridad clara de la escena. El DJ puede conceder +1D a la primera tirada que siga esa orden si el grupo acepta el riesgo.", descripcion: "Talento de liderazgo para marcar rumbo, asumir responsabilidad y mantener unido al capítulo." } },
  { name: "Mano derecha", type: "talento", img: `systems/${CAMC.systemId}/assets/patches/vicepresidente.webp`, system: { cargo: "Vicepresidente", efecto: "Una vez por escena puedes cubrir a otro Cuervo que esté actuando por el capítulo. Describe cómo le apoyas y dale +1D o reduce en 1D una penalización circunstancial.", descripcion: "Talento de apoyo para sostener la mesa presidencial y reemplazar al Presidente cuando haga falta." } },
  { name: "Inspirar", type: "talento", img: `systems/${CAMC.systemId}/assets/patches/secretario.webp`, system: { cargo: "Secretario", efecto: "Cuando recuerdas una gesta, pronuncias un juramento o conviertes una escena en leyenda del club, el DJ puede conceder proezas al grupo por la interpretación memorable.", descripcion: "Talento del Secretario: conserva memoria, relato y sentido mítico del capítulo." } },
  { name: "Cuentas claras", type: "talento", img: `systems/${CAMC.systemId}/assets/patches/tesorero.webp`, system: { cargo: "Tesorero", efecto: "Una vez por sesión puedes localizar, conservar o reasignar un recurso menor del capítulo si explicas dónde estaba guardado y qué coste social o material implica.", descripcion: "Talento de administración de recursos, favores, deuda y supervivencia logística." } },
  { name: "Nadie pasa", type: "talento", img: `systems/${CAMC.systemId}/assets/patches/sargento_armas.webp`, system: { cargo: "Sargento de armas", efecto: "Cuando proteges a otro Cuervo o mantienes una línea de defensa, puedes recibir tú una consecuencia física menor para darle +1D a su siguiente tirada de resistencia, lucha o huida.", descripcion: "Talento de seguridad, pelea y presencia intimidante." } },
  { name: "Ruta segura", type: "talento", img: `systems/${CAMC.systemId}/assets/patches/capitan_rutas.webp`, system: { cargo: "Capitán de rutas", efecto: "Antes de un viaje o persecución puedes declarar una ruta preparada. Si el grupo la sigue, la primera complicación de terreno, clima o orientación se afronta con +1D.", descripcion: "Talento de exploración, navegación, vigilancia de ruta y conocimiento del asfalto." } },
  { name: "Arreglo de emergencia", type: "talento", img: `systems/${CAMC.systemId}/assets/patches/mecanico_jefe.webp`, system: { cargo: "Mecánico jefe", efecto: "Una vez por escena puedes improvisar una reparación suficiente para que una moto, arma o pieza de equipo funcione hasta el final de la escena. Después deberá repararse con tiempo y recursos.", descripcion: "Talento de mecánica práctica, apaños de carretera y soluciones con lo que haya a mano." } },
  { name: "Full Patch", type: "talento", img: `systems/${CAMC.systemId}/assets/patches/full_patch.svg`, system: { cargo: "Full Patch", efecto: "Cuando actúas en nombre del club y pones en juego tu reputación, puedes pedir al DJ una ventaja narrativa razonable ligada al parche. Si abusas de ello, el club también paga el precio.", descripcion: "Talento genérico de pertenencia plena al capítulo." } }
];

const starterDones = [
  { name: "Furia de la Tormenta", type: "don", img: "icons/magic/lightning/bolt-strike-blue.webp", system: { deidad: "Thor", coste_proezas: 2, coste_descripcion: "2 proezas por uso y combate", virtud: "Valor", efecto: "Los ataques del Cuervo impactan automáticamente y causan el doble de daño durante todo un combate. Los impactos adicionales no pueden ser críticos.", descripcion: "Thor te bendice con la furia de la tormenta." } },
  { name: "Azote del Enemigo", type: "don", img: "icons/magic/fire/dagger-rune-enchant-flame-orange.webp", system: { deidad: "Thor", coste_proezas: 2, coste_descripcion: "2 proezas por combate", virtud: "Valor", efecto: "Escoge uno de los atributos del enemigo (FUE, DES, PER, INT o CAR) y redúcelo a 0 durante todo el combate.", descripcion: "El dios del trueno te otorga el poder de debilitar a tus enemigos." } },
  { name: "Guerrero Legendario", type: "don", img: "icons/skills/melee/weapons-crossed-swords-yellow.webp", system: { deidad: "Thor", coste_proezas: 1, coste_descripcion: "1 proeza por contraataque", virtud: "Valor", efecto: "Cada vez que un enemigo falle un ataque contra ti, puedes gastar 1 proeza para contraatacar automáticamente con tu arma cuerpo a cuerpo equipada.", descripcion: "Como los grandes guerreros de antaño, aprovechas cada oportunidad para golpear." } },
  { name: "Lazos de Skuld", type: "don", img: "icons/magic/nature/root-vines-grow-brown.webp", system: { deidad: "Freya", coste_proezas: 2, coste_descripcion: "2 proezas por uso", virtud: "Liderazgo", efecto: "Puedes obligar a un enemigo a rehacer una tirada que haya tenido éxito, quedándose con el peor resultado.", descripcion: "Como las nornas tejen el destino, tú puedes alterar el curso de los eventos." } },
  { name: "Valquiria", type: "don", img: "icons/magic/light/projectile-smoke-trail-pink.webp", system: { deidad: "Freya", coste_proezas: 2, coste_descripcion: "2 proezas por uso", virtud: "Liderazgo", efecto: "Durante un combate completo, todas tus tiradas de habilidad ganan +3 al resultado.", descripcion: "Las Valquirias de Freya te acompañan en batalla." } },
  { name: "Espíritu de Freya", type: "don", img: "icons/magic/life/heart-cross-pink.webp", system: { deidad: "Freya", coste_proezas: 2, coste_descripcion: "2 proezas por uso", virtud: "Liderazgo", efecto: "Recuperas 1D6 puntos de Salud instantáneamente.", descripcion: "La diosa Freya te otorga su bendición sanadora." } },
  { name: "Sacrificio de Tyr", type: "don", img: "icons/magic/holy/barrier-shield-winged-cross.webp", system: { deidad: "Tyr", coste_proezas: 1, coste_descripcion: "1 proeza por uso", virtud: "Honor", efecto: "Puedes interponerte entre un aliado y un ataque enemigo, recibiendo todo el daño en su lugar. Tu armadura se considera de 2 niveles superior para este ataque.", descripcion: "Como Tyr perdió su mano por el bien de todos, tú te sacrificas por tus camaradas." } },
  { name: "Inquebrantable", type: "don", img: "icons/equipment/shield/shield-kite-iron-brown.webp", system: { deidad: "Tyr", coste_proezas: 2, coste_descripcion: "2 proezas por combate", virtud: "Honor", efecto: "Durante un combate completo, eres inmune a los efectos de estado (aturdido, envenenado, etc.) y no sufres penalizadores por perdida de Salud.", descripcion: "Tu honor te mantiene firme donde otros caerían." } },
  { name: "Justicia", type: "don", img: "icons/magic/control/buff-strength-muscle-damage-orange.webp", system: { deidad: "Tyr", coste_proezas: 2, coste_descripcion: "2 proezas por uso", virtud: "Honor", efecto: "Tu próximo ataque causará daño igual a la Salud máxima del enemigo menos su Salud actual (daño por justicia).", descripcion: "El dios de la guerra te guía para castigar a los malhechores." } },
  { name: "Ojo de Heimdall", type: "don", img: "icons/magic/perception/eye-slit-orange.webp", system: { deidad: "Heimdall", coste_proezas: 1, coste_descripcion: "1 proeza por uso", virtud: "Vigilancia", efecto: "Detectas automáticamente todas las criaturas hostiles en un radio de 100 metros, incluyendo sus puntos de Salud aproximados y su intención inmediata.", descripcion: "El ojo omnisciente de Heimdall te permite ver lo invisible." } },
  { name: "Gjallarhorn", type: "don", img: "icons/magic/sonic/projectile-sound-wave.webp", system: { deidad: "Heimdall", coste_proezas: 3, coste_descripcion: "3 proezas por uso (1 por aliado alertado)", virtud: "Vigilancia", efecto: "Todos los aliados en un radio de 1 kilómetro son alertados de tu situación y conocen tu posición exacta. Pueden responder moviéndose hacia ti a máxima velocidad.", descripcion: "El cuerno del guardián resuena a través de las Llanuras Yermas." } },
  { name: "Guardian", type: "don", img: "icons/magic/defensive/shield-barrier-flaming-diamond.webp", system: { deidad: "Heimdall", coste_proezas: 1, coste_descripcion: "1 proeza por ronda", virtud: "Vigilancia", efecto: "Mientras estés en guardia, ningún enemigo puede tomar por sorpresa a tu grupo. Además, los enemigos que intenten acercarse sigilosamente deben superar tu Perspicacia con Sigilo.", descripcion: "El guardián del Bifrost te otorga su vigilancia eterna." } },
  { name: "Visión de Frigg", type: "don", img: "icons/magic/perception/eye-ringed-glow-angry-small-teal.webp", system: { deidad: "Frigg", coste_proezas: 2, coste_descripcion: "2 proezas por pregunta", virtud: "Sabiduría", efecto: "Puedes hacer una pregunta sobre el futuro inmediato (lo que ocurrirá en las próximas 24 horas). La DJ debe responder con una pista críptica pero verdadera.", descripcion: "La reina de los dioses te concede un vislumbre del destino." } },
  { name: "Tejido del Destino", type: "don", img: "icons/magic/control/fear-fright-mask.webp", system: { deidad: "Frigg", coste_proezas: 3, coste_descripcion: "3 proezas por uso", virtud: "Sabiduría", efecto: "Puedes alterar un resultado de dado recién tirado por cualquier personaje (PJ o PNJ) cambiándolo por el valor que desees.", descripcion: "Como las nornas tejen y destejen el hilo del destino, tú puedes alterar el curso de los eventos." } },
  { name: "Consejo de Frigg", type: "don", img: "icons/magic/light/explosion-star-teal.webp", system: { deidad: "Frigg", coste_proezas: 1, coste_descripcion: "1 proeza por uso", virtud: "Sabiduría", efecto: "Un aliado puede repetir una tirada fallida con +2D adicionales.", descripcion: "La sabiduría de Frigg guía a través de las palabras adecuadas." } },
  { name: "Cota de Draupnir", type: "don", img: "icons/equipment/chest/breastplate-collared-steel.webp", system: { deidad: "Idunn", coste_proezas: 1, coste_descripcion: "1 proeza por activación", virtud: "Perseverancia", efecto: "Te ves beneficiado con una protección de nivel 3 sin penalización. El artefacto es personal e intransferible. Se repliega mágicamente al final de cada combate adoptando el tamaño de un anillo. Requiere una acción de turno completo para equiparla.", descripcion: "Manufacturada por Idunn a partir del anillo mágico Draupnir." } },
  { name: "Manzanas de Idunn", type: "don", img: "icons/consumables/fruit/apple-red.webp", system: { deidad: "Idunn", coste_proezas: 2, coste_descripcion: "2 proezas por uso", virtud: "Perseverancia", efecto: "Recuperas todos tus puntos de Salud perdidos y eliminas cualquier estado negativo.", descripcion: "Las mágicas manzanas de Idunn restauran la vitalidad perdida." } },
  { name: "Juventud Eterna", type: "don", img: "icons/magic/life/heart-pink.webp", system: { deidad: "Idunn", coste_proezas: 1, coste_descripcion: "1 proeza por ronda", virtud: "Perseverancia", efecto: "Durante una ronda completa, eres inmune a todo daño. Sin embargo, al final de la ronda pierdes 1D6 puntos de Salud por el coste de mantener la juventud.", descripcion: "Idunn te concede un momento de perfección eterna." } }
];

function starterEquipmentFor({ cargo, deidad, favored = [], rng = Math.random } = {}) {
  const cargoData = CAMC.cargos[cargo] ?? CAMC.cargos.full_patch;
  const dios = CAMC.dioses[deidad] ?? {};
  const melee = [
    {
      name: "Cuchillo de carretera",
      img: "icons/weapons/daggers/dagger-simple.webp",
      system: { tipo: "cuerpo_a_cuerpo", categoria: "Arma blanca", alcance: "cuerpo_a_cuerpo", dano: "1D", dano_fijo: 1, especial: "Herramienta de supervivencia y arma discreta.", descripcion: "Hoja corta útil para trabajo de campamento, intimidación y combate cercano.", equipada: true, carga: { ubicacion: "mochila", espacios: 0.5 } }
    },
    {
      name: "Llave pesada",
      img: "icons/tools/hand/wrench-steel-grey.webp",
      system: { tipo: "cuerpo_a_cuerpo", categoria: "Improvisada", alcance: "cuerpo_a_cuerpo", dano: "1D", dano_fijo: 2, especial: "Cuenta también como herramienta de mecánica.", descripcion: "Llave de taller grande, marcada con hollín y runas de uso.", equipada: true, carga: { ubicacion: "mochila", espacios: 1 } }
    },
    {
      name: "Cadena de arrastre",
      img: "icons/tools/fasteners/chain-steel.webp",
      system: { tipo: "cuerpo_a_cuerpo", categoria: "Contundente", alcance: "cuerpo_a_cuerpo", dano: "1D", dano_fijo: 2, especial: "Puede servir para bloquear, atar o remolcar.", descripcion: "Cadena de acero recuperada de un portón de carretera.", equipada: true, carga: { ubicacion: "mochila", espacios: 1 } }
    }
  ];
  const ranged = [
    {
      name: "Arpón",
      img: "icons/weapons/polearms/spear-hooked-brown.webp",
      system: { tipo: "distancia", categoria: "Armas a distancia no de fuego", alcance: "distancia", dano: "1D", dano_fijo: 7, municion: { value: 1, max: 1 }, especial: "Recuperable si la escena permite recogerlo.", descripcion: "Arpón pesado usado para cazar, intimidar y detener objetivos a corta distancia.", equipada: false, carga: { ubicacion: "mochila", espacios: 2 } }
    },
    {
      name: "Pistola reciclada",
      img: "icons/weapons/guns/gun-pistol-brass.webp",
      system: { tipo: "distancia", categoria: "Arma de fuego", alcance: "distancia", dano: "2D", dano_fijo: 0, municion: { value: 6, max: 6 }, especial: "Munición escasa; declarar recarga cuando se agote.", descripcion: "Arma corta reconstruida con piezas no coincidentes.", equipada: false, carga: { ubicacion: "mochila", espacios: 1 } }
    },
    {
      name: "Ballesta de taller",
      img: "icons/weapons/crossbows/crossbow-simple-brown.webp",
      system: { tipo: "distancia", categoria: "Armas a distancia no de fuego", alcance: "distancia", dano: "1D", dano_fijo: 5, municion: { value: 1, max: 1 }, especial: "Silenciosa y fácil de reparar con piezas comunes.", descripcion: "Ballesta sencilla fabricada con acero de suspensión.", equipada: false, carga: { ubicacion: "mochila", espacios: 2 } }
    }
  ];
  const useful = [
    { name: "Kit de herramientas", img: "icons/tools/hand/hammer-and-wrench.webp", tipo: "herramienta", especial: "Permite justificar reparaciones y trabajos de Mecánica.", descripcion: "Llaves, bridas, cable, cinta, grasa y recambios pequeños.", espacios: 1 },
    { name: "Botiquín de ruta", img: "icons/containers/bags/pack-leather-white.webp", tipo: "suministro", especial: "Apoyo narrativo para Auxilio y curas improvisadas.", descripcion: "Vendas limpias, alcohol, aguja, hilo y analgésicos de dudosa fecha.", espacios: 1 },
    { name: "Raciones y cantimplora", img: "icons/consumables/food/bowl-stew-tofu-potato-red.webp", tipo: "suministro", especial: "Comida y agua para una salida corta.", descripcion: "Lo justo para sobrevivir a una ruta sin depender de nadie.", espacios: 1 },
    { name: "Mapa plastificado", img: "icons/sundries/documents/document-map-yellow.webp", tipo: "general", especial: "Ayuda a justificar rutas, atajos y memoria del territorio.", descripcion: "Mapa del Viejo Mundo lleno de marcas nuevas del capítulo.", espacios: 0 }
  ];
  const cargoLabel = cargoData.label ?? "Cuervo";
  const deityLabel = dios.label ?? title(deidad || "deidad");
  const virtud = dios.virtud ?? "";
  const talent = clone(starterTalents.find(item => normalized(item.system.cargo) === normalized(cargoLabel)) ?? starterTalents.at(-1));
  const deityDones = starterDones.filter(item => normalized(item.system.deidad) === normalized(deityLabel));
  const don = deityDones.length
    ? clone(pick(deityDones, rng))
    : {
      name: `Don de ${deityLabel}`,
      type: "don",
      img: "icons/magic/symbols/runes-star-pentagon-blue.webp",
      system: {
        deidad: deityLabel,
        coste_proezas: 2,
        coste_descripcion: "Coste base sugerido; ajusta si el don concreto lo requiere.",
        virtud,
        efecto: `Manifestación de ${virtud || "la virtud"} de ${deityLabel}.`,
        descripcion: "Don inicial generado como punto de partida. Edita nombre, coste y efecto para ajustarlo al don concreto elegido en mesa."
      }
    };
  talent.flags = starterFlag();
  don.flags = starterFlag();
  const selectedMelee = clone(pick(melee, rng));
  const selectedRanged = clone(pick(ranged, rng));
  const selectedTools = uniquePicks(useful, 2, rng).map(item => ({
    name: item.name,
    type: "objeto",
    img: item.img,
    flags: starterFlag(),
    system: {
      tipo: item.tipo,
      tamano: item.espacios >= 2 ? "grande" : item.espacios <= 0 ? "no_equipable" : "mediano",
      deterioro: "M",
      disponibilidad: "frecuente",
      cantidad: 1,
      especial: item.especial,
      descripcion: item.descripcion,
      equipada: false,
      carga: { ubicacion: "mochila", espacios: item.espacios }
    }
  }));

  return [
    talent,
    don,
    { ...selectedMelee, type: "arma", flags: starterFlag() },
    { ...selectedRanged, type: "arma", flags: starterFlag() },
    {
      name: "Armadura de cuero",
      type: "armadura",
      img: "icons/equipment/chest/breastplate-banded-leather-brown.webp",
      flags: starterFlag(),
      system: {
        nivel: 1,
        penalizacion: 0,
        tipo: "armadura",
        tamano: "mediano",
        deterioro: "M",
        disponibilidad: "frecuente",
        compatible: true,
        descripcion: "Protección básica de carretera, reforzada con placas recicladas.",
        equipada: true,
        carga: { ubicacion: "mochila", espacios: 1 }
      }
    },
    ...selectedTools
  ];
}

export function generateRandomCharacter(options = {}) {
  const rng = mulberry32(hashSeed(options.seed));
  const cargos = Object.keys(CAMC.cargos).filter(key => key !== "full_patch");
  const cargo = options.cargo || pick(cargos, rng);
  const deidad = options.deidad || pick(Object.keys(CAMC.dioses), rng);
  const cargoData = CAMC.cargos[cargo] ?? CAMC.cargos.full_patch;
  const favored = Array.isArray(options.favored) && options.favored.length
    ? options.favored.slice(0, 4)
    : (cargoData.habilidades?.length ? [...cargoData.habilidades] : uniquePicks(Object.keys(CAMC.habilidades), 4, rng));
  const archetype = options.archetype || cargoArchetype[cargo] || "ruta";
  const attributes = buildAttributes(CAMCCharacterArchetypes[archetype] ?? CAMCCharacterArchetypes.ruta);
  const skills = buildSkills(favored, rng);
  const name = options.name || `${pick(CAMCGeneratorTables.nombres, rng)} «${pick(CAMCGeneratorTables.apodos, rng)}»`;

  return {
    name,
    type: "personaje",
    img: "icons/svg/mystery-man.svg",
    system: {
      atributos: attributes,
      valores_pasivos: derivedFor(attributes, skills),
      combate: combatFor(attributes, skills, false, { saludRoll: options.saludRoll }),
      proteccion: { armadura_nivel: 0, armadura_penalizacion: 0, escudo_nivel: 0, escudo_penalizacion: 0 },
      habilidades: skills,
      habilidades_favorecidas: favored,
      biografia: {
        jugador: options.jugador ?? "",
        concepto: "",
        edad: options.edad ?? "",
        cargo,
        talento: cargoData.talento ?? "",
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
      notas: "Generado automáticamente siguiendo el reparto base de creación: atributos 6/4/2/1/0, habilidades base 1D y habilidades favorecidas del cargo a 4D."
    },
    items: starterEquipmentFor({ cargo, deidad, favored, rng })
  };
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
    img: "icons/svg/mystery-man.svg",
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
      proteccion: {
        armadura_nivel: difficulty === "menor" ? 0 : difficulty === "elite" ? 2 : 1,
        armadura_descripcion: difficulty === "menor" ? "" : "protección improvisada",
        armadura_penalizacion: 0
      },
      especial: pick(CAMCGeneratorTables.motivaciones, rng),
      armas: []
    }
  };
}

export function generateRandomCommunity(options = {}) {
  const rng = mulberry32(hashSeed(options.seed));
  const c = CAMCGeneratorTables.comunidades;
  const name = `${pick(c.prefijos, rng)} ${pick(c.nucleos, rng)}`;
  const resources = Object.fromEntries(["comida", "agua", "combustible", "medicina", "municion", "repuestos"].map(key => [key, 2 + Math.floor(rng() * 7)]));

  return {
    name,
    type: "comunidad",
    img: options.img || "systems/cuervos-de-asgard-mc/assets/ui/system-cover.png",
    system: {
      nombre: name,
      capitulo: options.chapter || "Cuervos de Asgard MC",
      poblacion: 25 + Math.floor(rng() * 176),
      reputacion: { value: 2 + Math.floor(rng() * 7) },
      recursos: resources,
      defensas: `${pick(c.tipos, rng)} protegido por ${pick(c.defensas, rng)}.`,
      aliados: uniquePicks(c.aliados, 2, rng).join("\n"),
      amenazas: uniquePicks(c.amenazas, 2, rng).join("\n"),
      notas: `${pick(c.notas, rng)}\nNecesidad actual: ${pick(Object.keys(resources), rng)}.`
    }
  };
}
