/**
 * Herramientas del DJ para el ritmo de campaña: «Nueva sesión» y «Fin de aventura».
 * Reinician lo que el manual dice que se renueva por sesión o por aventura (pp. 47, 76-79, 102, 125-127).
 */
import { Dialog } from "../compat/applications.mjs";
import { createRollMessage } from "../compat/chat.mjs";
import { CAMC } from "../config.mjs";
import * as R from "../rules/reglas.mjs";
import { proezasPorMoral } from "../rules/comunidad.mjs";
import { escapeHtml } from "../utils/sheet-utils.mjs";
import { tirarSucesoComunidad } from "../actor/comunidad.mjs";

const personajes = () => game.actors.filter(a => a.type === "personaje");
const comunidades = () => game.actors.filter(a => a.type === "comunidad");

async function mensaje(html) {
  await createRollMessage({ speaker: ChatMessage.getSpeaker(), content: `<div class="camc-chat-card"><header><strong>CAMC</strong></header>${html}</div>` });
}

/** Por defecto se marcan los PJ con jugador; si ninguno lo tiene (mesa de pruebas), todos. */
const filaPJ = (a, _i, todos) => `<label class="camc-checkline"><input name="pj" type="checkbox" value="${a.id}" ${a.hasPlayerOwner || !todos.some(p => p.hasPlayerOwner) ? "checked" : ""}/> ${escapeHtml(a.name)}</label>`;

function elegir({ title, content, ok }) {
  return new Promise(resolve => new Dialog({
    title,
    content,
    buttons: { ok: { label: ok, callback: html => resolve(html) }, cancel: { label: "Cancelar", callback: () => resolve(null) } },
    default: "ok",
    close: () => resolve(null)
  }, { width: 460 }).render(true));
}

/** Nueva sesión: proezas al máximo (con el efecto de la Moral), defecto leve, umbrales de Resistencia y talentos «por sesión». */
export async function nuevaSesion() {
  if (!game.user.isGM) return ui.notifications.warn("Solo el DJ puede empezar una sesión.");
  const pjs = personajes();
  if (!pjs.length) return ui.notifications.info("No hay personajes en el mundo.");
  const coms = comunidades();
  const opcComunidad = [`<option value="">Sin comunidad</option>`, ...coms.map((c, i) => `<option value="${c.id}" ${i === 0 ? "selected" : ""}>${escapeHtml(c.name)} · Moral ${c.system.puntos?.moral ?? 0}</option>`)].join("");
  const html = await elegir({
    title: "Nueva sesión",
    ok: "Empezar sesión",
    content: `<form class="camc-dialog">
      <p>Cada PJ empieza la sesión con sus proezas iniciales (las sobrantes se pierden), recupera el defecto leve y los talentos «una vez por sesión», y se reinician los umbrales de Resistencia Física.</p>
      <div class="camc-checkline-group">${pjs.map(filaPJ).join("")}</div>
      <label><span>Comunidad (su Moral ajusta las proezas)</span><select name="comunidad">${opcComunidad}</select></label>
    </form>`
  });
  if (!html) return;
  const comunidad = game.actors.get(html.find('[name="comunidad"]').val());
  const ajuste = comunidad ? proezasPorMoral({ moral: comunidad.system.puntos?.moral ?? 0, castigoMoral: comunidad.system.puntos?.castigoMoral }) : 0;
  const ids = html.find('[name="pj"]:checked').map((_, i) => i.value).get();
  const lineas = [];
  for (const id of ids) {
    const pj = game.actors.get(id);
    if (!pj) continue;
    const proezas = Math.max(0, pj.proezasMaximas() + ajuste);
    await pj.update({ "system.combate.proezas.value": proezas, "system.biografia.defecto_leve_usado": false });
    await pj.unsetFlag(CAMC.systemId, "umbralesRF");
    const porSesion = pj.items.filter(i => i.type === "talento" && i.system.uso === "sesion" && Number(i.system.usos?.value) > 0);
    if (porSesion.length) await pj.updateEmbeddedDocuments("Item", porSesion.map(i => ({ _id: i.id, "system.usos.value": 0 })));
    lineas.push(`<li><strong>${escapeHtml(pj.name)}</strong>: ${proezas} proezas</li>`);
  }
  await mensaje(`<h3>Nueva sesión</h3><ul>${lineas.join("")}</ul>${ajuste ? `<p><small>Moral de ${escapeHtml(comunidad.name)}: ${ajuste > 0 ? "+" : "−"}1 proeza a cada PJ.</small></p>` : ""}`);
}

/** Objetos Reciclados (R) que un PJ lleva consigo: los que pueden averiarse al acabar la aventura (p. 102). */
export const objetosReciclados = actor => actor.items.filter(i => ["objeto", "arma", "armadura", "escudo"].includes(i.type)
  && i.system?.deterioro === "R" && i.system?.tipo !== "modificacion_moto" && i.system?.carga?.ubicacion !== "comunidad");

/** Fin de aventura: Recuerdo cuando…, talentos «por aventura», Experiencia, caducidad y suceso de comunidad. */
export async function finDeAventura() {
  if (!game.user.isGM) return ui.notifications.warn("Solo el DJ puede cerrar una aventura.");
  const pjs = personajes();
  const coms = comunidades();
  const opcComunidad = [`<option value="">No tirar</option>`, ...coms.map((c, i) => `<option value="${c.id}" ${i === 0 ? "selected" : ""}>${escapeHtml(c.name)}</option>`)].join("");
  const filasObjetos = pjs.flatMap(pj => objetosReciclados(pj).map(i =>
    `<label class="camc-checkline"><input name="rec" type="checkbox" value="${pj.id}|${i.id}" ${i.system.equipada ? "checked" : ""}/> ${escapeHtml(pj.name)}: ${escapeHtml(i.name)}</label>`)).join("") || "<p><em>Ningún PJ lleva objetos reciclados.</em></p>";
  const html = await elegir({
    title: "Fin de aventura",
    ok: "Cerrar aventura",
    content: `<form class="camc-dialog">
      <div class="camc-checkline-group">${pjs.map(filaPJ).join("")}</div>
      <label><span>Experiencia por PJ (1 a 3 por objetivo; más por Motivación y Virtud)</span><input name="xp" type="number" min="0" value="0"/></label>
      <label class="camc-checkline"><input name="reiniciar" type="checkbox" checked/> Reiniciar Recuerdo cuando… y talentos «una vez por aventura»</label>
      <fieldset><legend>Tiradas de caducidad (1D por cada objeto reciclado usado)</legend>${filasObjetos}
        <label class="camc-checkline"><input name="repetirCaducidad" type="checkbox"/> Recursos 3: repetir las tiradas (se queda el nuevo resultado)</label></fieldset>
      <label><span>Suceso de comunidad (D66)</span><select name="comunidad">${opcComunidad}</select></label>
    </form>`
  });
  if (!html) return;
  const ids = html.find('[name="pj"]:checked').map((_, i) => i.value).get();
  const xp = Math.max(0, Number(html.find('[name="xp"]').val()) || 0);
  const lineas = [];
  for (const id of ids) {
    const pj = game.actors.get(id);
    if (!pj) continue;
    const cambios = {};
    if (xp) cambios["system.experiencia.total"] = Number(pj.system.experiencia?.total ?? 0) + xp;
    if (html.find('[name="reiniciar"]').is(":checked")) {
      cambios["system.biografia.recuerdo_cuando_usos"] = 0;
      cambios["system.biografia.recuerdo_cuando_usado"] = false;
      const porAventura = pj.items.filter(i => i.type === "talento" && i.system.uso === "aventura" && Number(i.system.usos?.value) > 0);
      if (porAventura.length) await pj.updateEmbeddedDocuments("Item", porAventura.map(i => ({ _id: i.id, "system.usos.value": 0 })));
    }
    if (Object.keys(cambios).length) await pj.update(cambios);
    const hecho = [xp ? `+${xp} PX (total ${pj.system.experiencia.total})` : "", html.find('[name="reiniciar"]').is(":checked") ? "Recuerdo cuando… y talentos de aventura reiniciados" : ""].filter(Boolean);
    if (hecho.length) lineas.push(`<li><strong>${escapeHtml(pj.name)}</strong>: ${hecho.join("; ")}</li>`);
  }
  const filas = [];
  for (const par of html.find('[name="rec"]:checked').map((_, i) => i.value).get()) {
    const [actorId, itemId] = par.split("|");
    const item = game.actors.get(actorId)?.items.get(itemId);
    if (!item) continue;
    filas.push(await tirarCaducidad(item, { repetir: html.find('[name="repetirCaducidad"]').is(":checked") }));
  }
  if (filas.length) lineas.push(`<li><strong>Caducidad</strong><ul>${filas.join("")}</ul></li>`);
  await mensaje(`<h3>Fin de aventura</h3><ul>${lineas.join("") || "<li>Sin cambios.</li>"}</ul>`);
  const comunidad = game.actors.get(html.find('[name="comunidad"]').val());
  if (comunidad) await tirarSucesoComunidad(comunidad);
}

/** Tirada de caducidad de un objeto reciclado; deja el estado anotado en el objeto. */
export async function tirarCaducidad(item, { repetir = false } = {}) {
  let roll = await (new Roll("1d6")).evaluate();
  let d6 = roll.total;
  let nota = "";
  if (repetir) {
    const segunda = await (new Roll("1d6")).evaluate();
    nota = ` (repetida: ${d6} → ${segunda.total})`;
    roll = segunda; d6 = segunda.total;
  }
  const r = R.caducidad(d6);
  await item.setFlag(CAMC.systemId, "estado", r.estado === "funciona" ? null : { estado: r.estado, dificultad: r.dificultad ?? null, intentos: r.intentos ?? 0 });
  return `<li>${escapeHtml(item.parent?.name ?? "")} · <strong>${escapeHtml(item.name)}</strong>: ${d6}${nota} — ${r.texto}</li>`;
}
