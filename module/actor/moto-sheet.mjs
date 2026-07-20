import { CAMC } from "../config.mjs";
import { generateRandomMount, CAMCMountTables } from "../mount/mount-generator.mjs";
import { CAMCMountRolls } from "../mount/mount-rolls.mjs";

const get = foundry.utils.getProperty;
const ActorSheetV1 = foundry.appv1.sheets.ActorSheet;

export class CAMCMotoSheet extends ActorSheetV1 {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["camc", "sheet", "actor", "moto", "camc-moto-window"],
      template: `systems/${CAMC.systemId}/templates/actor/moto-sheet.hbs`,
      width: 1080,
      height: 740,
      resizable: true,
      scrollY: [".camc-body", ".camc-scroll"],
      tabs: [{ navSelector: ".camc-tabs", contentSelector: ".camc-body", initial: "identidad" }],
      dragDrop: [{ dragSelector: ".camc-mod-row", dropSelector: ".camc-moto-sheet" }]
    });
  }

  get title() { return `${this.actor.name} - Hoja de Moto`; }

  async getData(options = {}) {
    const context = await super.getData(options);
    await this.#migrateLegacyMods();
    const s = this.actor.system;
    const owner = await this.#getOwner();
    const structure = s.reglas?.estructura ?? { value: 0, max: 1 };
    const cargo = this.#buildCargo(owner);
    context.config = CAMC;
    context.system = s;
    context.owner = owner;
    context.structurePct = this.#pct(structure.value, structure.max);
    context.structureTone = this.#structureTone(structure.value, structure.max);
    context.status = this.#status();
    context.modsUsed = Number(s.reglas?.mods_funcionales_usadas ?? 0);
    context.modsMax = Number(s.reglas?.mods_funcionales_max ?? 2);
    context.functionalMods = this.#functionalModItems();
    context.cosmeticMods = this.#cosmeticModItems();
    context.cargoItems = cargo.items;
    context.cargoUsed = cargo.usedLabel;
    context.cargoMax = cargo.maxLabel;
    context.cargoPct = cargo.pct;
    context.cargoOver = cargo.over;
    context.tables = CAMCMountTables;
    context.extendedMotoRules = this.#extendedRules();
    context.chase = this.#buildChaseContext();
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    this.#autosizeTextareas(html);
    html.find(".camc-auto-textarea").on("input", ev => this.#autosizeTextareas($(ev.currentTarget)));
    html.find(".moto-img-button").on("click", ev => this.#changeImage(ev));
    html.find(".moto-adjust").on("click", ev => this.#adjustNumber(ev));
    html.find(".moto-apply-damage").on("click", ev => this.#applyDamage(ev));
    html.find(".moto-repair").on("click", ev => this.#repair(ev));
    html.find(".moto-roll-drive").on("click", ev => this.#rollDrive(ev));
    html.find(".moto-roll-damage").on("click", ev => this.#rollDamage(ev));
    html.find(".moto-chase-roll").on("click", ev => this.#rollChase(ev));
    html.find(".moto-chase-step").on("click", ev => this.#adjustChasePosition(ev));
    html.find(".moto-roll-mechanic").on("click", ev => this.#rollMechanic(ev));
    html.find(".moto-generate").on("click", ev => this.#generate(ev));
    html.find(".moto-add-mod").on("click", ev => this.#addMod(ev));
    html.find(".moto-delete-mod").on("click", ev => this.#deleteMod(ev));
    html.find(".moto-item-edit").on("click", ev => this.#editItem(ev));
    html.find(".moto-mod-toggle").on("click", ev => this.#toggleMod(ev));
    html.find(".moto-cargo-remove").on("click", ev => this.#removeCargo(ev));
    html.find(".moto-apply-owner").on("click", ev => this.#applyOwner(ev));
    html.find('[name="system.reglas.sidecar"]').on("change", ev => this.#toggleSidecar(ev));
  }

  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    if (data?.type !== "Item") return super._onDrop(event);
    const item = await Item.implementation.fromDropData(data);
    if (!item) return;
    if (item.type === "objeto" && String(item.system?.tipo ?? "").includes("modificacion")) {
      return this.#installDroppedMod(item);
    }
    if (this.#isPortable(item)) return this.#storeDroppedCargo(item);
    return ui.notifications.info("Solo se pueden guardar armas, protecciones, escudos u objetos en las alforjas.");
  }

  async #getOwner() {
    const uuid = this.actor.system?.vinculo?.ownerUuid;
    if (!uuid) return null;
    return this.#resolveActorUuid(uuid);
  }

  async #resolveActorUuid(uuid) {
    if (!uuid) return null;
    try {
      const doc = await fromUuid(uuid);
      if (doc) return doc;
    } catch (_err) {
      /* fallback below */
    }
    const match = String(uuid).match(/^Actor\.([^\.]+)$/);
    return match ? game.actors.get(match[1]) ?? null : null;
  }

  async #changeImage(event) {
    event.preventDefault();
    new FilePicker({ type: "image", current: this.actor.img, callback: path => this.actor.update({ img: path }) }).render(true);
  }

  async #adjustNumber(event) {
    event.preventDefault();
    const path = event.currentTarget.dataset.path;
    const delta = Number(event.currentTarget.dataset.delta ?? 0);
    if (!path || !delta) return;
    const current = Number(get(this.actor, path) ?? 0);
    let next = current + delta;
    if (path.endsWith(".value")) {
      const max = Number(get(this.actor, path.replace(/\.value$/, ".max")));
      if (Number.isFinite(max)) next = Math.min(max, next);
    }
    await this.actor.update({ [path]: Math.max(0, next) });
  }

  async #adjustChasePosition(event) {
    event.preventDefault();
    const path = event.currentTarget.dataset.path;
    const delta = Number(event.currentTarget.dataset.delta ?? 0);
    if (!path || !delta) return;
    const current = Number(get(this.actor, path) ?? 1);
    const next = Math.max(1, Math.min(10, current + delta));
    const update = { [path]: next };
    if (path === "system.persecucion.perseguidor") update["system.persecucion.franja"] = next;
    await this.actor.update(update);
  }

  async #applyDamage(event) {
    event.preventDefault();
    const amount = await this.#numberDialog("Aplicar daño", "Daño", 1);
    if (amount === null) return;
    const current = Number(this.actor.system.reglas?.estructura?.value ?? 0);
    await this.actor.update({ "system.reglas.estructura.value": Math.max(0, current - amount) });
  }

  async #repair(event) {
    event.preventDefault();
    const amount = event.shiftKey ? await this.#numberDialog("Reparar estructura", "Estructura", 1) : 1;
    if (amount === null) return;
    const current = Number(this.actor.system.reglas?.estructura?.value ?? 0);
    const max = Number(this.actor.system.reglas?.estructura?.max ?? current);
    await this.actor.update({ "system.reglas.estructura.value": Math.min(max, current + amount) });
  }

  async #rollDrive(event) {
    event.preventDefault();
    const owner = await this.#getOwner();
    const action = event.currentTarget.dataset.action ?? "Conducir";
    return CAMCMountRolls.rollDrive(owner, this.actor, { label: action });
  }

  async #rollDamage(event) {
    event.preventDefault();
    const action = event.currentTarget.dataset.action ?? "Daño de moto";
    return CAMCMountRolls.rollMountDamage(this.actor, { label: action });
  }

  async #rollChase(event) {
    event.preventDefault();
    const owner = await this.#getOwner();
    const label = event.currentTarget.dataset.label ?? "Persecución";
    const kind = event.currentTarget.dataset.kind ?? "movement";
    const mod = Number(event.currentTarget.dataset.mod ?? 0);
    if (kind === "movement" && event.currentTarget.dataset.key === "mantener_posicion") {
      return ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div class="camc-chat-card"><header><h3><i class="fas fa-flag-checkered"></i> Persecución</h3><strong>${this.actor.name}</strong></header><p><b>Mantener posición:</b> no requiere tirada y conserva la franja actual.</p></div>`
      });
    }
    const terrain = Number(this.actor.system.persecucion?.terreno ?? 10);
    const visibility = Number(this.actor.system.persecucion?.visibilidad ?? 0);
    const target = Number(this.actor.system.persecucion?.evasion_objetivo ?? 10);
    const difficulty = kind === "maneuver" ? target + visibility + mod : terrain + visibility + mod;
    return CAMCMountRolls.rollDrive(owner, this.actor, {
      label: `Persecución: ${label}`,
      difficulty
    });
  }

  async #rollMechanic(event) {
    event.preventDefault();
    const owner = await this.#getOwner();
    return CAMCMountRolls.rollMechanic(owner, this.actor, { install: event.currentTarget.dataset.action !== "retirar" });
  }

  async #generate(event) {
    event.preventDefault();
    try {
      const mode = event.currentTarget.dataset.mode ?? "full";
      const generated = generateRandomMount({
        withSidecar: this.actor.system.reglas?.sidecar,
        includeFunctionalMods: mode === "full" && this.#extendedRules(),
        seed: `${this.actor.id}-${Date.now()}-${mode}`
      });
      const update = {};
      let generatedItems = null;
      let cosmeticOnly = false;
      if (mode === "name") update.name = generated.name;
      else if (mode === "style") {
        update["system.identidad.detalles_visuales"] = generated.system.identidad.detalles_visuales;
        generatedItems = generated.items ?? [];
        cosmeticOnly = true;
      } else if (mode === "engine") update["system.tecnica.motor"] = generated.system.tecnica.motor;
      else if (mode === "story") {
        update["system.identidad.historia"] = generated.system.identidad.historia;
        update["system.identidad.origen"] = generated.system.identidad.origen;
        update["system.identidad.juramento"] = generated.system.identidad.juramento;
      } else {
        update.name = generated.name;
        const system = foundry.utils.deepClone(generated.system);
        system.mods = { funcionales: [], esteticas: [] };
        update.system = foundry.utils.mergeObject(foundry.utils.deepClone(this.actor.system), system, { inplace: false });
        generatedItems = generated.items ?? [];
      }
      await this.actor.update(update);
      if (generatedItems) await this.#replaceGeneratedMods(generatedItems, { cosmeticOnly });
      ui.notifications.info("Moto generada.");
    } catch (err) {
      console.error("CAMC | Error generando moto", err);
      ui.notifications.error("No se pudo generar la moto. Revisa la consola para ver el error.");
    }
  }

  async #addMod(event) {
    event.preventDefault();
    const type = event.currentTarget.dataset.type === "estetica" ? "esteticas" : "funcionales";
    if (type === "funcionales" && !this.#canAddFunctional()) return;
    const doc = type === "funcionales"
      ? this.#modItemData({ name: "Nuevo tuneado funcional", descripcion: "", efecto: {}, tipo: "modificacion_moto", equipada: false, ocupaRanura: true })
      : this.#modItemData({ name: "Nuevo detalle estético", descripcion: "", tipo: "modificacion_estetica_moto", equipada: true, ocupaRanura: false });
    const [item] = await this.actor.createEmbeddedDocuments("Item", [doc]);
    item?.sheet?.render(true);
  }

  async #installDroppedMod(item) {
    if (item.parent?.uuid === this.actor.uuid) return;
    if (item.system?.tipo === "modificacion_moto" && !this.#canAddFunctional(item)) return;
    const data = item.toObject();
    delete data._id;
    data.system ??= {};
    data.system.equipada = item.system?.tipo === "modificacion_moto";
    data.system.carga ??= {};
    data.system.carga.ubicacion = "comunidad";
    await this.actor.createEmbeddedDocuments("Item", [data]);
  }

  async #storeDroppedCargo(item) {
    const owner = await this.#getOwner();
    const destination = owner ?? this.actor;
    const existingInDestination = item.parent?.uuid === destination.uuid;
    const cargo = this.#buildCargo(owner, { excludeUuid: existingInDestination ? item.uuid : "" });
    const total = this.#itemTotalSpaces(item);
    if (cargo.used + total > cargo.max) {
      return ui.notifications.warn(`${item.name} no cabe en las alforjas de ${this.actor.name}: ${this.#formatSlots(cargo.used + total)} / ${this.#formatSlots(cargo.max)} espacios.`);
    }

    if (existingInDestination) {
      await item.update({ "system.carga.ubicacion": "alforjas" });
    } else {
      const data = item.toObject();
      delete data._id;
      data.system ??= {};
      data.system.carga ??= {};
      data.system.carga.ubicacion = "alforjas";
      await destination.createEmbeddedDocuments("Item", [data]);
      if (owner && item.parent?.uuid === this.actor.uuid) await item.delete();
    }
    await this.#syncAlforjasValue(owner);
    ui.notifications.info(`${item.name} guardado en las alforjas de ${this.actor.name}.`);
    this.render(false);
  }

  async #deleteMod(event) {
    event.preventDefault();
    const item = this.#getEmbeddedItem(event);
    if (!item) return;
    const ok = await Dialog.confirm({ title: "Eliminar tuneado", content: `<p>¿Eliminar <strong>${item.name}</strong> de la moto?</p>` });
    if (ok) await item.delete();
  }

  async #editItem(event) {
    event.preventDefault();
    this.#getEmbeddedItem(event)?.sheet.render(true);
  }

  async #toggleMod(event) {
    event.preventDefault();
    const item = this.#getEmbeddedItem(event);
    if (!item) return;
    if (!item.system.equipada && item.system.tipo === "modificacion_moto" && !this.#canAddFunctional(item)) return;
    await item.update({ "system.equipada": !item.system.equipada });
  }

  async #removeCargo(event) {
    event.preventDefault();
    const uuid = event.currentTarget.dataset.uuid;
    if (!uuid) return;
    const item = await fromUuid(uuid);
    if (!item) return ui.notifications.warn("No se pudo encontrar ese objeto.");
    await item.update({ "system.carga.ubicacion": "mochila" });
    const owner = await this.#getOwner();
    await this.#syncAlforjasValue(owner);
    this.render(false);
  }

  async #applyOwner(event) {
    event.preventDefault();
    const owner = await this.#getOwner();
    if (!owner) return ui.notifications.warn("Esta moto no tiene PJ vinculado.");
    const uuid = this.actor.uuid || (this.actor.id ? `Actor.${this.actor.id}` : "");
    await owner.update({ "system.mount": { uuid, name: this.actor.name, img: this.actor.img } });
    await this.actor.update({ "system.vinculo.ownerUuid": owner.uuid, "system.vinculo.ownerName": owner.name });
    ui.notifications.info(`${this.actor.name} aplicada como montura de ${owner.name}.`);
    for (const app of Object.values(owner.apps ?? {})) app.render(false);
    this.render(false);
  }

  async #toggleSidecar(event) {
    const sidecar = event.currentTarget.checked;
    const update = { "system.reglas.sidecar": sidecar };
    if (sidecar) {
      update["system.reglas.base_dados_dano"] = "3D";
      update["system.reglas.base_estructura"] = 20;
      update["system.reglas.base_maniobrabilidad"] = 1;
      update["system.reglas.base_alforjas"] = 12;
      update["system.reglas.plazas"] = Math.max(2, Number(this.actor.system.reglas?.plazas ?? 1));
      update["system.reglas.mods_funcionales_max"] = Math.max(3, Number(this.actor.system.reglas?.mods_funcionales_max ?? 2));
      update["system.reglas.estructura.value"] = Math.max(Number(this.actor.system.reglas?.estructura?.value ?? 0), 20);
    } else {
      update["system.reglas.base_dados_dano"] = "2D";
      update["system.reglas.base_estructura"] = 15;
      update["system.reglas.base_maniobrabilidad"] = 2;
      update["system.reglas.base_alforjas"] = 8;
      update["system.reglas.plazas"] = 1;
      update["system.reglas.mods_funcionales_max"] = Math.min(2, Number(this.actor.system.reglas?.mods_funcionales_max ?? 2));
    }
    await this.actor.update(update);
  }

  #canAddFunctional(item = null) {
    const used = Number(this.actor.system.reglas?.mods_funcionales_usadas ?? 0);
    const max = Number(this.actor.system.reglas?.mods_funcionales_max ?? 2);
    const requiresSidecar = Boolean(item?.system?.requiereSidecar);
    if (requiresSidecar && !this.actor.system.reglas?.sidecar) {
      ui.notifications.warn("Esta modificación requiere sidecar.");
      return false;
    }
    if (used >= max) {
      ui.notifications.warn(`La moto ya tiene ${used}/${max} modificaciones funcionales.`);
      return false;
    }
    return true;
  }

  #functionalModItems() {
    const items = this.actor.items?.filter(item => item.type === "objeto" && item.system?.tipo === "modificacion_moto") ?? [];
    const legacy = (this.actor.system.mods?.funcionales ?? []).map((mod, index) => ({
      id: `legacy-func-${index}`,
      name: mod.name,
      img: "icons/tools/smithing/anvil.webp",
      system: {
        tipo: "modificacion_moto",
        equipada: true,
        especial: mod.descripcion,
        descripcion: mod.descripcion,
        efecto: mod.efecto ?? {},
        ocupaRanura: mod.ocupaRanura !== false
      }
    }));
    return [...items, ...legacy];
  }

  #cosmeticModItems() {
    const items = this.actor.items?.filter(item => item.type === "objeto" && item.system?.tipo === "modificacion_estetica_moto") ?? [];
    const legacy = (this.actor.system.mods?.esteticas ?? []).map((mod, index) => ({
      id: `legacy-est-${index}`,
      name: mod.name,
      img: "icons/sundries/scrolls/scroll-runed-brown.webp",
      system: { tipo: "modificacion_estetica_moto", equipada: true, descripcion: mod.descripcion }
    }));
    return [...items, ...legacy];
  }

  #getEmbeddedItem(event) {
    const row = event.currentTarget.closest("[data-item-id]");
    return this.actor.items.get(row?.dataset.itemId);
  }

  #modItemData({ name, descripcion = "", efecto = {}, tipo = "modificacion_moto", equipada = true, ocupaRanura = true }) {
    return {
      name,
      type: "objeto",
      img: tipo === "modificacion_moto" ? "icons/tools/smithing/anvil.webp" : "icons/sundries/scrolls/scroll-runed-brown.webp",
      system: {
        tipo,
        tamano: "no_equipable",
        cantidad: 1,
        especial: descripcion,
        descripcion,
        efecto,
        equipada,
        ocupaRanura,
        dificultadInstalacion: 15,
        dificultadRetirada: 12,
        carga: { ubicacion: "comunidad", espacios: 0 }
      }
    };
  }

  async #replaceGeneratedMods(items = [], { cosmeticOnly = false } = {}) {
    const current = this.actor.items
      .filter(item => item.type === "objeto" && String(item.system?.tipo ?? "").includes("modificacion") && (!cosmeticOnly || item.system?.tipo === "modificacion_estetica_moto"))
      .map(item => item.id);
    if (current.length) await this.actor.deleteEmbeddedDocuments("Item", current);
    const docs = items.filter(item => !cosmeticOnly || item.system?.tipo === "modificacion_estetica_moto");
    if (docs.length) await this.actor.createEmbeddedDocuments("Item", docs.map(item => {
      const data = foundry.utils.deepClone(item);
      delete data._id;
      return data;
    }));
  }

  async #migrateLegacyMods() {
    const functional = this.actor.system.mods?.funcionales ?? [];
    const cosmetic = this.actor.system.mods?.esteticas ?? [];
    if (!functional.length && !cosmetic.length) return;
    const docs = [
      ...functional.map(mod => this.#modItemData({
        name: mod.name,
        descripcion: mod.descripcion,
        efecto: mod.efecto ?? {},
        tipo: "modificacion_moto",
        equipada: true,
        ocupaRanura: mod.ocupaRanura !== false
      })),
      ...cosmetic.map(mod => this.#modItemData({
        name: mod.name,
        descripcion: mod.descripcion,
        tipo: "modificacion_estetica_moto",
        equipada: true,
        ocupaRanura: false
      }))
    ];
    if (docs.length) await this.actor.createEmbeddedDocuments("Item", docs);
    await this.actor.update({ "system.mods": { funcionales: [], esteticas: [] } });
  }

  #buildCargo(owner = null, { excludeUuid = "" } = {}) {
    const sourceActors = [owner, this.actor].filter(Boolean);
    const rows = [];
    for (const actor of sourceActors) {
      for (const item of actor.items?.contents ?? []) {
        if (!this.#isPortable(item)) continue;
        if (item.uuid === excludeUuid) continue;
        if ((item.system?.carga?.ubicacion || "mochila") !== "alforjas") continue;
        const spaces = this.#itemSpaces(item);
        const quantity = item.type === "objeto" ? Math.max(1, Number(item.system?.cantidad ?? 1)) : 1;
        rows.push({
          id: item.id,
          uuid: item.uuid,
          item,
          actorUuid: actor.uuid,
          actorName: actor.name,
          spaces,
          total: spaces * quantity,
          totalLabel: this.#formatSlots(spaces * quantity)
        });
      }
    }
    const used = rows.reduce((sum, row) => sum + row.total, 0);
    const max = Number(this.actor.system.reglas?.alforjas?.max ?? 0);
    return {
      items: rows,
      used,
      max,
      usedLabel: this.#formatSlots(used),
      maxLabel: this.#formatSlots(max),
      pct: this.#pct(used, max || 1),
      over: used > max
    };
  }

  async #syncAlforjasValue(owner = null) {
    const cargo = this.#buildCargo(owner);
    const current = Number(this.actor.system.reglas?.alforjas?.value ?? 0);
    if (current !== cargo.used) await this.actor.update({ "system.reglas.alforjas.value": cargo.used });
  }

  #isPortable(item) {
    return ["arma", "armadura", "escudo", "objeto"].includes(item?.type);
  }

  #itemTotalSpaces(item) {
    const quantity = item.type === "objeto" ? Math.max(1, Number(item.system?.cantidad ?? 1)) : 1;
    return this.#itemSpaces(item) * quantity;
  }

  #itemSpaces(item) {
    const explicit = Number(item.system?.carga?.espacios);
    if (Number.isFinite(explicit) && explicit >= 0) return explicit;
    const size = item.system?.tamano || "mediano";
    if (size === "no_equipable") return 0;
    return Number(CAMC.cargaPorTamano[size] ?? 1);
  }

  #formatSlots(value) {
    value = Number(value) || 0;
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
  }

  #numberDialog(title, label, value = 1) {
    return new Promise(resolve => new Dialog({
      title,
      content: `<form class="camc-dialog"><label><span>${label}</span><input name="value" type="number" min="0" value="${value}"/></label></form>`,
      buttons: {
        ok: { label: "Aceptar", callback: html => resolve(Math.max(0, Number(html.find('[name="value"]').val() ?? 0))) },
        cancel: { label: "Cancelar", callback: () => resolve(null) }
      },
      default: "ok",
      close: () => resolve(null)
    }).render(true));
  }

  #pct(value, max) {
    value = Number(value) || 0;
    max = Number(max) || 1;
    return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  }

  #structureTone(value, max) {
    value = Number(value) || 0;
    max = Number(max) || 1;
    if (value <= 0) return "danger";
    if (value <= Math.floor(max / 2)) return "warning";
    return "good";
  }

  #status() {
    const s = this.actor.system.reglas ?? {};
    if (s.inutilizada) return { label: "Inutilizada", tone: "danger", note: "Estructura 0. No puede usarse hasta repararla." };
    if (s.dano_grave) return { label: "Dañada", tone: "warning", note: `+${s.penalizador_dano_grave ?? 3} dificultad a las tiradas del piloto.` };
    return { label: s.mantenimiento || "Operativa", tone: "good", note: "Lista para rodar." };
  }

  #extendedRules() {
    try {
      if (!game?.settings?.settings?.has(`${CAMC.systemId}.motoExtendedRules`)) return false;
      return Boolean(game.settings.get(CAMC.systemId, "motoExtendedRules"));
    } catch (_err) {
      return false;
    }
  }

  #autosizeTextareas(html) {
    const nodes = html instanceof jQuery ? html.find("textarea.camc-auto-textarea").addBack("textarea.camc-auto-textarea") : [];
    for (const textarea of nodes) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(34, textarea.scrollHeight)}px`;
    }
  }

  #buildChaseContext() {
    const p = this.actor.system.persecucion ?? {};
    const clamp = value => Math.max(1, Math.min(10, Number(value) || 1));
    const pursuer = clamp(p.perseguidor ?? p.franja ?? 1);
    const target = clamp(p.objetivo ?? 5);
    const escape = clamp(p.huida ?? 10);
    return {
      terrains: CAMC.persecucion?.terrenos ?? [],
      visibility: CAMC.persecucion?.visibilidad ?? [],
      movement: CAMC.persecucion?.movimiento ?? [],
      maneuvers: CAMC.persecucion?.maniobras ?? [],
      pursuer,
      target,
      escape,
      caught: pursuer === target,
      escaped: target >= escape,
      bands: Array.from({ length: 10 }, (_, index) => {
        const value = index + 1;
        return {
          value,
          pursuer: value === pursuer,
          target: value === target,
          escape: value === escape
        };
      })
    };
  }
}
