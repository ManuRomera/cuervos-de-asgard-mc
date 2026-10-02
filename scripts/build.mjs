/**
 * Compila los compendios (packs/) a LevelDB desde `_data`. Los compendios no se guardan en git:
 * se generan aquí al publicar (y a mano con `npm run build` para probar en local).
 * Usa los mismos constructores de documentos que el importador del mundo (module/content/documentos.mjs).
 */
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { ClassicLevel } from "classic-level";
import { CAMC } from "../module/config.mjs";
import { normalizarActor, manualDocuments, generatorTablesDocument } from "../module/content/documentos.mjs";

const manifiesto = JSON.parse(await fs.readFile("system.json", "utf8"));
const leer = async f => JSON.parse(await fs.readFile(`_data/${f}.json`, "utf8"));
const id = texto => createHash("sha1").update(texto).digest("hex").slice(0, 16);

const RAIZ = { Item: "items", Actor: "actors", JournalEntry: "journal" };
const EMBEBIDOS = { Item: [], Actor: [["items", "items"]], JournalEntry: [["pages", "pages"]] };

const FUENTES = {
  "armas-camc": () => leer("armas/armas"),
  "protecciones-camc": () => leer("armaduras/armaduras"),
  "dones-camc": () => leer("dones/dones"),
  "talentos-camc": () => leer("talentos/talentos"),
  "objetos-camc": () => leer("objetos/objetos"),
  "parches-camc": () => leer("parches/parches"),
  "vehiculos-camc": () => leer("vehiculos/vehiculos"),
  "modificaciones-moto": () => leer("motos/modificaciones-moto"),
  "motos-base": async () => (await leer("motos/motos")).map(normalizarActor),
  "personajes-camc": async () => (await leer("personajes/pregenerados")).map(normalizarActor),
  "bestiario-camc": async () => (await leer("bestiario/enemigos")).map(normalizarActor),
  "manual-camc": async () => manualDocuments(await leer("manual/reglas-resumen")),
  "tablas-generador-motos": async () => [generatorTablesDocument()]
};

/** Foundry abierto con el mundo cargado bloquea LevelDB: compilar entonces dejaría los packs vacíos. */
async function comprobarCerrados(packs) {
  const bloqueados = [];
  for (const pack of packs) {
    if (!(await fs.stat(pack.path).catch(() => null))) continue;
    const db = new ClassicLevel(pack.path, { valueEncoding: "json" });
    try { await db.open(); await db.close(); }
    catch (error) {
      if ((error.cause?.code ?? error.code) === "LEVEL_LOCKED") bloqueados.push(pack.name);
      else throw error;
    }
  }
  if (bloqueados.length) throw new Error(`Foundry tiene abiertos estos packs: ${bloqueados.join(", ")}.\nCierra el mundo antes de compilar.`);
}

function preparar(pack, bruto) {
  const doc = structuredClone(bruto);
  delete doc.folder;
  doc._id = id(`${pack}:${doc.type ?? "doc"}:${doc.name}`);
  doc.flags = { ...(doc.flags ?? {}), [CAMC.systemId]: { source: "core-import", version: CAMC.contentVersion } };
  doc.ownership ??= { default: 0 };
  return doc;
}

await comprobarCerrados(manifiesto.packs);
await fs.mkdir("packs", { recursive: true });
let total = 0;
for (const pack of manifiesto.packs) {
  const origen = FUENTES[pack.name];
  if (!origen) throw new Error(`system.json declara el compendio ${pack.name} y scripts/build.mjs no sabe de dónde sacarlo.`);
  const documentos = await origen();
  const raiz = RAIZ[pack.type];
  await fs.rm(pack.path, { recursive: true, force: true });
  const db = new ClassicLevel(pack.path, { valueEncoding: "json" });
  const vistos = new Set();
  for (const bruto of documentos) {
    const doc = preparar(pack.name, bruto);
    if (vistos.has(doc._id)) throw new Error(`${pack.name}: nombre repetido «${doc.name}».`);
    vistos.add(doc._id);
    for (const [campo, subraiz] of EMBEBIDOS[pack.type]) {
      const filas = doc[campo];
      if (!Array.isArray(filas)) continue;
      doc[campo] = filas.map((fila, i) => {
        const hijo = { ...structuredClone(fila), _id: id(`${doc._id}:${campo}:${fila.name ?? i}:${i}`) };
        return hijo;
      });
      const hijos = doc[campo];
      doc[campo] = hijos.map(h => h._id);
      for (const h of hijos) await db.put(`!${raiz}.${subraiz}!${doc._id}.${h._id}`, h);
    }
    await db.put(`!${raiz}!${doc._id}`, doc);
  }
  await db.close();
  total += documentos.length;
  console.log(`${pack.name}: ${documentos.length} documentos`);
}
console.log(`Compendios compilados: ${total} documentos.`);
