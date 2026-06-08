import { CAMC } from "../config.mjs";
import { YsystemDice } from "../dice/ysystem-dice.mjs";
import { generateRandomMount } from "../mount/mount-generator.mjs";
import { CAMCMountRolls } from "../mount/mount-rolls.mjs";
import { generateRandomCharacter } from "../generator/camc-generators.mjs";

const get = foundry.utils.getProperty;
const ActorSheetV1 = foundry.appv1.sheets.ActorSheet;

export class CAMCActorSheet extends ActorSheetV1 {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["camc", "sheet", "actor", "personaje", "camc-character-window"],
      template: `systems/${CAMC.systemId}/templates/actor/character-sheet.hbs`,
      width: 980,
      height: 690,
      resizable: true,
      scrollY: [".camc-body", ".camc-scroll"],
      tabs: [{ navSelector: ".camc-tabs", contentSelector: ".camc-body", initial: "resumen" }],
      dragDrop: [{ dragSelector: ".item", dropSelector: ".camc-sheet" }]
    });
  }

  get title() { return `${this.actor.name} - Hoja de Personaje`; }

  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();
    if (this.isEditable) {
      buttons.unshift({
        label: "Generar PJ",
        class: "camc-generate-character",
        icon: "fas fa-dice",
        onclick: () => this.#generateCharacter()
      });
    }
    return buttons;
  }

  async getData(options = {}) {
    const context = await super.getData(options);
    const actor = this.actor;
    const items = actor.items.contents;
    const system = actor.system;

    const armas = items.filter(i => i.type === "arma");
    const armaduras = items.filter(i => i.type === "armadura");
    const escudos = items.filter(i => i.type === "escudo");
    const dones = items.filter(i => i.type === "don");
    const vehiculos = items.filter(i => i.type === "vehiculo");
    const talentos = items.filter(i => i.type === "talento");
    const reglas = items.filter(i => i.type === "regla");
    const objetos = items.filter(i => i.type === "objeto");

    const habilidades = Object.entries(CAMC.habilidades).map(([key, cfg]) => {
      const data = system.habilidades?.[key] ?? {};
      const atributo = data.atributo ?? cfg.atributo ?? "int";
      const value = Number(data.value ?? 1);
      const atributoValue = actor.getAtributo(atributo);
      const favorecida = actor.esHabilidadFavorecida(key);
      const dice = [1, 2, 3].map(rank => ({ rank, skill: key, active: value >= rank }));
      return {
        key,
        label: cfg.label,
        atributo,
        atributoShort: CAMC.atributos[atributo]?.short ?? atributo.toUpperCase(),
        value,
        dice,
        bonificador: atributoValue,
        total: value + atributoValue + (favorecida ? 3 : 0),
        favorecida
      };
    });

    const cargoSkills = CAMC.cargos[system.biografia?.cargo]?.habilidades ?? [];
    const destacadas = habilidades
      .filter(h => h.favorecida || cargoSkills.includes(h.key))
      .concat(habilidades.filter(h => ["conducir", "mecanica", "intimidacion", "supervivencia", "punteria", "auxilio"].includes(h.key)))
      .filter((h, idx, arr) => arr.findIndex(x => x.key === h.key) === idx)
      .slice(0, 6);

    const salud = system.combate?.salud ?? { value: 0, max: 1 };
    const proezas = system.combate?.proezas ?? { value: 0, max: 1 };
    const mount = await this.#buildMountCard(system);
    const carga = this.#buildCarga(items, system, mount.actor ?? null);

    context.config = CAMC;
    context.system = system;
    const portraitMode = game.settings.get(CAMC.systemId, "characterPortraitMode") === "standee" ? "standee" : "framed";
    const portraitScale = Number(game.settings.get(CAMC.systemId, "characterPortraitScale") ?? 45) / 100;
    const deityKey = this.#assetKey(system.biografia?.deidad, "none");
    const cargoKey = this.#assetKey(system.biografia?.cargo, "full_patch");
    context.portraitMode = portraitMode;
    context.portraitScale = portraitScale;
    context.vestCalibration = game.user.isGM && game.settings.get(CAMC.systemId, "vestCalibration");
    context.vestCalibrationAvailable = game.user.isGM;
    context.skillEditUnlocked = game.settings.get(CAMC.systemId, "skillEditUnlocked");
    context.deityKey = deityKey;
    context.cargoKey = cargoKey;
    context.deityBanner = CAMC.deityBanners[deityKey] ?? CAMC.assets.deityFallback;
    context.cargoPatch = CAMC.patches[cargoKey]?.img ?? CAMC.assets.patchFallback;
    context.deidadActual = CAMC.dioses[deityKey] ?? { label: "Sin deidad", virtud: "" };
    context.cargoActual = CAMC.cargos[system.biografia?.cargo] ?? CAMC.cargos.full_patch;
    context.cargoTalent = talentos.find(t => String(t.system?.cargo ?? "").toLowerCase() === String(context.cargoActual.label ?? "").toLowerCase())
      ?? { name: context.cargoActual.talento ?? "" };
    context.logo = CAMC.assets.logo;
    context.vestImage = CAMC.assets.vest;
    context.vestSlots = this.#buildVestSlots(system);
    context.patchGroups = this.#buildPatchGroups();
    context.attrCards = Object.entries(CAMC.atributos).map(([key, cfg]) => {
      const value = Number(system.atributos?.[key]?.value ?? 0);
      const options = [6, 4, 2, 1, 0].map(option => ({ value: option, selected: option === value }));
      return { key, short: cfg.short, label: cfg.label, value, options, signed: this.#signed(value), tone: this.#scoreTone(value) };
    });
    context.derivedCards = [
      { key: "agilidad", label: "Agilidad", icon: "fa-person-running", value: system.valores_pasivos?.agilidad ?? 0, formula: "Atletismo x3 + DES" },
      { key: "evasion", label: "Evasión", icon: "fa-shield-halved", value: system.valores_pasivos?.evasion ?? 0, formula: "Conducir x3 + DES" },
      { key: "aplomo", label: "Aplomo", icon: "fa-heart-pulse", value: system.valores_pasivos?.aplomo ?? 0, formula: "CAR + INT + 5" },
      { key: "perspicacia", label: "Perspicacia", icon: "fa-eye", value: system.valores_pasivos?.perspicacia ?? 0, formula: "INT + PER + 5" }
    ];
    context.saludPct = this.#pct(salud.value, salud.max);
    context.saludTone = this.#resourceTone(salud.value, salud.max);
    context.healthPenalty = actor.getPenalizadorSalud();
    context.initiativeWeapon = actor.getArmaPreparada();
    context.proezasPct = this.#pct(proezas.value, proezas.max);
    context.habilidades = habilidades;
    context.habilidadesDestacadas = destacadas;
    context.carga = carga;
    context.mount = mount;
    context.carryItems = carga.items;
    context.itemsByType = {
      armas,
      armasEquipadas: armas.filter(i => i.system.equipada),
      armaduras,
      escudos,
      protecciones: [...armaduras, ...escudos],
      proteccionesEquipadas: [...armaduras.filter(i => i.system.equipada), ...escudos.filter(i => i.system.equipado)],
      dones,
      vehiculos,
      talentos,
      reglas,
      objetos,
      otros: items.filter(i => !["arma", "armadura", "escudo", "don", "vehiculo", "talento", "objeto", "regla"].includes(i.type))
    };
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".roll-skill").on("click", ev => this.#rollSkill(ev));
    html.find(".camc-sheet-img-button, .camc-img-button").on("click", ev => this.#changeActorImage(ev));
    html.find(".roll-initiative").on("click", () => YsystemDice.rollInitiative(this.actor));
    html.find(".roll-resistance").on("click", () => YsystemDice.rollResistance(this.actor));
    html.find(".item-primary-action").on("click", ev => this.#itemPrimaryAction(ev));
    html.find(".item-edit").on("click", ev => this.#getItem(ev)?.sheet.render(true));
    html.find(".item-delete").on("click", ev => this.#deleteItem(ev));
    html.find(".item-equip").on("click", ev => this.#toggleEquip(ev));
    html.find(".item-carry-location").on("change", ev => this.#setCarryLocation(ev));
    html.find(".vest-patch-select").on("change", ev => this.#setVestPatch(ev));
    html.find(".vest-calibration-toggle").on("click", ev => this.#toggleVestCalibration(ev));
    html.find(".camc-vest-patch.calibrating, .camc-vest-slot-guide.calibrating").on("pointerdown", ev => this.#dragVestPatch(ev));
    html.find(".camc-vest-patch.calibrating, .camc-vest-slot-guide.calibrating").on("wheel", ev => this.#resizeVestPatch(ev));
    html.find(".item-roll-damage").on("click", ev => this.#rollDamage(ev));
    html.find(".use-don").on("click", ev => this.#useDon(ev));
    html.find(".use-cargo-talent").on("click", ev => this.#useCargoTalent(ev));
    html.find(".create-item").on("click", ev => this.#createItem(ev));
    html.find(".auto-role-skills").on("click", () => this.#setRoleSkills());
    html.find(".fav-toggle").on("click", ev => this.#toggleFav(ev));
    html.find(".skill-edit-toggle").on("click", ev => this.#toggleSkillEdit(ev));
    html.find(".skill-die").on("click", ev => this.#setSkillDice(ev));
    html.find(".camc-attr-select").on("change", ev => this.#setAttributeValue(ev));
    html.find(".camc-adjust").on("click", ev => this.#adjustNumber(ev));
    html.find(".spend-proeza").on("click", () => this.actor.gastarProezas(1));
    html.find(".gain-proeza").on("click", () => this.actor.ganarProezas(1));
    html.find(".health-plus").on("click", () => this.actor.modificarSalud(1));
    html.find(".health-minus").on("click", () => this.actor.modificarSalud(-1));
    html.find(".mount-create").on("click", ev => this.#createMount(ev));
    html.find(".mount-generate").on("click", ev => this.#generateMount(ev));
    html.find(".mount-open").on("click", ev => this.#openMount(ev));
    html.find(".mount-unlink").on("click", ev => this.#unlinkMount(ev));
    html.find(".mount-repair").on("click", ev => this.#repairMount(ev));
    html.find(".mount-damage").on("click", ev => this.#damageMount(ev));
    html.find(".mount-roll-drive").on("click", ev => this.#rollMountDrive(ev));
  }

  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    if (data?.type === "Actor") {
      const actor = await Actor.implementation.fromDropData(data);
      if (actor?.type === "moto") {
        await this.#linkMount(actor);
        return;
      }
    }
    return super._onDrop(event);
  }

  async #rollSkill(event) {
    event.preventDefault();
    const habilidad = event.currentTarget.dataset.skill;
    const options = event.altKey ? { dificultad: null } : await this.#askRollOptions(habilidad);
    if (options === null) return;
    const proezaDados = Number(options.proezaDados ?? 0);
    if (proezaDados > 0) {
      const ok = await this.actor.gastarProezas(proezaDados);
      if (!ok) return ui.notifications.warn("No hay proezas suficientes para añadir dados.");
    }
    await YsystemDice.rollSkill(this.actor, habilidad, options);
  }

  async #setAttributeValue(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.attribute;
    const nextValue = Number(event.currentTarget.value);
    if (!key || ![6, 4, 2, 1, 0].includes(nextValue)) return;

    const attrs = this.actor.system.atributos ?? {};
    const previousValue = Number(attrs[key]?.value ?? 0);
    const update = { [`system.atributos.${key}.value`]: nextValue };
    const swapEntry = Object.entries(attrs).find(([otherKey, data]) => {
      return otherKey !== key && Number(data?.value ?? 0) === nextValue;
    });
    if (swapEntry) update[`system.atributos.${swapEntry[0]}.value`] = previousValue;
    await this.actor.update(update);
  }

  async #askRollOptions(habilidad, { weapon = null } = {}) {
    const skillLabel = CAMC.habilidades[habilidad]?.label ?? "Tirada";
    const opts = [`<option value="">Sin dificultad</option>`].concat(CAMC.dificultades.map(d => `<option value="${d.value}">${d.value} · ${d.label}</option>`)).join("");
    const penalty = this.actor.getPenalizadorSalud();
    const weaponInfo = weapon ? { label: weapon.name } : null;
    const content = `
      <form class="camc-dialog camc-roll-options">
        <p><strong>${skillLabel}</strong></p>
        <label><span>Dificultad</span><select name="dificultad">${opts}</select></label>
        <label><span>Dificultad personalizada</span><input name="dificultadManual" type="number" placeholder="Opcional"/></label>
        <div class="camc-dialog-grid">
          <label><span>Modificador fijo</span>${this.#numberStepper("modificador", 0, -99, 99)}</label>
          <label><span>Dados extra</span>${this.#numberStepper("dadosExtra", 0, -3, 3)}</label>
          <label><span>Proezas para +D</span>${this.#numberStepper("proezaDados", 0, 0, 3)}</label>
          <label><span>Dados sacrificados</span>${this.#numberStepper("dadosSacrificados", 0, 0, 3)}</label>
        </div>
        <label class="camc-checkline"><input name="aplicaSalud" type="checkbox" checked/> Aplicar penalizador de Salud (${penalty.label})</label>
        ${weaponInfo ? `<label class="camc-checkline"><input name="desenfundar" type="checkbox"/> Desenfundar o cambiar de arma este turno (-1D)</label>` : ""}
        <p class="notes">${weaponInfo ? `Arma usada: <strong>${weaponInfo.label}</strong>. ` : ""}Los dados sacrificados sirven para apuntar o afinar una accion cuando la regla lo permita. Alt + clic tira rapido sin abrir este panel.</p>
      </form>`;
    return new Promise(resolve => new Dialog({
      title: "Opciones de tirada",
      content,
      buttons: {
        roll: {
          label: "Tirar",
          callback: html => {
            const dificultad = html.find('[name="dificultad"]').val();
            const dificultadManual = Number(html.find('[name="dificultadManual"]').val());
            resolve({
              dificultad: Number.isFinite(dificultadManual) && dificultadManual > 0 ? dificultadManual : (dificultad === "" ? null : Number(dificultad)),
              modificador: Number(html.find('[name="modificador"]').val() ?? 0),
              dadosExtra: Number(html.find('[name="dadosExtra"]').val() ?? 0),
              proezaDados: Math.max(0, Number(html.find('[name="proezaDados"]').val() ?? 0)),
              dadosSacrificados: Math.max(0, Number(html.find('[name="dadosSacrificados"]').val() ?? 0)),
              aplicaSalud: html.find('[name="aplicaSalud"]').is(":checked"),
              desenfundar: html.find('[name="desenfundar"]').is(":checked")
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

  #numberStepper(name, value, min, max) {
    return `<div class="camc-dialog-stepper" data-stepper="${name}" data-min="${min}" data-max="${max}">
      <button type="button" class="camc-dialog-minus" data-delta="-1"><i class="fas fa-minus"></i></button>
      <input name="${name}" type="number" value="${value}" min="${min}" max="${max}"/>
      <button type="button" class="camc-dialog-plus" data-delta="1"><i class="fas fa-plus"></i></button>
    </div>`;
  }

  #activateDialogSteppers(html) {
    html.find(".camc-dialog-stepper button").on("click", ev => {
      ev.preventDefault();
      const wrapper = ev.currentTarget.closest(".camc-dialog-stepper");
      const input = wrapper?.querySelector("input");
      if (!input) return;
      const min = Number(wrapper.dataset.min ?? input.min ?? -Infinity);
      const max = Number(wrapper.dataset.max ?? input.max ?? Infinity);
      const delta = Number(ev.currentTarget.dataset.delta ?? 0);
      const next = Math.max(min, Math.min(max, Number(input.value || 0) + delta));
      input.value = String(next);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  #getItem(event) {
    const li = event.currentTarget.closest("[data-item-id]");
    return this.actor.items.get(li?.dataset.itemId);
  }

  async #toggleEquip(event) {
    event.preventDefault();
    const item = this.#getItem(event);
    if (!item) return;
    if (item.type === "armadura") return item.update({ "system.equipada": !item.system.equipada });
    if (item.type === "escudo") return item.update({ "system.equipado": !item.system.equipado });
    if (item.type === "objeto" && !item.system.equipada && item.system.tipo === "modificacion_moto") {
      const validation = this.#validateMotoMod(item);
      if (!validation.ok) return ui.notifications.warn(validation.message);
    }
    if (["arma", "objeto"].includes(item.type)) return item.update({ "system.equipada": !item.system.equipada });
  }

  async #toggleVestCalibration(event) {
    event.preventDefault();
    if (!game.user.isGM) return ui.notifications.warn("Solo el DJ puede calibrar las posiciones del chaleco.");
    const current = game.settings.get(CAMC.systemId, "vestCalibration");
    await game.settings.set(CAMC.systemId, "vestCalibration", !current);
    this.render(false);
  }

  async #setCarryLocation(event) {
    event.preventDefault();
    const item = this.#getItem(event);
    const ubicacion = event.currentTarget.value || "mochila";
    if (!item || !CAMC.ubicacionesCarga[ubicacion]) return;
    const validation = await this.#validateCarryLocation(item, ubicacion);
    if (!validation.ok) {
      event.currentTarget.value = item.system.carga?.ubicacion || "mochila";
      return ui.notifications.warn(validation.message);
    }
    await item.update({ "system.carga.ubicacion": ubicacion });
  }

  async #setVestPatch(event) {
    event.preventDefault();
    const slot = event.currentTarget.dataset.slot;
    const cfg = CAMC.patchSlots[slot];
    const value = event.currentTarget.value;
    if (!slot || !cfg || cfg.source !== "manual") return;
    const patch = CAMC.patches[value];
    if (value && patch?.group !== cfg.allowedGroup) return ui.notifications.warn("Ese parche no puede colocarse en este hueco.");
    const repeated = Object.entries(this.actor.system.chaleco ?? {}).some(([otherSlot, otherValue]) => {
      return otherSlot !== slot && this.#assetKey(otherValue, "") === value;
    });
    if (value && repeated) {
      event.currentTarget.value = this.actor.system.chaleco?.[slot] || "";
      return ui.notifications.warn("Ese parche ya está colocado en otro hueco del chaleco.");
    }
    await this.actor.update({ [`system.chaleco.${slot}`]: value });
  }

  async #dragVestPatch(event) {
    if (!game.user.isGM) return;
    event.preventDefault();
    const patch = event.currentTarget;
    const slot = patch.dataset.slot;
    const canvas = patch.closest(".camc-vest-canvas");
    if (!slot || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const onMove = ev => {
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      patch.style.left = `${Math.max(0, Math.min(100, x)).toFixed(2)}%`;
      patch.style.top = `${Math.max(0, Math.min(100, y)).toFixed(2)}%`;
    };
    const onUp = async () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      await this.#saveVestPatchPosition(slot, patch);
      ui.notifications.info(`Coordenadas de ${slot} guardadas.`);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  async #resizeVestPatch(event) {
    if (!game.user.isGM) return;
    event.preventDefault();
    const patch = event.currentTarget;
    const slot = patch.dataset.slot;
    if (!slot) return;
    const delta = event.deltaY < 0 ? 0.5 : -0.5;
    const currentW = Number.parseFloat(patch.style.width) || 10;
    const currentH = Number.parseFloat(patch.style.height) || 5;
    patch.style.width = `${Math.max(1, Math.min(60, currentW + delta)).toFixed(2)}%`;
    patch.style.height = `${Math.max(1, Math.min(60, currentH + delta * 0.45)).toFixed(2)}%`;
    await this.#saveVestPatchPosition(slot, patch);
  }

  async #saveVestPatchPosition(slot, patch) {
    const overrides = foundry.utils.deepClone(game.settings.get(CAMC.systemId, "vestSlotOverridesV2") ?? {});
    overrides[slot] = {
      x: Number.parseFloat(patch.style.left) || 0,
      y: Number.parseFloat(patch.style.top) || 0,
      w: Number.parseFloat(patch.style.width) || 10,
      h: Number.parseFloat(patch.style.height) || 5
    };
    await game.settings.set(CAMC.systemId, "vestSlotOverridesV2", overrides);
  }

  async #rollDamage(event) {
    event.preventDefault();
    const item = this.#getItem(event);
    if (!item) return;
    if (item.tieneMunicion?.()) {
      const ok = await item.consumirMunicion(1);
      if (!ok) return ui.notifications.warn(`${item.name}: sin munición.`);
    }
    await YsystemDice.rollDamage(this.actor, item);
  }

  async #itemPrimaryAction(event) {
    event.preventDefault();
    const item = this.#getItem(event);
    if (!item) return;
    if (item.type === "arma") return this.#rollWeaponAttack(event);
    if (item.type === "don") return this.#useDon(event);
    if (item.type === "talento") return this.#useTalento(event);
    return item.sheet.render(true);
  }

  async #rollWeaponAttack(event) {
    event.preventDefault();
    const item = this.#getItem(event);
    if (!item || item.type !== "arma") return;
    const habilidad = this.#weaponSkill(item);
    const options = event.altKey ? { dificultad: null } : await this.#askRollOptions(habilidad, { weapon: item });
    if (options === null) return;
    const proezaDados = Number(options.proezaDados ?? 0);
    if (proezaDados > 0) {
      const ok = await this.actor.gastarProezas(proezaDados);
      if (!ok) return ui.notifications.warn("No hay proezas suficientes para añadir dados.");
    }
    options.armaPreparada = { id: item.id, name: item.name, label: item.name };
    await YsystemDice.rollSkill(this.actor, habilidad, options);
  }

  #weaponSkill(item) {
    if (item.system?.habilidad_ataque) return item.system.habilidad_ataque;
    const tipo = String(item.system?.tipo ?? item.system?.categoria ?? item.system?.alcance ?? "").toLowerCase();
    if (tipo.includes("distancia") || tipo.includes("fuego") || tipo.includes("arroj")) return "punteria";
    return "lucha";
  }

  async #changeActorImage(event) {
    event.preventDefault();
    const picker = new FilePicker({
      type: "image",
      current: this.actor.img,
      callback: path => this.actor.update({ img: path })
    });
    picker.render(true);
  }

  async #useDon(event) {
    event.preventDefault();
    const item = this.#getItem(event);
    if (!item || item.type !== "don") return;
    const coste = Math.max(0, Number(item.system.coste_proezas ?? 0));
    if (coste > 0) {
      const ok = await this.actor.gastarProezas(coste);
      if (!ok) return ui.notifications.warn(`${item.name}: no hay proezas suficientes.`);
    }
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: await renderTemplate(`systems/${CAMC.systemId}/templates/chat/roll-card.hbs`, {
        actor: this.actor,
        tipo: "don",
        item,
        coste
      })
    });
  }

  async #useTalento(event) {
    event.preventDefault();
    const item = this.#getItem(event);
    if (!item || item.type !== "talento") return;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: await renderTemplate(`systems/${CAMC.systemId}/templates/chat/roll-card.hbs`, {
        actor: this.actor,
        tipo: "talento",
        item
      })
    });
  }

  async #useCargoTalent(event) {
    event.preventDefault();
    const cargo = CAMC.cargos[this.actor.system.biografia?.cargo] ?? CAMC.cargos.full_patch;
    const item = {
      name: cargo.talento || cargo.label,
      system: {
        cargo: cargo.label,
        efecto: cargo.nota || "Talento de cargo."
      }
    };
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: await renderTemplate(`systems/${CAMC.systemId}/templates/chat/roll-card.hbs`, {
        actor: this.actor,
        tipo: "talento",
        item
      })
    });
  }

  async #createItem(event) {
    event.preventDefault();
    const type = event.currentTarget.dataset.type || "objeto";
    await this.actor.createEmbeddedDocuments("Item", [{ name: `Nuevo ${type}`, type }]);
  }

  async #buildMountCard(system) {
    const ref = system.mount ?? {};
    let moto = null;
    if (ref.uuid) {
      try { moto = await fromUuid(ref.uuid); }
      catch (_err) { moto = null; }
    }
    if (!moto) {
      return {
        linked: false,
        uuid: "",
        name: ref.name || "",
        img: ref.img || "",
        warning: ref.uuid ? "La moto vinculada no está disponible." : ""
      };
    }
    const s = moto.system ?? {};
    const estructura = s.reglas?.estructura ?? { value: 0, max: 1 };
    return {
      linked: true,
      uuid: moto.uuid,
      actor: moto,
      name: moto.name,
      img: moto.img,
      marca: s.identidad?.marca ?? "",
      modelo: s.identidad?.modelo ?? "",
      tipo: s.identidad?.tipo ?? "",
      estructura,
      estructuraPct: this.#pct(estructura.value, estructura.max),
      maniobrabilidad: s.reglas?.maniobrabilidad ?? 0,
      dano: s.reglas?.dados_dano ?? "2D",
      modsUsed: s.reglas?.mods_funcionales_usadas ?? 0,
      modsMax: s.reglas?.mods_funcionales_max ?? 2,
      status: s.reglas?.estado ?? "Operativa",
      damaged: s.reglas?.dano_grave,
      unusable: s.reglas?.inutilizada
    };
  }

  async #linkMount(moto) {
    await this.actor.update({ "system.mount": { uuid: moto.uuid, name: moto.name, img: moto.img } });
    await moto.update({ "system.vinculo.ownerUuid": this.actor.uuid, "system.vinculo.ownerName": this.actor.name });
    ui.notifications.info(`${moto.name} vinculada a ${this.actor.name}.`);
  }

  async #createMount(event) {
    event.preventDefault();
    const moto = await Actor.create({
      name: `Moto de ${this.actor.name}`,
      type: "moto",
      img: "systems/cuervos-de-asgard-mc/assets/ui/motorcycle.svg",
      system: { vinculo: { ownerUuid: this.actor.uuid, ownerName: this.actor.name } }
    });
    await this.#linkMount(moto);
    moto.sheet.render(true);
  }

  async #generateMount(event) {
    event.preventDefault();
    try {
      const data = generateRandomMount({
        seed: `${this.actor.id}-${Date.now()}`,
        ownerRole: CAMC.cargos[this.actor.system.biografia?.cargo]?.label ?? "",
        chapter: "Cuervos de Asgard"
      });
      data.system.vinculo = { ownerUuid: this.actor.uuid, ownerName: this.actor.name };
      data.system.mods = { funcionales: [], esteticas: [] };
      const items = data.items ?? [];
      delete data.items;
      const moto = await Actor.create(data);
      if (items.length) await moto.createEmbeddedDocuments("Item", items);
      await this.#linkMount(moto);
      moto.sheet.render(true);
    } catch (err) {
      console.error("CAMC | Error generando moto", err);
      ui.notifications.error("No se pudo generar la moto. Revisa la consola para ver el error.");
    }
  }

  async #generateCharacter() {
    const ok = window.confirm("Esto reemplazará los datos principales de este personaje. ¿Continuar?");
    if (!ok) return;
    try {
      const data = generateRandomCharacter({ seed: `${this.actor.id}-${Date.now()}` });
      data.img = this.actor.img || data.img;
      delete data.type;
      delete data.items;
      await this.actor.update(data);
      ui.notifications.info(`${this.actor.name} generado.`);
      this.render(false);
    } catch (err) {
      console.error("CAMC | Error generando personaje", err);
      ui.notifications.error("No se pudo generar el personaje. Revisa la consola.");
    }
  }

  async #getLinkedMount() {
    const uuid = this.actor.system.mount?.uuid;
    if (!uuid) return null;
    try { return await fromUuid(uuid); }
    catch (_err) { return null; }
  }

  async #openMount(event) {
    event.preventDefault();
    const moto = await this.#getLinkedMount();
    if (!moto) return ui.notifications.warn("No hay moto vinculada disponible.");
    moto.sheet.render(true);
  }

  async #unlinkMount(event) {
    event.preventDefault();
    const moto = await this.#getLinkedMount();
    await this.actor.update({ "system.mount": { uuid: "", name: "", img: "" } });
    if (moto?.system?.vinculo?.ownerUuid === this.actor.uuid) {
      await moto.update({ "system.vinculo.ownerUuid": "", "system.vinculo.ownerName": "" });
    }
  }

  async #repairMount(event) {
    event.preventDefault();
    const moto = await this.#getLinkedMount();
    if (!moto) return ui.notifications.warn("No hay moto vinculada.");
    const current = Number(moto.system.reglas?.estructura?.value ?? 0);
    const max = Number(moto.system.reglas?.estructura?.max ?? current);
    await moto.update({ "system.reglas.estructura.value": Math.min(max, current + 1) });
  }

  async #damageMount(event) {
    event.preventDefault();
    const moto = await this.#getLinkedMount();
    if (!moto) return ui.notifications.warn("No hay moto vinculada.");
    const current = Number(moto.system.reglas?.estructura?.value ?? 0);
    await moto.update({ "system.reglas.estructura.value": Math.max(0, current - 1) });
  }

  async #rollMountDrive(event) {
    event.preventDefault();
    const moto = await this.#getLinkedMount();
    if (!moto) return ui.notifications.warn("No hay moto vinculada.");
    return CAMCMountRolls.rollDrive(this.actor, moto, { label: event.currentTarget.dataset.action ?? "Conducir" });
  }

  async #deleteItem(event) {
    event.preventDefault();
    const item = this.#getItem(event);
    if (!item) return;
    const ok = await Dialog.confirm({ title: "Eliminar objeto", content: `<p>¿Eliminar <strong>${item.name}</strong>?</p>` });
    if (ok) await item.delete();
  }

  async #setRoleSkills() {
    const cargo = this.actor.system.biografia?.cargo;
    const skills = CAMC.cargos[cargo]?.habilidades ?? [];
    if (!skills.length) return ui.notifications.info("Este cargo permite escoger manualmente las cuatro habilidades favorecidas.");
    await this.actor.update({ "system.habilidades_favorecidas": skills.slice(0, 4) });
  }

  async #toggleFav(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const skill = button.dataset.skill;
    const current = new Set(this.actor.system.habilidades_favorecidas ?? []);
    if (current.has(skill)) current.delete(skill);
    else {
      if (current.size >= 4) return ui.notifications.warn("Solo puedes marcar hasta 4 habilidades favorecidas.");
      current.add(skill);
    }
    await this.actor.update({ "system.habilidades_favorecidas": Array.from(current) });
  }

  async #setSkillDice(event) {
    event.preventDefault();
    if (!game.settings.get(CAMC.systemId, "skillEditUnlocked")) {
      ui.notifications.info("Desbloquea la edición de dados con la llave inglesa.");
      return;
    }
    const button = event.currentTarget;
    const skill = button.dataset.skill;
    const rank = Number(button.dataset.value ?? 0);
    if (!skill || !rank) return;
    const current = Number(get(this.actor, `system.habilidades.${skill}.value`) ?? 0);
    const next = current === rank ? Math.max(0, rank - 1) : rank;
    await this.actor.update({ [`system.habilidades.${skill}.value`]: next });
  }

  async #toggleSkillEdit(event) {
    event.preventDefault();
    const current = game.settings.get(CAMC.systemId, "skillEditUnlocked");
    await game.settings.set(CAMC.systemId, "skillEditUnlocked", !current);
    this.render(false);
  }

  async #adjustNumber(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const path = button.dataset.path;
    const delta = Number(button.dataset.delta ?? 0);
    if (!path || !delta) return;
    const current = Number(get(this.actor, path) ?? 0);
    let next = current + delta;
    if (path.endsWith(".value")) {
      const maxPath = path.replace(/\.value$/, ".max");
      const max = Number(get(this.actor, maxPath));
      if (Number.isFinite(max)) next = Math.min(max, next);
    }
    await this.actor.update({ [path]: Math.max(0, next) });
  }

  #pct(value, max) {
    value = Number(value) || 0;
    max = Number(max) || 1;
    return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  }

  #resourceTone(value, max) {
    value = Number(value) || 0;
    if (value <= 0) return "danger";
    if (value <= 3) return "danger";
    if (value <= 6) return "warning";
    if (value <= 10) return "strained";
    return "good";
  }

  #scoreTone(value) {
    value = Number(value) || 0;
    if (value >= 4) return "peak";
    if (value >= 2) return "strong";
    if (value >= 1) return "trained";
    return "weak";
  }

  #signed(value) {
    value = Number(value) || 0;
    return value >= 0 ? `+${value}` : `${value}`;
  }

  #buildCarga(items, system, moto = null) {
    const portable = items.filter(i => ["arma", "armadura", "escudo", "objeto"].includes(i.type));
    const mochilaMax = Number(system.carga?.mochila_max ?? 6);
    const vehicleMods = String(system.vehiculo?.modificaciones ?? "").toLowerCase();
    const hasExtraSaddlebags = Boolean(system.carga?.alforjas_extra)
      || vehicleMods.includes("alforjas extra")
      || items.some(i => i.type === "objeto" && i.system?.equipada && String(i.name).toLowerCase().includes("alforjas extra"));
    const motoAlforjas = moto?.type === "moto" ? Number(moto.system?.reglas?.alforjas?.max ?? 0) : null;
    const alforjasMax = Number.isFinite(motoAlforjas)
      ? motoAlforjas
      : Number(system.carga?.alforjas_base ?? 8) + (hasExtraSaddlebags ? 8 : 0);
    const rows = portable.map(item => {
      const spaces = this.#itemSpaces(item);
      const quantity = item.type === "objeto" ? Math.max(1, Number(item.system.cantidad ?? 1)) : 1;
      const total = spaces * quantity;
      const ubicacion = item.system.carga?.ubicacion || "mochila";
      return {
        id: item.id,
        item,
        spaces,
        total,
        ubicacion,
        locationLabel: CAMC.ubicacionesCarga[ubicacion] ?? ubicacion,
        slots: this.#formatSlots(total)
      };
    });
    const mochila = rows.filter(r => r.ubicacion === "mochila").reduce((n, r) => n + r.total, 0);
    const alforjas = rows.filter(r => r.ubicacion === "alforjas").reduce((n, r) => n + r.total, 0);
    return {
      items: rows,
      mochila: this.#loadBlock(mochila, mochilaMax),
      alforjas: this.#loadBlock(alforjas, alforjasMax),
      mountName: moto?.name ?? "",
      mountLinked: Boolean(moto),
      hasExtraSaddlebags,
      ubicaciones: CAMC.ubicacionesCarga,
      reglas: moto
        ? `A pie: máximo 6 espacios. Alforjas activas: ${moto.name} (${this.#formatSlots(alforjasMax)} espacios). Pequeño 0,5; mediano 1; grande 2.`
        : "A pie: máximo 6 espacios. Pequeño 0,5; mediano 1; grande 2. Alforjas: 8 espacios de la moto; alforjas extra: +8 adicionales."
    };
  }

  #itemSpaces(item) {
    const explicit = Number(item.system.carga?.espacios);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const size = item.system.tamano || "mediano";
    if (size === "no_equipable") return 0;
    return Number(CAMC.cargaPorTamano[size] ?? 1);
  }

  async #validateCarryLocation(item, ubicacion) {
    if (ubicacion === "comunidad") return { ok: true };
    const moto = await this.#getLinkedMount();
    const carga = this.#buildCarga(this.actor.items.contents, this.actor.system, moto);
    const row = carga.items.find(entry => entry.id === item.id);
    if (!row || row.ubicacion === ubicacion) return { ok: true };
    const block = ubicacion === "alforjas" ? carga.alforjas : carga.mochila;
    const projected = Number(block.raw ?? 0) + Number(row.total ?? 0);
    if (projected <= Number(block.rawMax ?? 0)) return { ok: true };
    return {
      ok: false,
      message: `${item.name} no cabe en ${CAMC.ubicacionesCarga[ubicacion]}: ${this.#formatSlots(projected)} / ${this.#formatSlots(block.rawMax)} espacios.`
    };
  }

  #validateMotoMod(item) {
    const active = this.actor.items.filter(entry => entry.type === "objeto" && entry.system?.equipada && entry.system?.tipo === "modificacion_moto" && entry.id !== item.id);
    const names = active.map(entry => String(entry.name ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const nextName = String(item.name ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (nextName.includes("ultrarreforzado") && !names.includes("chasis reforzado")) {
      return { ok: false, message: "Chasis ultrarreforzado requiere tener equipado Chasis reforzado." };
    }
    const hasSidecar = names.some(name => name.includes("sidecar")) || nextName.includes("sidecar");
    const max = hasSidecar ? 3 : 2;
    if (active.length + 1 > max) {
      return { ok: false, message: `La moto no puede tener más de ${max} modificaciones funcionales${hasSidecar ? " con sidecar" : ""}.` };
    }
    return { ok: true };
  }

  #loadBlock(value, max) {
    return {
      value: this.#formatSlots(value),
      max: this.#formatSlots(max),
      raw: value,
      rawMax: max,
      pct: this.#pct(value, max),
      over: value > max
    };
  }

  #formatSlots(value) {
    value = Number(value) || 0;
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
  }

  #assetKey(value, fallback) {
    const key = String(value || fallback).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
    return key || fallback;
  }

  #buildPatchGroups() {
    const groups = { cargo: [], deidad: [], merito: [] };
    for (const [key, patch] of Object.entries(CAMC.patches)) {
      if (groups[patch.group]) groups[patch.group].push({ key, ...patch });
    }
    for (const list of Object.values(groups)) list.sort((a, b) => a.label.localeCompare(b.label));
    return groups;
  }

  #buildVestSlots(system) {
    const slots = [];
    const overrides = game.settings.get(CAMC.systemId, "vestSlotOverridesV2") ?? {};
    const selectedManualPatches = new Map(Object.entries(system.chaleco ?? {})
      .map(([slot, value]) => [slot, this.#assetKey(value, "")])
      .filter(([, value]) => value));
    const usedByOtherSlot = (slotKey, patchKey) => Array.from(selectedManualPatches.entries())
      .some(([otherSlot, otherPatch]) => otherSlot !== slotKey && otherPatch === patchKey);
    const groupsByAllowedGroup = (group, slotKey, currentPatchKey = "") => Object.entries(CAMC.patches)
      .filter(([, patch]) => patch.group === group)
      .filter(([patchKey]) => patchKey === currentPatchKey || !usedByOtherSlot(slotKey, patchKey))
      .map(([key, patch]) => ({ key, ...patch }))
      .sort((a, b) => a.label.localeCompare(b.label));
    const forceSlotSize = new Set(["merito_izq_1", "parche_espalda"]);
    for (const [key, slot] of Object.entries(CAMC.patchSlots)) {
      const calibrated = overrides[key] ?? {};
      const position = forceSlotSize.has(key)
        ? { ...slot, x: calibrated.x ?? slot.x, y: calibrated.y ?? slot.y }
        : { ...slot, ...calibrated };
      let patchKey = "";
      if (position.source === "cargo") patchKey = this.#assetKey(system.biografia?.cargo, "");
      else if (position.source === "deidad") patchKey = this.#assetKey(system.biografia?.deidad, "");
      else patchKey = this.#assetKey(system.chaleco?.[key], "");
      const patch = CAMC.patches[patchKey];
      const options = position.source === "manual" ? groupsByAllowedGroup(position.allowedGroup, key, patchKey) : [];
      slots.push({
        key,
        ...position,
        patchKey,
        patch,
        options,
        img: patch?.img ?? "",
        label: patch?.label ?? slot.label,
        efecto: patch?.efecto ?? ""
      });
    }
    return slots;
  }
}
