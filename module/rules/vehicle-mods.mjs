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
