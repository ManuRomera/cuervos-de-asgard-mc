/**
 * Validación estática antes de publicar: sintaxis, JSON, rutas, coherencia entre manifiesto, etiqueta
 * y versión, y que los datos de _data casan con lo que el código espera del manual.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const errores = [];
const existe = p => fs.stat(p).then(() => true, () => false);
const listar = async dir => (await fs.readdir(dir, { recursive: true })).map(f => path.join(dir, f));
const leerJSON = async f => JSON.parse(await fs.readFile(f, "utf8"));

const manifiesto = await leerJSON("system.json");
const paquete = await leerJSON("package.json");
const id = manifiesto.id;
const etiqueta = process.env.RELEASE_TAG;
if (etiqueta && etiqueta !== `v${manifiesto.version}`) errores.push(`La etiqueta ${etiqueta} no coincide con la versión ${manifiesto.version}.`);
if (paquete.version !== manifiesto.version) errores.push(`package.json (${paquete.version}) y system.json (${manifiesto.version}) no coinciden.`);
if (!manifiesto.download.includes(`/v${manifiesto.version}/`)) errores.push(`system.json: la URL de descarga no apunta a v${manifiesto.version}.`);
const cambios = await fs.readFile("CHANGELOG.md", "utf8");
if (!cambios.includes(`## [${manifiesto.version}]`)) errores.push(`CHANGELOG.md no tiene la entrada [${manifiesto.version}].`);

// Sintaxis de todos los módulos
const js = [...(await listar("module")), ...(await listar("scripts")), ...(await listar("tests"))].filter(f => f.endsWith(".mjs"));
for (const f of js) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { errores.push(`${f}: ${e.stderr}`); }
}

// JSON válido
const datos = (await listar("_data")).filter(f => f.endsWith(".json"));
for (const f of ["system.json", "template.json", "lang/es.json", "lang/en.json", ...datos]) {
  try { await leerJSON(f); } catch (e) { errores.push(`${f}: JSON inválido (${e.message})`); }
}

// Mismas claves de idioma en es y en
const aplanar = (o, p = "") => Object.entries(o).flatMap(([k, v]) => typeof v === "object" ? aplanar(v, `${p}${k}.`) : [`${p}${k}`]);
const es = new Set(aplanar(await leerJSON("lang/es.json")));
const en = new Set(aplanar(await leerJSON("lang/en.json")));
for (const k of es) if (!en.has(k)) errores.push(`lang/en.json: falta ${k}`);
for (const k of en) if (!es.has(k)) errores.push(`lang/es.json: falta ${k}`);

// Rutas systems/<id>/... citadas en código, plantillas y datos deben existir
const fuentes = [...js, ...(await listar("templates")), ...datos, "system.json"].filter(f => /\.(mjs|hbs|json)$/.test(f));
const prefijo = new RegExp(`systems/${id}/([\\w\\-/.áéíóúñÑ ]+\\.(?:hbs|webp|png|svg|css|woff2|jpg|json))`, "g");
for (const f of fuentes) {
  const texto = await fs.readFile(f, "utf8");
  for (const [, ruta] of texto.matchAll(prefijo)) if (!(await existe(ruta))) errores.push(`${f}: falta ${ruta}`);
}
for (const f of [...manifiesto.esmodules, ...manifiesto.styles, ...manifiesto.languages.map(l => l.path)]) if (!(await existe(f))) errores.push(`system.json: falta ${f}`);

// Coherencia de contenido con el manual
const { CAMC } = await import("../module/config.mjs");
const talentos = await leerJSON("_data/talentos/talentos.json");
const dones = await leerJSON("_data/dones/dones.json");
const armas = await leerJSON("_data/armas/armas.json");
const objetos = await leerJSON("_data/objetos/objetos.json");
const nombres = lista => new Set(lista.map(i => i.name));
for (const [clave, cargo] of Object.entries(CAMC.cargos)) {
  for (const t of cargo.talentos) {
    const hallado = talentos.find(x => x.name === t);
    if (!hallado) errores.push(`Cargo ${clave}: falta el talento «${t}» en _data/talentos.`);
    else if (hallado.system.cargo !== cargo.label) errores.push(`Talento «${t}»: su cargo es ${hallado.system.cargo}, no ${cargo.label}.`);
  }
  if (cargo.habilidades.length + cargo.libres !== (clave === "full_patch" ? 0 : 4)) errores.push(`Cargo ${clave}: las favorecidas no suman cuatro.`);
}
if (talentos.length !== 21) errores.push(`El manual tiene 21 talentos y _data/talentos tiene ${talentos.length}.`);
for (const dios of Object.values(CAMC.dioses)) if (!dones.some(d => d.system.deidad === dios.label && d.system.virtud === dios.virtud)) errores.push(`Falta el don de ${dios.label} con su Virtud (${dios.virtud}).`);
const { EQUIPO_CARGO } = await import("../module/generator/camc-generators.mjs");
const catalogo = { armas: nombres(armas), objetos: nombres(objetos) };
for (const [cargo, e] of Object.entries(EQUIPO_CARGO)) {
  for (const n of [...(e.fijos ?? [])]) if (!catalogo.objetos.has(n)) errores.push(`Equipo inicial de ${cargo}: «${n}» no está en _data/objetos.`);
}
for (const n of ["Raciones de comida", "Raciones de agua potable", "Munición"]) if (!catalogo.objetos.has(n)) errores.push(`_data/objetos: falta «${n}».`);

const oficiales = new Set((await leerJSON("_data/motos/modificaciones-moto.json")).map(m => m.name));
for (const moto of await leerJSON("_data/motos/motos.json")) {
  for (const mod of [...(moto.system.mods?.funcionales ?? []), ...(moto.system.mods?.esteticas ?? [])]) if (!oficiales.has(mod.name)) errores.push(`Moto «${moto.name}»: la modificación «${mod.name}» no está en el manual (_data/motos/modificaciones-moto.json).`);
}

if (errores.length) {
  console.error(errores.join("\n"));
  process.exit(1);
}
console.log(`Comprobación correcta: ${js.length} módulos, ${datos.length} ficheros de datos, ${fuentes.length} fuentes revisadas.`);
