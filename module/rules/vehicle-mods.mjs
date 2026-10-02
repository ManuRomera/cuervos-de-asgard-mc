/**
 * Regla compartida de equipar modificaciones funcionales de moto (chaleco/PJ, no la
 * hoja de Moto en sí, que tiene su propia gestión de ranuras): Chasis ultrarreforzado
 * exige tener Chasis reforzado equipado, y el máximo de modificaciones funcionales
 * simultáneas es 2 (3 si hay Sidecar entre ellas). Antes de extraerla aquí, esta misma
 * comprobación estaba copiada en el hook preUpdateItem, en la hoja de Personaje y en la
 * hoja de Objeto: mantenerla en un único sitio evita que una futura corrección de regla
 * solo se aplique en dos de los tres.
 */
export function validateMotoModEquip(actor, item) {
  if (!actor) return { ok: true };
  const active = actor.items.filter(entry => entry.type === "objeto" && entry.system?.equipada && entry.system?.tipo === "modificacion_moto" && entry.id !== item.id);
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

const sinTildes = texto => String(texto ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Efectos de las modificaciones funcionales de moto (cap. 5, pp. 108-109), la única tabla que usan tanto
 * la ficha de PJ como la de moto. Las claves se comparan sin tildes ni mayúsculas.
 */
export const EFECTOS_MODS = {
  "acelerador trucado": { iniciativa: 5 },
  "alforjas extra": { alforjasMax: 8, alforjasExtra: true },
  "chasis reforzado": { estructura: 5 },
  "chasis ultrarreforzado": { estructura: 5, maniobrabilidad: -1 },
  "configuracion ofensiva": { dadosDano: 1 },
  "manillar adaptado": { iniciativa: 1, maniobrabilidad: 1 },
  "ruedas reforzadas": { estructura: 1, maniobrabilidad: 1 },
  "sidecar": { ocupantes: 1, maniobrabilidad: -1, sidecar: true },
  "suspension mejorada": { maniobrabilidad: 1 }
};

/** Suma los efectos de una lista de modificaciones (objetos con nombre, o ítems de Foundry). */
export function efectosDeMods(mods = []) {
  const total = { labels: [], iniciativa: 0, estructura: 0, maniobrabilidad: 0, ocupantes: 0, dadosDano: 0, alforjasMax: 0, alforjasExtra: false, sidecar: false };
  for (const mod of mods) {
    const nombre = sinTildes(mod?.name);
    const clave = Object.keys(EFECTOS_MODS).find(k => nombre === k || nombre.includes(k));
    if (!clave) continue;
    total.labels.push(mod.name);
    const e = EFECTOS_MODS[clave];
    for (const campo of ["iniciativa", "estructura", "maniobrabilidad", "ocupantes", "dadosDano", "alforjasMax"]) total[campo] += e[campo] ?? 0;
    total.alforjasExtra ||= Boolean(e.alforjasExtra);
    total.sidecar ||= Boolean(e.sidecar);
  }
  return total;
}
