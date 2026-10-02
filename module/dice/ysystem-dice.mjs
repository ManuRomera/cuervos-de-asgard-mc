import { createRollMessage, showRepeatedRoll } from "../compat/chat.mjs";
import { Dialog } from "../compat/applications.mjs";
import { CAMC } from "../config.mjs";
import * as R from "../rules/reglas.mjs";
import { escapeHtml } from "../utils/sheet-utils.mjs";

const PLANTILLA = `systems/${CAMC.systemId}/templates/chat/roll-card.hbs`;

export class YsystemDice {
  static async rollSkill(actor, habilidad, options = {}) {
    const data = actor.getDatosTirada(habilidad, options);
    if (!options.armaPreparada) data.armaPreparada = null;
    const flat = data.bonificador + data.bonusFavorecida + data.modificador;
    const dicePart = data.dados > 0 ? `${data.dados}d6` : "0";
    const formula = flat === 0 ? dicePart : `${dicePart} ${flat >= 0 ? "+" : "-"} ${Math.abs(flat)}`;
    const roll = await (new Roll(formula)).evaluate();
    const dice = roll.dice?.[0]?.results?.map(r => r.result) ?? [];
    const { critico, pifia } = R.evaluarDados(dice, { umbralCritico: data.umbralCritico });
    const dificultad = options.dificultad ? Number(options.dificultad) : null;
    const exito = critico || (dificultad !== null && roll.total >= dificultad && !pifia);
    // Una proeza por crítico en tirada de habilidad (no en la Resistencia Física automática).
    if (critico && actor.type === "personaje" && options.umbralRF === undefined) await actor.ganarProezas(1);

    const resultado = await this.#resolverResultado(actor, habilidad, options, data, { exito, critico, pifia });
    const ctx = { habilidad, dificultad, dice, total: roll.total, data, opciones: options, exito, pifia, critico, ...resultado };
    await this.#sendChat({ actor, tipo: "tirada", roll, ctx });
    return { roll, dice, critico, pifia, dificultad, exito, ...resultado };
  }

  /**
   * Efectos automáticos de una tirada resuelta: daño de un impacto, curación con Auxilio y
   * desmayo por Resistencia Física. Se usa también cuando una repetición convierte el fallo en éxito.
   */
  static async #resolverResultado(actor, habilidad, options, data, { exito, critico, pifia }) {
    const out = {};
    if (options.umbralRF !== undefined) {
      if (!exito) { await actor.ponerInconsciente(true); out.desmayo = true; }
      else if (actor.statuses?.has("unconscious") && options.umbralRF !== undefined) await actor.ponerInconsciente(false);
    }
    if (exito && !options.auxilioCurar && (habilidad === "lucha" || habilidad === "punteria")) {
      if (data.armaPreparada && !data.armaPreparada.desarmado) {
        out.danoInfo = await this.#resolverDanoDeAtaque(actor, data.armaPreparada, critico, options);
      } else if (habilidad === "lucha") {
        out.danoInfo = await this.#resolverDanoDesarmado(actor, critico, options);
      }
    }
    if (options.auxilioCurar) out.curaInfo = await this.#resolverCuraAuxilio(actor, options, { exito, critico, pifia });
    return out;
  }

  /**
   * Reglas (pp. 81-83): el daño de un impacto es fijo por arma + bonificador de atributo; apuntar añade
   * 1D (cuerpo a cuerpo) o 2D (a distancia) por dado sacrificado, sin explotar; un crítico dobla el daño;
   * noquear lo reduce a la mitad; las ráfagas no suman el bonificador de PER; un ataque combinado suma
   * un punto por personaje que colabora. Las proezas se gastan después, desde la tarjeta.
   */
  static async #resolverDanoDeAtaque(actor, armaPreparada, critico = false, options = {}) {
    const item = actor.items?.get(armaPreparada.id);
    if (!item) return null;
    let cargadorVacio = false;
    if (typeof item.tieneMunicion === "function" && item.tieneMunicion()) {
      // Ráfaga: un cartucho por blanco y después 1D; con 1 o 2 se vacía el cargador y toca recargar el turno siguiente (p. 83).
      const gasto = options.rafaga ? Math.min(Number(options.rafaga), Number(item.system.municion.value)) : 1;
      const ok = await item.consumirMunicion(Math.max(1, gasto));
      if (!ok) {
        ui.notifications.warn(`${item.name}: sin munición.`);
        return null;
      }
      if (options.rafaga && (await (new Roll("1d6")).evaluate()).total <= 2) {
        cargadorVacio = true;
        await item.update({ "system.municion.value": 0 });
      }
    }
    const formula = (typeof item.getFormulaDano === "function" ? item.getFormulaDano(actor, { sinAtributo: Boolean(options.rafaga) }) : "") || "0";
    const danoRoll = await (new Roll(formula)).evaluate();
    const aDistancia = (item.system?.habilidad_ataque ?? "") === "punteria";
    const apuntar = options.noquear ? 0 : R.dadosPorApuntar(Number(options.dadosApuntados ?? 0), aDistancia);
    let extra = 0;
    if (apuntar) extra = (await (new Roll(`${apuntar}d6`)).evaluate()).total;
    const combinado = Number(options.colaboradores ?? 0) > 0 ? Number(options.colaboradores) + 1 : 0;
    return this.#construirDano({
      base: danoRoll.total + extra + combinado, formula: danoRoll.formula, itemName: item.name, itemId: item.id,
      critico, noquear: Boolean(options.noquear), apuntar, combinado, categoria: item.system?.categoria ?? "", rafaga: Number(options.rafaga ?? 0), cargadorVacio
    });
  }

  static async #resolverDanoDesarmado(actor, critico = false, options = {}) {
    const fue = Number(actor.system?.atributos?.fue?.value ?? 0);
    const base = Number(CAMC.danoDesarmado?.fijo ?? 1) + Math.floor(fue / 2);
    const apuntar = options.noquear ? 0 : Number(options.dadosApuntados ?? 0);
    const extra = apuntar ? (await (new Roll(`${apuntar}d6`)).evaluate()).total : 0;
    const combinado = Number(options.colaboradores ?? 0) > 0 ? Number(options.colaboradores) + 1 : 0;
    return this.#construirDano({
      base: base + extra + combinado, formula: `${CAMC.danoDesarmado?.fijo ?? 1} + FUE/2`, itemName: "Desarmado", itemId: null,
      critico, noquear: Boolean(options.noquear), apuntar, combinado, categoria: "desarmado", rafaga: 0
    });
  }

  /** Aplica noqueo y crítico, y deja anotado lo necesario para sumar proezas después. */
  static #construirDano(d) {
    const sinCritico = d.noquear ? R.danoNoqueo(d.base) : d.base;
    return { ...d, sinCritico, total: R.aplicarCriticoDano(sinCritico, d.critico), proezasUsadas: 0, maxProezas: R.maxProezasDano(d.categoria) };
  }

  /**
   * Reglas (curación, cap. 4): Auxilio a dificultad 10 fija para primeros auxilios.
   * Éxito: +2 Salud. Crítico: +4 Salud. Pifia: -1 Salud adicional. Un único intento
   * por herida (esto último no se puede forzar automáticamente: no hay un registro
   * de heridas individuales, así que queda en manos de la DJ recordarlo).
   * El botiquín de primeros auxilios (equipo), además de su +2 a la tirada, permite
   * recuperar 1 punto extra de Salud cuando la cura tiene éxito.
   */
  static async #resolverCuraAuxilio(actor, options, { exito, critico, pifia }) {
    const targetUuid = options.curarTargetUuid || actor.uuid;
    const target = targetUuid === actor.uuid ? actor : await fromUuid(targetUuid);
    if (!target || typeof target.modificarSalud !== "function") return null;
    const cantidad0 = R.curacionAuxilio({ exito, critico, pifia }, { curandero: actor.tieneTalento?.("curandero") });
    let cantidad = cantidad0;
    const resultado = critico ? "critico" : pifia ? "pifia" : exito ? "exito" : "sin_efecto";
    const tieneBotiquin = (actor.items ?? []).some(item => item.type === "objeto" && item.system?.equipada && String(item.name ?? "").toLowerCase().includes("botiqu"));
    const bonusBotiquin = tieneBotiquin && cantidad > 0 ? 1 : 0;
    cantidad += bonusBotiquin;
    if (cantidad !== 0) await target.modificarSalud(cantidad);
    return { targetName: target.name, cantidad, resultado, bonusBotiquin: bonusBotiquin > 0 };
  }

  static async rollDamage(actor, item, options = {}) {
    let formula = typeof item?.getFormulaDano === "function"
      ? item.getFormulaDano(actor, options)
      : item?.formulaDano || `${Number(options.cantidad ?? 0)}`;
    if (options.extra && typeof item?.getFormulaDano !== "function") formula += ` + ${Number(options.extra)}`;
    const roll = await (new Roll(formula)).evaluate();
    await this.#sendChat({ actor, tipo: "dano", item, roll, formula });
    return roll;
  }

  /**
   * Iniciativa (p. 81): 1D fijo + valor de Iniciativa. Los empates los resuelven DES, INT, PER y Agilidad
   * (se suman como fracción al valor del rastreador). Un 6 en el dado da una acción extra al comienzo del
   * primer turno, solo a quien tenga la iniciativa más alta entre los que sacaron 6.
   */
  static async rollInitiative(actor) {
    const bonus = Number(actor.system.combate?.iniciativa ?? 0);
    const roll = await (new Roll(`1d6 + ${bonus}`)).evaluate();
    const dado = roll.dice?.[0]?.results?.[0]?.result ?? 0;
    const desempate = Number(actor.system.combate?.desempate ?? 0);
    const moto = Number(actor.system.combate?.iniciativa_moto ?? 0);
    await this.#sendChat({ actor, tipo: "iniciativa", roll, formula: `1d6 + ${bonus}`, extraAccion: dado === 6, moto, totalMoto: roll.total + moto });
    const combatant = game.combat?.combatants?.find(c => c.actor?.id === actor.id);
    if (combatant) {
      await game.combat.setInitiative(combatant.id, roll.total + desempate);
      if (dado === 6) await combatant.setFlag(CAMC.systemId, "accionExtra", true);
    }
    return roll;
  }

  /**
   * Resistencia Física (p. 88): 3D contra el valor del personaje, con los penalizadores de Salud. Si se falla,
   * el personaje se desmaya (estado inconsciente). `umbral` indica que la tirada viene de bajar de 11, 7, 4 o 2 de Salud.
   */
  static async rollResistance(actor, { umbral } = {}) {
    const dificultad = Number(actor.system.combate?.resistencia_fisica ?? 12);
    return this.rollSkill(actor, "resistencia_fisica", {
      dificultad,
      dadosBase: 3,
      atributo: "fue",
      bonificador: 0,
      favorecida: false,
      modificador: 0,
      aplicaProteccion: false,
      umbralRF: umbral,
      esResistencia: true,
      etiqueta: umbral === undefined ? "Resistencia Física" : `Resistencia Física · Salud por debajo de ${umbral}`
    });
  }

  /**
   * Gasta proezas en el daño de un impacto: +1D por proeza (máximo 2, o 3 con armas de fuego), dados que explotan.
   * El crítico, si lo hubo, sigue doblando el daño total (p. 79).
   */
  static async gastarProezasEnDano(message, cantidad) {
    const ctx = message.getFlag(CAMC.systemId, "tirada");
    const dano = ctx?.danoInfo;
    if (!dano) return ui.notifications.warn("Este mensaje no tiene daño al que sumar proezas.");
    const actor = ctx.actorUuid ? await fromUuid(ctx.actorUuid) : null;
    if (!actor) return ui.notifications.warn("No se encuentra el personaje de esta tirada.");
    if (!(game.user.isGM || actor.isOwner)) return ui.notifications.warn("No tienes permiso para gastar proezas de este personaje.");
    cantidad = Math.max(1, Math.floor(Number(cantidad) || 1));
    const quedan = dano.maxProezas - dano.proezasUsadas;
    if (cantidad > quedan) return ui.notifications.warn(quedan ? `Solo puedes gastar ${quedan} proeza(s) más en este ataque.` : "Ya has gastado el máximo de proezas en este ataque.");
    if (!(await actor.gastarProezas(cantidad))) return ui.notifications.warn(`${actor.name} no tiene proezas suficientes.`);
    const roll = await (new Roll(`${cantidad}d6x`)).evaluate();
    await showRepeatedRoll(roll, message);
    dano.sinCritico += roll.total;
    dano.proezasUsadas += cantidad;
    dano.total = R.aplicarCriticoDano(dano.sinCritico, dano.critico);
    dano.proezaDados = [...(dano.proezaDados ?? []), ...roll.dice[0].results.map(r => r.result)];
    const actual = { ...ctx, danoInfo: dano };
    await message.update({
      content: await this.#renderCard(actor, actual),
      [`flags.${CAMC.systemId}.tirada`]: actual,
      [`flags.${CAMC.systemId}.chatAction`]: { type: "damage", total: dano.total, actorUuid: actor.uuid, itemUuid: dano.itemId ?? "", categoria: dano.categoria ?? "" }
    });
  }

  /**
   * Reglas (cap. 4, "Bielas, cilindros y válvulas"): al gastar una proeza se pueden repetir
   * los dados que se quiera de una tirada FALLADA (el jugador elige cuáles). El resultado ya
   * no puede ser crítico. Solo se puede intentar una vez por tirada.
   */
  static async gastarProezaParaRepetir(message) {
    const ctx = message.getFlag(CAMC.systemId, "tirada");
    if (!ctx) return ui.notifications.warn("Esta tirada no admite repetición.");
    if (ctx.repetida) return ui.notifications.warn("Esta tirada ya se ha repetido una vez.");
    if (ctx.defectoPendiente) return ui.notifications.warn("Esta tirada tiene un defecto pendiente de tirar.");
    if (ctx.exito) return ui.notifications.warn("Solo se puede gastar una proeza para repetir una tirada fallida.");
    const dice = ctx.dice ?? [];
    if (!dice.length) return ui.notifications.warn("Esta tirada no tiene dados que repetir.");

    const actor = ctx.actorUuid ? await fromUuid(ctx.actorUuid) : null;
    if (!actor) return ui.notifications.warn("No se encuentra el personaje de esta tirada.");
    if (!(game.user.isGM || actor.isOwner)) return ui.notifications.warn("No tienes permiso para repetir esta tirada.");
    const proezasActuales = Number(actor.system.combate?.proezas?.value ?? 0);
    if (proezasActuales < 1) return ui.notifications.warn(`${actor.name} no tiene proezas disponibles.`);

    const tiles = dice.map((value, i) => `
      <label class="camc-reroll-die" data-index="${i}">
        ${this.#dieFaceHtml(value)}
        <input type="checkbox" name="dado-${i}"/>
        <span class="camc-reroll-state">Se mantiene</span>
      </label>`).join("");

    const content = `
      <div class="camc-dialog camc-reroll-dialog">
        <p class="camc-reroll-intro">Marca los dados que quieras <strong>repetir</strong>. Los que dejes sin marcar se <strong>mantienen</strong> tal cual estaban.</p>
        <div class="camc-reroll-grid">${tiles}</div>
        <p class="camc-reroll-summary"></p>
        <p class="notes">Vas a gastar 1 proeza (te quedan ${proezasActuales}). Si repites algún dado, esta tirada ya no podrá ser crítico, aunque salgan dos o más seises.</p>
      </div>`;

    return new Promise(resolve => new Dialog({
      title: "Gastar proeza · repetir dados",
      content,
      buttons: {
        confirm: {
          label: "Gastar proeza y repetir",
          callback: async html => {
            const keepValues = dice.filter((_, i) => !html.find(`input[name="dado-${i}"]`).is(":checked"));
            const rerollCount = dice.length - keepValues.length;
            if (rerollCount < 1) {
              ui.notifications.warn("Selecciona al menos un dado para repetir.");
              return resolve(null);
            }
            resolve(await this.#ejecutarRepeticion(message, ctx, actor, {
              keepValues,
              rerollCount,
              allowCritico: false,
              spendProeza: true,
              grantProeza: false,
              markLeveUsado: false,
              banner: `<i class="fas fa-bolt"></i> ${escapeHtml(actor.name)} gasta una proeza y repite ${rerollCount} dado(s). Ya no puede ser crítico.`
            }));
          }
        },
        cancel: { label: "Cancelar", callback: () => resolve(null) }
      },
      default: "confirm",
      render: html => this.#activateRerollDialog(html),
      close: () => resolve(null)
    }).render(true));
  }

  /**
   * Reglas: los defectos solo los activa la DJ, nunca el resto de jugadores, y solo cuando el
   * defecto concreto interfiere de verdad con la habilidad usada. El grave repite con 1D menos
   * y da 1 proeza al jugador (sin límite de usos); el leve repite igual, sin proeza, y solo se
   * puede activar una vez por sesión por PJ.
   */
  static async openDefectoDialog(message) {
    if (!game.user.isGM) return ui.notifications.warn("Solo la Dirección de Juego puede aplicar defectos.");
    const ctx = message.getFlag(CAMC.systemId, "tirada");
    if (!ctx) return ui.notifications.warn("Esta tirada no admite defectos.");
    if (ctx.repetida) return ui.notifications.warn("Esta tirada ya se ha repetido una vez.");
    if (ctx.defectoPendiente) return ui.notifications.warn("Esta tirada ya tiene un defecto pendiente de tirar.");
    const dice = ctx.dice ?? [];

    const actor = ctx.actorUuid ? await fromUuid(ctx.actorUuid) : null;
    if (!actor) return ui.notifications.warn("No se encuentra el personaje de esta tirada.");
    if (actor.type !== "personaje") return ui.notifications.warn("Los defectos solo existen para los PJ; los PNJ no tienen.");

    const leveUsado = Boolean(actor.system.biografia?.defecto_leve_usado);
    const defectoLeveRaw = actor.system.biografia?.defecto_leve || "(sin definir)";
    const defectoGraveRaw = actor.system.biografia?.defecto_grave || "(sin definir)";
    const defectoLeve = escapeHtml(defectoLeveRaw);
    const defectoGrave = escapeHtml(defectoGraveRaw);

    const content = `
      <div class="camc-dialog camc-defecto-dialog">
        <p>Vas a obligar a <strong>${escapeHtml(actor.name)}</strong> a repetir esta tirada por uno de sus defectos.
        Actívalo solo si el defecto elegido interfiere de verdad con la habilidad que se ha usado.</p>
        <label class="camc-defecto-option">
          <input type="radio" name="tipo" value="grave" checked/>
          <span><strong>Defecto grave</strong> — ${defectoGrave}<br/>
          <small>Repite con 1D menos (el bonificador se mantiene). El jugador gana 1 proeza. Sin límite de usos.</small></span>
        </label>
        <label class="camc-defecto-option${leveUsado ? " disabled" : ""}">
          <input type="radio" name="tipo" value="leve" ${leveUsado ? "disabled" : ""}/>
          <span><strong>Defecto leve</strong> — ${defectoLeve}<br/>
          <small>Repite igual, sin dar proeza. Solo 1 vez por sesión${leveUsado ? " · <strong>ya usado con este PJ esta sesión</strong>" : ""}.</small></span>
        </label>
      </div>`;

    return new Promise(resolve => new Dialog({
      title: "DJ · Aplicar defecto",
      content,
      buttons: {
        confirm: {
          label: "Anunciar defecto",
          callback: async html => {
            const tipo = html.find('input[name="tipo"]:checked').val();
            if (tipo === "leve" && leveUsado) {
              ui.notifications.warn(`El defecto leve de ${actor.name} ya se ha usado esta sesión.`);
              return resolve(null);
            }
            const rerollCount = tipo === "grave" ? Math.max(0, dice.length - 1) : dice.length;
            const texto = tipo === "grave" ? defectoGraveRaw : defectoLeveRaw;
            resolve(await this.#anunciarDefecto(message, ctx, actor, {
              tipo,
              texto,
              rerollCount,
              allowCritico: true,
              grantProeza: tipo === "grave",
              markLeveUsado: tipo === "leve"
            }));
          }
        },
        cancel: { label: "Cancelar", callback: () => resolve(null) }
      },
      default: "confirm",
      close: () => resolve(null)
    }).render(true));
  }

  /**
   * Anuncia el defecto en la propia tarjeta de la tirada (citando su texto, para que el
   * jugador pueda rolearlo) y deja un botón "Tirar dados" para que sea el jugador quien
   * decida el momento de tirar, en vez de repetir la tirada automáticamente al aplicarlo.
   */
  static async #anunciarDefecto(message, ctx, actor, { tipo, texto, rerollCount, allowCritico, grantProeza, markLeveUsado }) {
    const etiqueta = tipo === "grave" ? "Defecto grave" : "Defecto leve";
    const detalle = tipo === "grave"
      ? "Repetirás con 1D menos y ganarás 1 proeza."
      : "Repetirás la tirada igual, sin proeza (solo puede usarse una vez por sesión).";
    const nota = `<i class="fas fa-user-shield"></i> El DJ activa tu <strong>${etiqueta}</strong>: "${escapeHtml(texto)}". ${detalle} Pulsa "Tirar dados" cuando quieras interpretarlo.`;
    const defectoPendiente = { tipo, texto, rerollCount, allowCritico, grantProeza, markLeveUsado };
    const actual = { ...ctx, defectoPendiente };
    await message.update({
      content: await this.#renderCard(actor, actual, { repeticionNota: nota, repetida: false }),
      [`flags.${CAMC.systemId}.tirada`]: actual
    });
    return defectoPendiente;
  }

  /** El jugador (dueño del PJ) pulsa "Tirar dados" tras el anuncio del defecto: aquí se tira de verdad. */
  static async rollDefectoPendiente(message) {
    const ctx = message.getFlag(CAMC.systemId, "tirada");
    const pendiente = ctx?.defectoPendiente;
    if (!ctx || !pendiente) return ui.notifications.warn("No hay ningún defecto pendiente de tirar en esta tirada.");
    const actor = ctx.actorUuid ? await fromUuid(ctx.actorUuid) : null;
    if (!actor) return ui.notifications.warn("No se encuentra el personaje de esta tirada.");
    if (!(game.user.isGM || actor.isOwner)) return ui.notifications.warn("No tienes permiso para tirar este defecto.");
    const etiqueta = pendiente.tipo === "grave" ? "Defecto grave" : "Defecto leve";
    const banner = `<i class="fas fa-user-shield"></i> ${escapeHtml(actor.name)} tira por su <strong>${etiqueta}</strong>: "${escapeHtml(pendiente.texto)}".`;
    return this.#ejecutarRepeticion(message, ctx, actor, {
      keepValues: [],
      rerollCount: pendiente.rerollCount,
      allowCritico: pendiente.allowCritico,
      spendProeza: false,
      grantProeza: pendiente.grantProeza,
      markLeveUsado: pendiente.markLeveUsado,
      banner
    });
  }

  static async #ejecutarRepeticion(message, ctx, actor, { keepValues, rerollCount, allowCritico, spendProeza, grantProeza, markLeveUsado, banner }) {
    if (spendProeza) {
      const ok = await actor.gastarProezas(1);
      if (!ok) return ui.notifications.warn(`${actor.name} no tiene proezas suficientes.`);
    }

    let nuevos = [];
    if (rerollCount > 0) {
      const roll = await (new Roll(`${rerollCount}d6`)).evaluate();
      nuevos = roll.dice?.[0]?.results?.map(r => r.result) ?? [];
      // Esta tirada no pasa por ChatMessage.create (solo actualiza la tarjeta ya existente),
      // así que Dice So Nice nunca la ve a menos que se lo pidamos explícitamente aquí.
      await showRepeatedRoll(roll, message);
    }
    const diceFinal = [...keepValues, ...nuevos];
    const diceIsNew = keepValues.map(() => false).concat(nuevos.map(() => true));
    const flat = Number(ctx.data?.bonificador ?? 0) + Number(ctx.data?.bonusFavorecida ?? 0) + Number(ctx.data?.modificador ?? 0);
    const total = diceFinal.reduce((a, b) => a + b, 0) + flat;
    const { critico, pifia } = R.evaluarDados(diceFinal, { umbralCritico: ctx.data?.umbralCritico ?? 2, permitirCritico: allowCritico });
    const dificultad = ctx.dificultad ?? null;
    const exito = critico || (dificultad !== null && total >= dificultad && !pifia);

    if (critico) await actor.ganarProezas(1);
    if (grantProeza) await actor.ganarProezas(1);
    if (markLeveUsado) await actor.update({ "system.biografia.defecto_leve_usado": true });

    // La repetición puede convertir un fallo en éxito: entonces también hay que resolver el daño,
    // la curación o el desmayo que la tirada original no llegó a producir.
    const resultado = ctx.danoInfo || ctx.curaInfo ? {} : await this.#resolverResultado(actor, ctx.habilidad, ctx.opciones ?? {}, ctx.data ?? {}, { exito, critico, pifia });
    if (ctx.desmayo && exito) { await actor.ponerInconsciente(false); resultado.desmayo = false; }
    const actual = { ...ctx, dice: diceFinal, total, repetida: true, exito, pifia, critico, defectoPendiente: null, ...resultado };
    const chatAction = resultado.danoInfo
      ? { [`flags.${CAMC.systemId}.chatAction`]: { type: "damage", total: Number(resultado.danoInfo.total ?? 0), actorUuid: actor.uuid, itemUuid: resultado.danoInfo.itemId ?? "", categoria: resultado.danoInfo.categoria ?? "" } }
      : {};
    await message.update({
      content: await this.#renderCard(actor, actual, { diceIsNew, repeticionNota: banner }),
      [`flags.${CAMC.systemId}.tirada`]: actual,
      ...chatAction
    });
    return { diceFinal, total, exito, pifia, critico };
  }

  /** Dibuja la tarjeta de una tirada de habilidad a partir de su contexto guardado. */
  static async #renderCard(actor, ctx, extra = {}) {
    return foundry.applications.handlebars.renderTemplate(PLANTILLA, {
      tipo: "tirada",
      habilidad: ctx.habilidad,
      actor,
      roll: { total: ctx.total ?? (ctx.dice ?? []).reduce((a, b) => a + b, 0) + Number(ctx.data?.bonificador ?? 0) + Number(ctx.data?.bonusFavorecida ?? 0) + Number(ctx.data?.modificador ?? 0) },
      dice: ctx.dice ?? [],
      data: ctx.data ?? {},
      critico: ctx.critico,
      pifia: ctx.pifia,
      exito: ctx.exito,
      dificultad: ctx.dificultad,
      opciones: ctx.opciones ?? {},
      repetida: Boolean(ctx.repetida),
      defectoPendiente: ctx.defectoPendiente ?? null,
      danoInfo: ctx.danoInfo ?? null,
      curaInfo: ctx.curaInfo ?? null,
      desmayo: ctx.desmayo ?? false,
      ...extra
    });
  }

  static #activateRerollDialog(html) {
    const update = () => {
      let kept = 0, rerolled = 0;
      html.find(".camc-reroll-die").each((_, el) => {
        const $tile = $(el);
        const checked = $tile.find("input").is(":checked");
        $tile.toggleClass("rerolling", checked);
        $tile.find(".camc-reroll-state").text(checked ? "Se repite" : "Se mantiene");
        checked ? rerolled++ : kept++;
      });
      html.find(".camc-reroll-summary").text(`Mantienes ${kept} dado(s) · repites ${rerolled} dado(s).`);
    };
    html.find(".camc-reroll-die").on("click", function (ev) {
      if (ev.target.tagName !== "INPUT") {
        ev.preventDefault();
        const $input = $(this).find("input");
        $input.prop("checked", !$input.prop("checked"));
      }
      update();
    });
    update();
  }

  static #dieFaceHtml(value) {
    const layouts = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
    const active = new Set(layouts[value] ?? []);
    let cells = "";
    for (let i = 1; i <= 9; i++) cells += `<i class="pip${active.has(i) ? " on" : ""}"></i>`;
    return `<span class="camc-die-pips" data-value="${value}">${cells}</span>`;
  }

  static async #sendChat(payload) {
    const actor = payload.actor;
    const flags = {};
    let content;
    if (payload.tipo === "tirada") {
      const ctx = payload.ctx;
      content = await this.#renderCard(actor, ctx);
      flags.tirada = { ...ctx, actorUuid: actor?.uuid ?? null, repetida: false };
      if (ctx.danoInfo) flags.chatAction = { type: "damage", total: Number(ctx.danoInfo.total ?? 0), actorUuid: actor?.uuid ?? "", itemUuid: ctx.danoInfo.itemId ?? "", categoria: ctx.danoInfo.categoria ?? "" };
    } else {
      const safePayload = { ...payload, actor: actor ?? { name: payload.item?.name ?? "CAMC" }, repetida: false };
      content = await foundry.applications.handlebars.renderTemplate(PLANTILLA, safePayload);
      if (payload.tipo === "dano" && payload.roll) {
        flags.chatAction = { type: "damage", total: Number(payload.roll.total ?? 0), actorUuid: actor?.uuid ?? "", itemUuid: payload.item?.uuid ?? "" };
      }
    }
    await createRollMessage({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      content,
      rolls: payload.roll ? [payload.roll] : [],
      flags: { [CAMC.systemId]: flags }
    });
  }
}
