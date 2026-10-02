/**
 * Asistente de creación de PJ paso a paso (cap. 3, pp. 41-48). Es ApplicationV2: el resto de hojas siguen en V1.
 * Valida cada paso con las reglas del manual (módulo rules/reglas.mjs) y deja la ficha lista para jugar.
 */
import { CAMC } from "../config.mjs";
import * as R from "../rules/reglas.mjs";
import { EQUIPO_CARGO, OBJETOS_LIBRES, starterEquipmentFor, applyGeneratedStarterItems } from "../generator/camc-generators.mjs";
import { generateRandomMount } from "../mount/mount-generator.mjs";
import { entrada } from "../content/catalogo.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const PASOS = ["Identidad", "Cargo y talento", "Deidad", "Atributos", "Habilidades", "Defectos", "Equipo", "Resumen"];
const ATRIBUTOS_SUGERIDOS = {
  presidente: ["car", "int", "per", "des", "fue"], vicepresidente: ["car", "per", "int", "des", "fue"],
  secretario: ["int", "per", "car", "des", "fue"], tesorero: ["per", "int", "fue", "des", "car"],
  sargento_armas: ["des", "fue", "per", "car", "int"], capitan_rutas: ["des", "per", "int", "car", "fue"],
  mecanico_jefe: ["int", "des", "per", "fue", "car"]
};

export class AsistenteCreacion extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "camc-asistente-creacion",
    classes: ["camc", "camc-wizard-app"],
    tag: "div",
    window: { title: "Creación de personaje", icon: "fas fa-wand-magic-sparkles", resizable: true },
    position: { width: 760, height: 720 },
    actions: { siguiente: AsistenteCreacion.#siguiente, anterior: AsistenteCreacion.#anterior, crear: AsistenteCreacion.#crear, sugerir: AsistenteCreacion.#sugerir, irA: AsistenteCreacion.#irA }
  };

  static PARTS = { cuerpo: { template: `systems/${CAMC.systemId}/templates/apps/creacion.hbs` } };

  paso = 0;

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    const b = actor.system.biografia ?? {};
    this.estado = {
      name: actor.name === "Nuevo Personaje" ? "" : actor.name,
      jugador: b.jugador ?? "", edad: b.edad ?? "", cita: b.cita ?? "", motivacion: b.motivacion ?? "",
      entorno: b.entorno_nacimiento ?? "", descripcion: b.descripcion ?? "",
      cargo: b.cargo && CAMC.cargos[b.cargo] && b.cargo !== "full_patch" ? b.cargo : "presidente",
      talento: "", libres: [], deidad: b.deidad && CAMC.dioses[b.deidad] ? b.deidad : "freya",
      atributos: { car: "", des: "", fue: "", int: "", per: "" },
      habilidades: Object.fromEntries(Object.keys(CAMC.habilidades).map(k => [k, 1])),
      defectoGrave: b.defecto_grave ?? "", defectoLeve: b.defecto_leve ?? "",
      saludRoll: 0, arma: "", objetos: [], moto: true, modMoto: ""
    };
  }

  get title() { return `Creación de personaje · ${PASOS[this.paso]}`; }

  /* ---------- contexto ---------- */

  async _prepareContext() {
    const e = this.estado;
    const cargo = CAMC.cargos[e.cargo];
    const catalogo = CAMC.catalogo ?? {};
    const conteo = d => Object.values(e.habilidades).filter(v => v === d).length;
    const attr = Object.fromEntries(Object.entries(e.atributos).map(([k, v]) => [k, v === "" ? null : Number(v)]));
    const completoAttr = Object.values(attr).every(v => v !== null);
    const hab = Object.fromEntries(Object.entries(e.habilidades).map(([k, v]) => [k, Number(v)]));
    const favoritas = [...cargo.habilidades, ...e.libres];
    const derivados = completoAttr ? {
      agilidad: R.agilidad(hab.atletismo, attr.des), evasion: R.evasion(hab.conducir, attr.des),
      aplomo: R.aplomo(attr.car, attr.int), perspicacia: R.perspicacia(attr.int, attr.per),
      iniciativa: R.iniciativa(attr.des, attr.int), resistencia: R.resistenciaFisica(attr.fue),
      proezas: R.proezasIniciales(attr.fue, attr.int, e.talento === "Líder nato" ? 2 : 0),
      salud: e.saludRoll ? R.saludMaxima(attr.fue, e.saludRoll) : null
    } : null;
    const armasNoFuego = (catalogo.armas ?? []).filter(a => ["cuerpo_a_cuerpo", "cuerpo_a_cuerpo_dos_manos", "distancia_no_fuego"].includes(a.system.categoria) && a.name !== "Lanza");
    const def = EQUIPO_CARGO[e.cargo];
    return {
      paso: this.paso, pasos: PASOS.map((nombre, i) => ({ nombre, i, actual: i === this.paso, hecho: i < this.paso })),
      ultimo: this.paso === PASOS.length - 1, primero: this.paso === 0,
      e,
      cargos: Object.entries(CAMC.cargos).filter(([k]) => k !== "full_patch").map(([k, c]) => ({ key: k, label: c.label, selected: k === e.cargo })),
      cargo,
      talentos: cargo.talentos.map(n => ({ name: n, efecto: entrada(catalogo.talentos, n)?.system?.efecto ?? "", checked: n === e.talento })),
      libresRestantes: cargo.libres - e.libres.length,
      hayLibres: cargo.libres > 0,
      habilidadesLista: Object.entries(CAMC.habilidades).map(([k, h]) => ({
        key: k, label: h.label, atributo: CAMC.atributos[h.atributo].short, fija: cargo.habilidades.includes(k),
        libre: e.libres.includes(k), favorecida: favoritas.includes(k), dados: e.habilidades[k]
      })),
      dioses: Object.entries(CAMC.dioses).map(([k, d]) => ({
        key: k, label: d.label, virtud: d.virtud, checked: k === e.deidad,
        don: (catalogo.dones ?? []).find(x => x.system.deidad === d.label)
      })),
      atributos: Object.entries(CAMC.atributos).map(([k, a]) => ({ key: k, label: a.label, short: a.short, valor: e.atributos[k], opciones: R.BONIFICADORES_INICIALES.map(v => ({ v, selected: String(v) === String(e.atributos[k]) })) })),
      restantesAtributos: R.BONIFICADORES_INICIALES.filter(v => !Object.values(e.atributos).map(String).includes(String(v))),
      conteo: { tres: conteo(3), dos: conteo(2), uno: conteo(1) },
      derivados,
      armas: armasNoFuego.map(a => ({ name: a.name, selected: a.name === e.arma })),
      objetosLibres: OBJETOS_LIBRES.map(n => ({ name: n, checked: e.objetos.includes(n) })),
      numObjetos: def.objetos,
      armadura: def.armadura ? `${def.armadura.nombre} (nivel ${def.armadura.nivel})` : "",
      escudo: def.escudo ?? "", dias: def.dias, armaFuego: Boolean(def.armaFuego),
      modsMoto: (catalogo.objetos ?? []).filter(o => o.system.tipo === "modificacion_moto" && !o.name.includes("ultra") && o.name !== "Sidecar").map(o => ({ name: o.name, selected: o.name === e.modMoto })),
      motosGratis: ["capitan_rutas", "mecanico_jefe"].includes(e.cargo) ? 2 : 1
    };
  }

  /* ---------- eventos ---------- */

  _onRender(context, options) {
    super._onRender?.(context, options);
    this.element.querySelectorAll("[data-campo]").forEach(el => el.addEventListener("change", ev => this.#guardar(ev.currentTarget)));
  }

  /** Vuelca un campo del formulario al estado; algunos cambios obligan a repintar el paso. */
  #guardar(el) {
    const e = this.estado;
    const campo = el.dataset.campo;
    const valor = el.type === "checkbox" ? el.checked : el.value;
    if (campo.startsWith("atributo.")) { e.atributos[campo.split(".")[1]] = valor; return this.render(); }
    if (campo.startsWith("habilidad.")) { e.habilidades[campo.split(".")[1]] = Number(valor); return this.render(); }
    if (campo === "libre") {
      const k = el.dataset.valor;
      const maximo = CAMC.cargos[e.cargo].libres;
      if (valor && e.libres.length >= maximo) { el.checked = false; return ui.notifications.warn(`Este cargo solo permite ${maximo} habilidad(es) favorecida(s) a elegir.`); }
      e.libres = valor ? [...new Set([...e.libres, k])] : e.libres.filter(x => x !== k);
      return this.render();
    }
    if (campo === "objeto") {
      const maximo = EQUIPO_CARGO[e.cargo].objetos;
      if (valor && e.objetos.length >= maximo) { el.checked = false; return ui.notifications.warn(`Este cargo elige ${maximo} objeto(s) libre(s).`); }
      e.objetos = valor ? [...new Set([...e.objetos, el.dataset.valor])] : e.objetos.filter(x => x !== el.dataset.valor);
      return this.render();
    }
    if (campo === "cargo") { e.cargo = valor; e.talento = ""; e.libres = []; e.objetos = []; return this.render(); }
    if (campo === "moto") { e.moto = Boolean(valor); return this.render(); }
    e[campo] = valor;
    if (["talento", "deidad"].includes(campo)) this.render();
  }

  /** Comprueba el paso actual; devuelve un mensaje de error o null. */
  #validar() {
    const e = this.estado;
    const cargo = CAMC.cargos[e.cargo];
    switch (this.paso) {
      case 0: return e.name.trim() ? null : "Escribe el nombre del personaje.";
      case 1:
        if (!e.talento) return "Elige uno de los tres talentos del cargo.";
        return e.libres.length === cargo.libres ? null : `Elige ${cargo.libres - e.libres.length} habilidad(es) favorecida(s) más.`;
      case 3: {
        const v = Object.values(e.atributos);
        if (v.some(x => x === "")) return "Asigna un bonificador a cada atributo.";
        return R.repartoAtributosValido(v.map(Number)) ? null : "Cada bonificador (0, +1, +2, +4 y +6) se usa una sola vez.";
      }
      case 4: return R.repartoHabilidadesValido(Object.values(e.habilidades).map(Number)) ? null : "Debes tener 4 habilidades a 3D, 8 a 2D y 12 a 1D.";
      case 5: return e.defectoGrave.trim() && e.defectoLeve.trim() ? null : "Anota un defecto grave y uno leve (uno de ellos, mejor físico).";
      case 6: return e.arma ? null : "Elige un arma que no sea de fuego.";
      default: return null;
    }
  }

  static async #siguiente() {
    const error = this.#validar();
    if (error) return ui.notifications.warn(error);
    this.paso = Math.min(PASOS.length - 1, this.paso + 1);
    return this.render();
  }

  static async #anterior() { this.paso = Math.max(0, this.paso - 1); return this.render(); }

  static async #irA(_ev, target) {
    const destino = Number(target.dataset.paso);
    if (destino <= this.paso) { this.paso = destino; return this.render(); }
  }

  /** Sugiere un reparto de atributos según el cargo (el jugador puede cambiarlo). */
  static async #sugerir() {
    const orden = ATRIBUTOS_SUGERIDOS[this.estado.cargo] ?? ATRIBUTOS_SUGERIDOS.presidente;
    orden.forEach((k, i) => { this.estado.atributos[k] = String(R.BONIFICADORES_INICIALES.toSorted((a, b) => b - a)[i]); });
    return this.render();
  }

  /* ---------- creación ---------- */

  static async #crear() {
    const error = this.#validar();
    if (error) return ui.notifications.warn(error);
    const e = this.estado;
    const cargo = CAMC.cargos[e.cargo];
    const roll = e.saludRoll || Math.ceil(CONFIG.Dice.randomUniform() * 6);
    const atributos = Object.fromEntries(Object.entries(e.atributos).map(([k, v]) => [k, { value: Number(v) }]));
    const habilidades = Object.fromEntries(Object.entries(e.habilidades).map(([k, v]) => [k, { value: Number(v), atributo: CAMC.habilidades[k].atributo }]));
    const fue = Number(e.atributos.fue), int = Number(e.atributos.int);
    const salud = R.saludMaxima(fue, roll);
    const proezas = R.proezasIniciales(fue, int, e.talento === "Líder nato" ? 2 : 0);
    const datos = {
      name: e.name.trim(),
      "system.atributos": atributos,
      "system.habilidades": habilidades,
      "system.habilidades_favorecidas": [...cargo.habilidades, ...e.libres],
      "system.combate.salud": { value: salud, max: salud, roll_inicial: roll },
      "system.combate.proezas": { value: proezas, max: proezas },
      "system.reputacion.value": 6,
      "system.biografia.jugador": e.jugador, "system.biografia.edad": e.edad, "system.biografia.cita": e.cita,
      "system.biografia.motivacion": e.motivacion, "system.biografia.entorno_nacimiento": e.entorno, "system.biografia.descripcion": e.descripcion,
      "system.biografia.cargo": e.cargo, "system.biografia.talento": e.talento, "system.biografia.deidad": e.deidad,
      "system.biografia.virtud": CAMC.dioses[e.deidad].virtud,
      "system.biografia.defecto_grave": e.defectoGrave, "system.biografia.defecto_leve": e.defectoLeve
    };
    await this.actor.update(datos);
    const items = starterEquipmentFor({ cargo: e.cargo, deidad: e.deidad, talento: e.talento, arma: e.arma, objetos: e.objetos });
    await applyGeneratedStarterItems(this.actor, items);
    if (e.moto) await AsistenteCreacion.#crearMoto(this.actor, e);
    ui.notifications.info(`${this.actor.name} creado.`);
    this.close();
    this.actor.sheet.render(true);
  }

  static async #crearMoto(actor, e) {
    const data = generateRandomMount({ seed: `${actor.id}-${Date.now()}`, ownerRole: CAMC.cargos[e.cargo].label, chapter: "Cuervos de Asgard", includeFunctionalMods: false });
    data.system.vinculo = { ownerUuid: actor.uuid, ownerName: actor.name };
    data.system.mods = { funcionales: [], esteticas: [] };
    const extra = data.items ?? [];
    delete data.items;
    const moto = await Actor.create(data);
    const mod = e.modMoto ? entrada(CAMC.catalogo?.objetos, e.modMoto) : null;
    if (mod || extra.length) await moto.createEmbeddedDocuments("Item", [...extra, ...(mod ? [{ ...mod, system: { ...mod.system, equipada: true } }] : [])]);
    await actor.update({ "system.mount": { uuid: moto.uuid, name: moto.name, img: moto.img } });
  }
}
