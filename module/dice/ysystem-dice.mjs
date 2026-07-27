import { CAMC } from "../config.mjs";

export class YsystemDice {
  static async rollSkill(actor, habilidad, options = {}) {
    const data = actor.getDatosTirada(habilidad, options);
    if (!options.armaPreparada) data.armaPreparada = null;
    const flat = data.bonificador + data.bonusFavorecida + data.modificador;
    const dicePart = data.dados > 0 ? `${data.dados}d6` : "0";
    const formula = flat === 0 ? dicePart : `${dicePart} ${flat >= 0 ? "+" : "-"} ${Math.abs(flat)}`;
    const roll = await (new Roll(formula)).evaluate({ async: true });
    const dice = roll.dice?.[0]?.results?.map(r => r.result) ?? [];
    const critico = dice.filter(d => d === 6).length >= 2;
    const pifia = dice.length > 0 && dice.every(d => d === 1);
    const dificultad = options.dificultad ? Number(options.dificultad) : null;
    const exito = critico || (dificultad !== null && roll.total >= dificultad && !pifia);
    if (critico && actor.type === "personaje") await actor.ganarProezas(1);

    let danoInfo = null;
    if (exito && !options.auxilioCurar && (habilidad === "lucha" || habilidad === "punteria")) {
      if (data.armaPreparada && !data.armaPreparada.desarmado) {
        danoInfo = await this.#resolverDanoDeAtaque(actor, data.armaPreparada, critico);
      } else if (habilidad === "lucha" && (!data.armaPreparada || data.armaPreparada.desarmado)) {
        danoInfo = this.#resolverDanoDesarmado(actor, critico);
      }
    }

    let curaInfo = null;
    if (options.auxilioCurar) {
      curaInfo = await this.#resolverCuraAuxilio(actor, options, { exito, critico, pifia });
    }

    await this.#sendChat({ actor, tipo: "tirada", habilidad, roll, dice, data, critico, pifia, dificultad, exito, opciones: options, danoInfo, curaInfo });
    return { roll, dice, critico, pifia, dificultad, exito, danoInfo, curaInfo };
  }

  /**
   * Reglas: el daño de un impacto con Lucha/Puntería es esencialmente fijo por arma
   * (daño fijo + bonificador de atributo, a veces con algún dado), así que se resuelve
   * en el mismo momento del impacto en vez de exigir una segunda tirada manual.
   */
  static async #resolverDanoDeAtaque(actor, armaPreparada, critico = false) {
    const item = actor.items?.get(armaPreparada.id);
    if (!item) return null;
    if (typeof item.tieneMunicion === "function" && item.tieneMunicion()) {
      const ok = await item.consumirMunicion(1);
      if (!ok) {
        ui.notifications.warn(`${item.name}: sin munición.`);
        return null;
      }
    }
    const formula = (typeof item.getFormulaDano === "function" ? item.getFormulaDano(actor) : "") || "0";
    const danoRoll = await (new Roll(formula)).evaluate({ async: true });
    const total = critico ? danoRoll.total * 2 : danoRoll.total;
    return { total, formula: danoRoll.formula, itemName: item.name, itemId: item.id, critico };
  }

  /**
   * Reglas: sin arma, el daño de Lucha desarmada es fijo (1) + la mitad del bonificador
   * de FUE (redondeado hacia abajo), igual que cualquier otro impacto se resuelve en el
   * momento del éxito en vez de exigir una tirada de daño aparte.
   */
  static #resolverDanoDesarmado(actor, critico = false) {
    const fue = Number(actor.system?.atributos?.fue?.value ?? 0);
    const base = Number(CAMC.danoDesarmado?.fijo ?? 1) + Math.floor(fue / 2);
    const total = critico ? base * 2 : base;
    return { total, formula: `${CAMC.danoDesarmado?.fijo ?? 1} + FUE/2`, itemName: "Desarmado", itemId: null, critico };
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
    let cantidad = 0;
    let resultado = "sin_efecto";
    if (critico) { cantidad = 4; resultado = "critico"; }
    else if (pifia) { cantidad = -1; resultado = "pifia"; }
    else if (exito) { cantidad = 2; resultado = "exito"; }
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
    const roll = await (new Roll(formula)).evaluate({ async: true });
    await this.#sendChat({ actor, tipo: "dano", item, roll, formula });
    return roll;
  }

  static async rollInitiative(actor) {
    const bonus = Number(actor.system.combate?.iniciativa ?? 0);
    const roll = await (new Roll(`1d6 + ${bonus}`)).evaluate({ async: true });
    await this.#sendChat({ actor, tipo: "iniciativa", roll, formula: `1d6 + ${bonus}` });
    const combatant = game.combat?.combatants?.find(c => c.actor?.id === actor.id);
    if (combatant) await game.combat.setInitiative(combatant.id, roll.total);
    return roll;
  }

  static async rollResistance(actor) {
    const dificultad = Number(actor.system.combate?.resistencia_fisica ?? 12);
    return this.rollSkill(actor, "resistencia_fisica", {
      dificultad,
      dadosBase: 3,
      atributo: "fue",
      bonificador: 0,
      favorecida: false,
      modificador: 0,
      etiqueta: "Resistencia Física"
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
              banner: `<i class="fas fa-bolt"></i> ${this.#escape(actor.name)} gasta una proeza y repite ${rerollCount} dado(s). Ya no puede ser crítico.`
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
    const dice = ctx.dice ?? [];

    const actor = ctx.actorUuid ? await fromUuid(ctx.actorUuid) : null;
    if (!actor) return ui.notifications.warn("No se encuentra el personaje de esta tirada.");
    if (actor.type !== "personaje") return ui.notifications.warn("Los defectos solo existen para los PJ; los PNJ no tienen.");

    const leveUsado = Boolean(actor.system.biografia?.defecto_leve_usado);
    const defectoLeve = this.#escape(actor.system.biografia?.defecto_leve || "(sin definir)");
    const defectoGrave = this.#escape(actor.system.biografia?.defecto_grave || "(sin definir)");

    const content = `
      <div class="camc-dialog camc-defecto-dialog">
        <p>Vas a obligar a <strong>${this.#escape(actor.name)}</strong> a repetir esta tirada por uno de sus defectos.
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
          label: "Aplicar y repetir",
          callback: async html => {
            const tipo = html.find('input[name="tipo"]:checked').val();
            if (tipo === "leve" && leveUsado) {
              ui.notifications.warn(`El defecto leve de ${actor.name} ya se ha usado esta sesión.`);
              return resolve(null);
            }
            const rerollCount = tipo === "grave" ? Math.max(0, dice.length - 1) : dice.length;
            const banner = tipo === "grave"
              ? `<i class="fas fa-triangle-exclamation"></i> El DJ activa el <strong>Defecto grave</strong> de ${this.#escape(actor.name)}: repite con 1D menos (gana 1 proeza).`
              : `<i class="fas fa-feather"></i> El DJ activa el <strong>Defecto leve</strong> de ${this.#escape(actor.name)}: repite la tirada.`;
            resolve(await this.#ejecutarRepeticion(message, ctx, actor, {
              keepValues: [],
              rerollCount,
              allowCritico: true,
              spendProeza: false,
              grantProeza: tipo === "grave",
              markLeveUsado: tipo === "leve",
              banner
            }));
          }
        },
        cancel: { label: "Cancelar", callback: () => resolve(null) }
      },
      default: "confirm",
      close: () => resolve(null)
    }).render(true));
  }

  static async #ejecutarRepeticion(message, ctx, actor, { keepValues, rerollCount, allowCritico, spendProeza, grantProeza, markLeveUsado, banner }) {
    if (spendProeza) {
      const ok = await actor.gastarProezas(1);
      if (!ok) return ui.notifications.warn(`${actor.name} no tiene proezas suficientes.`);
    }

    let nuevos = [];
    if (rerollCount > 0) {
      const roll = await (new Roll(`${rerollCount}d6`)).evaluate({ async: true });
      nuevos = roll.dice?.[0]?.results?.map(r => r.result) ?? [];
    }
    const diceFinal = [...keepValues, ...nuevos];
    const flat = Number(ctx.data?.bonificador ?? 0) + Number(ctx.data?.bonusFavorecida ?? 0) + Number(ctx.data?.modificador ?? 0);
    const total = diceFinal.reduce((a, b) => a + b, 0) + flat;
    const pifia = diceFinal.length > 0 && diceFinal.every(d => d === 1);
    const critico = allowCritico && diceFinal.filter(d => d === 6).length >= 2;
    const dificultad = ctx.dificultad ?? null;
    const exito = critico || (dificultad !== null && total >= dificultad && !pifia);

    if (critico) await actor.ganarProezas(1);
    if (grantProeza) await actor.ganarProezas(1);
    if (markLeveUsado) await actor.update({ "system.biografia.defecto_leve_usado": true });

    const content = await renderTemplate(`systems/${CAMC.systemId}/templates/chat/roll-card.hbs`, {
      tipo: "tirada",
      habilidad: ctx.habilidad,
      actor,
      roll: { total },
      dice: diceFinal,
      data: ctx.data,
      critico,
      pifia,
      exito,
      dificultad,
      opciones: ctx.opciones ?? {},
      repetida: true,
      repeticionNota: banner
    });

    await message.update({
      content,
      [`flags.${CAMC.systemId}.tirada`]: { ...ctx, dice: diceFinal, repetida: true, exito, pifia, critico }
    });
    return { diceFinal, total, exito, pifia, critico };
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

  static #escape(str) {
    return String(str ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  static async #sendChat(payload) {
    const actor = payload.actor;
    const safePayload = { ...payload, actor: actor ?? { name: payload.item?.name ?? "CAMC" }, repetida: false };
    const content = await renderTemplate(`systems/${CAMC.systemId}/templates/chat/roll-card.hbs`, safePayload);
    const flags = {};
    if (payload.tipo === "dano" && payload.roll) {
      flags[CAMC.systemId] = {
        chatAction: {
          type: "damage",
          total: Number(payload.roll.total ?? 0),
          actorUuid: actor?.uuid ?? "",
          itemUuid: payload.item?.uuid ?? ""
        }
      };
    }
    if (payload.tipo === "tirada" && payload.danoInfo) {
      flags[CAMC.systemId] = {
        ...(flags[CAMC.systemId] ?? {}),
        chatAction: {
          type: "damage",
          total: Number(payload.danoInfo.total ?? 0),
          actorUuid: actor?.uuid ?? "",
          itemUuid: payload.danoInfo.itemId ?? ""
        }
      };
    }
    if (payload.tipo === "tirada") {
      flags[CAMC.systemId] = {
        ...(flags[CAMC.systemId] ?? {}),
        tirada: {
          actorUuid: actor?.uuid ?? null,
          habilidad: payload.habilidad,
          dificultad: payload.dificultad ?? null,
          dice: [...(payload.dice ?? [])],
          data: payload.data ?? {},
          opciones: payload.opciones ?? {},
          exito: Boolean(payload.exito),
          pifia: Boolean(payload.pifia),
          critico: Boolean(payload.critico),
          repetida: false
        }
      };
    }
    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      content,
      rolls: payload.roll ? [payload.roll] : [],
      flags
    });
  }
}
