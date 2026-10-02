import { createRollMessage } from "../compat/chat.mjs";
import { CAMC } from "../config.mjs";
import { YsystemDice } from "../dice/ysystem-dice.mjs";
import { askRollOptions, pagarCostes } from "../dice/roll-dialog.mjs";

export class CAMCMountRolls {
  static damagePenalty(moto) {
    const value = Number(moto.system?.reglas?.estructura?.value ?? 0);
    const max = Number(moto.system?.reglas?.estructura?.max ?? 1);
    if (value <= 0) return Number(moto.system?.reglas?.penalizador_dano_grave ?? 3);
    return value <= Math.floor(max / 2) ? Number(moto.system?.reglas?.penalizador_dano_grave ?? 3) : 0;
  }

  static async rollDrive(pilot, moto, { label = "Conducir", difficulty = null, extra = 0 } = {}) {
    if (!pilot) return ui.notifications.warn("La moto necesita un piloto vinculado para tirar Conducir.");
    if (moto.system?.reglas?.inutilizada) {
      return ui.notifications.warn(`${moto.name}: estructura a 0, la moto está inutilizada y no se puede conducir hasta repararla.`);
    }
    const maneuver = Number(moto.system?.reglas?.maniobrabilidad ?? 0);
    const damagePenalty = this.damagePenalty(moto);
    const modifier = maneuver - damagePenalty + Number(extra || 0);
    return YsystemDice.rollSkill(pilot, "conducir", {
      dificultad: difficulty,
      modificador: modifier,
      etiqueta: label,
      mount: {
        name: moto.name,
        uuid: moto.uuid,
        maniobrabilidad: maneuver,
        penalizadorDano: damagePenalty,
        accion: label
      }
    });
  }

  static async rollMountDamage(moto, { label = "Daño de moto" } = {}) {
    const formula = String(moto.system?.reglas?.dados_dano ?? "2D").replaceAll("D", "d6");
    const roll = await new Roll(formula).evaluate();
    await createRollMessage({
      speaker: ChatMessage.getSpeaker({ actor: moto }),
      rolls: [roll],
      content: await foundry.applications.handlebars.renderTemplate(`systems/${CAMC.systemId}/templates/chat/roll-card.hbs`, {
        actor: moto,
        tipo: "dano_moto",
        roll,
        formula,
        label
      })
    });
    return roll;
  }

  static async rollMechanic(pilot, moto, { install = true } = {}) {
    if (!pilot) return ui.notifications.warn("La moto necesita un piloto vinculado para tirar Mecánica.");
    const label = install ? "Instalar tuneado" : "Retirar tuneado";
    const options = await askRollOptions(pilot, "mecanica", { dificultad: install ? 15 : 12, etiqueta: label });
    if (options === null) return null;
    if (!(await pagarCostes(pilot, options))) return null;
    return YsystemDice.rollSkill(pilot, "mecanica", {
      ...options,
      etiqueta: label,
      mount: { name: moto.name, uuid: moto.uuid, accion: label }
    });
  }
}
