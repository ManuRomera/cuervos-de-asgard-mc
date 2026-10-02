/**
 * Accesibilidad de lectura (ajuste de cliente): tamaño del texto, mayor contraste, lectura fácil y menos
 * movimiento. Se aplica con clases en <body>; las hojas llevan un botón con el icono de accesibilidad en la cabecera.
 */
import { Dialog } from "../compat/applications.mjs";
import { CAMC } from "../config.mjs";

import { TAMANOS, DEFECTO, clasesDe } from "./clases.mjs";

export function ajustes() {
  try { return { ...DEFECTO, ...(game.settings.get(CAMC.systemId, "accesibilidad") ?? {}) }; }
  catch { return { ...DEFECTO }; }
}

export function aplicar(a = ajustes()) {
  const todas = ["camc-acc-t115", "camc-acc-t130", "camc-acc-t150", "camc-acc-contraste", "camc-acc-facil", "camc-acc-quieto"];
  document.body.classList.remove(...todas);
  document.body.classList.add(...clasesDe(a));
}

export function registrarAccesibilidad() {
  game.settings.register(CAMC.systemId, "accesibilidad", {
    name: "CAMC.Settings.Accesibilidad.Name", scope: "client", config: false, type: Object, default: DEFECTO,
    onChange: valor => aplicar({ ...DEFECTO, ...valor })
  });
  game.settings.registerMenu(CAMC.systemId, "accesibilidadMenu", {
    name: "CAMC.Settings.Accesibilidad.Name",
    label: "CAMC.Settings.Accesibilidad.Boton",
    hint: "CAMC.Settings.Accesibilidad.Hint",
    icon: "fas fa-universal-access",
    type: class extends foundry.appv1.api.FormApplication {
      constructor(...args) { super(...args); abrirAccesibilidad(); }
      render() { return this; }
    },
    restricted: false
  });
  Hooks.once("ready", () => aplicar());
}

/** Diálogo de accesibilidad: los cambios se ven al instante y se guardan al aceptar. */
export function abrirAccesibilidad() {
  const actual = ajustes();
  const radio = t => `<label class="camc-checkline"><input type="radio" name="tamano" value="${t}" ${Number(actual.tamano) === t ? "checked" : ""}/> ${t} %</label>`;
  const casilla = (n, txt) => `<label class="camc-checkline"><input type="checkbox" name="${n}" ${actual[n] ? "checked" : ""}/> ${txt}</label>`;
  const leer = html => ({
    tamano: Number(html.find('[name="tamano"]:checked').val() ?? 100),
    contraste: html.find('[name="contraste"]').is(":checked"),
    facil: html.find('[name="facil"]').is(":checked"),
    quieto: html.find('[name="quieto"]').is(":checked")
  });
  return new Dialog({
    title: game.i18n.localize("CAMC.Settings.Accesibilidad.Name"),
    content: `<form class="camc-dialog camc-acc-form">
      <fieldset><legend>Tamaño del texto de las hojas</legend><div class="camc-checkline-group">${TAMANOS.map(radio).join("")}</div></fieldset>
      ${casilla("contraste", "Mayor contraste (texto más claro, bordes más marcados)")}
      ${casilla("facil", "Lectura fácil (sin mayúsculas forzadas ni letras espaciadas)")}
      ${casilla("quieto", "Reducir animaciones y transiciones")}
      <p class="notes">Es un ajuste de este navegador: no afecta a los demás jugadores.</p>
    </form>`,
    buttons: {
      ok: { icon: '<i class="fas fa-check"></i>', label: "Guardar", callback: html => game.settings.set(CAMC.systemId, "accesibilidad", leer(html)) },
      reset: { icon: '<i class="fas fa-rotate-left"></i>', label: "Restablecer", callback: () => game.settings.set(CAMC.systemId, "accesibilidad", DEFECTO) }
    },
    default: "ok",
    render: html => html.find("input").on("change", () => aplicar(leer(html))),
    close: () => aplicar()
  }, { width: 420 }).render(true);
}

/** Botón de cabecera para las hojas V1 (icono de accesibilidad). */
export const botonAccesibilidad = () => ({
  label: "",
  class: "camc-accesibilidad",
  icon: "fas fa-universal-access",
  onclick: () => abrirAccesibilidad()
});
