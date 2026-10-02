/**
 * Reglas de Cuervos de Asgard MC (Ysystem) como funciones puras, sin Foundry.
 * Cada función cita la página del manual (numeración impresa) de la que sale.
 * Las usan los documentos, las hojas y las pruebas (tests/reglas.test.mjs).
 */

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/* ---------- Tiradas (cap. 4, pp. 72-76) ---------- */

/** Crítico: dos o más seises. Pifia: todos los dados con un 1 (p. 75). `umbralCritico` baja a 1 con talentos como Leer el terreno. */
export function evaluarDados(dados, { umbralCritico = 2, permitirCritico = true } = {}) {
  const seises = dados.filter(d => d === 6).length;
  return {
    critico: permitirCritico && seises >= umbralCritico && dados.length > 0,
    pifia: dados.length > 0 && dados.every(d => d === 1)
  };
}

/** Pasos de dificultad orientativos (p. 72). */
export const DIFICULTADES = [
  { min: 5, label: "Muy fácil" }, { min: 7, label: "Fácil" }, { min: 9, label: "Media" },
  { min: 11, label: "Desafiante" }, { min: 14, label: "Difícil" }, { min: 18, label: "Muy difícil" }, { min: 22, label: "Extrema" }
];

/* ---------- Valores derivados (cap. 3, pp. 46-48) ---------- */

export const agilidad = (dadosAtletismo, des) => dadosAtletismo * 3 + des;
export const evasion = (dadosConducir, des) => dadosConducir * 3 + des;
export const aplomo = (car, int) => car + int + 5;
export const perspicacia = (int, per) => int + per + 5;
export const iniciativa = (des, int) => des + int;
export const resistenciaFisica = fue => Math.max(0, 12 - fue);
/** (FUE + INT)/2 + 3 redondeando hacia abajo (p. 47). `extra` = talento Líder nato (+2) o Moral. */
export const proezasIniciales = (fue, int, extra = 0) => Math.max(0, Math.floor((fue + int) / 2)) + 3 + extra;
/** FUE x 2 + 10 + 1D (p. 47). */
export const saludMaxima = (fue, d6) => fue * 2 + 10 + d6;

export const BONIFICADORES_INICIALES = [0, 1, 2, 4, 6];
export function repartoAtributosValido(valores) {
  return [...valores].sort((a, b) => a - b).join() === BONIFICADORES_INICIALES.join();
}
/** 4 habilidades a 3D, 8 a 2D y 12 a 1D (p. 46). */
export function repartoHabilidadesValido(dados) {
  const n = d => dados.filter(x => x === d).length;
  return dados.length === 24 && n(3) === 4 && n(2) === 8 && n(1) === 12;
}

/* ---------- Salud, penalizadores y Resistencia Física (p. 88) ---------- */

/** −1D por debajo de 7 puntos de Salud, −2D por debajo de 4. */
export function dadosPorSalud(salud) {
  if (salud < 4) return -2;
  if (salud < 7) return -1;
  return 0;
}

export const UMBRALES_RF = [11, 7, 4, 2];

/**
 * Umbrales que se traspasan al pasar de `antes` a `despues` de Salud y que aún no han dado tirada
 * en esta partida. De mayor a menor: si se cruzan varios de golpe hay una tirada por cada uno.
 */
export function umbralesCruzados(antes, despues, yaTirados = []) {
  return UMBRALES_RF.filter(u => antes >= u && despues < u && !yaTirados.includes(u));
}

/* ---------- Protecciones (p. 89) ---------- */

/** Armadura: mitad del nivel (hacia abajo) a DES y FUE. Escudo: el nivel entero. */
export const penalizadorProtecciones = (nivelArmadura, nivelEscudo, { sinPenalizacion = false } = {}) =>
  sinPenalizacion ? 0 : Math.floor(nivelArmadura / 2) + nivelEscudo;

/**
 * Protección total de las armaduras puestas. Las «compatibles» (casco, gabán) se suman a la mejor
 * armadura normal; las de «solo armas de fuego» (kevlar) aportan nivel extra solo contra ellas y no
 * penalizan. La penalización es la suma de la de cada pieza (la hoja de Munin del manual: 3 + 2 de
 * armaduras y un escudo de 2 dan −4 en total).
 */
export function proteccionDeArmaduras(armaduras) {
  const normales = armaduras.filter(a => !a.soloFuego);
  const base = normales.filter(a => !a.compatible).sort((a, b) => b.nivel - a.nivel)[0];
  const contadas = [...(base ? [base] : []), ...normales.filter(a => a.compatible)];
  return {
    nivel: contadas.reduce((n, a) => n + a.nivel, 0),
    penalizacion: contadas.reduce((n, a) => n + a.penalizacion, 0),
    soloFuego: armaduras.filter(a => a.soloFuego).reduce((m, a) => Math.max(m, a.nivel), 0)
  };
}

/* ---------- Daño (cap. 4, pp. 78-84) ---------- */

export const DANO_BASE = { desarmado: 1, cuerpo_a_cuerpo: 3, distancia_no_fuego: 3, fuego_cortas: 7, fuego_largas: 10, fuego_mortiferas: 15 };

/** Máximo de proezas por ataque: 2 (3 con armas de fuego) (p. 79). */
export const maxProezasDano = categoria => String(categoria).startsWith("fuego") ? 3 : 2;

/**
 * Dados extra al apuntar: por cada dado de habilidad sacrificado, +1D (cuerpo a cuerpo) o +2D (a distancia).
 * No explotan (p. 83).
 */
export const dadosPorApuntar = (dadosSacrificados, aDistancia) => dadosSacrificados * (aDistancia ? 2 : 1);

/** Suma una tirada de dados que explotan: cada 6 vuelve a tirarse. `d6` devuelve 1..6. */
export function tirarExplosivos(cantidad, d6) {
  const caras = [];
  let total = 0;
  for (let i = 0; i < cantidad; i++) {
    let c;
    do { c = d6(); caras.push(c); total += c; } while (c === 6);
  }
  return { total, caras };
}

/** Un crítico al atacar dobla el daño (p. 82). */
export const aplicarCriticoDano = (dano, critico) => critico ? dano * 2 : dano;

/** Daño que se resta de la Salud tras la armadura (p. 89). Nunca baja de 0. */
export const danoTrasArmadura = (dano, nivelArmadura, { ignorar = false } = {}) => Math.max(0, dano - (ignorar ? 0 : nivelArmadura));
/** Nivel de armadura que cuenta contra un ataque: el de solo-fuego solo si el arma es de fuego. */
export const nivelContraAtaque = (p, categoria) => Number(p.armadura_nivel ?? 0) + (String(categoria).startsWith("fuego") ? Number(p.armadura_solo_fuego ?? 0) : 0);

/** Noquear: la mitad del daño habitual, hacia abajo (p. 83). */
export const danoNoqueo = dano => Math.floor(dano / 2);

/** Ráfaga: +2 a Agilidad/Evasión de cada blanco por oponente declarado, hasta 5 blancos (p. 83). */
export const dificultadRafaga = (valorPasivo, blancos) => valorPasivo + 2 * clamp(blancos, 1, 5);

/** Cobertura sólida: +3 si protege hasta el 50 %, +6 si más del 75 % (p. 84). */
export const bonoCobertura = nivel => ({ ninguna: 0, media: 3, total: 6 })[nivel] ?? 0;

/* ---------- Curación (p. 89) ---------- */

/** Auxilio a dificultad 10: 2 puntos; crítico 4; pifia −1 (Curandero: 3 y 6). */
export function curacionAuxilio({ exito, critico, pifia }, { curandero = false } = {}) {
  if (critico) return curandero ? 6 : 4;
  if (pifia) return -1;
  return exito ? (curandero ? 3 : 2) : 0;
}

/* ---------- Experiencia (cap. 3, p. 64) ---------- */

/** Coste de subir una habilidad de `dadosActuales` a +1D: 1→2 = 5, 2→3 = 10. */
export const costeHabilidad = dadosActuales => ({ 1: 5, 2: 10 })[dadosActuales] ?? null;
/** Coste de subir un atributo a `nuevoValor`: nuevo valor x 3. Se sube de punto en punto. */
export const costeAtributo = nuevoValor => nuevoValor * 3;

/* ---------- Equipo (cap. 5, p. 102) ---------- */

/** Tirada de caducidad de un objeto Reciclado (1D al final de la aventura). */
export function caducidad(d6) {
  if (d6 >= 4) return { estado: "funciona", texto: "Sigue funcionando." };
  if (d6 === 3) return { estado: "averiado", dificultad: 12, intentos: 3, texto: "Averiado: Mecánica a dificultad 12 (hasta 3 personas)." };
  if (d6 === 2) return { estado: "averiado", dificultad: 18, intentos: 2, texto: "Averiado: Mecánica a dificultad 18 (hasta 2 personas)." };
  return { estado: "roto", texto: "Roto: solo se repara con un crítico en una única tirada de Mecánica." };
}

/** Espacios de carga: grande 2, mediano 1, pequeño ½; a pie 6, alforjas +8 (pp. 101-102). */
export const ESPACIOS = { grande: 2, mediano: 1, pequeno: 0.5, no_equipable: 0 };

/* ---------- Iniciativa (p. 81) ---------- */

/**
 * Clave de orden que resuelve los empates del manual: mayor DES, luego INT, PER y Agilidad.
 * Se suma como fracción al total para que el rastreador de combate ordene bien.
 */
export const desempateIniciativa = ({ des = 0, int = 0, per = 0, agilidad: ag = 0 }) =>
  (clamp(des, 0, 9) * 1e-1 + clamp(int, 0, 9) * 1e-2 + clamp(per, 0, 9) * 1e-3 + clamp(ag, 0, 99) * 1e-5);

/* ---------- Reputación (cap. 6, pp. 118-120) ---------- */

export const RANGOS_REPUTACION = [
  "Repudiado", "Reprobado", "Deshonrado", "Bajo sospecha", "Aceptado",
  "Respetado", "Honrado", "Admirado", "Venerado", "Reverenciado"
];
/** La Reputación va de 1 a 10 y sube o baja de medio en medio punto. */
export const limitarReputacion = v => clamp(Math.round(v * 2) / 2, 1, 10);
export const rangoReputacion = v => RANGOS_REPUTACION[clamp(Math.floor(v), 1, 10) - 1];
/** Efecto del rango sobre la Moral de la comunidad: −1 en los rangos 1-3, +1 en los 8-10. */
export const efectoMoralReputacion = v => { const r = Math.floor(v); return r <= 3 ? -1 : r >= 8 ? 1 : 0; };
export const PILARES = ["Lealtad", "Honor", "Deber", "Compasión"];

/* ---------- Faltas contra la Virtud del dios patrón (p. 56) ---------- */
export const FALTAS_PARA_CASTIGO = 3;

/* ---------- Persecuciones (cap. 4, pp. 90-98) ---------- */

export const TERRENOS = [
  { key: "facil", label: "Fácil", dificultad: 8 },
  { key: "media", label: "Media", dificultad: 10 },
  { key: "desafiante", label: "Desafiante", dificultad: 13 },
  { key: "dificil", label: "Difícil", dificultad: 16 },
  { key: "muy_dificil", label: "Muy difícil", dificultad: 20 }
];
export const VISIBILIDAD = [
  { key: "normal", label: "Buena", mod: 0 },
  { key: "mala", label: "Reducida (calima, lluvia)", mod: 2 },
  { key: "pesima", label: "Nula (tormenta, niebla densa)", mod: 4 }
];

/** Movimiento: tirada contra terreno + visibilidad + modificador de la acción (p. 94). */
export const MOVIMIENTOS = [
  { key: "mantener", label: "Mantener posición", mod: null, avance: 0, resumen: "Sin tirada: conserva la franja." },
  { key: "cambiar", label: "Cambiar de posición", mod: 0, avance: 1, avanceCritico: 2, resumen: "Avanza 1 franja (2 con crítico)." },
  { key: "obstaculizar", label: "Obstaculizar", mod: 2, avance: 1, avanceCritico: 1, resumen: "Solo con un perseguidor a 1 franja: avanzas 1 y su siguiente movimiento sube +3 (+6 con crítico)." },
  { key: "quemar", label: "Quemar rueda / Darlo todo", mod: 4, avance: 2, avanceCritico: 3, resumen: "Avanza hasta 2 franjas (3 con crítico)." }
];

/**
 * Maniobras (pp. 94-98). `mod` se suma al valor de Agilidad/Evasión del objetivo.
 * `solo`: "vehiculos" | "pie" | "ambos". `tiradaPrevia` es una tirada que debe superarse antes.
 */
export const MANIOBRAS = [
  { key: "atacar_directamente", label: "Atacar directamente", mod: 5, modPasajero: 2, solo: "ambos", resumen: "+5 si ataca el conductor, +2 si es un pasajero. Para impactar a un ocupante concreto hay que sacrificar 1D." },
  { key: "atacar_estabilizando", label: "Atacar estabilizando", mod: 0, solo: "ambos", tiradaPrevia: "Cambiar de posición", resumen: "Antes del ataque, tirada de Conducir/Atletismo contra el terreno; si falla no hay ataque." },
  { key: "abordar", label: "Abordar", mod: 3, solo: "vehiculos", tiradaPrevia: "Atletismo 15", resumen: "Conducir contra Evasión+3 y luego Atletismo a 15 (se omite con crítico de Conducir)." },
  { key: "atrapar", label: "Atrapar / Interceptar", mod: 2, solo: "pie", resumen: "Misma franja. Atletismo contra Agilidad+2 (sin visibilidad). Con crítico, inmoviliza." },
  { key: "chocar", label: "Chocar directamente", mod: 4, solo: "vehiculos", resumen: "Misma franja. Ambos vehículos tiran sus dados de daño contra la Estructura rival; ocupantes sufren 1/3." },
  { key: "embestir", label: "Embestir", mod: 2, solo: "vehiculos", resumen: "No motos. Sacrificas 1D de Estructura propia; daño = dados del vehículo −1D; ocupantes 1 punto." },
  { key: "evadirse", label: "Evadirse", mod: 1, solo: "vehiculos", resumen: "Reactiva contra Chocar, Embestir o Sacar de la carretera. Si funciona el rival sufre +3 (+6 con crítico)." },
  { key: "sacar", label: "Sacar de la carretera", mod: 2, solo: "vehiculos", resumen: "Misma franja. El objetivo pierde 1D de Estructura y queda fuera 2 turnos. Las motos solo contra motos." }
];

/** Maniobras de combate al volante (p. 98). */
export const MANIOBRAS_COMBATE = [
  { key: "arrollar", label: "Arrollar", mod: 4, resumen: "Contra enemigos a pie. Sacrificas una posición de iniciativa. Dados de daño del vehículo, que explotan." },
  { key: "cargar", label: "Cargar", mod: 3, resumen: "Conducir a 12 y luego Lucha contra Agilidad/Evasión +3. +1D de daño que explota (+3 / +6 si el objetivo va en moto / coche)." }
];

/** Si el vehículo pierde la mitad de su Estructura, +3 a las dificultades; a 0 queda inutilizado (p. 96). */
export function estadoVehiculo(estructura, max) {
  if (estructura <= 0) return { inutilizado: true, penalizador: 0 };
  return { inutilizado: false, penalizador: estructura <= Math.floor(max / 2) ? 3 : 0 };
}

export const dificultadMovimiento = (terreno, visibilidad, mod) => terreno + visibilidad + (mod ?? 0);
