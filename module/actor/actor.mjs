import { CAMC } from "../config.mjs";

const get = foundry.utils.getProperty;

export class CAMCActor extends Actor {
  prepareData() {
    super.prepareData();
    if (this.type === "personaje") this.#preparePersonaje();
    if (this.type === "pnj") this.#preparePNJ();
    if (this.type === "moto") this.#prepareMoto();
  }

  #num(path, fallback = 0) {
    const value = Number(get(this, path));
    return Number.isFinite(value) ? value : fallback;
  }

  #preparePersonaje() {
    const s = this.system;
    s.habilidades_favorecidas ??= [];
    const fue = this.#num("system.atributos.fue.value");
    const des = this.#num("system.atributos.des.value");
    const int = this.#num("system.atributos.int.value");
    const per = this.#num("system.atributos.per.value");
    const car = this.#num("system.atributos.car.value");
    const atletismo = this.#num("system.habilidades.atletismo.value", 1);
    const conducir = this.#num("system.habilidades.conducir.value", 1);
    s.carga ??= {};
    s.carga.mochila_max ??= 6;
    s.carga.alforjas_base ??= 8;
    s.carga.alforjas_extra ??= false;
    s.mount ??= { uuid: "", name: "", img: "" };
    s.vehiculo ??= {};
    s.vehiculo.estructura ??= { value: 15, max: 15 };
    s.vehiculo.base_estructura ??= Number(s.vehiculo.estructura.max ?? 15);
    s.vehiculo.base_dados_dano ??= s.vehiculo.dados_dano || "2D";
    s.vehiculo.base_maniobrabilidad ??= Number(s.vehiculo.maniobrabilidad ?? 2);
    s.vehiculo.base_ocupantes ??= Number(s.vehiculo.ocupantes ?? 1);
    s.biografia ??= {};
    s.biografia.edad ??= "";
    s.biografia.recuerdo_cuando_usado ??= false;
    const cargo = CAMC.cargos[s.biografia.cargo] ?? CAMC.cargos.full_patch;
    const deidad = CAMC.dioses[s.biografia.deidad] ?? {};
    s.biografia.virtud = deidad.virtud ?? "";
    s.biografia.talento = cargo.talento ?? "";

    s.valores_pasivos.agilidad = (atletismo * 3) + des - this.#proteccionPenalizacion();
    s.valores_pasivos.evasion = (conducir * 3) + des - this.#proteccionPenalizacion();
    s.valores_pasivos.aplomo = car + int + 5;
    s.valores_pasivos.perspicacia = int + per + 5;
    const vehicleMods = this.#getVehicleMods();
    s.carga.alforjas_extra_activa = Boolean(s.carga.alforjas_extra || vehicleMods.alforjasExtra);
    s.vehiculo.efectos_mods = vehicleMods.labels;
    s.vehiculo.estructura.max = Number(s.vehiculo.base_estructura ?? 15) + vehicleMods.estructura;
    s.vehiculo.estructura.value = Math.min(Number(s.vehiculo.estructura.value ?? s.vehiculo.estructura.max), s.vehiculo.estructura.max);
    s.vehiculo.maniobrabilidad = Number(s.vehiculo.base_maniobrabilidad ?? 2) + vehicleMods.maniobrabilidad;
    s.vehiculo.ocupantes = Number(s.vehiculo.base_ocupantes ?? 1) + vehicleMods.ocupantes;
    s.vehiculo.dados_dano = this.#addVehicleDamageDice(s.vehiculo.base_dados_dano ?? "2D", vehicleMods.dadosDano);
    s.vehiculo.modificaciones_max = vehicleMods.sidecar ? 3 : 2;

    s.combate.iniciativa = des + int + vehicleMods.iniciativa;
    s.combate.tiradas_iniciales_hechas ??= false;
    s.combate.arma_preparada = this.getArmaPreparada();
    s.combate.penalizador_salud = this.getPenalizadorSalud();
    s.combate.resistencia_fisica = Math.max(0, 12 - fue);
    const saludRoll = Number(s.combate.salud.roll_inicial ?? 0);
    if (saludRoll > 0) s.combate.salud.max = 10 + (fue * 2) + saludRoll;
    else s.combate.salud.max ||= 10 + (fue * 2) + 1;
    s.combate.salud.value = Math.min(s.combate.salud.value ?? s.combate.salud.max, s.combate.salud.max);
    const previousProezasMax = Number(s.combate.proezas.max ?? 3);
    const previousProezasValue = Number(s.combate.proezas.value ?? previousProezasMax);
    s.combate.proezas.max = Math.max(3, Math.floor((fue + int) / 2) + 3);
    if (!Number.isFinite(previousProezasValue) || previousProezasValue === previousProezasMax) {
      s.combate.proezas.value = s.combate.proezas.max;
    } else {
      s.combate.proezas.value = Math.max(0, previousProezasValue);
    }
    this.#calcularProteccion();
  }

  #getVehicleMods() {
    const mods = {
      labels: [],
      iniciativa: 0,
      estructura: 0,
      maniobrabilidad: 0,
      ocupantes: 0,
      dadosDano: 0,
      alforjasExtra: false,
      sidecar: false
    };
    const active = this.items?.filter(item => item.type === "objeto" && item.system?.equipada && item.system?.tipo === "modificacion_moto") ?? [];
    for (const item of active) {
      const key = String(item.name ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      mods.labels.push(item.name);
      if (key.includes("acelerador")) mods.iniciativa += 5;
      if (key.includes("alforjas")) mods.alforjasExtra = true;
      if (key === "chasis reforzado") mods.estructura += 5;
      if (key.includes("ultrarreforzado")) { mods.estructura += 5; mods.maniobrabilidad -= 1; }
      if (key.includes("configuracion ofensiva")) mods.dadosDano += 1;
      if (key.includes("manillar adaptado")) { mods.iniciativa += 1; mods.maniobrabilidad += 1; }
      if (key.includes("ruedas reforzadas")) { mods.estructura += 1; mods.maniobrabilidad += 1; }
      if (key.includes("sidecar")) { mods.sidecar = true; mods.ocupantes += 1; mods.maniobrabilidad -= 1; }
      if (key.includes("suspension mejorada")) mods.maniobrabilidad += 1;
    }
    return mods;
  }

  #addVehicleDamageDice(formula, extraDice = 0) {
    const match = String(formula || "2D").match(/(\d+)\s*D/i);
    if (!match) return formula || "2D";
    return `${Number(match[1]) + Number(extraDice || 0)}D`;
  }

  #preparePNJ() {
    this.#calcularProteccion();
    const s = this.system;
    const fue = this.#num("system.atributos.fue.value");
    const des = this.#num("system.atributos.des.value");
    const int = this.#num("system.atributos.int.value");
    const per = this.#num("system.atributos.per.value");
    const car = this.#num("system.atributos.car.value");
    const atletismo = this.#num("system.habilidades_clave.atletismo.value", 1);
    const conducir = this.#num("system.habilidades_clave.conducir.value", 1);
    s.valores_pasivos ??= {};
    s.combate ??= {};
    s.valores_pasivos.agilidad = (atletismo * 3) + des - this.#proteccionPenalizacion();
    s.valores_pasivos.evasion = (conducir * 3) + des - this.#proteccionPenalizacion();
    s.valores_pasivos.aplomo = car + int + 5;
    s.valores_pasivos.perspicacia = int + per + 5;
    s.combate.iniciativa = des + int;
    s.combate.arma_preparada = this.getArmaPreparada();
    s.combate.penalizador_salud = this.getPenalizadorSalud();
    s.combate.resistencia_fisica = Math.max(0, 12 - fue);
    if (s.combate?.salud) s.combate.salud.value = Math.min(s.combate.salud.value ?? s.combate.salud.max, s.combate.salud.max ?? 0);
  }

  #prepareMoto() {
    const s = this.system;
    s.identidad ??= {};
    s.tecnica ??= {};
    s.reglas ??= {};
    s.reglas.estructura ??= { value: 15, max: 15 };
    s.reglas.dados_dano ||= s.reglas.sidecar ? "3D" : "2D";
    s.reglas.base_dados_dano ??= s.reglas.dados_dano;
    s.reglas.base_estructura ??= Number(s.reglas.estructura.max ?? (s.reglas.sidecar ? 20 : 15));
    s.reglas.base_maniobrabilidad ??= Number(s.reglas.maniobrabilidad ?? (s.reglas.sidecar ? 1 : 2));
    s.reglas.base_alforjas = Number(s.reglas.base_alforjas ?? s.reglas.alforjas?.max);
    if (!Number.isFinite(s.reglas.base_alforjas) || s.reglas.base_alforjas <= 0) s.reglas.base_alforjas = s.reglas.sidecar ? 12 : 8;
    s.reglas.maniobrabilidad = Number(s.reglas.maniobrabilidad ?? (s.reglas.sidecar ? 1 : 2));
    s.reglas.plazas = Number(s.reglas.plazas ?? (s.reglas.sidecar ? 2 : 1));
    s.reglas.mods_funcionales_max = Number(s.reglas.mods_funcionales_max ?? (s.reglas.sidecar ? 3 : 2));
    s.reglas.alforjas ??= { value: 0, max: 8 };
    s.reglas.penalizador_dano_grave = Number(s.reglas.penalizador_dano_grave ?? 3);
    s.mods ??= {};
    s.mods.funcionales ??= [];
    s.mods.esteticas ??= [];
    s.carga ??= { items: [], notas: "" };
    s.persecucion ??= {};
    s.persecucion.terreno = Number(s.persecucion.terreno ?? 10);
    s.persecucion.visibilidad = Number(s.persecucion.visibilidad ?? 0);
    s.persecucion.evasion_objetivo = Number(s.persecucion.evasion_objetivo ?? 10);
    s.persecucion.franja = Number(s.persecucion.franja ?? 1);
    const itemMods = this.items?.filter(item => item.type === "objeto" && item.system?.tipo === "modificacion_moto" && item.system?.equipada) ?? [];
    const legacyMods = s.mods.funcionales ?? [];
    const modEffects = this.#getMotoModEffects([...legacyMods, ...itemMods]);
    s.reglas.estructura.max = Number(s.reglas.base_estructura ?? 15) + modEffects.estructura;
    s.reglas.maniobrabilidad = Number(s.reglas.base_maniobrabilidad ?? 2) + modEffects.maniobrabilidad;
    s.reglas.alforjas.max = Number(s.reglas.base_alforjas ?? 8) + modEffects.alforjasMax;
    s.reglas.dados_dano = this.#addVehicleDamageDice(s.reglas.base_dados_dano ?? "2D", modEffects.dadosDano);
    s.reglas.efectos_mods = modEffects.labels;
    const estructura = s.reglas.estructura;
    const max = Number(estructura.max ?? 15);
    estructura.value = Math.max(0, Math.min(max, Number(estructura.value ?? max)));
    const usedLegacy = legacyMods.filter(mod => mod?.ocupaRanura !== false).length;
    const usedItems = itemMods.filter(mod => mod.system?.tipo === "modificacion_moto" && mod.system?.ocupaRanura !== false).length;
    s.reglas.mods_funcionales_usadas = usedLegacy + usedItems;
    s.reglas.dano_grave = estructura.value > 0 && estructura.value <= Math.floor(max / 2);
    s.reglas.inutilizada = estructura.value <= 0;
    s.reglas.estado = s.reglas.inutilizada ? "Inutilizada" : (s.reglas.dano_grave ? "Dañada" : (s.reglas.mantenimiento || "Operativa"));
  }

  #getMotoModEffects(mods = []) {
    const effects = { labels: [], estructura: 0, maniobrabilidad: 0, dadosDano: 0, alforjasMax: 0 };
    const extended = this.#motoExtendedRules();
    for (const mod of mods) {
      const source = mod?.system ?? mod ?? {};
      const name = String(mod?.name ?? source.name ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!extended && !this.#isManualMotoMod(name)) continue;
      const efecto = source.efecto ?? {};
      effects.labels.push(mod.name ?? source.name ?? "Tuneado");
      effects.estructura += Number(efecto.estructura ?? 0);
      effects.maniobrabilidad += Number(efecto.maniobrabilidad ?? 0);
      effects.dadosDano += Number(efecto.dadosDano ?? 0);
      effects.alforjasMax += Number(efecto.alforjasMax ?? 0);
      if (name.includes("blindaje improvisado") && !efecto.estructura) { effects.estructura += 5; effects.maniobrabilidad -= 1; }
      if (name.includes("configuracion ofensiva") && !efecto.dadosDano) effects.dadosDano += 1;
      if (name.includes("alforjas extra") && !efecto.alforjasMax) effects.alforjasMax += 8;
      if (name.includes("sidecar reforzado") && !efecto.alforjasMax) effects.alforjasMax += 4;
    }
    return effects;
  }

  #motoExtendedRules() {
    try {
      if (!game?.settings?.settings?.has(`${CAMC.systemId}.motoExtendedRules`)) return false;
      return Boolean(game.settings.get(CAMC.systemId, "motoExtendedRules"));
    } catch (_err) {
      return false;
    }
  }

  #isManualMotoMod(normalizedName) {
    return Object.values(CAMC.modificacionesMoto ?? {}).some(mod => {
      const label = String(mod.label ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalizedName === label || normalizedName.includes(label);
    });
  }

  #proteccionPenalizacion() {
    const arm = this.items?.find(i => i.type === "armadura" && i.system.equipada);
    const esc = this.items?.find(i => i.type === "escudo" && i.system.equipado);
    return Number(arm?.system?.penalizacion ?? 0) + Number(esc?.system?.penalizacion ?? 0);
  }

  #calcularProteccion() {
    const arm = this.items?.find(i => i.type === "armadura" && i.system.equipada);
    const esc = this.items?.find(i => i.type === "escudo" && i.system.equipado);
    this.system.proteccion ??= {};
    this.system.proteccion.armadura_nivel = Number(arm?.system?.nivel ?? this.system.proteccion.armadura_nivel ?? 0);
    this.system.proteccion.armadura_penalizacion = Number(arm?.system?.penalizacion ?? this.system.proteccion.armadura_penalizacion ?? 0);
    this.system.proteccion.escudo_nivel = Number(esc?.system?.nivel ?? this.system.proteccion.escudo_nivel ?? 0);
    this.system.proteccion.escudo_penalizacion = Number(esc?.system?.penalizacion ?? this.system.proteccion.escudo_penalizacion ?? 0);
  }

  getAtributo(atributo) {
    return Number(this.system.atributos?.[atributo]?.value ?? 0);
  }

  getHabilidad(habilidad) {
    const skill = this.system.habilidades?.[habilidad] ?? this.system.habilidades_clave?.[habilidad];
    return Number(skill?.value ?? 1);
  }

  getAtributoDeHabilidad(habilidad) {
    return this.system.habilidades?.[habilidad]?.atributo || this.system.habilidades_clave?.[habilidad]?.atributo || CAMC.habilidades[habilidad]?.atributo || "int";
  }

  esHabilidadFavorecida(habilidad) {
    return Array.isArray(this.system.habilidades_favorecidas) && this.system.habilidades_favorecidas.includes(habilidad);
  }

  getPenalizadorSalud() {
    const salud = Number(this.system.combate?.salud?.value ?? 0);
    if (salud <= 0) return { dados: -2, label: "0 Salud: muerte", tone: "danger", resistencia: "Sin tirada: muerto" };
    if (salud <= 3) return { dados: -2, label: "-2D por Salud 1-3", tone: "danger", resistencia: "RF al bajar de 4 y 2" };
    if (salud <= 6) return { dados: -1, label: "-1D por Salud 4-6", tone: "warning", resistencia: "RF al bajar de 7" };
    if (salud <= 10) return { dados: 0, label: "Sin penalizador por Salud 7-10", tone: "strained", resistencia: "RF al bajar de 11" };
    return { dados: 0, label: "Sin penalizador por Salud 11+", tone: "good", resistencia: "" };
  }

  getArmaPreparada() {
    const weapon = this.items?.find(i => i.type === "arma" && i.system.equipada);
    if (!weapon) return { id: null, name: "Desarmado", label: "Desarmado", desarmado: true };
    return {
      id: weapon.id,
      name: weapon.name,
      label: weapon.name,
      desarmado: false,
      categoria: weapon.system?.categoria ?? "",
      tamano: weapon.system?.tamano ?? ""
    };
  }

  getDatosTirada(habilidad, options = {}) {
    const baseDados = Number(options.dadosBase ?? options.dados ?? this.getHabilidad(habilidad));
    const proezaDados = Number(options.proezaDados ?? 0);
    const dadosExtraManual = Number(options.dadosExtra ?? 0);
    const recuerdoCuandoDados = options.recuerdoCuando ? 2 : 0;
    const dadosExtra = dadosExtraManual + recuerdoCuandoDados;
    const dadosSacrificados = Number(options.dadosSacrificados ?? 0);
    const desenfundar = options.desenfundar ? -1 : 0;
    const saludPenalty = options.aplicaSalud === false ? 0 : Number(this.getPenalizadorSalud().dados ?? 0);
    const dados = Math.max(0, Math.min(6, baseDados + proezaDados + dadosExtra + saludPenalty + desenfundar - dadosSacrificados));
    const atributo = options.atributo || this.getAtributoDeHabilidad(habilidad);
    const bonificador = Number(options.bonificador ?? this.getAtributo(atributo));
    const favorecida = options.favorecida ?? this.esHabilidadFavorecida(habilidad);
    const bonusFavorecida = favorecida ? 3 : 0;
    const equipoBonus = this.getEquipoBonus(habilidad);
    const modificadorManual = Number(options.modificador ?? 0);
    const modificador = modificadorManual + equipoBonus;
    return {
      dados,
      baseDados,
      atributo,
      bonificador,
      favorecida,
      bonusFavorecida,
      modificador,
      modificadorManual,
      equipoBonus,
      proezaDados,
      dadosExtra: dadosExtraManual,
      recuerdoCuandoDados,
      dadosSacrificados,
      desenfundar,
      saludPenalty,
      recuerdoCuando: Boolean(options.recuerdoCuando),
      armaPreparada: options.armaPreparada ?? this.getArmaPreparada()
    };
  }

  async modificarSalud(cantidad) {
    const actual = Number(this.system.combate?.salud?.value ?? 0);
    const max = Number(this.system.combate?.salud?.max ?? actual);
    await this.update({ "system.combate.salud.value": Math.max(0, Math.min(max, actual + Number(cantidad))) });
  }

  getEquipoBonus(habilidad) {
    const equipped = this.items?.filter(item => item.type === "objeto" && item.system?.equipada) ?? [];
    let bonus = 0;
    for (const item of equipped) {
      const name = String(item.name ?? "").toLowerCase();
      if (habilidad === "auxilio" && name.includes("botiqu")) bonus += 2;
      if (habilidad === "mecanica" && (name.includes("herramientas") || name.includes("kit de reparacion"))) bonus += 2;
    }
    bonus += this.#getLinkedMotoSkillBonus(habilidad);
    return bonus;
  }

  #getLinkedMotoSkillBonus(habilidad) {
    if (this.type !== "personaje") return 0;
    const uuid = String(this.system.mount?.uuid ?? "");
    const match = uuid.match(/^Actor\.([^./]+)$/);
    const moto = match ? game.actors?.get(match[1]) : null;
    if (moto?.type !== "moto") return 0;
    let bonus = 0;
    for (const mod of moto.system?.mods?.funcionales ?? []) {
      const effect = mod?.efecto ?? {};
      if (habilidad === "intimidacion") bonus += Number(effect.intimidacion ?? 0);
      if (habilidad === "sigilo") bonus += Number(effect.sigilo ?? 0);
      if (habilidad === "observacion") bonus += Number(effect.nocturno ?? 0);
    }
    return bonus;
  }

  async aplicarDano(cantidad, options = {}) {
    const bruto = Number(cantidad) || 0;
    const proteccion = options.ignorarProteccion ? 0 : Number(this.system.proteccion?.armadura_nivel ?? 0);
    const final = Math.max(0, bruto - proteccion);
    await this.modificarSalud(-final);
    return { bruto, proteccion, final };
  }

  async gastarProezas(cantidad = 1) {
    const actual = Number(this.system.combate?.proezas?.value ?? 0);
    cantidad = Number(cantidad) || 1;
    if (actual < cantidad) return false;
    await this.update({ "system.combate.proezas.value": actual - cantidad });
    return true;
  }

  async ganarProezas(cantidad = 1) {
    const actual = Number(this.system.combate?.proezas?.value ?? 0);
    await this.update({ "system.combate.proezas.value": Math.max(0, actual + Number(cantidad)) });
  }
}
