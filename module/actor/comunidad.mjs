/**
 * Comunidad de supervivientes (cap. 7): cambios de Moral, Población y Recursos con sus efectos en cascada,
 * y la tabla de sucesos de la comunidad (D66) con su tirada de salvación.
 */
import { createRollMessage } from "../compat/chat.mjs";
import { CAMC } from "../config.mjs";
import * as C from "../rules/comunidad.mjs";
import { escapeHtml } from "../utils/sheet-utils.mjs";

const ETIQUETA = { moral: "Moral", poblacion: "Población", recursos: "Recursos" };
const CARGOS = { presidente: "Presidente", vicepresidente: "Vicepresidente", secretario: "Secretario", tesorero: "Tesorero", sargento_armas: "Sargento de armas", capitan_rutas: "Capitán de rutas", mecanico_jefe: "Mecánico jefe" };

const pjs = () => game.actors.filter(a => a.type === "personaje");

async function tarjeta(html, extra = {}) {
  return createRollMessage({ speaker: ChatMessage.getSpeaker(), content: `<div class="camc-chat-card comunidad"><header><strong>Comunidad</strong></header>${html}</div>`, ...extra });
}

/** Cambia un punto de la comunidad y aplica lo que dice el manual: Población, XP para todos, castigos. */
export async function cambiarPunto(actor, atributo, delta, { motivo = "" } = {}) {
  const p = actor.system.puntos ?? {};
  const capitulo = actor.system.capitulo_clave;
  const { estado, efectos } = C.cambiarAtributo({ moral: p.moral ?? 0, poblacion: p.poblacion ?? 0, recursos: p.recursos ?? 0, castigoMoral: Boolean(p.castigoMoral) }, atributo, delta, capitulo);
  const cambios = { "system.puntos.moral": estado.moral, "system.puntos.poblacion": estado.poblacion, "system.puntos.recursos": estado.recursos };
  if (atributo === "moral") cambios["system.puntos.castigoMoral"] = Boolean(estado.castigoMoral);
  await actor.update(cambios);
  if (efectos.xpParaTodos) {
    for (const pj of pjs()) await pj.update({ "system.experiencia.total": Number(pj.system.experiencia?.total ?? 0) + efectos.xpParaTodos });
  }
  const antes = p[atributo] ?? 0;
  const lineas = [`<p><strong>${escapeHtml(actor.name)}</strong>: ${ETIQUETA[atributo]} ${antes} → ${estado[atributo]}${motivo ? ` · ${escapeHtml(motivo)}` : ""}</p>`];
  if (efectos.poblacion) lineas.push(`<p>Población ${p.poblacion ?? 0} → ${estado.poblacion}</p>`);
  for (const nota of efectos.notas) lineas.push(`<p><em>${escapeHtml(nota)}</em></p>`);
  await tarjeta(lineas.join(""));
  return { estado, efectos };
}

/** Anota un acontecimiento en el diario de la comunidad. */
export async function anotarAcontecimiento(actor, texto) {
  const lista = foundry.utils.deepClone(actor.system.acontecimientos ?? []);
  lista.unshift({ fecha: new Date().toLocaleDateString("es-ES"), texto });
  await actor.update({ "system.acontecimientos": lista.slice(0, 60) });
}

/** Tira un suceso de la comunidad (D66) y deja la tarjeta con los botones de salvación para el DJ. */
export async function tirarSucesoComunidad(actor) {
  const hechos = (actor.getFlag(CAMC.systemId, "sucesosUnicos") ?? []);
  let roll, clave;
  for (let intento = 0; intento < 20; intento++) {
    roll = await (new Roll("2d6")).evaluate();
    const [a, b] = roll.dice[0].results.map(r => r.result);
    clave = C.d66(a, b);
    if (!C.SUCESOS[clave]) continue;                       // 17-20, 27-30… no existen
    if (C.SUCESOS[clave].unico && hechos.includes(clave)) continue;
    break;
  }
  const suceso = C.SUCESOS[clave];
  if (!suceso) return ui.notifications.warn("No se pudo resolver el suceso de comunidad.");
  if (suceso.unico) await actor.setFlag(CAMC.systemId, "sucesosUnicos", [...hechos, clave]);

  if (suceso.favorable) {
    await tarjeta(`<h3>${escapeHtml(suceso.nombre)} <small>(${clave})</small></h3><p>${escapeHtml(suceso.texto)}</p><p><strong>Suceso favorable.</strong> +1 ${ETIQUETA[suceso.atributo]}.</p>`, { rolls: [roll] });
    await cambiarPunto(actor, suceso.atributo, +suceso.favorable, { motivo: suceso.nombre });
    await anotarAcontecimiento(actor, `${suceso.nombre} (+1 ${ETIQUETA[suceso.atributo]})`);
    return { clave, suceso };
  }

  const d6 = (await (new Roll("1d6")).evaluate()).total;
  let cargo = C.CARGO_POR_D6[d6 - 1];
  const jugadores = pjs();
  const porCargo = k => jugadores.find(a => a.system.biografia?.cargo === k);
  if (cargo === "presidente_o_vicepresidente") cargo = porCargo("presidente") ? "presidente" : porCargo("vicepresidente") ? "vicepresidente" : "presidente";
  const responsable = porCargo(cargo);
  const poblacion4 = (actor.system.puntos?.poblacion ?? 0) >= 4;
  const df = C.dificultadSalvacion(Boolean(responsable) || poblacion4);
  const habilidad = CAMC.habilidades[suceso.habilidad]?.label ?? suceso.habilidad;
  await tarjeta(`
    <h3>${escapeHtml(suceso.nombre)} <small>(${clave})</small></h3>
    <p>${escapeHtml(suceso.texto)}</p>
    <p>En riesgo: <strong>${suceso.riesgo[0]}</strong> ${ETIQUETA[suceso.atributo]} si se falla la salvación, <strong>${suceso.riesgo[1]}</strong> si se supera.</p>
    <p>Responsable (1D = ${d6}): <strong>${CARGOS[cargo]}</strong>${responsable ? ` · ${escapeHtml(responsable.name)}` : " · ningún PJ: tira cualquier PJ"}.
       Salvación de <strong>${habilidad}</strong> a dificultad <strong>${df}</strong>${poblacion4 && !responsable ? " (Población 4: se trata como PJ)" : ""}.</p>
    <div class="camc-chat-actions-row camc-gm-only">
      <button type="button" class="camc-chat-action" data-camc-action="suceso-salvacion"><i class="fas fa-dice-d6"></i> Tirar salvación</button>
      <button type="button" class="camc-chat-action ghost" data-camc-action="suceso-resolver" data-salvado="1">Superada</button>
      <button type="button" class="camc-chat-action ghost" data-camc-action="suceso-resolver" data-salvado="0">Fallada</button>
    </div>`, {
    rolls: [roll],
    flags: { [CAMC.systemId]: { suceso: { comunidad: actor.uuid, clave, cargo, responsable: responsable?.uuid ?? null, df, resuelto: false } } }
  });
  return { clave, suceso };
}

/** Tirada de salvación de un suceso con el PJ responsable (o el que elija el DJ entre los PJ). */
export async function tirarSalvacion(message) {
  const s = message.getFlag(CAMC.systemId, "suceso");
  if (!s || s.resuelto) return ui.notifications.warn("Este suceso ya está resuelto.");
  const suceso = C.SUCESOS[s.clave];
  let actor = s.responsable ? await fromUuid(s.responsable) : null;
  actor ??= canvas?.tokens?.controlled?.[0]?.actor ?? pjs()[0];
  if (!actor) return ui.notifications.warn("No hay ningún PJ para tirar la salvación.");
  const { askRollOptions, pagarCostes } = await import("../dice/roll-dialog.mjs");
  const { YsystemDice } = await import("../dice/ysystem-dice.mjs");
  const options = await askRollOptions(actor, suceso.habilidad, { dificultad: s.df, etiqueta: `Salvación · ${suceso.nombre}` });
  if (!options) return;
  if (!(await pagarCostes(actor, options))) return;
  const r = await YsystemDice.rollSkill(actor, suceso.habilidad, { ...options, etiqueta: `Salvación · ${suceso.nombre}` });
  ui.notifications.info(`Salvación ${r.exito ? "superada" : "fallada"}: pulsa «${r.exito ? "Superada" : "Fallada"}» para aplicar el resultado (puedes gastar una proeza antes).`);
}

/** El DJ aplica el resultado del suceso a la comunidad. */
export async function resolverSuceso(message, salvado) {
  const s = message.getFlag(CAMC.systemId, "suceso");
  if (!s || s.resuelto) return ui.notifications.warn("Este suceso ya está resuelto.");
  const actor = await fromUuid(s.comunidad);
  if (!actor) return ui.notifications.warn("No se encuentra la comunidad.");
  const { suceso, delta } = C.resolverSuceso(s.clave, salvado);
  await message.setFlag(CAMC.systemId, "suceso", { ...s, resuelto: true });
  const raiz = $(message.content);
  raiz.find(".camc-chat-actions-row").remove();
  raiz.append(`<p><em>${salvado ? "Salvación superada" : "Salvación fallada"}: ${delta ? `${delta} ${ETIQUETA[suceso.atributo]}` : "sin pérdida"}.</em></p>`);
  await message.update({ content: raiz.prop("outerHTML") });
  if (delta) await cambiarPunto(actor, suceso.atributo, delta, { motivo: suceso.nombre });
  await anotarAcontecimiento(actor, `${suceso.nombre} (${delta ? `${delta} ${ETIQUETA[suceso.atributo]}` : "salvado"})`);
}
