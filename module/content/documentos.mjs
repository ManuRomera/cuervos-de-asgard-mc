/**
 * Documentos de contenido (compendios y mundo) a partir de `_data`. Funciones puras, sin Foundry:
 * las usan el importador del mundo y `scripts/build.mjs`, que compila los compendios al publicar.
 */
import { CAMC } from "../config.mjs";
import { CAMCMountTables } from "../mount/mount-generator.mjs";

export function normalizarActor(raw) {
  const doc = structuredClone(raw);
  if (doc.type !== "moto") return doc;
  const functional = doc.system?.mods?.funcionales ?? [];
  const cosmetic = doc.system?.mods?.esteticas ?? [];
  const existing = doc.items ?? [];
  const generatedItems = [
    ...functional.map(mod => motoModItem(mod, "modificacion_moto")),
    ...cosmetic.map(mod => motoModItem(mod, "modificacion_estetica_moto"))
  ];
  doc.items = [...existing, ...generatedItems];
  doc.system ??= {};
  doc.system.mods = { funcionales: [], esteticas: [] };
  return doc;
}


export function motoModItem(mod, tipo) {
  const funcional = tipo === "modificacion_moto";
  return {
    name: mod.name,
    type: "objeto",
    img: CAMC.itemIcons.modificacionMoto,
    system: {
      tipo,
      tamano: "no_equipable",
      cantidad: 1,
      especial: mod.descripcion ?? "",
      descripcion: mod.descripcion ?? "",
      efecto: mod.efecto ?? {},
      requiereSidecar: Boolean(mod.requiereSidecar),
      ocupaRanura: funcional ? mod.ocupaRanura !== false : false,
      equipada: true,
      dificultadInstalacion: funcional ? 15 : 0,
      dificultadRetirada: funcional ? 12 : 0,
      carga: { ubicacion: "comunidad", espacios: 0 }
    }
  };
}


export function journalPage(name, content, sort = 0) {
  return {
    name,
    type: "text",
    sort,
    text: { format: 1, content }
  };
}


export function coverageContent() {
  const rows = [
    ["Creación de personaje", "Cargo, deidad, virtud, talento, habilidades favorecidas, atributos y valores derivados se calculan en hoja."],
    ["Tiradas Ysystem", "Tiradas iniciales, dificultad, dados extra, sacrificios, proezas, penalizador de Salud, tirada rápida con Alt y tarjetas de chat con resultado destacado."],
    ["Combate y daño", "Ataques con arma equipada, daño con atributo correcto por categoría, munición, aplicar daño desde chat y protección automática."],
    ["Equipo y carga", "Ubicación mochila/alforjas/comunidad, conteo de espacios, aviso de sobrecarga y requisito de alforjas equipadas."],
    ["Motos y modificaciones", "La moto puede ser Actor propio vinculado por UUID al PJ. Su hoja gestiona estructura, maniobrabilidad, daño, sidecar, alforjas, persecuciones, tuneado, generación y tiradas de Conducir/Mecánica."],
    ["Chaleco y parches", "Parche de cargo automático, parches manuales por hueco, bloqueo de duplicados y calibración de posición/tamaño desde la propia ficha."],
    ["Contenido estructurado", "Armas, protecciones, objetos, dones, talentos, parches, vehículos, personajes pregenerados y PNJ base están en compendios separados."],
    ["Pendiente de ampliar", "El manual contiene contexto narrativo, regiones, comunidades, elenco y amenazas que no deben volcarse como manual completo; cuando se conviertan en reglas jugables deben añadirse como datos estructurados, no como texto bruto."]
  ];
  return `<h1>Cobertura de reglas y automatización</h1>
    <p>Esta página resume lo implementado sin incluir el texto completo del manual en compendios.</p>
    <table>${rows.map(([area, detail]) => `<tr><th>${area}</th><td>${detail}</td></tr>`).join("")}</table>`;
}


export function generatorTablesDocument() {
  const list = (title, values) => `<h2>${title}</h2><ul>${values.map(value => {
    const label = typeof value === "string" ? value : value.name;
    const description = typeof value === "string" ? "" : value.descripcion;
    return `<li><strong>${label}</strong>${description ? `: ${description}` : ""}</li>`;
  }).join("")}</ul>`;
  const content = `<h1>Tablas del generador de motos</h1>
    <p>Estas tablas alimentan el generador de monturas del sistema. No son el manual completo; son datos operativos para crear motos en mesa.</p>
    ${list("Marcas", CAMCMountTables.brands)}
    ${list("Modelos", CAMCMountTables.models)}
    ${list("Tipos", CAMCMountTables.types)}
    ${list("Motores", CAMCMountTables.engines)}
    ${list("Colores", CAMCMountTables.colors)}
    ${list("Acabados", CAMCMountTables.finishes)}
    ${list("Ruido del motor", CAMCMountTables.noises)}
    ${list("Historias de origen", CAMCMountTables.origins)}
    ${list("Juramentos y supersticiones", CAMCMountTables.oaths)}
    ${list("Nombres", CAMCMountTables.names)}
    ${list("Modificaciones funcionales", CAMCMountTables.functionalMods)}
    ${list("Modificaciones estéticas", CAMCMountTables.cosmeticMods)}`;
  return { name: "CAMC · Tablas del generador de motos", pages: [journalPage("Tablas", content)] };
}


export function manualDocuments(rules) {
  const summaryContent = `<h1>Resumen operativo de reglas</h1>
    <h2>Atributos</h2><p>${rules.attributes.join(", ").toUpperCase()}</p>
    <h2>Creación</h2><ul><li>Atributos: ${rules.creation.attribute_array.join(", ")}</li><li>Habilidades: ${rules.creation.skill_distribution}</li><li>Habilidades favorecidas: +${rules.creation.favoured_skill_bonus}</li></ul>
    <h2>Valores derivados</h2><ul>${Object.entries(rules.passives).map(([k,v]) => `<li><strong>${k}</strong>: ${v}</li>`).join("")}</ul>
    <h2>Dados</h2><ul>${Object.entries(rules.dice).map(([k,v]) => `<li><strong>${k}</strong>: ${v}</li>`).join("")}</ul>
    <h2>Equipo y carga</h2><ul>${Object.entries(rules.equipment ?? {}).map(([k,v]) => `<li><strong>${k}</strong>: ${v}</li>`).join("")}</ul>`;
  const guideContent = `<h1>Guía de uso del sistema</h1>
    <h2>Primeros pasos</h2>
    <p>El sistema importa contenido estructurado en compendios y, si el DJ lo permite, también en el mundo. Usa la macro <strong>CAMC · Reimportar contenido</strong> para reconstruir armas, protecciones, objetos, dones, talentos, parches, vehículos, personajes y PNJ sin copiar el manual completo.</p>
    <h2>Imagen de personaje</h2>
    <p>En Ajustes del sistema puedes elegir <strong>Retrato integrado</strong> o <strong>Figura exterior</strong>. La figura exterior mantiene tamaño fijo por porcentaje de sistema y usa la bandera de la deidad como fondo; el retrato integrado usa solo la imagen del actor dentro de la hoja.</p>
    <h2>Parches</h2>
    <p>El cargo y la deidad colocan automáticamente sus parches. Los huecos manuales aceptan parches compatibles y no permiten repetir el mismo parche en más de un hueco. En la pestaña Chaleco, el botón de llave inglesa desbloquea la calibración para ajustar posiciones y tamaños con arrastre, rueda o botones +/− situados junto a cada etiqueta del panel izquierdo.</p>
    <h2>Tiradas iniciales</h2>
    <p>El botón <strong>Tiradas iniciales</strong> tira 1D para Salud, calcula Salud como FUE x 2 + 10 + 1D y recalcula Proezas como piso((FUE + INT) / 2) + 3. La primera vez se aplica directamente; si se repite, pide confirmación y deja un mensaje de chat con valores anteriores y nuevos.</p>
    <h2>Tiradas</h2>
    <p>Pulsa una habilidad para abrir opciones de tirada. Alt + clic hace una tirada rápida. El panel permite dificultad, modificador fijo, dados extra, sacrificios, uso de proezas y penalizador de Salud. Las armas solo aparecen en chat cuando la tirada usa arma.</p>
    <h2>Equipo y carga</h2>
    <p>La mochila permite 6 espacios. Si el PJ tiene una moto vinculada, la ubicación Alforjas usa la capacidad real de esa moto y bloquea cualquier cambio que la supere. Sin moto vinculada se conserva la compatibilidad con el campo antiguo de alforjas del personaje.</p>
    <h2>Motos y modificaciones</h2>
    <p>Cada PJ puede tener una montura propia vinculada por UUID. En la tarjeta <strong>Mi montura</strong> puedes crear, generar, abrir, reparar, dañar o desvincular la moto. La hoja de moto gestiona identidad, mecánica, estructura, sidecar, alforjas, persecuciones, tuneado funcional/estético y generador. Arrastra equipo a la hoja de moto para guardarlo en sus alforjas; si no cabe, el sistema avisa y bloquea el movimiento. La Maniobrabilidad se aplica a tiradas de Conducir y el daño grave muestra su penalizador visible.</p>
    <h2>Persecuciones</h2>
    <p>La pestaña Persecución de la moto ofrece dificultad de terreno, modificador por visibilidad, Evasión rival, franja actual y botones para acciones de movimiento y maniobras. Las tiradas usan Conducir del piloto vinculado y aplican la Maniobrabilidad y el daño grave de la moto.</p>
    <h2>Menú contextual</h2>
    <p>Botón derecho sobre campos, botones, filas, habilidades, objetos y paneles muestra ayuda contextual tomada de los datos del sistema: descripción de habilidades, reglas de objeto, tipo, coste, cargo, deidad, daño o acción disponible.</p>
    <h2>Macros base</h2>
    <p>La macro <strong>CAMC · Escalar token visual</strong> se coloca automáticamente en la posición 1 de la barra rápida del DJ. Ajusta el tamaño visual de los tokens seleccionados, oculta nombre y barras, bloquea la rotación y mantiene la base del token en 1x1.</p>`;
  return [
    { name: "CAMC · Resumen operativo de reglas", pages: [journalPage("Reglas rápidas", summaryContent)] },
    { name: "CAMC · Guía de uso del sistema", pages: [
      journalPage("Uso del sistema", guideContent, 10),
      journalPage("Cobertura", coverageContent(), 20)
    ] }
  ];
}


export const documentosManual = manualDocuments;
export const documentoTablasMotos = generatorTablesDocument;
