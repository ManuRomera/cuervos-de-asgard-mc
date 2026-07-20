import { CAMC } from "../config.mjs";
import { YsystemDice } from "../dice/ysystem-dice.mjs";
import { generateRandomMount } from "../mount/mount-generator.mjs";
import { CAMCMountRolls } from "../mount/mount-rolls.mjs";
import { CAMCCharacterArchetypes, generateRandomCharacter } from "../generator/camc-generators.mjs";

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

    const destacadas = habilidades.filter(h => h.favorecida);

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
    html.find(".vest-size-adjust").on("click", ev => this.#adjustVestPatchSize(ev));
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
    html.find(".roll-initial-health, .roll-initial-values").on("click", ev => this.#rollInitialValues(ev));
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
    const options = event.altKey ? { dificultad: null, aplicaSalud: false } : await this.#askRollOptions(habilidad);
    if (options === null) return;
    const proezaDados = Number(options.proezaDados ?? 0);
    if (proezaDados > 0) {
      const ok = await this.actor.gastarProezas(proezaDados);
      if (!ok) return ui.notifications.warn("No hay proezas suficientes para añadir dados.");
    }
    if (options.recuerdoCuando) await this.actor.update({ "system.biografia.recuerdo_cuando_usado": true });
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
    const recuerdoUsado = Boolean(this.actor.system.biografia?.recuerdo_cuando_usado);
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
        <label class="camc-checkline"><input name="aplicaSalud" type="checkbox"/> Aplicar penalizador de Salud (${penalty.label})</label>
        <label class="camc-checkline"><input name="recuerdoCuando" type="checkbox" ${recuerdoUsado ? "disabled" : ""}/> Recuerdo cuando (+2D, no compatible con gastar proezas)${recuerdoUsado ? " · ya usado" : ""}</label>
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
            const recuerdoCuando = html.find('[name="recuerdoCuando"]').is(":checked");
            resolve({
              dificultad: Number.isFinite(dificultadManual) && dificultadManual > 0 ? dificultadManual : (dificultad === "" ? null : Number(dificultad)),
              modificador: Number(html.find('[name="modificador"]').val() ?? 0),
              dadosExtra: Number(html.find('[name="dadosExtra"]').val() ?? 0),
              proezaDados: recuerdoCuando ? 0 : Math.max(0, Number(html.find('[name="proezaDados"]').val() ?? 0)),
              dadosSacrificados: Math.max(0, Number(html.find('[name="dadosSacrificados"]').val() ?? 0)),
              aplicaSalud: html.find('[name="aplicaSalud"]').is(":checked"),
              recuerdoCuando,
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
    await this.#applyVestPatchSize(slot, delta);
  }

  async #adjustVestPatchSize(event) {
    if (!game.user.isGM) return;
    event.preventDefault();
    event.stopPropagation();
    const slot = event.currentTarget.dataset.slot;
    const delta = Number(event.currentTarget.dataset.delta ?? 0) * 1.4;
    if (!slot || !delta) return;
    await this.#applyVestPatchSize(slot, delta);
  }

  async #applyVestPatchSize(slot, delta) {
    const nodes = this.element[0]?.querySelectorAll(`.camc-vest-patch[data-slot="${slot}"], .camc-vest-slot-guide[data-slot="${slot}"]`) ?? [];
    const patch = nodes[0];
    if (!patch) return;
    const currentW = Number.parseFloat(patch.style.width) || Number(CAMC.patchSlots[slot]?.w ?? 10);
    const currentH = Number.parseFloat(patch.style.height) || Number(CAMC.patchSlots[slot]?.h ?? 5);
    const ratio = currentW > 0 ? currentH / currentW : 0.45;
    const nextW = Math.max(1, Math.min(85, currentW + delta));
    const nextH = Math.max(1, Math.min(65, currentH + (delta * ratio)));
    for (const node of nodes) {
      node.style.width = `${nextW.toFixed(2)}%`;
      node.style.height = `${nextH.toFixed(2)}%`;
    }
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
    const options = event.altKey ? { dificultad: null, aplicaSalud: false } : await this.#askRollOptions(habilidad, { weapon: item });
    if (options === null) return;
    const proezaDados = Number(options.proezaDados ?? 0);
    if (proezaDados > 0) {
      const ok = await this.actor.gastarProezas(proezaDados);
      if (!ok) return ui.notifications.warn("No hay proezas suficientes para añadir dados.");
    }
    if (options.recuerdoCuando) await this.actor.update({ "system.biografia.recuerdo_cuando_usado": true });
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
    if (type === "vehiculo") {
      return ui.notifications.warn("Las motos son Actores de tipo Moto. Créala fuera de la ficha y vincúlala arrastrándola sobre el PJ o desde la hoja de moto.");
    }
    const [item] = await this.actor.createEmbeddedDocuments("Item", [{ name: `Nuevo ${type}`, type }]);
    item?.sheet?.render(true);
  }

  async #rollInitialValues(event) {
    event.preventDefault();
    if (this.actor.system.combate?.tiradas_iniciales_hechas) {
      const confirm = await Dialog.confirm({
        title: "Repetir tiradas iniciales",
        content: "<p>Las tiradas iniciales ya se realizaron. ¿Seguro que quieres repetirlas? Se publicará en el chat el valor anterior y el nuevo resultado.</p>"
      });
      if (!confirm) return;
    }
    const fue = Number(this.actor.system.atributos?.fue?.value ?? 0);
    const int = Number(this.actor.system.atributos?.int?.value ?? 0);
    const previousHealth = foundry.utils.deepClone(this.actor.system.combate?.salud ?? {});
    const previousProezas = foundry.utils.deepClone(this.actor.system.combate?.proezas ?? {});
    const roll = await (new Roll("1d6")).evaluate({ async: true });
    const saludTotal = 10 + (fue * 2) + Number(roll.total ?? 0);
    const proezasTotal = Math.max(3, Math.floor((fue + int) / 2) + 3);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      rolls: [roll],
      content: `
        <div class="camc-chat-card camc-initial-rolls">
          <header><h3><i class="fas fa-dice-d6"></i> Tiradas iniciales</h3><strong>${this.#escapeHtml(this.actor.name)}</strong></header>
          <p><b>Salud anterior:</b> ${Number(previousHealth.value ?? 0)} / ${Number(previousHealth.max ?? 0)}${previousHealth.roll_inicial ? ` (1D anterior: ${previousHealth.roll_inicial})` : ""}</p>
          <p><b>Salud nueva:</b> FUE ${fue} x 2 + 10 + 1D (${Number(roll.total ?? 0)}) = <strong>${saludTotal}</strong></p>
          <p><b>Proezas anteriores:</b> ${Number(previousProezas.value ?? 0)} / ${Number(previousProezas.max ?? 0)}</p>
          <p><b>Proezas nuevas:</b> piso((FUE ${fue} + INT ${int}) / 2) + 3 = <strong>${proezasTotal}</strong></p>
        </div>`
    });
    await this.actor.update({
      "system.combate.salud.roll_inicial": Number(roll.total ?? 0),
      "system.combate.salud.max": saludTotal,
      "system.combate.salud.value": saludTotal,
      "system.combate.proezas.max": proezasTotal,
      "system.combate.proezas.value": proezasTotal,
      "system.combate.tiradas_iniciales_hechas": true
    });
  }

  async #buildMountCard(system) {
    const ref = system.mount ?? {};
    let moto = await this.#resolveActorUuid(ref.uuid);
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
      plazas: s.reglas?.plazas ?? 1,
      dano: s.reglas?.dados_dano ?? "2D",
      modsUsed: s.reglas?.mods_funcionales_usadas ?? 0,
      modsMax: s.reglas?.mods_funcionales_max ?? 2,
      status: s.reglas?.estado ?? "Operativa",
      damaged: s.reglas?.dano_grave,
      unusable: s.reglas?.inutilizada
    };
  }

  async #linkMount(moto) {
    const uuid = moto.uuid || (moto.id ? `Actor.${moto.id}` : "");
    await this.actor.update({ "system.mount": { uuid, name: moto.name, img: moto.img } });
    await moto.update({ "system.vinculo.ownerUuid": this.actor.uuid, "system.vinculo.ownerName": this.actor.name });
    ui.notifications.info(`${moto.name} vinculada a ${this.actor.name}.`);
    for (const app of Object.values(moto.apps ?? {})) app.render(false);
    this.render(false);
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
    try {
      const state = {
        seed: `${this.actor.id}-${Date.now()}`,
        name: this.actor.name,
        jugador: this.actor.system.biografia?.jugador ?? "",
        edad: this.actor.system.biografia?.edad ?? "",
        cargo: this.actor.system.biografia?.cargo || "capitan_rutas",
        deidad: this.actor.system.biografia?.deidad || "odin",
        archetype: this.#defaultArchetypeForCargo(this.actor.system.biografia?.cargo),
        favored: []
      };
      const identity = await this.#characterWizardIdentity(state);
      if (!identity) return;
      Object.assign(state, identity);
      if (state.randomComplete) {
        const healthRoll = await (new Roll("1d6")).evaluate({ async: true });
        const data = generateRandomCharacter({
          seed: `${this.actor.id}-${Date.now()}-random-full`,
          jugador: state.jugador,
          edad: state.edad,
          saludRoll: Number(healthRoll.total ?? 1)
        });
        data.img = this.actor.img || data.img;
        delete data.type;
        delete data.items;
        await this.actor.update(data);
        const fue = Number(this.actor.system.atributos?.fue?.value ?? 0);
        const total = 10 + (fue * 2) + Number(healthRoll.total ?? 0);
        await healthRoll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: `${this.actor.name}: PJ aleatorio completo. Salud inicial = FUE x 2 + 10 + 1D = ${total}`
        });
        ui.notifications.info(`${this.actor.name} generado aleatoriamente.`);
        this.render(false);
        return;
      }
      const favored = await this.#characterWizardFavored(state);
      if (!favored) return;
      state.favored = favored;
      const finalOptions = await this.#characterWizardFinish(state);
      if (!finalOptions) return;

      let healthRoll = null;
      if (finalOptions.rollHealth) {
        healthRoll = await (new Roll("1d6")).evaluate({ async: true });
      }
      const data = generateRandomCharacter({
        seed: state.seed,
        name: state.name,
        jugador: state.jugador,
        edad: state.edad,
        cargo: state.cargo,
        deidad: state.deidad,
        archetype: state.archetype,
        favored: state.favored,
        saludRoll: healthRoll ? Number(healthRoll.total ?? 1) : 1
      });
      data.img = this.actor.img || data.img;
      delete data.type;
      delete data.items;
      await this.actor.update(data);
      if (healthRoll) {
        const fue = Number(this.actor.system.atributos?.fue?.value ?? 0);
        const total = 10 + (fue * 2) + Number(healthRoll.total ?? 0);
        await healthRoll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: `${this.actor.name}: Salud inicial generada = FUE x 2 + 10 + 1D = ${total}`
        });
      }
      if (finalOptions.createMount) await this.#createGeneratedMountForActor();
      ui.notifications.info(`${this.actor.name} generado.`);
      this.render(false);
    } catch (err) {
      console.error("CAMC | Error generando personaje", err);
      ui.notifications.error("No se pudo generar el personaje. Revisa la consola.");
    }
  }

  async #characterWizardIdentity(state) {
    const cargoOptions = Object.entries(CAMC.cargos)
      .filter(([key]) => key !== "full_patch")
      .map(([key, cargo]) => `<option value="${key}" ${state.cargo === key ? "selected" : ""}>${cargo.label}</option>`)
      .join("");
    const deityOptions = Object.entries(CAMC.dioses)
      .map(([key, dios]) => `<option value="${key}" ${state.deidad === key ? "selected" : ""}>${dios.label} · ${dios.virtud}</option>`)
      .join("");
    const archetypeOptions = this.#archetypeOptions(state.archetype);
    const content = `
      <form class="camc-dialog camc-character-wizard">
        <p><strong>Paso 1 de 3: identidad y enfoque.</strong> El asistente reemplazará los datos principales de este PJ manteniendo su imagen actual.</p>
        <div class="camc-dialog-grid">
          <label><span>Nombre</span><input name="name" type="text" value="${this.#escapeHtml(state.name)}"/></label>
          <label><span>Jugador</span><input name="jugador" type="text" value="${this.#escapeHtml(state.jugador)}"/></label>
          <label><span>Edad</span><input name="edad" type="text" value="${this.#escapeHtml(state.edad)}"/></label>
          <label><span>Cargo</span><select name="cargo">${cargoOptions}</select></label>
          <label><span>Deidad</span><select name="deidad">${deityOptions}</select></label>
          <label><span>Enfoque de atributos</span><select name="archetype">${archetypeOptions}</select></label>
        </div>
        <p class="notes">Los atributos se asignan como 6, 4, 2, 1 y 0 según el enfoque elegido. En el siguiente paso se fijan exactamente cuatro habilidades favorecidas.</p>
      </form>`;
    return new Promise(resolve => new Dialog({
      title: "Generador de PJ · Identidad",
      content,
      buttons: {
        random: {
          label: "Aleatorio",
          callback: html => resolve({
            jugador: String(html.find('[name="jugador"]').val() || "").trim(),
            edad: String(this.#randomInt(18, 68)),
            randomComplete: true
          })
        },
        ok: {
          label: "Siguiente",
          callback: html => resolve({
            name: String(html.find('[name="name"]').val() || this.actor.name).trim(),
            jugador: String(html.find('[name="jugador"]').val() || "").trim(),
            edad: String(html.find('[name="edad"]').val() || "").trim(),
            cargo: String(html.find('[name="cargo"]').val() || "capitan_rutas"),
            deidad: String(html.find('[name="deidad"]').val() || "odin"),
            archetype: String(html.find('[name="archetype"]').val() || "ruta"),
            randomComplete: false
          })
        },
        cancel: { label: "Cancelar", callback: () => resolve(null) }
      },
      default: "ok",
      close: () => resolve(null)
    }, { width: 820, resizable: true }).render(true));
  }

  async #characterWizardFavored(state) {
    const cargoSkills = CAMC.cargos[state.cargo]?.habilidades ?? [];
    const defaults = cargoSkills.length ? cargoSkills : this.#defaultFavoredForArchetype(state.archetype);
    const rows = Object.entries(CAMC.habilidades).map(([key, skill]) => `
      <label class="camc-checkline">
        <input name="favored" type="checkbox" value="${key}" ${defaults.includes(key) ? "checked" : ""}/>
        ${skill.label} <small>${CAMC.atributos[skill.atributo]?.short ?? skill.atributo.toUpperCase()}</small>
      </label>`).join("");
    const cargoLabel = CAMC.cargos[state.cargo]?.label ?? "Cargo";
    const content = `
      <form class="camc-dialog camc-character-wizard">
        <p><strong>Paso 2 de 3: habilidades favorecidas.</strong> ${cargoLabel} ${cargoSkills.length ? "propone sus cuatro habilidades del cargo." : "permite escoger cuatro habilidades."}</p>
        <div class="camc-wizard-skill-grid">${rows}</div>
        <p class="notes">Debes dejar marcadas exactamente cuatro. En la ficha aparecerán como Habilidades favorecidas.</p>
      </form>`;
    return this.#dialogPromise({
      title: "Generador de PJ · Habilidades favorecidas",
      content,
      okLabel: "Siguiente",
      read: html => {
        const selected = html.find('[name="favored"]:checked').map((_, input) => input.value).get();
        if (selected.length !== 4) {
          ui.notifications.warn("El PJ debe tener exactamente 4 habilidades favorecidas.");
          return null;
        }
        return selected;
      }
    });
  }

  async #characterWizardFinish(state) {
    const attrOrder = CAMCCharacterArchetypes[state.archetype] ?? CAMCCharacterArchetypes.ruta;
    const attrs = attrOrder.map((key, index) => `${CAMC.atributos[key]?.short ?? key.toUpperCase()} ${[6, 4, 2, 1, 0][index]}`).join(" · ");
    const skills = state.favored.map(key => CAMC.habilidades[key]?.label ?? key).join(", ");
    const content = `
      <form class="camc-dialog camc-character-wizard">
        <p><strong>Paso 3 de 3: revisar y crear.</strong></p>
        <dl class="camc-wizard-summary">
          <dt>Cargo</dt><dd>${this.#escapeHtml(CAMC.cargos[state.cargo]?.label ?? state.cargo)}</dd>
          <dt>Deidad</dt><dd>${this.#escapeHtml(CAMC.dioses[state.deidad]?.label ?? state.deidad)} · ${this.#escapeHtml(CAMC.dioses[state.deidad]?.virtud ?? "")}</dd>
          <dt>Atributos</dt><dd>${attrs}</dd>
          <dt>Habilidades favorecidas</dt><dd>${this.#escapeHtml(skills)}</dd>
        </dl>
        <label class="camc-checkline"><input name="rollHealth" type="checkbox" checked/> Tirar Salud inicial en el chat (FUE x 2 + 10 + 1D)</label>
        <label class="camc-checkline"><input name="createMount" type="checkbox"/> Generar y vincular una moto inicial</label>
      </form>`;
    return this.#dialogPromise({
      title: "Generador de PJ · Confirmar",
      content,
      okLabel: "Crear PJ",
      read: html => ({
        rollHealth: html.find('[name="rollHealth"]').is(":checked"),
        createMount: html.find('[name="createMount"]').is(":checked")
      })
    });
  }

  async #createGeneratedMountForActor() {
    const data = generateRandomMount({
      seed: `${this.actor.id}-${Date.now()}-wizard-mount`,
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
  }

  #dialogPromise({ title, content, okLabel = "Aceptar", read }) {
    return new Promise(resolve => new Dialog({
      title,
      content,
      buttons: {
        ok: {
          label: okLabel,
          callback: html => resolve(read(html))
        },
        cancel: { label: "Cancelar", callback: () => resolve(null) }
      },
      default: "ok",
      close: () => resolve(null)
    }, { width: 820, resizable: true }).render(true));
  }

  #archetypeOptions(selected = "ruta") {
    const labels = {
      lider: "Liderazgo (CAR, INT, PER, DES, FUE)",
      ruta: "Ruta (DES, PER, INT, CAR, FUE)",
      combate: "Combate (DES, FUE, PER, CAR, INT)",
      mecanica: "Mecánica (INT, DES, PER, FUE, CAR)",
      supervivencia: "Supervivencia (PER, FUE, DES, INT, CAR)",
      social: "Social (CAR, PER, INT, DES, FUE)"
    };
    return Object.keys(CAMCCharacterArchetypes)
      .map(key => `<option value="${key}" ${selected === key ? "selected" : ""}>${labels[key] ?? key}</option>`)
      .join("");
  }

  #defaultArchetypeForCargo(cargo) {
    const map = {
      presidente: "lider",
      vicepresidente: "social",
      secretario: "mecanica",
      tesorero: "supervivencia",
      sargento_armas: "combate",
      capitan_rutas: "ruta",
      mecanico_jefe: "mecanica"
    };
    return map[cargo] ?? "ruta";
  }

  #defaultFavoredForArchetype(archetype) {
    const map = {
      lider: ["conversacion", "intimidacion", "informacion", "psicologia"],
      ruta: ["conducir", "entorno", "observacion", "rastreo"],
      combate: ["atletismo", "lucha", "punteria", "intimidacion"],
      mecanica: ["conducir", "mecanica", "informacion", "fuerza_bruta"],
      supervivencia: ["auxilio", "oido", "supervivencia", "ocultacion"],
      social: ["conversacion", "seduccion", "subterfugio", "psicologia"]
    };
    return map[archetype] ?? map.ruta;
  }

  #escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
  }

  #pickRandom(list, fallback = "") {
    if (!Array.isArray(list) || !list.length) return fallback;
    return list[Math.floor(Math.random() * list.length)] ?? fallback;
  }

  #randomInt(min, max) {
    min = Math.ceil(Number(min) || 0);
    max = Math.floor(Number(max) || min);
    return min + Math.floor(Math.random() * Math.max(1, (max - min) + 1));
  }

  async #getLinkedMount() {
    const uuid = this.actor.system.mount?.uuid;
    if (!uuid) return null;
    return this.#resolveActorUuid(uuid);
  }

  async #resolveActorUuid(uuid) {
    if (!uuid) return null;
    try {
      const doc = await fromUuid(uuid);
      if (doc) return doc;
    } catch (_err) {
      /* fallback below */
    }
    const match = String(uuid).match(/^Actor\.([^\.]+)$/);
    return match ? game.actors.get(match[1]) ?? null : null;
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
    const baseAlforjas = Number(system.carga?.alforjas_base ?? 8);
    const alforjasMax = Math.max(baseAlforjas, Number.isFinite(motoAlforjas) ? motoAlforjas : 0) + (hasExtraSaddlebags ? 8 : 0);
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
    for (const [key, slot] of Object.entries(CAMC.patchSlots)) {
      const calibrated = overrides[key] ?? {};
      const position = { ...slot, ...calibrated };
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
