/**
 * Documentos de contenido (compendios y mundo) a partir de `_data`. Funciones puras, sin Foundry:
 * las usan el importador del mundo y `scripts/build.mjs`, que compila los compendios al publicar.
 */
import { CAMC } from "../config.mjs";
import { CAMCMountTables } from "../mount/mount-generator.mjs";
import { documentoTutorial } from "./tutorial.mjs";

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
  return [
    { name: "CAMC · Resumen operativo de reglas", pages: [journalPage("Reglas rápidas", summaryContent)] },
    documentoTutorial()
  ];
}


export const documentosManual = manualDocuments;
export const documentoTablasMotos = generatorTablesDocument;
