/** Ajustes de accesibilidad y su traducción a clases de <body> (sin Foundry: se prueba en node). */
export const TAMANOS = [100, 115, 130, 150];
export const DEFECTO = { tamano: 100, contraste: false, facil: false, quieto: false };

export function clasesDe(a) {
  const t = TAMANOS.includes(Number(a.tamano)) ? Number(a.tamano) : 100;
  return [t !== 100 ? `camc-acc-t${t}` : "", a.contraste ? "camc-acc-contraste" : "", a.facil ? "camc-acc-facil" : "", a.quieto ? "camc-acc-quieto" : ""].filter(Boolean);
}
