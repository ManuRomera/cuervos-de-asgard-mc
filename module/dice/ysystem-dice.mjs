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
    await this.#sendChat({ actor, tipo: "tirada", habilidad, roll, dice, data, critico, pifia, dificultad, exito, opciones: options });
    return { roll, dice, critico, pifia, dificultad, exito };
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

  static async #sendChat(payload) {
    const actor = payload.actor;
    const safePayload = { ...payload, actor: actor ?? { name: payload.item?.name ?? "CAMC" } };
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
    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      content,
      rolls: payload.roll ? [payload.roll] : [],
      flags
    });
  }
}
