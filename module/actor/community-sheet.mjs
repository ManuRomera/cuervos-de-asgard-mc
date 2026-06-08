import { CAMC } from "../config.mjs";
import { generateRandomCommunity } from "../generator/camc-generators.mjs";

const get = foundry.utils.getProperty;
const ActorSheetV1 = foundry.appv1.sheets.ActorSheet;

export class CAMCCommunitySheet extends ActorSheetV1 {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["camc", "sheet", "actor", "comunidad", "camc-community-window"],
      template: `systems/${CAMC.systemId}/templates/actor/community-sheet.hbs`,
      width: 1050,
      height: 760,
      resizable: true,
      scrollY: [".camc-body", ".camc-scroll"],
      tabs: [{ navSelector: ".camc-tabs", contentSelector: ".camc-body", initial: "resumen" }]
    });
  }

  get title() { return `${this.actor.name} - Hoja de Comunidad`; }

  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();
    if (this.isEditable) {
      buttons.unshift({
        label: "Generar",
        class: "camc-generate-community",
        icon: "fas fa-dice",
        onclick: () => this.#generateCommunity()
      });
    }
    return buttons;
  }

  async getData(options = {}) {
    const context = await super.getData(options);
    const s = this.actor.system;
    const resourceMap = [
      ["comida", "Comida", "fa-wheat-awn"],
      ["agua", "Agua", "fa-droplet"],
      ["combustible", "Combustible", "fa-gas-pump"],
      ["medicina", "Medicina", "fa-kit-medical"],
      ["municion", "Munición", "fa-bullseye"],
      ["repuestos", "Repuestos", "fa-gear"]
    ];
    const recursos = resourceMap.map(([key, label, icon]) => {
      const value = Number(s.recursos?.[key] ?? 0);
      return { key, label, icon, value, pct: this.#pct(value, 10), estado: this.#estado(value), tone: this.#tone(value) };
    });
    const rep = Number(s.reputacion?.value ?? 0);
    context.config = CAMC;
    context.system = s;
    context.recursos = recursos;
    context.reputacionPct = this.#pct(rep, 10);
    context.reputacionEstado = rep >= 8 ? "Legendaria" : rep >= 5 ? "Fuerte" : rep >= 3 ? "Respetada" : "Frágil";
    context.riesgo = this.#riesgo(recursos, s);
    context.populationTier = this.#populationTier(Number(s.poblacion ?? 0));
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".camc-adjust").on("click", ev => this.#adjustNumber(ev));
    html.find(".community-generate").on("click", ev => {
      ev.preventDefault();
      this.#generateCommunity();
    });
    html.find(".community-img-button").on("click", ev => this.#changeImage(ev));
  }

  async #adjustNumber(event) {
    event.preventDefault();
    const path = event.currentTarget.dataset.path;
    const delta = Number(event.currentTarget.dataset.delta ?? 0);
    if (!path || !delta) return;
    const current = Number(get(this.actor, path) ?? 0);
    await this.actor.update({ [path]: Math.max(0, Math.min(10, current + delta)) });
  }

  #pct(value, max) {
    value = Number(value) || 0;
    max = Number(max) || 1;
    return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  }

  #estado(value) {
    if (value <= 2) return "Crítico";
    if (value <= 4) return "Escaso";
    if (value <= 7) return "Suficiente";
    return "Abundante";
  }

  #tone(value) {
    if (value <= 2) return "danger";
    if (value <= 4) return "warning";
    if (value <= 7) return "cyan";
    return "good";
  }

  #riesgo(recursos, s) {
    const critical = recursos.filter(r => r.value <= 2).length;
    const threats = String(s.amenazas ?? "").trim().length > 0;
    if (critical >= 2 || (critical >= 1 && threats)) return { label: "Riesgo alto", tone: "danger", text: "Recursos críticos y amenazas activas." };
    if (critical >= 1 || threats) return { label: "Riesgo moderado", tone: "warning", text: "La comunidad necesita atención." };
    return { label: "Situación estable", tone: "good", text: "Los recursos básicos sostienen el capítulo." };
  }

  #populationTier(value) {
    if (value >= 150) return "Enclave mayor";
    if (value >= 80) return "Asentamiento fuerte";
    if (value >= 35) return "Comunidad viable";
    if (value > 0) return "Refugio pequeño";
    return "Sin censo";
  }

  async #generateCommunity() {
    const ok = window.confirm("Esto reemplazará los datos principales de esta comunidad. ¿Continuar?");
    if (!ok) return;
    try {
      const data = generateRandomCommunity({ seed: `${this.actor.id}-${Date.now()}`, img: this.actor.img });
      data.img = this.actor.img || data.img;
      delete data.type;
      delete data.items;
      await this.actor.update(data);
      ui.notifications.info(`${this.actor.name} generada.`);
      this.render(false);
    } catch (err) {
      console.error("CAMC | Error generando comunidad", err);
      ui.notifications.error("No se pudo generar la comunidad. Revisa la consola.");
    }
  }

  async #changeImage(event) {
    event.preventDefault();
    const fp = new FilePicker({
      type: "image",
      current: this.actor.img,
      callback: path => this.actor.update({ img: path })
    });
    return fp.browse();
  }
}
