import { CAMC } from "../config.mjs";

const PORTABLE_TYPES = ["arma", "armadura", "escudo", "objeto"];

export function isPortableItem(item) {
  return PORTABLE_TYPES.includes(item?.type);
}

/**
 * Espacios de carga de un objeto. Si trae un valor explícito en carga.espacios (incluido
 * un 0 explícito, p. ej. objetos marcados como "no equipable") se respeta tal cual; si no,
 * se calcula a partir del tamaño. Antes de unificarla aquí, la copia de la hoja de
 * Personaje y la del hook de validación solo aceptaban un explícito > 0 (ignoraban un 0
 * explícito y recalculaban por tamaño), mientras que la copia de la hoja de Moto ya
 * aceptaba >= 0 — igual que el propio Item#prepareData(). Se unifica al criterio >= 0,
 * que es el que ya usa el dato de origen.
 */
export function itemCarrySpaces(item) {
  const explicit = Number(item.system?.carga?.espacios);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  const size = item.system?.tamano || "mediano";
  if (size === "no_equipable") return 0;
  return Number(CAMC.cargaPorTamano[size] ?? 1);
}

export function formatCarrySlots(value) {
  value = Number(value) || 0;
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}

/** Resuelve de forma síncrona la moto vinculada a un PJ (solo por UUID de Actor de mundo). */
export function getLinkedMountSync(system) {
  const uuid = String(system.mount?.uuid ?? "");
  const match = uuid.match(/^Actor\.([^./]+)$/);
  if (!match) return null;
  const actor = game.actors?.get(match[1]);
  return actor?.type === "moto" ? actor : null;
}

/**
 * Calcula los totales de mochila/alforjas de un PJ. `mount` debe ser la moto ya resuelta
 * (o null); esta función no la resuelve para poder usarse tanto de forma síncrona (hook)
 * como asíncrona (hoja, que resuelve la moto vía fromUuid).
 */
export function computeCarryTotals(system, items, mount = null) {
  const portable = items.filter(isPortableItem);
  const mochilaMax = Number(system.carga?.mochila_max ?? 6);
  const vehicleMods = String(system.vehiculo?.modificaciones ?? "").toLowerCase();
  const hasExtraSaddlebags = mount?.type === "moto"
    ? Boolean(mount.system?.reglas?.alforjas_extra)
    : Boolean(system.carga?.alforjas_extra)
      || vehicleMods.includes("alforjas extra")
      || items.some(entry => entry.type === "objeto" && entry.system?.equipada && String(entry.name).toLowerCase().includes("alforjas extra"));
  const baseAlforjas = Number(system.carga?.alforjas_base ?? 8);
  const mountAlforjas = mount ? Number(mount.system?.reglas?.alforjas?.max ?? 0) : 0;
  const alforjasMax = Math.max(baseAlforjas, Number.isFinite(mountAlforjas) ? mountAlforjas : 0) + (hasExtraSaddlebags && !mount ? 8 : 0);
  const totals = { mochila: 0, alforjas: 0 };
  for (const entry of portable) {
    const location = entry.system?.carga?.ubicacion || "mochila";
    if (!Object.prototype.hasOwnProperty.call(totals, location)) continue;
    const quantity = entry.type === "objeto" ? Math.max(1, Number(entry.system?.cantidad ?? 1)) : 1;
    totals[location] += itemCarrySpaces(entry) * quantity;
  }
  return {
    mochila: { value: totals.mochila, max: mochilaMax },
    alforjas: { value: totals.alforjas, max: alforjasMax },
    hasExtraSaddlebags
  };
}
