/**
 * Hoja de Comunidad (cap. 7) en ApplicationV2: Moral, Población y Recursos, Mesa presidencial, sucesos D66.
 * Es la primera hoja del sistema fuera de ApplicationV1.
 */
import { ActorSheetV2, HandlebarsApplicationMixin, Dialog } from "../compat/applications.mjs";
import { ConMemoriaV2 } from "../compat/memoria.mjs";
import { abrirAccesibilidad } from "../ui/accesibilidad.mjs";
import { CAMC } from "../config.mjs";
import { generateRandomCommunity } from "../generator/camc-generators.mjs";
import * as C from "../rules/comunidad.mjs";
import { cambiarPunto, tirarSucesoComunidad, anotarAcontecimiento } from "./comunidad.mjs";

const ICONOS = { moral: "fa-fire-flame-curved", poblacion: "fa-people-group", recursos: "fa-boxes-stacked" };
const ETIQUETAS = { moral: "Moral", poblacion: "Población", recursos: "Recursos" };
const CARGOS_MESA = [
  ["presidente", "Presidente"], ["vicepresidente", "Vicepresidente"], ["secretario", "Secretario"], ["tesorero", "Tesorero"],
  ["sargento_armas", "Sargento de armas"], ["capitan_rutas", "Capitán de rutas"], ["mecanico_jefe", "Mecánico jefe"]
];
const PESTANAS = [
  { id: "resumen", label: "Resumen", icono: "fa-gauge-high" },
  { id: "mesa", label: "Mesa presidencial", icono: "fa-users" },
  { id: "sucesos", label: "Sucesos", icono: "fa-dice-d6" },
  { id: "inventario", label: "Inventario y notas", icono: "fa-boxes-stacked" }
];

export class CAMCCommunitySheet extends ConMemoriaV2(HandlebarsApplicationMixin(ActorSheetV2)) {
  static DEFAULT_OPTIONS = {
    classes: ["camc", "sheet", "actor", "comunidad", "camc-community-window"],
    position: { width: 980, height: 760 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      punto: CAMCCommunitySheet.#punto,
      suceso: CAMCCommunitySheet.#suceso,
      reparto: CAMCCommunitySheet.#reparto,
      mesaPJ: CAMCCommunitySheet.#mesaPJ,
      generar: CAMCCommunitySheet.#generar,
      accesibilidad: () => abrirAccesibilidad()
    }
  };

  static TABS = { primary: { tabs: PESTANAS.map(({ id, label }) => ({ id, label })), initial: "resumen" } };
  static PARTS = { cuerpo: { template: `systems/${CAMC.systemId}/templates/actor/community-sheet.hbs` } };

  get title() { return `${this.document.name} - Hoja de Comunidad`; }

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const actor = this.document;
    const s = actor.system;
    const capitulo = s.capitulo_clave || "norte";
    const valores = { moral: s.puntos?.moral ?? 0, poblacion: s.puntos?.poblacion ?? 0, recursos: s.puntos?.recursos ?? 0, castigoMoral: Boolean(s.puntos?.castigoMoral) };
    const pjs = game.actors.filter(a => a.type === "personaje");
    const activa = this.tabGroups.primary ?? "resumen";
    return {
      ...base,
      actor, system: s, config: CAMC,
      pestanas: PESTANAS.map(p => ({ ...p, activa: p.id === activa })),
      capitulos: Object.entries(C.CAPITULOS).map(([key, c]) => ({ key, label: c.label, selected: key === capitulo })),
      capituloActual: C.CAPITULOS[capitulo] ?? C.CAPITULOS.norte,
      esEste: capitulo === "este",
      atributosBono: C.ATRIBUTOS.map(key => ({ key, label: ETIQUETAS[key], selected: s.bono_este === key })),
      puntos: C.ATRIBUTOS.map(key => {
        const max = C.maximo(key, capitulo);
        const value = valores[key];
        return { key, label: ETIQUETAS[key], icon: ICONOS[key], value, max, pips: Array.from({ length: max }, (_, i) => ({ on: i < value })), texto: C.NIVELES[key][Math.min(value, C.NIVELES[key].length - 1)] };
      }),
      efectos: C.efectosVigentes(valores),
      mesa: CARGOS_MESA.map(([key, label]) => ({ key, label, value: s.mesa?.[key] ?? "", pj: pjs.some(a => a.system.biografia?.cargo === key) })),
      acontecimientos: s.acontecimientos ?? []
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const el = this.element;
    el.querySelector(".com-anotar")?.addEventListener("keydown", async ev => {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      const texto = ev.currentTarget.value.trim();
      if (texto) await anotarAcontecimiento(this.document, texto);
    });
    el.querySelector('[name="system.capitulo_clave"]')?.addEventListener("change", ev => this.#cambiarCapitulo(ev.currentTarget.value));
  }

  /** Cambiar de capítulo ajusta el tope de Recursos (4 solo en el Oeste). */
  async #cambiarCapitulo(clave) {
    const recursos = Math.min(this.document.system.puntos?.recursos ?? 0, C.maximo("recursos", clave));
    await this.document.update({ "system.capitulo_clave": clave, "system.puntos.recursos": recursos });
  }

  static async #punto(_ev, target) { await cambiarPunto(this.document, target.dataset.attr, Number(target.dataset.delta)); }
  static async #suceso() { await tirarSucesoComunidad(this.document); }

  static async #reparto() {
    const actor = this.document;
    const clave = actor.system.capitulo_clave || "norte";
    const p = actor.system.puntos ?? {};
    const campo = key => `<label><span>${ETIQUETAS[key]}</span><input name="${key}" type="number" min="1" max="${C.maximo(key, clave)}" value="${p[key] ?? 2}"/></label>`;
    const html = await new Promise(resolve => new Dialog({
      title: "Reparto inicial de la comunidad",
      content: `<form class="camc-dialog"><p>Seis puntos entre Moral, Población y Recursos, con al menos uno en cada atributo: 1-2-3, 2-2-2 o 1-1-4 (el 4 en Población; en el Capítulo Oeste también en Recursos). La capacidad especial del capítulo se suma aparte.</p><div class="camc-dialog-grid">${campo("moral")}${campo("poblacion")}${campo("recursos")}</div></form>`,
      buttons: { ok: { label: "Aplicar", callback: h => resolve(h) }, cancel: { label: "Cancelar", callback: () => resolve(null) } },
      default: "ok",
      close: () => resolve(null)
    }, { width: 480 }).render(true));
    if (!html) return;
    const v = Object.fromEntries(C.ATRIBUTOS.map(k => [k, Number(html.find(`[name="${k}"]`).val())]));
    if (!C.repartoComunidadValido(v, clave)) return ui.notifications.warn("El reparto no es válido: deben sumar 6, mínimo 1 en cada uno y sin pasar del máximo.");
    const bono = C.CAPITULOS[clave]?.bono;
    const extra = bono === "elegir" ? { [actor.system.bono_este]: 1 } : (bono ?? {});
    const final = Object.fromEntries(C.ATRIBUTOS.map(k => [k, Math.min(C.maximo(k, clave), v[k] + (extra[k] ?? 0))]));
    await actor.update({ "system.puntos.moral": final.moral, "system.puntos.poblacion": final.poblacion, "system.puntos.recursos": final.recursos, "system.puntos.castigoMoral": false });
    ui.notifications.info(`Reparto aplicado${Object.keys(extra).length ? " con la capacidad especial del capítulo" : ""}.`);
  }

  static async #mesaPJ() {
    const cambios = {};
    for (const pj of game.actors.filter(a => a.type === "personaje")) {
      const cargo = pj.system.biografia?.cargo;
      if (CARGOS_MESA.some(([k]) => k === cargo)) cambios[`system.mesa.${cargo}`] = pj.name;
    }
    if (!Object.keys(cambios).length) return ui.notifications.info("Ningún PJ tiene un cargo de la Mesa presidencial.");
    await this.document.update(cambios);
  }

  static async #generar() {
    const actor = this.document;
    const ok = await Dialog.confirm({ title: "Generar comunidad", content: "<p>Esto reemplazará los datos principales de esta comunidad. ¿Continuar?</p>" });
    if (!ok) return;
    try {
      const data = generateRandomCommunity({ seed: `${actor.id}-${Date.now()}`, img: actor.img });
      data.img = actor.img || data.img;
      delete data.type;
      await actor.update(data);
      ui.notifications.info(`${actor.name} generada.`);
    } catch (err) {
      console.error("CAMC | Error generando comunidad", err);
      ui.notifications.error("No se pudo generar la comunidad. Revisa la consola.");
    }
  }
}
