/**
 * Diálogo de opciones de tirada, compartido por la hoja de Personaje y por las acciones de moto.
 * Traduce lo que marca el jugador a las opciones de YsystemDice.rollSkill (modificadores del
 * manual, cap. 4: cobertura, ráfagas, acciones combinadas, falta de luz, talentos).
 */
import { Dialog } from "../compat/applications.mjs";
import { CAMC } from "../config.mjs";
import { bonoCobertura } from "../rules/reglas.mjs";
import { escapeHtml } from "../utils/sheet-utils.mjs";

/** Habilidades cuya dificultad sube 5 puntos sin luz (p. 73). */
const SIN_LUZ = ["auxilio", "conducir", "entorno", "informacion", "mecanica", "observacion", "punteria", "rastreo", "supervivencia"];
const VOZ = ["psicologia", "seduccion", "subterfugio"];

const stepper = (name, value, min, max) => `<div class="camc-dialog-stepper" data-stepper="${name}" data-min="${min}" data-max="${max}">
  <button type="button" class="camc-dialog-minus" data-delta="-1"><i class="fas fa-minus"></i></button>
  <input name="${name}" type="number" value="${value}" min="${min}" max="${max}"/>
  <button type="button" class="camc-dialog-plus" data-delta="1"><i class="fas fa-plus"></i></button>
</div>`;

function activarSteppers(html) {
  html.find(".camc-dialog-stepper button").on("click", ev => {
    ev.preventDefault();
    const wrapper = ev.currentTarget.closest(".camc-dialog-stepper");
    const input = wrapper?.querySelector("input");
    if (!input) return;
    const min = Number(wrapper.dataset.min ?? -Infinity);
    const max = Number(wrapper.dataset.max ?? Infinity);
    input.value = String(Math.max(min, Math.min(max, Number(input.value || 0) + Number(ev.currentTarget.dataset.delta ?? 0))));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

const check = (name, texto, { marcado = false, desactivado = false } = {}) =>
  `<label class="camc-checkline"><input name="${name}" type="checkbox" ${marcado ? "checked" : ""} ${desactivado ? "disabled" : ""}/> <span>${texto}</span></label>`;

/**
 * @param {Actor} actor
 * @param {string} habilidad
 * @param {object} [config]
 * @param {Item} [config.weapon]       arma con la que se ataca
 * @param {number|null} [config.dificultad]  dificultad preseleccionada
 * @param {string} [config.etiqueta]
 * @returns {Promise<object|null>} opciones para YsystemDice.rollSkill, o null si se cancela
 */
export async function askRollOptions(actor, habilidad, { weapon = null, dificultad = null, etiqueta = "" } = {}) {
  const skillLabel = CAMC.habilidades[habilidad]?.label ?? "Tirada";
  const esAtaque = habilidad === "lucha" || habilidad === "punteria";
  const categoria = weapon?.system?.categoria ?? "";
  const aDistancia = habilidad === "punteria";
  const targetToken = weapon || esAtaque ? Array.from(game.user.targets ?? [])[0] : null;
  const objetivoPasivo = Number(targetToken?.actor?.system?.valores_pasivos?.agilidad ?? NaN);
  const hayObjetivo = esAtaque && Number.isFinite(objetivoPasivo);
  const preseleccion = dificultad ?? (hayObjetivo ? null : 9);
  const opts = [`<option value="">Sin dificultad</option>`].concat(
    CAMC.dificultades.map(d => `<option value="${d.value}" ${d.value === preseleccion ? "selected" : ""}>${d.value} · ${d.label}</option>`)
  ).join("");
  const penalty = actor.getPenalizadorSalud();
  const b = actor.system.biografia ?? {};
  const recuerdoAgotado = actor.type === "personaje" && Number(b.recuerdo_cuando_usos ?? 0) >= Number(b.recuerdo_cuando_max ?? 1);
  const esAuxilio = habilidad === "auxilio";
  const curaToken = esAuxilio ? Array.from(game.user.targets ?? [])[0] : null;
  const curaNombre = curaToken?.name ?? actor.name;
  const proteccion = ["des", "fue"].includes(actor.getAtributoDeHabilidad(habilidad)) ? actor.getPenalizacionProteccion() : 0;
  const esRafagaPosible = categoria === "fuego_mortiferas";
  const voz = actor.tieneTalento?.("voz") && VOZ.includes(habilidad);
  const regateo = actor.tieneTalento?.("regatear") && habilidad === "conversacion";
  const urbanita = actor.tieneTalento?.("urbanita") && habilidad === "supervivencia";

  const content = `
    <form class="camc-dialog camc-roll-options">
      <p class="camc-roll-heading"><strong>${escapeHtml(skillLabel)}</strong>${weapon ? ` <span>· ${escapeHtml(weapon.name)}</span>` : (etiqueta ? ` <span>· ${escapeHtml(etiqueta)}</span>` : "")}</p>
      ${hayObjetivo ? `<p class="camc-target-hint"><i class="fas fa-crosshairs"></i> Objetivo: <strong>${escapeHtml(targetToken.name)}</strong> · Agilidad <strong>${objetivoPasivo}</strong> (ya rellenada abajo, puedes cambiarla).</p>` : ""}
      ${proteccion ? `<p class="camc-target-hint"><i class="fas fa-shield-halved"></i> Armadura y escudo penalizan esta tirada con <strong>−${proteccion}</strong> (se aplica solo).</p>` : ""}
      ${esAuxilio ? `
      <div class="camc-auxilio-mode">
        <label class="camc-defecto-option"><input type="radio" name="auxilioModo" value="normal" checked/> <span><strong>Diagnosticar / tratar</strong><br/><small>Examinar a alguien, recomendar medicamentos, etc. Dificultad normal, sin curación automática.</small></span></label>
        <label class="camc-defecto-option"><input type="radio" name="auxilioModo" value="curar"/> <span><strong>Curar (primeros auxilios)</strong> · a ${escapeHtml(curaNombre)}<br/><small>Dificultad fija 10. Éxito: +2 Salud. Crítico: +4. Pifia: −1. Solo un intento por herida concreta.</small></span></label>
      </div>` : ""}
      <div class="camc-dialog-grid camc-dificultad-row">
        <label><span>Dificultad</span><select name="dificultad">${opts}</select></label>
        <label><span>Dificultad personalizada</span><input name="dificultadManual" type="number" placeholder="Opcional" value="${hayObjetivo ? objetivoPasivo : ""}"/></label>
      </div>
      <div class="camc-dialog-grid">
        <label><span>Modificador fijo</span>${stepper("modificador", 0, -99, 99)}</label>
        <label><span>Dados extra</span>${stepper("dadosExtra", 0, -3, 3)}</label>
        <label><span>Proezas para +1D</span>${stepper("proezaDados", 0, 0, 3)}</label>
        <label><span>${esAtaque ? "Dados sacrificados (apuntar)" : "Dados sacrificados"}</span>${stepper("dadosSacrificados", 0, 0, 3)}</label>
        <label><span>Colaboradores (+2 cada uno)</span>${stepper("colaboradores", 0, 0, 5)}</label>
        ${esAtaque && aDistancia ? `<label><span>Cobertura del objetivo</span><select name="cobertura"><option value="ninguna">Ninguna</option><option value="media">Hasta 50 % del cuerpo (+3)</option><option value="total">Más del 75 % (+6)</option></select></label>` : ""}
        ${esRafagaPosible ? `<label><span>Ráfaga: blancos (+2 DF cada uno)</span>${stepper("rafaga", 0, 0, 5)}</label>` : ""}
      </div>
      <div class="camc-checkline-group">
        ${check("aplicaSalud", `Aplicar penalizador de Salud (${escapeHtml(penalty.label)})`, { marcado: true })}
        ${check("recuerdoCuando", `Recuerdo cuando… (+2D, no compatible con proezas)${recuerdoAgotado ? " · ya usado" : ""}`, { desactivado: recuerdoAgotado })}
        ${weapon ? check("desenfundar", "Desenfundar o cambiar de arma este turno (−1D)") : ""}
        ${esAtaque && !aDistancia ? check("noquear", "Noquear: sacrifica 1D, daño a la mitad y el objetivo tira Resistencia Física con −1D") : ""}
        ${SIN_LUZ.includes(habilidad) ? check("sinLuz", "Sin luz (+5 a la dificultad)") : ""}
        ${voz ? check("voz", "Talento Voz (−3 a la dificultad, expresión verbal)") : ""}
        ${regateo ? check("regateo", "Talento Regatear (−3 si es un intercambio)") : ""}
        ${urbanita ? check("entornoUrbano", "Talento Urbanita: entorno urbano (crítico con un 6)") : ""}
      </div>
      <p class="notes">Alt + clic tira rápido sin abrir este panel. Las proezas se gastan al confirmar.</p>
    </form>`;

  return new Promise(resolve => new Dialog({
    title: "Opciones de tirada",
    content,
    buttons: {
      roll: {
        label: "Tirar",
        callback: html => {
          const val = name => html.find(`[name="${name}"]`).val();
          const num = name => Number(val(name) ?? 0) || 0;
          const on = name => html.find(`[name="${name}"]`).is(":checked");
          const auxilioCurar = esAuxilio && html.find('input[name="auxilioModo"]:checked').val() === "curar";
          const manual = Number(val("dificultadManual"));
          const seleccion = val("dificultad");
          let df = auxilioCurar ? 10 : (Number.isFinite(manual) && manual > 0 ? manual : (seleccion === "" ? null : Number(seleccion)));
          const notas = [];
          const suma = (texto, valor) => { if (df !== null && !auxilioCurar) df += valor; notas.push(`${texto} ${valor > 0 ? "+" : ""}${valor} a la dificultad`); };
          const cobertura = val("cobertura") ?? "ninguna";
          if (bonoCobertura(cobertura)) suma("Cobertura", bonoCobertura(cobertura));
          const rafaga = num("rafaga");
          if (rafaga) suma(`Ráfaga a ${rafaga} blanco${rafaga === 1 ? "" : "s"}`, 2 * rafaga);
          if (on("sinLuz")) suma("Sin luz", 5);
          if (on("voz")) suma("Voz", -3);
          if (on("regateo")) suma("Regatear", -3);
          const colaboradores = num("colaboradores");
          if (colaboradores) notas.push(`${colaboradores} colaborador${colaboradores === 1 ? "" : "es"}: +${2 * colaboradores} a la tirada`);
          const noquear = on("noquear");
          const recuerdoCuando = on("recuerdoCuando");
          resolve({
            dificultad: df,
            modificador: num("modificador") + 2 * colaboradores,
            dadosExtra: num("dadosExtra"),
            proezaDados: recuerdoCuando ? 0 : Math.max(0, num("proezaDados")),
            dadosSacrificados: Math.max(0, num("dadosSacrificados")) + (noquear ? 1 : 0),
            dadosApuntados: Math.max(0, num("dadosSacrificados")),
            aplicaSalud: on("aplicaSalud"),
            recuerdoCuando,
            desenfundar: on("desenfundar"),
            noquear,
            colaboradores,
            rafaga,
            entornoUrbano: on("entornoUrbano"),
            auxilioCurar,
            curarTargetUuid: auxilioCurar ? (curaToken?.actor?.uuid ?? actor.uuid) : null,
            notas
          });
        }
      },
      cancel: { label: "Cancelar", callback: () => resolve(null) }
    },
    default: "roll",
    render: html => {
      activarSteppers(html);
      if (esAuxilio) {
        const actualizar = () => html.find(".camc-dificultad-row").toggle(html.find('input[name="auxilioModo"]:checked').val() !== "curar");
        html.find('input[name="auxilioModo"]').on("change", actualizar);
        actualizar();
      }
    },
    close: () => resolve(null)
  }, { width: 520 }).render(true));
}

/** Gasta las proezas y marca el Recuerdo cuando… antes de tirar. Devuelve false si no se puede. */
export async function pagarCostes(actor, options) {
  const proezas = Number(options.proezaDados ?? 0);
  if (proezas > 0 && !(await actor.gastarProezas(proezas))) {
    ui.notifications.warn("No hay proezas suficientes para añadir dados.");
    return false;
  }
  if (options.recuerdoCuando && !(await actor.usarRecuerdoCuando())) {
    ui.notifications.warn("El Recuerdo cuando… ya está usado.");
    return false;
  }
  return true;
}
