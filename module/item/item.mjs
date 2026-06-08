import { CAMC } from "../config.mjs";

export class CAMCItem extends Item {
  prepareData() {
    super.prepareData();
    const s = this.system;
    if (this.type === "armadura") {
      s.nivel ??= 1;
      s.penalizacion ??= Math.floor(Number(s.nivel) / 2);
      s.equipada ??= false;
    }
    if (this.type === "escudo") {
      s.nivel ??= 1;
      s.penalizacion ??= Number(s.nivel);
      s.equipado ??= false;
    }
    if (this.type === "arma") {
      s.municion ??= { value: 0, max: 0 };
      s.equipada ??= false;
      s.dano_fijo ??= 0;
      s.categoria = this.#normalizeWeaponCategory(s.categoria ?? s.tipo);
      s.tipo ||= s.categoria;
      s.categoria_label = CAMC.categoriasArma[s.categoria]?.label ?? s.categoria;
      s.habilidad_ataque = CAMC.categoriasArma[s.categoria]?.habilidad ?? "lucha";
      s.regla_dano = CAMC.categoriasArma[s.categoria]?.resumen ?? "";
    }
    if (this.type === "objeto") {
      s.cantidad ??= 1;
      s.equipada ??= false;
    }
    if (this.type === "vehiculo") {
      s.estructura ??= { value: 15, max: 15 };
      s.dados_dano ??= "2D";
      s.maniobrabilidad ??= 0;
    }
    this.#prepareCarga();
  }

  get formulaDano() {
    return this.getFormulaDano(this.actor);
  }

  getFormulaDano(actor = null, options = {}) {
    if (this.type !== "arma") return "";
    const parts = [];
    if (this.system.dano) parts.push(String(this.system.dano).replaceAll("D", "d6"));
    if (Number(this.system.dano_fijo)) parts.push(String(Number(this.system.dano_fijo)));
    const attr = CAMC.categoriasArma[this.system.categoria]?.atributoDano ?? "";
    const attrBonus = this.#damageAttributeBonus(actor, attr);
    if (attrBonus) parts.push(String(attrBonus));
    if (Number(options.extra)) parts.push(String(Number(options.extra)));
    return parts.length ? parts.join(" + ") : "0";
  }

  getFormulaDanoLabel(actor = null) {
    if (this.type !== "arma") return "";
    const base = Number(this.system.dano_fijo ?? 0);
    const attr = CAMC.categoriasArma[this.system.categoria]?.atributoDano ?? "";
    const attrLabel = attr === "fue_mitad" ? "FUE/2" : attr ? attr.toUpperCase() : "";
    return [this.system.dano, base ? String(base) : "", attrLabel].filter(Boolean).join(" + ") || "0";
  }

  tieneMunicion() {
    return this.type === "arma" && Number(this.system.municion?.max ?? 0) > 0;
  }

  async consumirMunicion(cantidad = 1) {
    if (!this.tieneMunicion()) return true;
    const actual = Number(this.system.municion?.value ?? 0);
    if (actual < cantidad) return false;
    await this.update({ "system.municion.value": actual - cantidad });
    return true;
  }

  #prepareCarga() {
    if (!["arma", "armadura", "escudo", "objeto"].includes(this.type)) return;
    const s = this.system;
    s.carga ??= {};
    s.carga.ubicacion ||= "mochila";
    const explicit = Number(s.carga.espacios);
    if (!Number.isFinite(explicit) || explicit < 0) {
      s.carga.espacios = Number(CAMC.cargaPorTamano[s.tamano] ?? 1);
    }
  }

  #normalizeWeaponCategory(value) {
    const raw = String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (CAMC.categoriasArma[value]) return value;
    if (raw.includes("mortif") || raw.includes("fusil") || raw.includes("lanzallamas")) return "fuego_mortiferas";
    if (raw.includes("fuego") && raw.includes("larga")) return "fuego_largas";
    if (raw.includes("fuego") && raw.includes("corta")) return "fuego_cortas";
    if (raw.includes("explos")) return "explosivo";
    if (raw.includes("distancia") && !raw.includes("fuego")) return "distancia_no_fuego";
    if (raw.includes("dos manos")) return "cuerpo_a_cuerpo_dos_manos";
    if (raw.includes("improvis")) return "improvisada";
    return "cuerpo_a_cuerpo";
  }

  #damageAttributeBonus(actor, attr) {
    if (!actor || !attr) return 0;
    if (attr === "fue_mitad") return Math.floor(Number(actor.system?.atributos?.fue?.value ?? 0) / 2);
    return Number(actor.system?.atributos?.[attr]?.value ?? 0);
  }
}
