import { Dialog } from "../compat/applications.mjs";
import { CAMC } from "../config.mjs";
import { normalizarActor, manualDocuments } from "./documentos.mjs";

async function json(path) {
  const response = await fetch(`systems/${CAMC.systemId}/${path}`);
  if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
  return response.json();
}

async function getFolder(name, type) {
  let folder = game.folders.find(f => f.name === name && f.type === type);
  if (!folder) folder = await Folder.create({ name, type, sorting: "a" });
  return folder;
}

function mark(doc) {
  doc.flags ??= {};
  doc.flags[CAMC.systemId] = { source: "core-import", version: CAMC.contentVersion };
  return doc;
}

function stripFolder(doc) {
  delete doc.folder;
  return doc;
}

const RETIRED_BESTIARIO_NAMES = [
  "Bandidos de las Llanuras Yermas",
  "Carroñeros",
  "Cuervos de Asgard",
  "Demonios de Fuego",
  "Draugar de Helheim"
];

// El manual solo da un don fijo por deidad patrona (7 en total). Estos 15 eran una
// invención con 2-3 dones a elegir por dios, con la Virtud y el efecto equivocados.
const RETIRED_DONES_NAMES = [
  "Lazos de Skuld",
  "Valquiria",
  "Espíritu de Freya",
  "Sacrificio de Tyr",
  "Inquebrantable",
  "Justicia",
  "Ojo de Heimdall",
  "Gjallarhorn",
  "Guardian",
  "Visión de Frigg",
  "Tejido del Destino",
  "Consejo de Frigg",
  "Manzanas de Idunn",
  "Juventud Eterna"
];

// El manual solo reconoce 14 modificaciones funcionales de moto (más las puramente
// estéticas, que quedan intactas). Estas 14 eran una invención sin relación con esa
// lista, con nombres, efectos y hasta requisitos (p. ej. "requiere sidecar") inventados.
const RETIRED_MOD_NAMES = [
  "Configuración ofensiva: pinchos",
  "Blindaje improvisado",
  "Depósito ampliado",
  "Escape atronador",
  "Suspensión de salto",
  "Neumáticos de garra",
  "Sidecar reforzado",
  "Torreta de sidecar",
  "Silenciador de patrulla",
  "Motor sobrealimentado",
  "Placas rompehielos",
  "Anclajes de remolque",
  "Faros de largo alcance",
  "Sistema de arranque redundante",
  "Alforjas blindadas"
];

// El manual da 21 talentos (tres por cargo, se elige uno). Estos eran una invención que no
// aparece en el libro; "Inspirar" y "Mano derecha" sí existen y se actualizan por nombre.
const RETIRED_TALENTOS_NAMES = [
  "Autoridad de carretera",
  "Cuentas claras",
  "Nadie pasa",
  "Ruta segura",
  "Arreglo de emergencia",
  "Full Patch"
];

// La tabla de objetos del manual (p. 103-105) tiene 30 entradas; estas 10 no figuran en ella.
const RETIRED_OBJETOS_NAMES = [
  "Cantimplora / Agua",
  "Cordel y cuerdas",
  "Cubiertos de supervivencia",
  "Equipo de acampada",
  "Equipo de herramientas",
  "Instrumentos médicos",
  "Kit de reparación de vehículos",
  "Mapas",
  "Mochila",
  "Piezas de recambio"
];

export class CAMCContentImporter {
  /**
   * Copia el contenido de `_data` al mundo. Los compendios ya vienen compilados en el paquete (scripts/build.mjs).
   * Lo que el DJ haya editado en el mundo no se pisa nunca salvo con la macro «CAMC · Reimportar contenido» (`force`).
   */
  static async importAll({ force = false } = {}) {
    if (!game.user.isGM) return;
    const imported = game.settings.get(CAMC.systemId, "contentVersion");
    if (!force && imported === CAMC.contentVersion) return;

    ui.notifications.info("CAMC | Importando contenido del sistema al mundo…");
    const updateExisting = force;
    await this.#importItems("_data/armas/armas.json", CAMC.itemFolders.armas.label, { force: updateExisting });
    await this.#importItems("_data/armaduras/armaduras.json", CAMC.itemFolders.armaduras.label, { force: updateExisting });
    await this.#deleteWorldItems(CAMC.itemFolders.dones.label, RETIRED_DONES_NAMES);
    await this.#importItems("_data/dones/dones.json", CAMC.itemFolders.dones.label, { force: updateExisting });
    await this.#deleteWorldItems(CAMC.itemFolders.talentos.label, RETIRED_TALENTOS_NAMES);
    await this.#importItems("_data/talentos/talentos.json", CAMC.itemFolders.talentos.label, { force: updateExisting });
    await this.#deleteWorldItems(CAMC.itemFolders.objetos.label, RETIRED_OBJETOS_NAMES);
    await this.#importItems("_data/objetos/objetos.json", CAMC.itemFolders.objetos.label, { force: updateExisting });
    await this.#deleteWorldItems(CAMC.itemFolders.modificacionesMoto.label, RETIRED_MOD_NAMES);
    await this.#importItems("_data/motos/modificaciones-moto.json", CAMC.itemFolders.modificacionesMoto.label, { force: updateExisting });
    await this.#importItems("_data/parches/parches.json", CAMC.itemFolders.parches.label, { force: updateExisting });
    await this.#importItems("_data/vehiculos/vehiculos.json", CAMC.itemFolders.vehiculos.label, { force: updateExisting });
    await this.#importActors("_data/motos/motos.json", CAMC.itemFolders.motos.label, { force: updateExisting });
    await this.#importActors("_data/personajes/pregenerados.json", CAMC.itemFolders.personajes.label, { force: updateExisting });
    await this.#deleteWorldActors(CAMC.itemFolders.bestiario.label, RETIRED_BESTIARIO_NAMES);
    await this.#importActors("_data/bestiario/enemigos.json", CAMC.itemFolders.bestiario.label, { force: updateExisting });
    await this.#importScenes("_data/scenes/scenes.json", "CAMC · Escenas", { force: updateExisting });
    await this.#importManual({ force });
    await this.#createSystemMacros();

    await game.settings.set(CAMC.systemId, "contentVersion", CAMC.contentVersion);
    ui.notifications.info("CAMC | Contenido importado. Hojas, reglas, equipo, dones y manual listos.");
  }

  static async #deleteWorldItems(folderName, names = []) {
    if (!names.length) return 0;
    const folder = game.folders.find(f => f.name === folderName && f.type === "Item");
    const targets = game.items.filter(i => names.includes(i.name)
      && (!folder || i.folder?.id === folder.id)
      && i.flags?.[CAMC.systemId]?.source === "core-import");
    if (!targets.length) return 0;
    await Item.deleteDocuments(targets.map(i => i.id));
    return targets.length;
  }

  static async #importItems(path, folderName, { force = false } = {}) {
    const folder = await getFolder(folderName, "Item");
    const data = await json(path);
    const created = [];
    for (const raw of data) {
      const existing = game.items.find(i => i.name === raw.name && i.type === raw.type && i.folder?.id === folder.id);
      if (existing) {
        if (force) await existing.update(mark(foundry.utils.deepClone(raw)));
        continue;
      }
      created.push(mark({ ...raw, folder: folder.id }));
    }
    if (created.length) await Item.createDocuments(created);
  }

  static async #deleteWorldActors(folderName, names = []) {
    if (!names.length) return 0;
    const folder = game.folders.find(f => f.name === folderName && f.type === "Actor");
    const targets = game.actors.filter(a => names.includes(a.name)
      && (!folder || a.folder?.id === folder.id)
      && a.flags?.[CAMC.systemId]?.source === "core-import");
    if (!targets.length) return 0;
    await Actor.deleteDocuments(targets.map(a => a.id));
    return targets.length;
  }

  static async #importActors(path, folderName, { force = false } = {}) {
    const folder = await getFolder(folderName, "Actor");
    const data = (await json(path)).map(doc => normalizarActor(doc));
    const created = [];
    for (const raw of data) {
      const existing = game.actors.find(a => a.name === raw.name && a.type === raw.type && a.folder?.id === folder.id);
      if (existing) {
        if (force) await existing.update(mark(foundry.utils.deepClone(raw)));
        continue;
      }
      created.push(mark({ ...raw, folder: folder.id }));
    }
    if (created.length) await Actor.createDocuments(created);
  }

  static async #importScenes(path, folderName, { force = false } = {}) {
    const folder = await getFolder(folderName, "Scene");
    const data = await json(path);
    const created = [];
    for (const raw of data) {
      const existing = game.scenes.find(s => s.name === raw.name && s.folder?.id === folder.id);
      if (existing) {
        if (force) await existing.update(mark(foundry.utils.deepClone(raw)));
        continue;
      }
      created.push(mark({ ...raw, folder: folder.id }));
    }
    if (created.length) await Scene.createDocuments(created);
  }

  static async #importManual({ force = false } = {}) {
    const folder = await getFolder(CAMC.itemFolders.manual.label, "JournalEntry");
    // Diarios antiguos del sistema que ya no existen: el manual completo y la guía de uso (sustituida por el tutorial).
    for (const nombre of ["CAMC · Manual completo", "CAMC · Guía de uso del sistema"]) {
      const viejo = game.journal.find(j => j.name === nombre && j.flags?.[CAMC.systemId]?.source === "core-import");
      if (viejo) await viejo.delete();
    }

    for (const doc of manualDocuments(await json("_data/manual/reglas-resumen.json"))) {
      await this.#upsertWorldJournal(folder, doc, force);
    }
  }

  static async #upsertWorldJournal(folder, raw, force) {
    const data = mark(foundry.utils.deepClone({ ...raw, folder: folder.id }));
    const existing = game.journal.find(j => j.name === data.name);
    if (!existing) return JournalEntry.create(data);
    if (!force) return existing;
    const pages = data.pages ?? [];
    delete data.pages;
    await existing.update(data);
    await this.#replaceJournalPages(existing, pages);
    return existing;
  }

  static async #replaceJournalPages(journal, pages = []) {
    const ids = journal.pages.map(page => page.id);
    if (ids.length) await journal.deleteEmbeddedDocuments("JournalEntryPage", ids);
    if (pages.length) await journal.createEmbeddedDocuments("JournalEntryPage", pages);
  }

  static async #createSystemMacros() {
    await this.#upsertMacro({
      name: "CAMC · Reimportar contenido",
      type: "script",
      img: "icons/svg/book.svg",
      command: `game.camc.importContent({force: true});`
    });
    const tokenScaleMacro = await this.#upsertMacro({
      name: "CAMC · Escalar token visual",
      type: "script",
      img: CAMC.assets.tokenScaleMacro,
      command: `(async () => {
  const selected = canvas.tokens.controlled;

  if (!selected.length) {
    ui.notifications.warn("Selecciona uno o varios tokens antes de ejecutar la macro.");
    return;
  }

  const currentScale = selected[0]?.document?.texture?.scaleX ?? 1;

  const scale = await Dialog.prompt({
    title: "Escalar token",
    content: '<form class="camc-macro-form"><div class="form-group"><label>Escala visual</label><input type="number" name="scale" value="' + currentScale + '" min="0.1" step="0.1"/></div><p style="font-size:12px; opacity:0.8;">Ejemplo: 1 = tamaño normal, 3 = triple, 5 = muy grande.</p></form>',
    label: "Aplicar",
    callback: (html) => {
      const root = html instanceof HTMLElement ? html : html[0];
      return Number(root.querySelector("[name='scale']").value);
    }
  });

  if (!Number.isFinite(scale) || scale <= 0) {
    ui.notifications.warn("Escala no válida.");
    return;
  }

  for (const token of selected) {
    await token.document.update({
      width: 1,
      height: 1,
      displayName: CONST.TOKEN_DISPLAY_MODES.NONE,
      displayBars: CONST.TOKEN_DISPLAY_MODES.NONE,
      lockRotation: true,
      "texture.scaleX": scale,
      "texture.scaleY": scale
    });
  }

  ui.notifications.info("Token ajustado a escala visual x" + scale + ".");
})();`
    });
    await this.#assignHotbarMacro(tokenScaleMacro, 1);
  }

  static async #upsertMacro(data) {
    const existing = game.macros.find(m => m.name === data.name && m.type === data.type);
    if (existing) {
      await existing.update(data);
      return existing;
    }
    return Macro.create(data);
  }

  static async #assignHotbarMacro(macro, slot) {
    if (!macro || !game.user?.isGM) return;
    if (typeof game.user.assignHotbarMacro === "function") {
      await game.user.assignHotbarMacro(macro, slot);
      return;
    }
    const hotbar = foundry.utils.deepClone(game.user.hotbar ?? {});
    hotbar[String(slot)] = macro.id;
    await game.user.update({ hotbar });
  }
}
