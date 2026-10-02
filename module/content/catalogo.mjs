/**
 * Catálogo de contenido (_data/*.json) en memoria. Es la única fuente de armas, armaduras,
 * objetos, talentos y dones para los generadores: antes cada uno llevaba su copia y se desfasaban.
 * Se carga una vez al arrancar el mundo; en las pruebas se inyecta desde disco.
 */
import { CAMC } from "../config.mjs";

const FICHEROS = {
  armas: "_data/armas/armas.json",
  armaduras: "_data/armaduras/armaduras.json",
  objetos: "_data/objetos/objetos.json",
  talentos: "_data/talentos/talentos.json",
  dones: "_data/dones/dones.json"
};

export async function cargarCatalogo() {
  const entradas = await Promise.all(Object.entries(FICHEROS).map(async ([clave, ruta]) => {
    const respuesta = await fetch(`systems/${CAMC.systemId}/${ruta}`);
    if (!respuesta.ok) throw new Error(`No se pudo cargar ${ruta}`);
    return [clave, await respuesta.json()];
  }));
  CAMC.catalogo = Object.fromEntries(entradas);
  return CAMC.catalogo;
}

const normal = v => String(v ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Copia de una entrada del catálogo por nombre (sin distinguir mayúsculas ni tildes). */
export function entrada(lista, nombre) {
  const buscado = normal(nombre);
  const hallada = (lista ?? []).find(e => normal(e.name) === buscado);
  return hallada ? JSON.parse(JSON.stringify(hallada)) : null;
}
