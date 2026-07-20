import { CAMC } from "../config.mjs";

const pick = (list, rng) => list[Math.floor(rng() * list.length)];

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

export const CAMCGeneratorTables = {
  nombres: [
    "Einar", "Astrid", "Runa", "Sigrid", "Bjorn", "Kara", "Ivar", "Hilda", "Ulf", "Solveig",
    "Gunnar", "Liv", "Skadi", "Njal", "Yrsa", "Ragnar", "Helga", "Torsten", "Freydis", "Vidar",
    "Arne", "Thyra", "Sten", "Bodil", "Leif", "Ingrid", "Ketil", "Dagny", "Sven", "Eira",
    "Viktor", "Mara", "Bruno", "Vega", "Nico", "Greta", "Lobo", "Hache", "Val", "Noa"
  ],
  apodos: [
    "Cuervo Negro", "Viejo Motor", "Diente Roto", "Mano de Humo", "La Sorda", "Ojo de Hielo",
    "Rompepuentes", "Santa Chatarra", "Piel de Asfalto", "La Devota", "Martillo Bajo", "Rueda Fria",
    "Tres Clavos", "Lengua de Plata", "Hueso Limpio", "La Ultima", "Cicatriz", "Trueno Seco",
    "Mala Senal", "Guardafaro", "Pluma Roja", "Hierro Dulce", "Sangre de Brea", "Norte"
  ],
  conceptos: [
    "veterano del Viejo Mundo", "exploradora de rutas muertas", "mecanico de frontera", "negociadora de asentamientos",
    "tirador de escolta", "recuperadora de reliquias", "sanadora de carretera", "mensajero entre comunidades",
    "exiliada de otro capitulo", "guardian de convoy", "piloto de persecucion", "cazadora de amenazas",
    "archivista de juramentos", "rompebloqueos", "protector de peregrinos", "contrabandista arrepentido"
  ],
  motivaciones: [
    "mantener con vida al capitulo aunque haya que pagar un precio",
    "encontrar una ruta segura hacia una comunidad perdida",
    "demostrar que merece portar el parche",
    "recuperar una deuda de sangre del Viejo Mundo",
    "convertir el asentamiento en un refugio real",
    "mantener su moto funcionando hasta el ultimo dia",
    "honrar a quienes murieron en la carretera",
    "impedir que otra comunidad caiga por falta de recursos"
  ],
  citas: [
    "La carretera no perdona, pero escucha los juramentos.",
    "Si el motor arranca, todavia queda esperanza.",
    "No prometas nada que no puedas sellar con gasolina y sangre.",
    "Un hermano no se abandona en la cuneta.",
    "Las runas no salvan a los cobardes.",
    "Primero el capitulo, luego el resto del mundo."
  ],
  nacimientos: [
    "refugio bajo una gasolinera", "caravana de sal", "mina abandonada", "barco varado en el polvo",
    "bunker de autopista", "comunidad agricola fortificada", "ruinas de un centro comercial",
    "taller dvergar", "puesto de peaje convertido en fortin", "hospital saqueado"
  ],
  defectosGraves: [
    "jura venganza antes de medir el peligro", "no abandona una moto aunque sea suicida",
    "desconfia de toda autoridad externa", "oculta una deuda con un enemigo del capitulo",
    "pierde el control cuando amenazan a la comunidad", "ha roto un juramento importante"
  ],
  defectosLeves: [
    "duerme con una herramienta en la mano", "habla con su moto", "colecciona matriculas viejas",
    "nunca tira una pieza rota", "se santigua con runas antes de arrancar", "odia viajar en silencio"
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
    }
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
