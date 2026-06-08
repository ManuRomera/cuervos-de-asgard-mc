import { CAMC } from "../config.mjs";
import { YsystemDice } from "../dice/ysystem-dice.mjs";

export class CAMCMountRolls {
  static damagePenalty(moto) {
    const value = Number(moto.system?.reglas?.estructura?.value ?? 0);
    const max = Number(moto.system?.reglas?.estructura?.max ?? 1);
    if (value <= 0) return Number(moto.system?.reglas?.penalizador_dano_grave ?? 3);
    return value <= Math.floor(max / 2) ? Number(moto.system?.reglas?.penalizador_dano_grave ?? 3) : 0;
  }

  static async rollDrive(pilot, moto, { label = "Conducir", difficulty = null, extra = 0 } = {}) {
    if (!pilot) return ui.notifications.warn("La moto necesita un piloto vinculado para tirar Conducir.");
    const maneuver = Number(moto.system?.reglas?.maniobrabilidad ?? 0);
    const damagePenalty = this.damagePenalty(moto);
    const context = this.contextualModifier(moto, label);
    const modifier = maneuver + context.value - damagePenalty + Number(extra || 0);
    return YsystemDice.rollSkill(pilot, "conducir", {
      dificultad: difficulty,
      modificador: modifier,
      etiqueta: label,
      mount: {
        name: moto.name,
        uuid: moto.uuid,
        maniobrabilidad: maneuver,
        contextual: context.value,
        contextualLabel: context.label,
        penalizadorDano: damagePenalty,
        accion: label
      }
    });
  }

  static async rollMountDamage(moto, { label = "Daño de moto" } = {}) {
    const formula = String(moto.system?.reglas?.dados_dano ?? "2D").replaceAll("D", "d6");
    const roll = await new Roll(formula).evaluate({ async: true });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: moto }),
      rolls: [roll],
      content: await renderTemplate(`systems/${CAMC.systemId}/templates/chat/roll-card.hbs`, {
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
    return YsystemDice.rollSkill(pilot, "mecanica", {
      dificultad: install ? 15 : 12,
      etiqueta: install ? "Instalar tuneado" : "Retirar tuneado",
      mount: { name: moto.name, uuid: moto.uuid, accion: install ? "Instalar tuneado" : "Retirar tuneado" }
    });
  }

  static contextualModifier(moto, label = "") {
    if (!this.#extendedRules()) return { value: 0, label: "" };
    const action = String(label).toLowerCase();
    const legacyMods = moto.system?.mods?.funcionales ?? [];
    const itemMods = moto.items?.filter(item => item.type === "objeto" && item.system?.tipo === "modificacion_moto" && item.system?.equipada)
      .map(item => ({ name: item.name, efecto: item.system?.efecto ?? {} })) ?? [];
    const mods = [...legacyMods, ...itemMods];
    let value = 0;
    const labels = [];
    for (const mod of mods) {
      const effect = mod?.efecto ?? {};
      const name = mod?.name ?? "Tuneado";
      if (action.includes("maniobra") && Number(effect.maniobrabilidadContextual)) {
        value += Number(effect.maniobrabilidadContextual);
        labels.push(`${name} ${this.#signed(effect.maniobrabilidadContextual)}`);
      }
      if ((action.includes("forzar") || action.includes("velocidad")) && Number(effect.velocidad)) {
        value += Number(effect.velocidad);
        labels.push(`${name} ${this.#signed(effect.velocidad)}`);
      }
      if ((action.includes("noche") || action.includes("explor")) && Number(effect.nocturno)) {
        value += Number(effect.nocturno);
        labels.push(`${name} ${this.#signed(effect.nocturno)}`);
      }
      if ((action.includes("barro") || action.includes("hielo") || action.includes("terreno")) && Number(effect.terrenoDificil)) {
        value += Number(effect.terrenoDificil);
        labels.push(`${name} ${this.#signed(effect.terrenoDificil)}`);
      }
      if ((action.includes("fuera") || action.includes("campo")) && Number(effect.offroad)) {
        value += Number(effect.offroad);
        labels.push(`${name} ${this.#signed(effect.offroad)}`);
      }
    }
    return { value, label: labels.join(", ") };
  }

  static #signed(value) {
    const n = Number(value) || 0;
    return n >= 0 ? `+${n}` : String(n);
  }

  static #extendedRules() {
    try {
      if (!game?.settings?.settings?.has(`${CAMC.systemId}.motoExtendedRules`)) return false;
      return Boolean(game.settings.get(CAMC.systemId, "motoExtendedRules"));
    } catch (_err) {
      return false;
    }
  }
}
