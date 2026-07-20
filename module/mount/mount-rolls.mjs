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
    const label = install ? "Instalar tuneado" : "Retirar tuneado";
    const options = await this.#askRollOptions(pilot, "mecanica", {
      dificultad: install ? 15 : 12,
      etiqueta: label
    });
    if (options === null) return null;
    const proezaDados = Number(options.proezaDados ?? 0);
    if (proezaDados > 0) {
      const ok = await pilot.gastarProezas(proezaDados);
      if (!ok) return ui.notifications.warn("No hay proezas suficientes para añadir dados.");
    }
    if (options.recuerdoCuando) await pilot.update({ "system.biografia.recuerdo_cuando_usado": true });
    return YsystemDice.rollSkill(pilot, "mecanica", {
      ...options,
      etiqueta: label,
      mount: { name: moto.name, uuid: moto.uuid, accion: label }
    });
  }

  static async #askRollOptions(actor, habilidad, { dificultad = null, etiqueta = "Tirada" } = {}) {
    const skillLabel = CAMC.habilidades[habilidad]?.label ?? etiqueta;
    const opts = [`<option value="">Sin dificultad</option>`]
      .concat(CAMC.dificultades.map(d => `<option value="${d.value}" ${Number(d.value) === Number(dificultad) ? "selected" : ""}>${d.value} · ${d.label}</option>`))
      .join("");
    const penalty = actor.getPenalizadorSalud?.() ?? { label: "Sin penalizador" };
    const recuerdoUsado = Boolean(actor.system?.biografia?.recuerdo_cuando_usado);
    const content = `
      <form class="camc-dialog camc-roll-options">
        <p><strong>${skillLabel}</strong> · ${etiqueta}</p>
        <label><span>Dificultad</span><select name="dificultad">${opts}</select></label>
        <label><span>Dificultad personalizada</span><input name="dificultadManual" type="number" placeholder="Opcional"/></label>
        <div class="camc-dialog-grid">
          <label><span>Modificador fijo</span>${this.#numberStepper("modificador", 0, -99, 99)}</label>
          <label><span>Dados extra</span>${this.#numberStepper("dadosExtra", 0, -3, 3)}</label>
          <label><span>Proezas para +D</span>${this.#numberStepper("proezaDados", 0, 0, 3)}</label>
          <label><span>Dados sacrificados</span>${this.#numberStepper("dadosSacrificados", 0, 0, 3)}</label>
        </div>
        <label class="camc-checkline"><input name="aplicaSalud" type="checkbox"/> Aplicar penalizador de Salud (${penalty.label})</label>
        <label class="camc-checkline"><input name="recuerdoCuando" type="checkbox" ${recuerdoUsado ? "disabled" : ""}/> Recuerdo cuando (+2D, no compatible con gastar proezas)${recuerdoUsado ? " · ya usado" : ""}</label>
      </form>`;
    return new Promise(resolve => new Dialog({
      title: "Opciones de tirada",
      content,
      buttons: {
        roll: {
          label: "Tirar",
          callback: html => {
            const selected = html.find('[name="dificultad"]').val();
            const manual = Number(html.find('[name="dificultadManual"]').val());
            const recuerdoCuando = html.find('[name="recuerdoCuando"]').is(":checked");
            resolve({
              dificultad: Number.isFinite(manual) && manual > 0 ? manual : (selected === "" ? null : Number(selected)),
              modificador: Number(html.find('[name="modificador"]').val() ?? 0),
              dadosExtra: Number(html.find('[name="dadosExtra"]').val() ?? 0),
              proezaDados: recuerdoCuando ? 0 : Math.max(0, Number(html.find('[name="proezaDados"]').val() ?? 0)),
              dadosSacrificados: Math.max(0, Number(html.find('[name="dadosSacrificados"]').val() ?? 0)),
              aplicaSalud: html.find('[name="aplicaSalud"]').is(":checked"),
              recuerdoCuando
            });
          }
        },
        cancel: { label: "Cancelar", callback: () => resolve(null) }
      },
      default: "roll",
      render: html => this.#activateDialogSteppers(html),
      close: () => resolve(null)
    }).render(true));
  }

  static #numberStepper(name, value, min, max) {
    return `<div class="camc-dialog-stepper" data-stepper="${name}" data-min="${min}" data-max="${max}">
      <button type="button" class="camc-dialog-minus" data-delta="-1"><i class="fas fa-minus"></i></button>
      <input name="${name}" type="number" value="${value}" min="${min}" max="${max}"/>
      <button type="button" class="camc-dialog-plus" data-delta="1"><i class="fas fa-plus"></i></button>
    </div>`;
  }

  static #activateDialogSteppers(html) {
    html.find(".camc-dialog-stepper button").on("click", ev => {
      ev.preventDefault();
      const wrapper = ev.currentTarget.closest(".camc-dialog-stepper");
      const input = wrapper?.querySelector("input");
      if (!input) return;
      const min = Number(wrapper.dataset.min ?? input.min ?? -Infinity);
      const max = Number(wrapper.dataset.max ?? input.max ?? Infinity);
      const delta = Number(ev.currentTarget.dataset.delta ?? 0);
      input.value = String(Math.max(min, Math.min(max, Number(input.value || 0) + delta)));
      input.dispatchEvent(new Event("change", { bubbles: true }));
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
