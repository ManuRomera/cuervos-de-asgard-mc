import { CAMC } from "./config.mjs";
import { CAMCActor } from "./actor/actor.mjs";
import { CAMCActorSheet } from "./actor/actor-sheet.mjs";
import { CAMCNpcSheet } from "./actor/npc-sheet.mjs";
import { CAMCCommunitySheet } from "./actor/community-sheet.mjs";
import { CAMCMotoSheet } from "./actor/moto-sheet.mjs";
import { CAMCItem } from "./item/item.mjs";
import { CAMCItemSheet } from "./item/item-sheet.mjs";
import { YsystemDice } from "./dice/ysystem-dice.mjs";
import { CAMCContentImporter } from "./content/importer.mjs";
import { generateRandomMount } from "./mount/mount-generator.mjs";
import { generateRandomCharacter, generateRandomNpc, generateRandomCommunity } from "./generator/camc-generators.mjs";

Hooks.once("init", async () => {
  console.log("CAMC | Inicializando Cuervos de Asgard Motor Club v13");

  CONFIG.CAMC = CAMC;
  CONFIG.Actor.documentClass = CAMCActor;
  CONFIG.Item.documentClass = CAMCItem;

  const ActorSheets = foundry.documents.collections.Actors;
  const ItemSheets = foundry.documents.collections.Items;
  const ActorSheetV1 = foundry.appv1.sheets.ActorSheet;
  const ItemSheetV1 = foundry.appv1.sheets.ItemSheet;

  ActorSheets.unregisterSheet("core", ActorSheetV1);
  ActorSheets.registerSheet(CAMC.systemId, CAMCActorSheet, { types: ["personaje"], makeDefault: true, label: "CAMC · Personaje" });
  ActorSheets.registerSheet(CAMC.systemId, CAMCNpcSheet, { types: ["pnj"], makeDefault: true, label: "CAMC · PNJ" });
  ActorSheets.registerSheet(CAMC.systemId, CAMCCommunitySheet, { types: ["comunidad"], makeDefault: true, label: "CAMC · Comunidad" });
  ActorSheets.registerSheet(CAMC.systemId, CAMCMotoSheet, { types: ["moto"], makeDefault: true, label: "CAMC · Moto" });

  ItemSheets.unregisterSheet("core", ItemSheetV1);
  ItemSheets.registerSheet(CAMC.systemId, CAMCItemSheet, { makeDefault: true, label: "CAMC · Item" });

  registerHandlebarsHelpers();

  await foundry.applications.handlebars.loadTemplates([
    `systems/${CAMC.systemId}/templates/actor/character-sheet.hbs`,
    `systems/${CAMC.systemId}/templates/actor/npc-sheet.hbs`,
    `systems/${CAMC.systemId}/templates/actor/community-sheet.hbs`,
    `systems/${CAMC.systemId}/templates/actor/moto-sheet.hbs`,
    `systems/${CAMC.systemId}/templates/item/item-sheet.hbs`,
    `systems/${CAMC.systemId}/templates/chat/roll-card.hbs`
  ]);
});

Hooks.once("setup", () => {
  game.settings.register(CAMC.systemId, "contentVersion", {
    name: "Versión de contenido CAMC importada",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

  game.settings.register(CAMC.systemId, "autoImportContent", {
    name: "Importar contenido automáticamente",
    hint: "Crea en el mundo los ítems, PNJ y entradas de diario extraídas del manual la primera vez que se abre el sistema.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(CAMC.systemId, "systemGuideShown", {
    name: "Guía inicial CAMC mostrada",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register(CAMC.systemId, "compactSheets", {
    name: "Hojas compactas",
    hint: "Activa un diseño más denso para reducir el espacio de pantalla ocupado por las hojas.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => document.body.classList.toggle("camc-compact", game.settings.get(CAMC.systemId, "compactSheets"))
  });

  game.settings.register(CAMC.systemId, "characterPortraitMode", {
    name: "Modo de imagen de personaje",
    hint: "Control de sesión del DJ: retrato integrado o figura exterior con fondo de deidad.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      framed: "Retrato integrado en la ficha",
      standee: "Figura exterior a la ficha"
    },
    default: "framed",
    onChange: () => Object.values(ui.windows).forEach(app => {
      if (app instanceof CAMCActorSheet) app.render(false);
    })
  });

  game.settings.register(CAMC.systemId, "characterPortraitScale", {
    name: "Tamaño de figura exterior",
    hint: "Porcentaje de tamaño de la figura exterior de personaje y su bandera de deidad.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "35": "35%",
      "45": "45%",
      "55": "55%",
      "65": "65%",
      "75": "75%",
      "90": "90%",
      "110": "110%",
      "130": "130%",
      "150": "150%",
      "175": "175%",
      "200": "200%",
      "250": "250%",
      "300": "300%",
      "350": "350%",
      "400": "400%"
    },
    default: "45",
    onChange: () => Object.values(ui.windows).forEach(app => {
      if (app instanceof CAMCActorSheet) app.render(false);
    })
  });

  game.settings.register(CAMC.systemId, "vestCalibration", {
    name: "Calibrar posiciones del chaleco",
    hint: "Solo para el DJ. Permite arrastrar parches sobre el chaleco para guardar coordenadas exactas por hueco.",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
    onChange: () => Object.values(ui.windows).forEach(app => {
      if (app instanceof CAMCActorSheet) app.render(false);
    })
  });

  game.settings.register(CAMC.systemId, "vestSlotOverridesV2", {
    name: "Coordenadas calibradas del chaleco",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(CAMC.systemId, "skillEditUnlocked", {
    name: "Edición de dados de habilidades desbloqueada",
    hint: "Estado local del botón de llave inglesa de la hoja.",
    scope: "client",
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register(CAMC.systemId, "motoExtendedRules", {
    name: "Reglas ampliadas de motos",
    hint: "Activa automatizaciones y opciones que no forman parte estricta del manual: tuneos generados con efectos propios, modificadores contextuales por piezas no oficiales y acciones de conducción ampliadas como Forzar motor. Desactívalo para usar solo datos y efectos declarados por el manual y por los objetos oficiales del sistema.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => Object.values(ui.windows).forEach(app => {
      if (app instanceof CAMCMotoSheet) app.render(false);
    })
  });
});

Hooks.once("ready", async () => {
  game.camc = {
    config: CAMC,
    dice: YsystemDice,
    generateRandomMount,
    generators: {
      character: generateRandomCharacter,
      npc: generateRandomNpc,
      community: generateRandomCommunity,
      mount: generateRandomMount
    },
    importContent: CAMCContentImporter.importAll.bind(CAMCContentImporter)
  };

  document.body.classList.toggle("camc-compact", game.settings.get(CAMC.systemId, "compactSheets"));

  if (game.user.isGM && game.settings.get(CAMC.systemId, "autoImportContent")) {
    await CAMCContentImporter.importAll();
  }
});

Hooks.on("renderChatMessageHTML", (message, html) => {
  const root = html?.find ? html : $(html);
  root.find("[data-camc-action='apply-damage']").on("click", ev => applyDamageFromChat(message, ev));
  activateCamcContextMenu(root);
});

for (const hook of ["renderActorSheet", "renderItemSheet", "renderDialog"]) {
  Hooks.on(hook, (_app, html) => activateCamcContextMenu(html?.find ? html : $(html)));
}

Hooks.on("preUpdateItem", (item, changes, _options, userId) => validateCamcCarryUpdate(item, changes, userId));
Hooks.on("updateItem", (item, changes) => syncCamcLinkedMountLoad(item, changes));

function registerHandlebarsHelpers() {
  Handlebars.registerHelper("camcLabel", (collection, key) => CAMC[collection]?.[key]?.label ?? key);
  Handlebars.registerHelper("camcAsset", key => CAMC.assets?.[key] ?? "");
  Handlebars.registerHelper("attrShort", key => CAMC.atributos[key]?.short ?? String(key).toUpperCase());
  Handlebars.registerHelper("attrLabel", key => CAMC.atributos[key]?.label ?? key);
  Handlebars.registerHelper("skillLabel", key => key === "resistencia_fisica" ? "Resistencia Física" : (CAMC.habilidades[key]?.label ?? key));
  Handlebars.registerHelper("add", (a, b) => Number(a) + Number(b));
  Handlebars.registerHelper("sub", (a, b) => Number(a) - Number(b));
  Handlebars.registerHelper("mul", (a, b) => Number(a) * Number(b));
  Handlebars.registerHelper("concat", (...args) => args.slice(0, -1).join(""));
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("ne", (a, b) => a !== b);
  Handlebars.registerHelper("gt", (a, b) => Number(a) > Number(b));
  Handlebars.registerHelper("or", (a, b) => a || b);
  Handlebars.registerHelper("and", (a, b) => a && b);
  Handlebars.registerHelper("not", a => !a);
  Handlebars.registerHelper("includes", (arr, value) => Array.isArray(arr) && arr.includes(value));
  Handlebars.registerHelper("lower", value => String(value ?? "").toLowerCase());
  Handlebars.registerHelper("pct", (value, max) => {
    value = Number(value) || 0; max = Number(max) || 1;
    return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  });
  Handlebars.registerHelper("select", function(selected, options) {
    return options.fn(this).replace(new RegExp(` value=["']${selected}["']`), `$& selected`);
  });
}

async function applyDamageFromChat(message, event) {
  event.preventDefault();
  const data = message.getFlag(CAMC.systemId, "chatAction") ?? {};
  if (data.type !== "damage") return;
  const damage = Math.max(0, Number(data.total ?? event.currentTarget.dataset.damage ?? 0));
  if (!damage) return ui.notifications.warn("No hay daño que aplicar.");

  const targets = Array.from(game.user.targets ?? []).map(token => token.actor).filter(Boolean);
  const controlled = globalThis.canvas?.tokens?.controlled?.map(token => token.actor).filter(Boolean) ?? [];
  const actors = targets.length ? targets : controlled;
  const uniqueActors = Array.from(new Map(actors.map(actor => [actor.uuid, actor])).values());
  if (!uniqueActors.length) return ui.notifications.warn("Selecciona o marca como objetivo al actor que recibirá el daño.");

  const results = [];
  for (const actor of uniqueActors) {
    if (typeof actor.aplicarDano !== "function") continue;
    const result = await actor.aplicarDano(damage);
    results.push(`${actor.name}: ${result.final} Salud (${result.bruto} - protección ${result.proteccion})`);
  }
  if (!results.length) return ui.notifications.warn("Los objetivos seleccionados no usan las reglas de Salud de CAMC.");

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: `<div class="camc-chat-card dano-aplicado"><header><strong>Daño aplicado</strong><span>auto</span></header><p>${results.join("<br>")}</p></div>`
  });
}

function activateCamcContextMenu(html) {
  const root = html?.find ? html : $(html);
  const scope = root.find(".camc-sheet, .camc-dialog, .camc-chat-card").addBack(".camc-sheet, .camc-dialog, .camc-chat-card");
  if (!scope.length) return;
  scope.off("contextmenu.camc-help").on("contextmenu.camc-help", "*", event => {
    if (event.target.closest(".camc-vest-stage,.camc-vest-canvas,.camc-vest-base,.camc-vest-patch,.camc-vest-slot-guide")) return;
    const target = event.target.closest("button,input,select,textarea,a,.item,.camc-item-row,.camc-skill-row,.camc-attr-card,.camc-resource-card,.camc-derived-mini,.camc-panel,.camc-tabs,.camc-chat-card,label");
    if (!target || !scope[0].contains(target)) return;
    event.preventDefault();
    event.stopPropagation();
    showCamcContextMenu(event, buildCamcContext(target));
  });
  $(document).off("mousedown.camc-help keydown.camc-help").on("mousedown.camc-help keydown.camc-help", event => {
    if (event.type === "keydown" && event.key !== "Escape") return;
    if (event.type === "mousedown" && event.target.closest(".camc-context-menu")) return;
    $(".camc-context-menu").remove();
  });
}

function buildCamcContext(element) {
  const button = element.closest("button,a");
  const input = element.closest("input,select,textarea");
  const item = element.closest("[data-item-id]");
  const skillElement = element.closest("[data-skill]");
  const panel = element.closest(".camc-panel");
  const label = element.closest("label");
  const title = cleanText(element.getAttribute("title"))
    || cleanText(button?.getAttribute("title"))
    || cleanText(label?.querySelector("span")?.textContent)
    || cleanText(panel?.querySelector(".camc-panel-title")?.textContent)
    || cleanText(element.textContent)
    || "Elemento CAMC";

  const lines = [];
  const skillKey = skillElement?.dataset?.skill;
  const skill = CAMC.habilidades[skillKey];
  const doc = item ? findCamcDocumentForElement(item, item.dataset.itemId) : null;
  if (skill) {
    lines.push(`<b>${escapeHtml(skill.label)}</b>`);
    lines.push(escapeHtml(skill.descripcion ?? "Habilidad del personaje."));
    lines.push(`Atributo base: ${escapeHtml(CAMC.atributos[skill.atributo]?.label ?? skill.atributo)}`);
  } else if (item) {
    const name = cleanText(doc?.name) || cleanText(item.querySelector(".camc-row-name, b, button")?.textContent) || "Elemento de inventario";
    lines.push(`<b>${escapeHtml(name)}</b>`);
    lines.push(...buildCamcItemHelp(doc));
  } else {
    lines.push(`<b>${escapeHtml(title)}</b>`);
  }

  lines.push(...buildCamcFieldHelp(input));
  const role = describeCamcElement(element, button, input);
  if (role) lines.push(role);
  if (input?.name) lines.push(`Campo de datos: ${escapeHtml(input.name)}`);
  if (element.dataset?.tab) lines.push(`Pestana: ${escapeHtml(element.dataset.tab)}`);
  if (skillKey && !skill) lines.push(`Habilidad: ${escapeHtml(skillKey)}`);
  if (element.dataset?.type) lines.push(`Tipo: ${escapeHtml(element.dataset.type)}`);
  if (element.dataset?.action) lines.push(`Accion: ${escapeHtml(element.dataset.action)}`);
  if (element.dataset?.itemId) lines.push(`ID: ${escapeHtml(element.dataset.itemId)}`);

  return lines;
}

function describeCamcElement(element, button, input) {
  const e = button || input || element;
  const classes = e.classList;
  if (classes.contains("item-edit")) return "Accion: editar y abrir la ficha de este elemento.";
  if (classes.contains("item-delete")) return "Accion: eliminar este elemento tras confirmacion.";
  if (classes.contains("item-equip")) return "Accion: equipar o desequipar este elemento.";
  if (classes.contains("item-roll-damage") || classes.contains("roll-damage")) return "Accion: tirar dano.";
  if (classes.contains("roll-skill")) return "Accion: tirar esta habilidad.";
  if (classes.contains("roll-initiative")) return "Accion: tirar iniciativa.";
  if (classes.contains("roll-resistance")) return "Accion: tirar Resistencia Fisica.";
  if (classes.contains("use-don")) return "Accion: usar este don y gastar proezas si procede.";
  if (classes.contains("use-cargo-talent")) return "Accion: usar el talento del cargo.";
  if (classes.contains("create-item")) return "Accion: crear un nuevo elemento de este tipo.";
  if (classes.contains("skill-edit-toggle")) return "Accion: bloquear o desbloquear la edicion de dados de habilidades.";
  if (classes.contains("vest-calibration-toggle")) return "Accion: bloquear o desbloquear la calibracion de parches del chaleco en esta ficha.";
  if (classes.contains("fav-toggle")) return "Accion: marcar o desmarcar habilidad favorecida.";
  if (classes.contains("skill-die")) return "Accion: cambiar el numero de dados de la habilidad si la edicion esta desbloqueada.";
  if (classes.contains("camc-attr-select")) return "Selector de atributo del personaje.";
  if (classes.contains("item-carry-location")) return "Selector de ubicacion de carga.";
  if (classes.contains("camc-sheet-img-button") || classes.contains("camc-img-button")) return "Accion: cambiar la imagen del actor o elemento.";
  if (classes.contains("camc-resource-card")) return "Recurso de la ficha con valor actual, maximo y controles.";
  if (classes.contains("camc-derived-mini")) return "Valor derivado calculado por el sistema.";
  if (classes.contains("camc-panel")) return "Panel de la hoja.";
  if (input) return "Campo editable de la hoja.";
  if (button) return "Boton de accion.";
  return "";
}

function findCamcDocumentForElement(element, itemId) {
  for (const app of Object.values(ui.windows ?? {})) {
    const root = app.element?.[0] ?? app.element;
    if (!(root instanceof HTMLElement) || !root.contains(element)) continue;
    if (itemId && app.actor?.items) return app.actor.items.get(itemId) ?? null;
    if (itemId && app.item?.id === itemId) return app.item;
    if (app.item) return app.item;
    if (app.actor) return app.actor;
  }
  return null;
}

function buildCamcItemHelp(doc) {
  if (!doc) return ["Fila de objeto: clic izquierdo para usar, tirar o abrir segun el tipo."];
  const s = doc.system ?? {};
  const lines = [];
  const typeLabels = {
    arma: "Arma",
    armadura: "Proteccion",
    escudo: "Escudo",
    don: "Don",
    talento: "Talento",
    objeto: "Objeto",
    vehiculo: "Vehiculo",
    regla: "Regla"
  };
  if (typeLabels[doc.type]) lines.push(typeLabels[doc.type]);
  if (doc.type === "don") {
    if (s.deidad) lines.push(`Deidad: ${escapeHtml(s.deidad)}`);
    if (s.coste_descripcion || s.coste_proezas) lines.push(`Coste: ${escapeHtml(s.coste_descripcion || `${s.coste_proezas} proezas`)}`);
  }
  if (doc.type === "talento" && s.cargo) lines.push(`Cargo: ${escapeHtml(s.cargo)}`);
  if (doc.type === "arma") {
    const damage = `${s.dano ?? ""}${s.dano_fijo ? `+${s.dano_fijo}` : ""}`.trim();
    if (s.categoria) lines.push(`Categoria: ${escapeHtml(s.categoria)}`);
    if (damage) lines.push(`Dano: ${escapeHtml(damage)}`);
  }
  if (["armadura", "escudo"].includes(doc.type)) {
    if (s.nivel !== undefined) lines.push(`Nivel ${escapeHtml(s.nivel)} · Penalizacion ${escapeHtml(s.penalizacion ?? 0)}`);
  }
  if (doc.type === "objeto") {
    if (s.tipo) lines.push(`Tipo: ${escapeHtml(s.tipo)}`);
    if (s.tamano) lines.push(`Carga: ${escapeHtml(CAMC.tamanos[s.tamano] ?? s.tamano)}`);
    if (s.tipo === "modificacion_moto") {
      lines.push("Modificacion de moto: al equiparla se aplica automaticamente a la moto del personaje cuando modifica iniciativa, estructura, maniobrabilidad, ocupantes, dados de dano o alforjas.");
      if (String(doc.name).toLowerCase().includes("sidecar")) lines.push("Sidecar: permite una tercera modificacion funcional.");
      if (String(doc.name).toLowerCase().includes("chasis ultrarreforzado")) lines.push("Condicion: requiere Chasis reforzado instalado.");
    }
  }
  if (doc.type === "vehiculo") {
    if (s.tipo) lines.push(`Tipo: ${escapeHtml(s.tipo)}`);
    if (s.estructura) lines.push(`Estructura: ${escapeHtml(s.estructura.value ?? 0)} / ${escapeHtml(s.estructura.max ?? 0)}`);
  }
  for (const text of [s.efecto, s.descripcion, s.resumen, s.regla, s.notas]) {
    const clean = cleanText(text);
    if (clean && !lines.includes(clean)) lines.push(escapeHtml(clean));
  }
  return lines.length ? lines : ["Elemento de la ficha CAMC."];
}

function buildCamcFieldHelp(input) {
  if (!input) return [];
  const name = input.name ?? "";
  const value = input.value ?? "";
  if (name === "system.biografia.cargo") {
    const cargo = CAMC.cargos[value];
    if (!cargo) return [];
    const skills = (cargo.habilidades ?? []).map(key => CAMC.habilidades[key]?.label ?? key).join(", ");
    return [
      `Cargo: ${escapeHtml(cargo.label)}`,
      `Talento asociado: ${escapeHtml(cargo.talento ?? "Sin talento")}`,
      skills ? `Habilidades favorecidas: ${escapeHtml(skills)}` : escapeHtml(cargo.nota ?? "Escoge cuatro habilidades favorecidas.")
    ];
  }
  if (name === "system.biografia.deidad") {
    const deity = CAMC.dioses[value];
    if (!deity) return [];
    return [`Deidad: ${escapeHtml(deity.label)}`, `Virtud: ${escapeHtml(deity.virtud)}`];
  }
  if (name === "system.carga.alforjas_extra") {
    return ["Alforjas extra: anaden 8 espacios a las alforjas de la moto. No aumentan la carga que el personaje lleva a pie."];
  }
  if (name === "dificultad") {
    return ["Dificultad: objetivo numerico de la tirada. Si se deja sin dificultad, el chat muestra solo el total."];
  }
  if (name === "dificultadManual") {
    return ["Dificultad personalizada: sobrescribe la lista de dificultades si escribes un numero."];
  }
  if (name === "modificador") {
    return ["Modificador fijo: suma o resta directa al resultado final despues de tirar los dados."];
  }
  if (name === "dadosExtra") {
    return ["Dados extra: dados circunstanciales antes de aplicar el limite de dados del sistema."];
  }
  if (name === "proezaDados") {
    return ["Proezas para +D: gasta proezas para anadir dados a la tirada."];
  }
  if (name === "dadosSacrificados") {
    return ["Dados sacrificados: retira dados de la tirada para apuntar o afinar una accion cuando la regla lo permita."];
  }
  if (name === "aplicaSalud") {
    return ["Penalizador de Salud: aplica la penalizacion automatica por heridas actuales."];
  }
  if (name === "desenfundar") {
    return ["Desenfundar o cambiar de arma: penalizador de -1D cuando se prepara o cambia el arma en este turno."];
  }
  if (input.classList?.contains("item-carry-location")) {
    const label = CAMC.ubicacionesCarga[value] ?? value;
    return [
      `Ubicacion de carga: ${escapeHtml(label)}`,
      "Mochila/equipo encima cuenta contra el limite a pie. Alforjas cuenta contra la capacidad de la moto."
    ];
  }
  return [];
}

function showCamcContextMenu(event, lines) {
  $(".camc-context-menu").remove();
  const menu = $(`<div class="camc-context-menu" role="menu">${lines.map(line => `<div>${line}</div>`).join("")}</div>`);
  $("body").append(menu);
  const width = menu.outerWidth();
  const height = menu.outerHeight();
  const left = Math.min(event.clientX + 8, window.innerWidth - width - 8);
  const top = Math.min(event.clientY + 8, window.innerHeight - height - 8);
  menu.css({ left: `${Math.max(8, left)}px`, top: `${Math.max(8, top)}px` });
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
}

function validateCamcCarryUpdate(item, changes, userId) {
  if (userId && game.user.id !== userId) return;
  const actor = item.parent;
  if (actor?.type !== "personaje") return;
  const flat = foundry.utils.flattenObject(changes ?? {});
  if (flat["system.equipada"] === true && item.type === "objeto" && item.system?.tipo === "modificacion_moto") {
    const validation = validateCamcMotoModEquip(actor, item);
    if (!validation.ok) {
      ui.notifications.warn(validation.message);
      return false;
    }
  }
  const relevant = ["system.carga.ubicacion", "system.carga.espacios", "system.cantidad", "system.tamano"]
    .some(path => Object.prototype.hasOwnProperty.call(flat, path));
  if (!relevant) return;

  const expanded = foundry.utils.expandObject(changes ?? {});
  const nextItem = foundry.utils.mergeObject(item.toObject(), expanded, { inplace: false });
  const nextLocation = nextItem.system?.carga?.ubicacion || "mochila";
  if (nextLocation === "comunidad") return;
  const items = actor.items.contents.map(entry => entry.id === item.id ? nextItem : entry);
  const load = computeCamcCarryLoad(actor.system, items);
  const block = nextLocation === "alforjas" ? load.alforjas : load.mochila;
  if (!block || block.value <= block.max) return;
  ui.notifications.warn(`${item.name} no cabe en ${CAMC.ubicacionesCarga[nextLocation]}: ${formatCamcSlots(block.value)} / ${formatCamcSlots(block.max)} espacios.`);
  return false;
}

function validateCamcMotoModEquip(actor, item) {
  const active = actor.items.filter(entry => entry.type === "objeto" && entry.system?.equipada && entry.system?.tipo === "modificacion_moto" && entry.id !== item.id);
  const names = active.map(entry => String(entry.name ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  const nextName = String(item.name ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (nextName.includes("ultrarreforzado") && !names.includes("chasis reforzado")) {
    return { ok: false, message: "Chasis ultrarreforzado requiere tener equipado Chasis reforzado." };
  }
  const hasSidecar = names.some(name => name.includes("sidecar")) || nextName.includes("sidecar");
  const max = hasSidecar ? 3 : 2;
  if (active.length + 1 > max) {
    return { ok: false, message: `La moto no puede tener más de ${max} modificaciones funcionales${hasSidecar ? " con sidecar" : ""}.` };
  }
  return { ok: true };
}

function computeCamcCarryLoad(system, items) {
  const portable = items.filter(entry => ["arma", "armadura", "escudo", "objeto"].includes(entry.type));
  const mochilaMax = Number(system.carga?.mochila_max ?? 6);
  const vehicleMods = String(system.vehiculo?.modificaciones ?? "").toLowerCase();
  const hasExtraSaddlebags = Boolean(system.carga?.alforjas_extra)
    || vehicleMods.includes("alforjas extra")
    || items.some(entry => entry.type === "objeto" && entry.system?.equipada && String(entry.name).toLowerCase().includes("alforjas extra"));
  const linkedMount = getCamcLinkedMountSync(system);
  const baseAlforjas = Number(system.carga?.alforjas_base ?? 8);
  const mountAlforjas = linkedMount ? Number(linkedMount.system?.reglas?.alforjas?.max ?? 0) : 0;
  const alforjasMax = Math.max(baseAlforjas, Number.isFinite(mountAlforjas) ? mountAlforjas : 0) + (hasExtraSaddlebags ? 8 : 0);
  const totals = { mochila: 0, alforjas: 0 };
  for (const entry of portable) {
    const location = entry.system?.carga?.ubicacion || "mochila";
    if (!Object.prototype.hasOwnProperty.call(totals, location)) continue;
    const quantity = entry.type === "objeto" ? Math.max(1, Number(entry.system?.cantidad ?? 1)) : 1;
    totals[location] += camcItemSpaces(entry) * quantity;
  }
  return {
    mochila: { value: totals.mochila, max: mochilaMax },
    alforjas: { value: totals.alforjas, max: alforjasMax }
  };
}

function getCamcLinkedMountSync(system) {
  const uuid = String(system.mount?.uuid ?? "");
  const match = uuid.match(/^Actor\.([^./]+)$/);
  if (!match) return null;
  const actor = game.actors?.get(match[1]);
  return actor?.type === "moto" ? actor : null;
}

function camcItemSpaces(item) {
  const explicit = Number(item.system?.carga?.espacios);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const size = item.system?.tamano || "mediano";
  if (size === "no_equipable") return 0;
  return Number(CAMC.cargaPorTamano[size] ?? 1);
}

function formatCamcSlots(value) {
  value = Number(value) || 0;
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}

async function syncCamcLinkedMountLoad(item, changes) {
  const actor = item.parent;
  if (actor?.type !== "personaje") return;
  const flat = foundry.utils.flattenObject(changes ?? {});
  const relevant = ["system.carga.ubicacion", "system.carga.espacios", "system.cantidad", "system.tamano"]
    .some(path => Object.prototype.hasOwnProperty.call(flat, path));
  if (!relevant) return;
  const mount = getCamcLinkedMountSync(actor.system);
  if (!mount) return;
  const load = computeCamcCarryLoad(actor.system, actor.items.contents);
  const value = load.alforjas.value;
  if (Number(mount.system?.reglas?.alforjas?.value ?? 0) !== value) {
    await mount.update({ "system.reglas.alforjas.value": value });
  }
}
