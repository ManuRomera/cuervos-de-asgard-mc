const get = foundry.utils.getProperty;

/**
 * Helpers compartidos por las distintas hojas (Personaje, PNJ, Moto, Objeto). Antes de
 * extraerlos aquí, cada hoja tenía su propia copia idéntica de estas funciones.
 */

export function pct(value, max) {
  value = Number(value) || 0;
  max = Number(max) || 1;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
}

/** Tono de recurso con Salud (0/3/6/10): usado por las cabeceras de Personaje y PNJ. */
export function healthResourceTone(value) {
  value = Number(value) || 0;
  if (value <= 0) return "danger";
  if (value <= 3) return "danger";
  if (value <= 6) return "warning";
  if (value <= 10) return "strained";
  return "good";
}

export async function resolveActorUuid(uuid) {
  if (!uuid) return null;
  try {
    const doc = await fromUuid(uuid);
    if (doc) return doc;
  } catch (_err) {
    /* fallback below */
  }
  const match = String(uuid).match(/^Actor\.([^.]+)$/);
  return match ? game.actors.get(match[1]) ?? null : null;
}

/**
 * Ajusta un campo numérico de un documento (Actor u Objeto) a partir de un botón
 * +/- con data-path y data-delta. Si el campo es un ".value" con un ".max" hermano,
 * respeta ese máximo.
 */
export async function adjustNumberField(document, event) {
  event.preventDefault();
  const path = event.currentTarget.dataset.path;
  const delta = Number(event.currentTarget.dataset.delta ?? 0);
  if (!path || !delta) return;
  const current = Number(get(document, path) ?? 0);
  let next = current + delta;
  if (path.endsWith(".value")) {
    const max = Number(get(document, path.replace(/\.value$/, ".max")));
    if (Number.isFinite(max)) next = Math.min(max, next);
  }
  await document.update({ [path]: Math.max(0, next) });
}
