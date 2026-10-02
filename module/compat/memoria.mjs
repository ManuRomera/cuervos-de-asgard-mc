/**
 * Memoria de ventanas para las hojas (Application V1): cada ventana recuerda, por usuario y mundo,
 * su posición, su tamaño y la pestaña activa. Una hoja nueva hereda el último tamaño usado por su clase.
 * Vive en localStorage: es una preferencia de este navegador, no un dato del mundo.
 */
const PREFIJO = "cuervos-de-asgard-mc.ventana.";
const CAMPOS = ["left", "top", "width", "height"];

const clave = id => `${PREFIJO}${globalThis.game?.world?.id}.${globalThis.game?.user?.id}.${id}`;

export function leer(id) {
  try { return JSON.parse(localStorage.getItem(clave(id))) ?? {}; } catch { return {}; }
}

function escribir(id, cambios) {
  try { localStorage.setItem(clave(id), JSON.stringify({ ...leer(id), ...cambios })); }
  catch (error) { console.warn("CAMC | No se pudo guardar la posición de la ventana", error); }
}

export function olvidarVentanas() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIJO)) localStorage.removeItem(k);
  }
}

const numericos = (pos, campos = CAMPOS) =>
  Object.fromEntries(campos.filter(c => Number.isFinite(pos?.[c])).map(c => [c, Math.round(pos[c])]));

import { botonAccesibilidad } from "../ui/accesibilidad.mjs";

export function ConMemoria(Base) {
  return class extends Base {
    /** Todas las hojas del sistema llevan el botón de accesibilidad en la cabecera. */
    _getHeaderButtons() {
      const botones = super._getHeaderButtons?.() ?? [];
      botones.unshift(botonAccesibilidad());
      return botones;
    }

    constructor(...args) {
      super(...args);
      try {
        const documento = this.object ?? this.document;
        this._memoriaId = documento?.uuid ?? this.constructor.name;
        const propia = leer(this._memoriaId);
        const heredada = propia.posicion ? {} : numericos(leer(`clase.${this.constructor.name}`).posicion, ["width", "height"]);
        Object.assign(this.position, heredada, numericos(propia.posicion));
        const tabs = this.options?.tabs;
        if (propia.pestana && Array.isArray(tabs) && tabs.length) {
          this.options.tabs = foundry.utils.deepClone(tabs);
          this.options.tabs[0].initial = propia.pestana;
        }
      } catch (error) { console.warn("CAMC | Memoria de ventana desactivada", error); }
    }

    setPosition(position = {}) {
      const resultado = super.setPosition(position);
      if (this._memoriaId && this.rendered) {
        clearTimeout(this._memoriaTemporizador);
        this._memoriaTemporizador = setTimeout(() => this.#guardar(), 300);
      }
      return resultado;
    }

    #guardar() {
      if (this._minimized || !this.rendered) return;
      const pos = numericos(this.position);
      escribir(this._memoriaId, { posicion: pos });
      escribir(`clase.${this.constructor.name}`, { posicion: numericos(this.position, ["width", "height"]) });
    }

    _onChangeTab(event, tabs, active) {
      super._onChangeTab?.(event, tabs, active);
      if (this._memoriaId) escribir(this._memoriaId, { pestana: active });
    }
  };
}

/**
 * Memoria de ventana para ApplicationV2: posición, tamaño y pestaña por usuario y mundo, y el botón de
 * accesibilidad en la cabecera. Misma clave de almacenamiento que la versión V1.
 */
export function ConMemoriaV2(Base) {
  return class extends Base {
    constructor(options = {}) {
      const id = options.document?.uuid ?? new.target.name;
      const propia = leer(id);
      const heredada = propia.posicion ? {} : numericos(leer(`clase.${new.target.name}`).posicion, ["width", "height"]);
      super({ ...options, position: { ...options.position, ...heredada, ...numericos(propia.posicion) } });
      this._memoriaId = id;
      if (propia.pestana) this.tabGroups.primary = propia.pestana;
    }

    _onPosition(position) {
      super._onPosition?.(position);
      if (!this.rendered || this.minimized) return;
      clearTimeout(this._memoriaTemporizador);
      this._memoriaTemporizador = setTimeout(() => {
        escribir(this._memoriaId, { posicion: numericos(this.position) });
        escribir(`clase.${this.constructor.name}`, { posicion: numericos(this.position, ["width", "height"]) });
      }, 300);
    }

    changeTab(tab, group, opciones) {
      super.changeTab(tab, group, opciones);
      if (group === "primary") escribir(this._memoriaId, { pestana: tab });
    }

    async _renderFrame(options) {
      const marco = await super._renderFrame(options);
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "header-control fa-solid fa-universal-access icon camc-accesibilidad";
      boton.dataset.action = "accesibilidad";
      boton.dataset.tooltip = "Accesibilidad";
      boton.setAttribute("aria-label", "Accesibilidad");
      marco.querySelector(".window-header")?.insertBefore(boton, marco.querySelector('[data-action="toggleControls"]'));
      return marco;
    }
  };
}
