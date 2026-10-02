import { CAMC } from "../config.mjs";
import * as R from "../rules/reglas.mjs";
import { efectosDeMods } from "../rules/vehicle-mods.mjs";

const get = foundry.utils.getProperty;

// Mano derecha comparte uno de los talentos del Presidente (p. 50).
const R_TALENTOS_COMPARTIBLES = { "Interponerse": "interponerse", "Líder ejemplar": "lider_ejemplar", "Líder nato": "lider_nato" };

export class CAMCActor extends Actor {
  prepareData() {
    super.prepareData();
    if (this.type === "personaje") this._preparePersonaje();
    if (this.type === "pnj") this._preparePNJ();
    if (this.type === "moto") this._prepareMoto();
  }

  _num(path, fallback = 0) {
    const value = Number(get(this, path));
    return Number.isFinite(value) ? value : fallback;
  }

  _preparePersonaje() {
    const s = this.system;
    s.habilidades_favorecidas ??= [];
    const fue = this._num("system.atributos.fue.value");
    const des = this._num("system.atributos.des.value");
    const int = this._num("system.atributos.int.value");
    const per = this._num("system.atributos.per.value");
    const car = this._num("system.atributos.car.value");
    const atletismo = this._num("system.habilidades.atletismo.value", 1);
    const conducir = this._num("system.habilidades.conducir.value", 1);
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
    s.biografia.defecto_leve_usado ??= false;
    const cargo = CAMC.cargos[s.biografia.cargo] ?? CAMC.cargos.full_patch;
    const deidad = CAMC.dioses[s.biografia.deidad] ?? {};
    s.biografia.virtud = deidad.virtud ?? "";
    // El talento es uno de los tres del cargo: el que el PJ lleva como objeto de la ficha.
    const talento = this.items?.find(i => i.type === "talento" && i.system?.cargo === cargo.label);
    s.biografia.talento = talento?.name ?? s.biografia.talento ?? "";

    s.valores_pasivos.agilidad = R.agilidad(atletismo, des) + this._escudoAgilidadBonus();
    s.valores_pasivos.evasion = R.evasion(conducir, des);
    s.valores_pasivos.aplomo = R.aplomo(car, int);
    s.valores_pasivos.perspicacia = R.perspicacia(int, per);
    const vehicleMods = this._getVehicleMods();
    s.carga.alforjas_extra_activa = Boolean(s.carga.alforjas_extra || vehicleMods.alforjasExtra);
    s.vehiculo.efectos_mods = vehicleMods.labels;
    s.vehiculo.estructura.max = Number(s.vehiculo.base_estructura ?? 15) + vehicleMods.estructura;
    s.vehiculo.estructura.value = Math.min(Number(s.vehiculo.estructura.value ?? s.vehiculo.estructura.max), s.vehiculo.estructura.max);
    s.vehiculo.maniobrabilidad = Number(s.vehiculo.base_maniobrabilidad ?? 2) + vehicleMods.maniobrabilidad;
    s.vehiculo.ocupantes = Number(s.vehiculo.base_ocupantes ?? 1) + vehicleMods.ocupantes;
    s.vehiculo.dados_dano = this._addVehicleDamageDice(s.vehiculo.base_dados_dano ?? "2D", vehicleMods.dadosDano);
    s.vehiculo.modificaciones_max = vehicleMods.sidecar ? 3 : 2;

    s.combate.iniciativa = R.iniciativa(des, int) + vehicleMods.iniciativa;
    s.combate.tiradas_iniciales_hechas ??= false;
    s.combate.arma_preparada = this.getArmaPreparada();
    s.combate.penalizador_salud = this.getPenalizadorSalud();
    s.combate.resistencia_fisica = R.resistenciaFisica(fue);
    // Salud = FUE x 2 + 10 + 1D. La tirada de 1D queda guardada en roll_inicial.
    s.combate.salud.max = R.saludMaxima(fue, this._saludRollInicial(fue));
    s.combate.salud.value = Math.min(s.combate.salud.value ?? s.combate.salud.max, s.combate.salud.max);
    // Proezas: (FUE+INT)/2 + 3 (+2 con Líder nato). Pueden superar el máximo durante la sesión.
    s.combate.proezas.max = this.proezasMaximas();
    if (!Number.isFinite(Number(s.combate.proezas.value))) s.combate.proezas.value = s.combate.proezas.max;
    // Recuerdo cuando…: una vez por sesión/aventura (dos con Pozo de sabiduría).
    s.biografia.recuerdo_cuando_usos ??= s.biografia.recuerdo_cuando_usado ? 1 : 0;
    s.biografia.recuerdo_cuando_max = this.tieneTalento("pozo_sabiduria") ? 2 : 1;
    s.biografia.recuerdo_cuando_usado = s.biografia.recuerdo_cuando_usos >= s.biografia.recuerdo_cuando_max;
    this._calcularProteccion();
  }

  /** Claves de los talentos del PJ (incluido el que comparte Mano derecha). */
  get clavesTalento() {
    const claves = new Set();
    for (const i of this.items?.filter(i => i.type === "talento") ?? []) {
      if (i.system?.clave) claves.add(i.system.clave);
      if (i.system?.clave === "mano_derecha" && i.system?.compartido) {
        const compartido = R_TALENTOS_COMPARTIBLES[i.system.compartido];
        if (compartido) claves.add(compartido);
      }
    }
    return claves;
  }

  tieneTalento(clave) {
    return this.clavesTalento.has(clave);
  }

  proezasMaximas() {
    return R.proezasIniciales(this._num("system.atributos.fue.value"), this._num("system.atributos.int.value"), this.tieneTalento("lider_nato") ? 2 : 0);
  }

  /**
   * Tirada de 1D de la Salud inicial. Si el PJ viene de antes de guardarla, se deduce de la Salud
   * máxima almacenada (si cuadra con la fórmula) y, si no, se toma el valor medio (3).
   */
  _saludRollInicial(fue) {
    const guardada = Number(this.system.combate?.salud?.roll_inicial ?? 0);
    if (guardada >= 1 && guardada <= 6) return guardada;
    const deducida = Number(this._source?.system?.combate?.salud?.max ?? 0) - 10 - 2 * fue;
    return deducida >= 1 && deducida <= 6 ? deducida : 3;
  }

  _getVehicleMods() {
    const activas = this.items?.filter(item => item.type === "objeto" && item.system?.equipada && item.system?.tipo === "modificacion_moto") ?? [];
    return efectosDeMods(activas);
  }

  _addVehicleDamageDice(formula, extraDice = 0) {
    const match = String(formula || "2D").match(/(\d+)\s*D/i);
    if (!match) return formula || "2D";
    return `${Number(match[1]) + Number(extraDice || 0)}D`;
  }

  _preparePNJ() {
    this._calcularProteccion();
    const s = this.system;
    const fue = this._num("system.atributos.fue.value");
    const des = this._num("system.atributos.des.value");
    const int = this._num("system.atributos.int.value");
    const per = this._num("system.atributos.per.value");
    const car = this._num("system.atributos.car.value");
    const atletismo = this._num("system.habilidades_clave.atletismo.value", 1);
    const conducir = this._num("system.habilidades_clave.conducir.value", 1);
    s.valores_pasivos ??= {};
    s.combate ??= {};
    // El manual permite que algunos PNJ tengan valores pasivos superiores a los que daría
    // la fórmula estándar de PJ (p. ej. una Valquiria más ágil de lo que sugerirían sus dados
    // de Atletismo). Por eso aquí solo se rellenan como valor por defecto si no vienen ya
    // definidos en la ficha (importados del bestiario o escritos a mano), en vez de
    // sobrescribirlos siempre.
    s.valores_pasivos.agilidad ??= (atletismo * 3) + des + this._escudoAgilidadBonus();
    s.valores_pasivos.evasion ??= (conducir * 3) + des;
    s.valores_pasivos.aplomo ??= car + int + 5;
    s.valores_pasivos.perspicacia ??= int + per + 5;
    // Igual que los valores pasivos, la iniciativa y la Resistencia Física del bestiario
    // pueden estar autoradas de forma distinta a la fórmula estándar (p. ej. un Demonio de
    // Fuego con RF 4 pese a su FUE 7), así que solo se rellenan si la ficha no trae ya un
    // valor propio, en vez de sobrescribirlo siempre.
    s.combate.iniciativa ??= des + int;
    s.combate.arma_preparada = this.getArmaPreparada();
    s.combate.penalizador_salud = this.getPenalizadorSalud();
    s.combate.resistencia_fisica ??= Math.max(0, 12 - fue);
    if (s.combate?.salud) s.combate.salud.value = Math.min(s.combate.salud.value ?? s.combate.salud.max, s.combate.salud.max ?? 0);
  }

  _prepareMoto() {
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
    s.reglas.alforjas_extra = Boolean(s.reglas.alforjas_extra);
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
    const modEffects = this._getMotoModEffects([...legacyMods, ...itemMods]);
    s.reglas.estructura.max = Number(s.reglas.base_estructura ?? 15) + modEffects.estructura;
    s.reglas.maniobrabilidad = Number(s.reglas.base_maniobrabilidad ?? 2) + modEffects.maniobrabilidad;
    s.reglas.alforjas.max = Number(s.reglas.base_alforjas ?? 8) + modEffects.alforjasMax + (s.reglas.alforjas_extra ? 8 : 0);
    s.reglas.dados_dano = this._addVehicleDamageDice(s.reglas.base_dados_dano ?? "2D", modEffects.dadosDano);
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

  _getMotoModEffects(mods = []) {
    return efectosDeMods(mods.map(mod => ({ name: mod?.name ?? mod?.system?.name })));
  }

  _escudoAgilidadBonus() {
    const esc = this.items?.find(i => i.type === "escudo" && i.system.equipado);
    return Number(esc?.system?.nivel ?? 0);
  }

  _calcularProteccion() {
    const equipadas = this.items?.filter(i => i.type === "armadura" && i.system.equipada) ?? [];
    const esc = this.items?.find(i => i.type === "escudo" && i.system.equipado);
    this.system.proteccion ??= {};
    // El nivel manda siempre desde el objeto equipado (nivel 1 si no viene indicado); sin armadura puesta no hay
    // protección: si se conservase el último valor guardado, desequipar no dejaría de reducir daño.
    const p = R.proteccionDeArmaduras(equipadas.map(a => {
      const nivel = Number(a.system.nivel ?? 1);
      return { nivel, penalizacion: Number(a.system.penalizacion ?? Math.floor(nivel / 2)), compatible: Boolean(a.system.compatible), soloFuego: Boolean(a.system.solo_fuego) };
    }));
    this.system.proteccion.armadura_nivel = p.nivel;
    this.system.proteccion.armadura_penalizacion = p.penalizacion;
    this.system.proteccion.armadura_solo_fuego = p.soloFuego;
    if (esc) {
      const nivel = Number(esc.system.nivel ?? 1);
      this.system.proteccion.escudo_nivel = nivel;
      this.system.proteccion.escudo_penalizacion = Number(esc.system.penalizacion ?? nivel);
    } else {
      this.system.proteccion.escudo_nivel = 0;
      this.system.proteccion.escudo_penalizacion = 0;
    }
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
    const cargo = CAMC.cargos[this.system.biografia?.cargo];
    if (cargo?.habilidades?.includes(habilidad)) return true;
    return Array.isArray(this.system.habilidades_favorecidas) && this.system.habilidades_favorecidas.includes(habilidad);
  }

  getPenalizadorSalud() {
    const salud = Number(this.system.combate?.salud?.value ?? 0);
    // Draugar, einherjar, espectros y esqueletos no sufren penalizaciones por acumulación de daño (cap. 9).
    if (this.system.combate?.sin_penalizadores && salud > 0) return { dados: 0, label: "Sin penalizadores por daño", tone: "good", resistencia: "" };
    const dados = R.dadosPorSalud(salud);
    if (salud <= 0) return { dados: -2, label: "0 Salud: muerte", tone: "danger", resistencia: "Sin tirada: muerto" };
    if (dados === -2) return { dados, label: "-2D por Salud 1-3", tone: "danger", resistencia: "RF al bajar de 4 y 2" };
    if (dados === -1) return { dados, label: "-1D por Salud 4-6", tone: "warning", resistencia: "RF al bajar de 7" };
    if (salud <= 10) return { dados, label: "Sin penalizador por Salud 7-10", tone: "strained", resistencia: "RF al bajar de 11" };
    return { dados, label: "Sin penalizador por Salud 11+", tone: "good", resistencia: "" };
  }

  getArmaPreparada() {
    const weapon = this.items?.find(i => i.type === "arma" && i.system.equipada);
    if (!weapon) return { id: null, name: "Desarmado", label: "Desarmado", desarmado: true, equipada: true };
    return {
      id: weapon.id,
      name: weapon.name,
      label: weapon.name,
      desarmado: false,
      equipada: true,
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
    // Armaduras y escudos penalizan las tiradas de habilidades de DES y FUE (p. 89).
    const proteccionPenalizacion = ["des", "fue"].includes(atributo) && options.aplicaProteccion !== false ? this.getPenalizacionProteccion() : 0;
    const modificador = modificadorManual + equipoBonus - proteccionPenalizacion;
    const umbralCritico = this.umbralCriticoPara(habilidad, options);
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
      proteccionPenalizacion,
      umbralCritico,
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

  /** Suma de penalizaciones de armadura (mitad del nivel) y escudo (nivel entero) a las tiradas de DES y FUE. */
  getPenalizacionProteccion() {
    const p = this.system.proteccion ?? {};
    return Number(p.armadura_penalizacion ?? 0) + Number(p.escudo_penalizacion ?? 0);
  }

  /** Leer el terreno (Rastreo) y Urbanita (Supervivencia urbana) dan crítico con un solo 6 (pp. 52, 54). */
  umbralCriticoPara(habilidad, options = {}) {
    if (habilidad === "rastreo" && this.tieneTalento("leer_terreno")) return 1;
    if (habilidad === "supervivencia" && options.entornoUrbano && this.tieneTalento("urbanita")) return 1;
    return 2;
  }

  async modificarSalud(cantidad) {
    const actual = Number(this.system.combate?.salud?.value ?? 0);
    const max = Number(this.system.combate?.salud?.max ?? actual);
    const nueva = Math.max(0, Math.min(max, actual + Number(cantidad)));
    await this.update({ "system.combate.salud.value": nueva });
    if (nueva < actual) await this.comprobarUmbralesSalud(actual, nueva);
  }

  /**
   * Al bajar por primera vez de 11, 7, 4 y 2 puntos de Salud hay una tirada de Resistencia Física
   * (una por umbral si se cruzan varios de golpe); si se falla, cae inconsciente (p. 88).
   * Los umbrales ya tirados se recuerdan hasta «Nueva sesión».
   */
  async comprobarUmbralesSalud(antes, despues) {
    const modo = game.settings.get(CAMC.systemId, "resistenciaAutomatica");
    if (modo === "ninguno" || (modo === "pj" && this.type !== "personaje")) return;
    if (despues <= 0 || Number(this.system.combate?.resistencia_fisica ?? 1) <= 0) return;   // RF 0 = «N/A» en el bestiario
    const hechos = this.getFlag(CAMC.systemId, "umbralesRF") ?? [];
    const nuevos = R.umbralesCruzados(antes, despues, hechos);
    if (!nuevos.length) return;
    await this.setFlag(CAMC.systemId, "umbralesRF", [...hechos, ...nuevos]);
    const { YsystemDice } = await import("../dice/ysystem-dice.mjs");
    for (const umbral of nuevos) await YsystemDice.rollResistance(this, { umbral });
  }

  /** Marca o quita el estado «inconsciente» (efecto de estado estándar de Foundry). */
  async ponerInconsciente(activo) {
    try { await this.toggleStatusEffect("unconscious", { active: activo }); }
    catch (error) { console.warn("CAMC | No se pudo cambiar el estado inconsciente", error); }
  }

  /** Consume un uso del «Recuerdo cuando…». Devuelve false si ya no quedan. */
  async usarRecuerdoCuando() {
    const b = this.system.biografia ?? {};
    if (Number(b.recuerdo_cuando_usos ?? 0) >= Number(b.recuerdo_cuando_max ?? 1)) return false;
    await this.update({ "system.biografia.recuerdo_cuando_usos": Number(b.recuerdo_cuando_usos ?? 0) + 1, "system.biografia.recuerdo_cuando_usado": true });
    return true;
  }

  getEquipoBonus(habilidad) {
    const equipped = this.items?.filter(item => item.type === "objeto" && item.system?.equipada) ?? [];
    let bonus = 0;
    for (const item of equipped) {
      const name = String(item.name ?? "").toLowerCase();
      if (habilidad === "auxilio" && name.includes("botiqu")) bonus += 2;
      if (habilidad === "mecanica" && (name.includes("herramientas") || name.includes("kit de reparacion"))) bonus += 2;
    }
    bonus += this._getLinkedMotoSkillBonus(habilidad);
    return bonus;
  }

  _getLinkedMotoSkillBonus(habilidad) {
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
    const proteccion = options.ignorarProteccion ? 0 : R.nivelContraAtaque(this.system.proteccion ?? {}, options.categoria ?? "");
    const final = R.danoTrasArmadura(bruto, proteccion);
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
