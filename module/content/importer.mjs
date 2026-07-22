import { CAMC } from "../config.mjs";
import { CAMCMountTables } from "../mount/mount-generator.mjs";

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

export class CAMCContentImporter {
  static async importAll({ force = false } = {}) {
    if (!game.user.isGM) return;
    const imported = game.settings.get(CAMC.systemId, "contentVersion");
    const contentChanged = imported !== CAMC.contentVersion;

    ui.notifications.info("CAMC | Sincronizando compendios del sistema…");
    const packCount = await this.#importCompendiums({ force: force || contentChanged });
    if (!force && imported === CAMC.contentVersion) {
      if (packCount) ui.notifications.info(`CAMC | Compendios actualizados: ${packCount} documentos.`);
      return;
    }

    ui.notifications.info("CAMC | Importando contenido del sistema al mundo…");
    const updateExisting = force || contentChanged;
    await this.#importItems("_data/armas/armas.json", CAMC.itemFolders.armas.label, { force: updateExisting });
    await this.#importItems("_data/armaduras/armaduras.json", CAMC.itemFolders.armaduras.label, { force: updateExisting });
    await this.#importItems("_data/dones/dones.json", CAMC.itemFolders.dones.label, { force: updateExisting });
    await this.#importItems("_data/talentos/talentos.json", CAMC.itemFolders.talentos.label, { force: updateExisting });
    await this.#importItems("_data/objetos/objetos.json", CAMC.itemFolders.objetos.label, { force: updateExisting });
    await this.#importItems("_data/motos/modificaciones-moto.json", CAMC.itemFolders.modificacionesMoto.label, { force: updateExisting });
    await this.#importItems("_data/parches/parches.json", CAMC.itemFolders.parches.label, { force: updateExisting });
    await this.#importItems("_data/vehiculos/vehiculos.json", CAMC.itemFolders.vehiculos.label, { force: updateExisting });
    await this.#importActors("_data/motos/motos.json", CAMC.itemFolders.motos.label, { force: updateExisting });
    await this.#importActors("_data/personajes/pregenerados.json", CAMC.itemFolders.personajes.label, { force: updateExisting });
    await this.#importActors("_data/bestiario/enemigos.json", CAMC.itemFolders.bestiario.label, { force: updateExisting });
    await this.#importManual();
    await this.#createReimportMacro();

    await game.settings.set(CAMC.systemId, "contentVersion", CAMC.contentVersion);
    ui.notifications.info("CAMC | Contenido importado. Hojas, reglas, equipo, dones y manual listos.");
  }

  static async #importCompendiums({ force = false } = {}) {
    let count = 0;
    count += await this.#importPackItems("armas-camc", "_data/armas/armas.json", { force });
    count += await this.#importPackItems("protecciones-camc", "_data/armaduras/armaduras.json", { force });
    count += await this.#importPackItems("dones-camc", "_data/dones/dones.json", { force });
    count += await this.#importPackItems("talentos-camc", "_data/talentos/talentos.json", { force });
    count += await this.#importPackItems("objetos-camc", "_data/objetos/objetos.json", { force });
    count += await this.#importPackItems("modificaciones-moto", "_data/motos/modificaciones-moto.json", { force });
    count += await this.#importPackItems("parches-camc", "_data/parches/parches.json", { force });
    count += await this.#importPackItems("vehiculos-camc", "_data/vehiculos/vehiculos.json", { force });
    count += await this.#importPackActors("motos-base", "_data/motos/motos.json", { force });
    count += await this.#importPackActors("personajes-camc", "_data/personajes/pregenerados.json", { force });
    count += await this.#importPackActors("bestiario-camc", "_data/bestiario/enemigos.json", { force });
    count += await this.#importPackManual("manual-camc", { force });
    count += await this.#importPackGeneratorTables("tablas-generador-motos", { force });
    return count;
  }

  static async #importPackItems(packName, path, { force = false } = {}) {
    const data = await json(path);
    return this.#upsertPackDocuments(packName, Item, data, { force });
  }

  static async #importPackActors(packName, path, { force = false } = {}) {
    const data = (await json(path)).map(doc => this.#normalizeActorData(doc));
    return this.#upsertPackDocuments(packName, Actor, data, { force });
  }

  static async #importPackManual(packName, { force = false } = {}) {
    await this.#deletePackDocuments(packName, JournalEntry, ["CAMC · Manual completo"]);
    return this.#upsertPackDocuments(packName, JournalEntry, await this.#manualDocuments(), { force });
  }

  static async #importPackGeneratorTables(packName, { force = false } = {}) {
    return this.#upsertPackDocuments(packName, JournalEntry, [this.#generatorTablesDocument()], { force });
  }

  static async #deletePackDocuments(packName, DocumentClass, names = []) {
    const pack = game.packs.get(`${CAMC.systemId}.${packName}`);
    if (!pack || !names.length) return 0;

    const wasLocked = pack.locked;
    if (wasLocked && typeof pack.configure === "function") await pack.configure({ locked: false });

    try {
      const index = await pack.getIndex({ fields: ["name"] });
      const ids = index.filter(entry => names.includes(entry.name)).map(entry => entry._id);
      if (!ids.length) return 0;
      await DocumentClass.deleteDocuments(ids, { pack: pack.collection });
      return ids.length;
    } finally {
      if (wasLocked && typeof pack.configure === "function") await pack.configure({ locked: true });
    }
  }

  static async #upsertPackDocuments(packName, DocumentClass, docs, { force = false } = {}) {
    const pack = game.packs.get(`${CAMC.systemId}.${packName}`);
    if (!pack) {
      console.warn(`CAMC | Compendio no declarado: ${CAMC.systemId}.${packName}`);
      return 0;
    }

    const wasLocked = pack.locked;
    if (wasLocked && typeof pack.configure === "function") await pack.configure({ locked: false });

    try {
      const documentName = DocumentClass.documentName ?? pack.documentName ?? pack.metadata?.type ?? "";
      const index = await pack.getIndex({ fields: ["name", "type", "flags"] });
      const existing = new Map(index.map(entry => [`${entry.name}::${entry.type ?? documentName}`, entry]));
      let changed = 0;
      for (const raw of docs) {
        const doc = stripFolder(mark(foundry.utils.deepClone(raw)));
        const key = `${doc.name}::${doc.type ?? documentName}`;
        const match = existing.get(key);
        if (!match) {
          await DocumentClass.createDocuments([doc], { pack: pack.collection });
          changed += 1;
          continue;
        }
        if (!force) continue;
        const existingDoc = await pack.getDocument(match._id);
        if (existingDoc) {
          const updateData = foundry.utils.deepClone(doc);
          const pages = DocumentClass === JournalEntry ? updateData.pages : null;
          if (pages) delete updateData.pages;
          await existingDoc.update(updateData);
          if (pages) await this.#replaceJournalPages(existingDoc, pages);
          changed += 1;
        }
      }
      return changed;
    } finally {
      if (wasLocked && typeof pack.configure === "function") await pack.configure({ locked: true });
    }
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

  static async #importActors(path, folderName, { force = false } = {}) {
    const folder = await getFolder(folderName, "Actor");
    const data = (await json(path)).map(doc => this.#normalizeActorData(doc));
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

  static #normalizeActorData(raw) {
    const doc = foundry.utils.deepClone(raw);
    if (doc.type !== "moto") return doc;
    const functional = doc.system?.mods?.funcionales ?? [];
    const cosmetic = doc.system?.mods?.esteticas ?? [];
    const existing = doc.items ?? [];
    const generatedItems = [
      ...functional.map(mod => this.#motoModItem(mod, "modificacion_moto")),
      ...cosmetic.map(mod => this.#motoModItem(mod, "modificacion_estetica_moto"))
    ];
    doc.items = [...existing, ...generatedItems];
    doc.system ??= {};
    doc.system.mods = { funcionales: [], esteticas: [] };
    return doc;
  }

  static #motoModItem(mod, tipo) {
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

  static async #importManual() {
    const folder = await getFolder(CAMC.itemFolders.manual.label, "JournalEntry");
    const oldManual = game.journal.find(j => j.name === "CAMC · Manual completo");
    if (oldManual) await oldManual.delete();

    let guide = null;
    for (const doc of await this.#manualDocuments()) {
      const imported = await this.#upsertWorldJournal(folder, doc);
      if (doc.name === "CAMC · Guía de uso del sistema") guide = imported;
    }
    await this.#showGuideOnce(guide);
  }

  static async #upsertWorldJournal(folder, raw) {
    const data = mark(foundry.utils.deepClone({ ...raw, folder: folder.id }));
    const existing = game.journal.find(j => j.name === data.name);
    if (!existing) return JournalEntry.create(data);
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

  static async #showGuideOnce(guide) {
    if (!guide || !game.user.isGM) return;
    if (game.settings.get(CAMC.systemId, "systemGuideShown")) return;
    guide.sheet?.render(true);
    await game.settings.set(CAMC.systemId, "systemGuideShown", true);
  }

  static #journalPage(name, content, sort = 0) {
    return {
      name,
      type: "text",
      sort,
      text: { format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML, content }
    };
  }

  static #coverageContent() {
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

  static #generatorTablesDocument() {
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
    return { name: "CAMC · Tablas del generador de motos", pages: [this.#journalPage("Tablas", content)] };
  }

  static async #manualDocuments() {
    const rules = await json("_data/manual/reglas-resumen.json");
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
      <p>Botón derecho sobre campos, botones, filas, habilidades, objetos y paneles muestra ayuda contextual tomada de los datos del sistema: descripción de habilidades, reglas de objeto, tipo, coste, cargo, deidad, daño o acción disponible.</p>`;
    return [
      { name: "CAMC · Resumen operativo de reglas", pages: [this.#journalPage("Reglas rápidas", summaryContent)] },
      { name: "CAMC · Guía de uso del sistema", pages: [
        this.#journalPage("Uso del sistema", guideContent, 10),
        this.#journalPage("Cobertura", this.#coverageContent(), 20)
      ] }
    ];
  }

  static async #createReimportMacro() {
    if (game.macros.find(m => m.name === "CAMC · Reimportar contenido")) return;
    await Macro.create({
      name: "CAMC · Reimportar contenido",
      type: "script",
      img: "icons/svg/book.svg",
      command: `game.camc.importContent({force: true});`
    });
  }
}
