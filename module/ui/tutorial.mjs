/**
 * Acceso al tutorial: se ofrece la primera vez que cada usuario entra en un mundo con el sistema, y queda a mano
 * en la pestaña de Actores y en los ajustes.
 */
import { Dialog } from "../compat/applications.mjs";
import { CAMC } from "../config.mjs";
import { NOMBRE_TUTORIAL } from "../content/tutorial.mjs";

export function registrarTutorial() {
  game.settings.register(CAMC.systemId, "tutorialOfrecido", { scope: "client", config: false, type: Boolean, default: false });
  game.settings.registerMenu(CAMC.systemId, "tutorialMenu", {
    name: "CAMC.Settings.Tutorial.Name",
    label: "CAMC.Settings.Tutorial.Boton",
    hint: "CAMC.Settings.Tutorial.Hint",
    icon: "fas fa-graduation-cap",
    type: class extends foundry.appv1.api.FormApplication {
      constructor(...args) { super(...args); abrirTutorial(); }
      render() { return this; }
    },
    restricted: false
  });
}

/** Abre el tutorial: la copia del mundo si el usuario puede verla y, si no, la del compendio. */
export async function abrirTutorial() {
  const delMundo = game.journal?.getName(NOMBRE_TUTORIAL);
  if (delMundo?.testUserPermission(game.user, "OBSERVER")) return delMundo.sheet.render(true);
  const pack = game.packs.get(`${CAMC.systemId}.manual-camc`);
  const indice = await pack?.getIndex();
  const entrada = indice?.find(e => e.name === NOMBRE_TUTORIAL);
  if (!entrada) return ui.notifications.warn("No se encuentra el tutorial en el compendio «CAMC · Reglas y guía».");
  const doc = await pack.getDocument(entrada._id);
  return doc?.sheet.render(true);
}

/** Pregunta, una sola vez por usuario y navegador, si quiere hacer el tutorial. */
export function ofrecerTutorial() {
  if (game.settings.get(CAMC.systemId, "tutorialOfrecido")) return;
  const marcar = () => game.settings.set(CAMC.systemId, "tutorialOfrecido", true);
  new Dialog({
    title: "Cuervos de Asgard MC · Tutorial",
    content: `<div class="camc-dialog"><p><strong>¿Es la primera vez que usas este sistema?</strong></p>
      <p>El tutorial explica en doce capítulos cortos cómo crear personajes, tirar, combatir, ir en moto, llevar la comunidad y cerrar sesiones, con ejercicios para probar cada cosa.</p>
      <p class="notes">Siempre podrás abrirlo desde el botón <strong>Tutorial</strong> de la pestaña de Actores o desde los ajustes del sistema.</p></div>`,
    buttons: {
      empezar: { icon: '<i class="fas fa-graduation-cap"></i>', label: "Empezar el tutorial", callback: () => { marcar(); abrirTutorial(); } },
      luego: { icon: '<i class="fas fa-clock"></i>', label: "Ahora no" },
      nunca: { icon: '<i class="fas fa-xmark"></i>', label: "No volver a preguntar", callback: marcar }
    },
    default: "empezar"
  }, { width: 460 }).render(true);
}
