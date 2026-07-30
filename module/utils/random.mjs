/**
 * Generador pseudoaleatorio con semilla, compartido por los generadores de
 * personaje/PNJ/comunidad y el de monturas para que un mismo seed produzca
 * siempre el mismo resultado.
 */
export function mulberry32(seed) {
  let t = Number(seed) || Date.now();
  return function rng() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(seed) {
  if (seed === undefined || seed === null || seed === "") return Date.now();
  const value = String(seed);
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const pick = (list, rng) => list[Math.floor(rng() * list.length)];
