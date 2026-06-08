import { CAMC } from "../config.mjs";
import { YsystemDice } from "../dice/ysystem-dice.mjs";

const get = foundry.utils.getProperty;
const ItemSheetV1 = foundry.appv1.sheets.ItemSheet;

export class CAMCItemSheet extends ItemSheetV1 {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["camc", "sheet", "item", "camc-item-window"],
      template: `systems/${CAMC.systemId}/templates/item/item-sheet.hbs`,
      width: 900,
      height: 720,
      resizable: true,
      scrollY: [".camc-body", ".camc-scroll"],
      tabs: [{ navSelector: ".camc-tabs", contentSelector: ".camc-body", initial: "principal" }]
    });
  }

  get title() { return `${this.item.name} - Hoja de Objeto`; }

  async getData(options = {}) {
    const context = await super.getData(options);
    const item = this.item;
    const s = item.system;
    context.config = CAMC;
    context.system = s;
    context.formulaDano = item.formulaDano;
    context.formulaDanoLabel = typeof item.getFormulaDanoLabel === "function" ? item.getFormulaDanoLabel(item.actor) : item.formulaDano;
    context.categoriaArmaLabel = CAMC.categoriasArma[s.categoria]?.label ?? s.categoria;
    context.isEquipped = Boolean(s.equipada || s.equipado);
    context.structurePct = this.#pct(s.estructura?.value, s.estructura?.max);
    context.structureTone = this.#resourceTone(s.estructura?.value, s.estructura?.max);
    context.ammoPct = this.#pct(s.municion?.value, s.municion?.max);
    context.isPortable = ["arma", "armadura", "escudo", "objeto"].includes(item.type);
    const explicitSlots = Number(s.carga?.espacios);
    context.cargaEspacios = Number.isFinite(explicitSlots) ? explicitSlots : Number(CAMC.cargaPorTamano[s.tamano] ?? 1);
    context.itemTypes = CONFIG.Item?.typeLabels ?? {};
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".roll-damage").on("click", () => this.#rollDamage());
    html.find(".roll-decay").on("click", () => this.#rollDecay());
    html.find(".toggle-equipped").on("click", () => this.#toggleEquipped());
    html.find(".use-don").on("click", () => this.#useDon());
    html.find(".camc-adjust").on("click", ev => this.#adjustNumber(ev));
    html.find(".vehicle-action").on("click", ev => this.#vehicleAction(ev));
  }

  async #rollDamage() {
    if (this.item.type !== "arma" && this.item.type !== "vehiculo") return;
    if (this.item.type === "arma" && this.item.tieneMunicion?.()) {
      const ok = await this.item.consumirMunicion(1);
      if (!ok) return ui.notifications.warn(`${this.item.name}: sin munición.`);
    }
    if (this.item.type === "vehiculo") {
      const formula = String(this.item.system.dados_dano ?? "2d6").replaceAll("D", "d6");
      const roll = await new Roll(formula).evaluate({ async: true });
      return roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.item.actor }), flavor: `${this.item.name} · Daño de vehículo` });
    }
    return YsystemDice.rollDamage(this.item.actor, this.item);
  }

  async #rollDecay() {
    if (this.item.system.deterioro !== "R") return ui.notifications.info("La caducidad solo se tira para equipo reciclado usado.");
    const roll = await new Roll("1d6").evaluate({ async: true });
    const total = roll.total;
    let result = "Sigue funcionando.";
    if (total === 3) result = "Necesita reparación: Mecánica a dificultad 12, hasta tres intentos.";
    if (total === 2) result = "Necesita reparación: Mecánica a dificultad 18, hasta dos intentos.";
    if (total === 1) result = "Roto: solo puede repararse con un crítico en una única tirada de Mecánica.";
    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.item.actor }),
      flavor: `${this.item.name} · Caducidad de equipo reciclado<br><strong>${result}</strong>`
    });
  }


  async #toggleEquipped() {
    if (this.item.type === "escudo") return this.item.update({ "system.equipado": !this.item.system.equipado });
    if (this.item.type === "objeto" && !this.item.system.equipada && this.item.system.tipo === "modificacion_moto") {
      const validation = this.#validateMotoMod();
      if (!validation.ok) return ui.notifications.warn(validation.message);
    }
    if (["arma", "armadura", "objeto"].includes(this.item.type)) return this.item.update({ "system.equipada": !this.item.system.equipada });
  }

  #validateMotoMod() {
    const actor = this.item.actor;
    if (!actor) return { ok: true };
    const active = actor.items.filter(entry => entry.type === "objeto" && entry.system?.equipada && entry.system?.tipo === "modificacion_moto" && entry.id !== this.item.id);
    const names = active.map(entry => String(entry.name ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const nextName = String(this.item.name ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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

  async #useDon() {
    if (this.item.type !== "don") return;
    const actor = this.item.actor;
    if (!actor) return ui.notifications.warn("Este don debe estar en una ficha para poder gastar proezas.");
    const coste = Math.max(0, Number(this.item.system.coste_proezas ?? 0));
    if (coste > 0) {
      const ok = await actor.gastarProezas(coste);
      if (!ok) return ui.notifications.warn(`${this.item.name}: no hay proezas suficientes.`);
    }
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: await renderTemplate(`systems/${CAMC.systemId}/templates/chat/roll-card.hbs`, {
        actor,
        tipo: "don",
        item: this.item,
        coste
      })
    });
  }

  async #adjustNumber(event) {
    event.preventDefault();
    const path = event.currentTarget.dataset.path;
    const delta = Number(event.currentTarget.dataset.delta ?? 0);
    if (!path || !delta) return;
    const current = Number(get(this.item, path) ?? 0);
    let next = current + delta;
    if (path.endsWith(".value")) {
      const max = Number(get(this.item, path.replace(/\.value$/, ".max")));
      if (Number.isFinite(max)) next = Math.min(max, next);
    }
    await this.item.update({ [path]: Math.max(0, next) });
  }

  async #vehicleAction(event) {
    event.preventDefault();
    const action = event.currentTarget.dataset.action;
    if (action === "damage") return this.#rollDamage();
    if (action === "repair") {
      const current = Number(this.item.system.estructura?.value ?? 0);
      const max = Number(this.item.system.estructura?.max ?? current);
      await this.item.update({ "system.estructura.value": Math.min(max, current + 1) });
      return ui.notifications.info(`${this.item.name}: +1 Estructura.`);
    }
    if (action === "accelerate" || action === "maneuver") {
      const bonus = Number(this.item.system.maniobrabilidad ?? 0);
      const roll = await new Roll(`1d6 + ${bonus}`).evaluate({ async: true });
      const label = action === "accelerate" ? "Acelerar" : "Maniobra";
      return roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.item.actor }), flavor: `${this.item.name} · ${label}` });
    }
  }

  #pct(value, max) {
    value = Number(value) || 0;
    max = Number(max) || 1;
    return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  }

  #resourceTone(value, max) {
    value = Number(value) || 0;
    max = Number(max) || 1;
    const ratio = value / max;
    if (ratio <= 0.33) return "danger";
    if (ratio <= 0.66) return "warning";
    return "good";
  }
}
