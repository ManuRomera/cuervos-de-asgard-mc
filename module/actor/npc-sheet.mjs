import { CAMC } from "../config.mjs";
import { YsystemDice } from "../dice/ysystem-dice.mjs";
import { generateRandomNpc } from "../generator/camc-generators.mjs";

const get = foundry.utils.getProperty;
const ActorSheetV1 = foundry.appv1.sheets.ActorSheet;

export class CAMCNpcSheet extends ActorSheetV1 {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["camc", "sheet", "actor", "pnj", "camc-npc-window"],
      template: `systems/${CAMC.systemId}/templates/actor/npc-sheet.hbs`,
      width: 980,
      height: 720,
      resizable: true,
      scrollY: [".camc-body", ".camc-scroll"],
      tabs: [{ navSelector: ".camc-tabs", contentSelector: ".camc-body", initial: "resumen" }],
      dragDrop: [{ dragSelector: ".item", dropSelector: ".camc-sheet" }]
    });
  }

  get title() { return `${this.actor.name} - Hoja de PNJ`; }

  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();
    if (this.isEditable) {
      buttons.unshift({
        label: "Generar PNJ",
        class: "camc-generate-npc",
        icon: "fas fa-dice",
        onclick: () => this.#generateNpc()
      });
    }
    return buttons;
  }

  async getData(options = {}) {
    const context = await super.getData(options);
    const actor = this.actor;
    const system = actor.system;
    const salud = system.combate?.salud ?? { value: 0, max: 1 };
    context.config = CAMC;
    context.system = system;
    context.attrCards = Object.entries(CAMC.atributos).map(([key, cfg]) => ({ key, short: cfg.short, label: cfg.label, value: Number(system.atributos?.[key]?.value ?? 0) }));
    context.derivedCards = [
      { key: "agilidad", label: "Agilidad", icon: "fa-person-running", value: system.valores_pasivos?.agilidad ?? 0 },
      { key: "evasion", label: "Evasión", icon: "fa-shield-halved", value: system.valores_pasivos?.evasion ?? 0 },
      { key: "aplomo", label: "Aplomo", icon: "fa-heart-pulse", value: system.valores_pasivos?.aplomo ?? 0 },
      { key: "perspicacia", label: "Perspicacia", icon: "fa-eye", value: system.valores_pasivos?.perspicacia ?? 0 }
    ];
    context.habilidadesClave = Object.entries(system.habilidades_clave ?? {}).map(([key, value]) => {
      const atributo = value.atributo ?? CAMC.habilidades[key]?.atributo ?? "int";
      return { key, value: Number(value.value ?? 1), atributo, atributoShort: CAMC.atributos[atributo]?.short ?? atributo.toUpperCase(), label: CAMC.habilidades[key]?.label ?? key };
    });
    context.saludPct = this.#pct(salud.value, salud.max);
    context.saludTone = this.#resourceTone(salud.value, salud.max);
    context.itemsByType = {
      armas: actor.items.filter(i => i.type === "arma"),
      protecciones: actor.items.filter(i => ["armadura", "escudo"].includes(i.type)),
      dones: actor.items.filter(i => i.type === "don"),
      objetos: actor.items.filter(i => i.type === "objeto")
    };
    context.armaduraTotal = Number(system.proteccion?.armadura_nivel ?? 0) + Number(system.proteccion?.escudo_nivel ?? 0);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".roll-skill").on("click", ev => YsystemDice.rollSkill(this.actor, ev.currentTarget.dataset.skill));
    html.find(".roll-initiative").on("click", () => YsystemDice.rollInitiative(this.actor));
    html.find(".roll-resistance").on("click", () => YsystemDice.rollResistance(this.actor));
    html.find(".item-primary-action").on("click", ev => this.#itemPrimaryAction(ev));
    html.find(".item-edit").on("click", ev => this.#getItem(ev)?.sheet.render(true));
    html.find(".item-roll-damage").on("click", ev => this.#rollDamage(ev));
    html.find(".item-equip").on("click", ev => this.#toggleEquip(ev));
    html.find(".camc-adjust").on("click", ev => this.#adjustNumber(ev));
  }

  #getItem(event) {
    const li = event.currentTarget.closest("[data-item-id]");
    return this.actor.items.get(li?.dataset.itemId);
  }

  async #rollDamage(event) {
    event.preventDefault();
    const item = this.#getItem(event);
    if (!item) return;
    if (item.tieneMunicion?.()) {
      const ok = await item.consumirMunicion(1);
      if (!ok) return ui.notifications.warn(`${item.name}: sin munición.`);
    }
    await YsystemDice.rollDamage(this.actor, item);
  }

  async #itemPrimaryAction(event) {
    event.preventDefault();
    const item = this.#getItem(event);
    if (!item) return;
    if (item.type === "arma") return this.#rollWeaponAttack(event);
    return item.sheet.render(true);
  }

  async #rollWeaponAttack(event) {
    event.preventDefault();
    const item = this.#getItem(event);
    if (!item || item.type !== "arma") return;
    const tipo = String(item.system?.tipo ?? item.system?.categoria ?? item.system?.alcance ?? "").toLowerCase();
    const habilidad = item.system?.habilidad_ataque || (tipo.includes("distancia") || tipo.includes("fuego") || tipo.includes("arroj") ? "punteria" : "lucha");
    await YsystemDice.rollSkill(this.actor, habilidad, { armaPreparada: { id: item.id, name: item.name, label: item.name } });
  }

  async #toggleEquip(event) {
    event.preventDefault();
    const item = this.#getItem(event);
    if (!item) return;
    if (item.type === "armadura") return item.update({ "system.equipada": !item.system.equipada });
    if (item.type === "escudo") return item.update({ "system.equipado": !item.system.equipado });
    if (item.type === "arma") return item.update({ "system.equipada": !item.system.equipada });
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

  async #generateNpc() {
    const ok = window.confirm("Esto reemplazará los datos principales de este PNJ. ¿Continuar?");
    if (!ok) return;
    try {
      const data = generateRandomNpc({ seed: `${this.actor.id}-${Date.now()}` });
      data.img = this.actor.img || data.img;
      delete data.type;
      delete data.items;
      await this.actor.update(data);
      ui.notifications.info(`${this.actor.name} generado.`);
      this.render(false);
    } catch (err) {
      console.error("CAMC | Error generando PNJ", err);
      ui.notifications.error("No se pudo generar el PNJ. Revisa la consola.");
    }
  }

  #pct(value, max) {
    value = Number(value) || 0;
    max = Number(max) || 1;
    return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  }

  #resourceTone(value, max) {
    value = Number(value) || 0;
    if (value <= 0) return "danger";
    if (value <= 3) return "danger";
    if (value <= 6) return "warning";
    if (value <= 10) return "strained";
    return "good";
  }
}
