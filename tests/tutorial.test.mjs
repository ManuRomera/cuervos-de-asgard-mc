import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { documentoTutorial, PAGINAS_TUTORIAL, NOMBRE_TUTORIAL } from "../module/content/tutorial.mjs";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const leerTodo = dir => fs.readdirSync(path.join(raiz, dir), { recursive: true })
  .filter(f => /\.(mjs|hbs)$/.test(f) && !f.includes("tutorial.mjs"))
  .map(f => fs.readFileSync(path.join(raiz, dir, f), "utf8")).join("\n");

test("el tutorial es un diario de doce capítulos visible para los jugadores", () => {
  const doc = documentoTutorial();
  assert.equal(doc.name, NOMBRE_TUTORIAL);
  assert.equal(doc.pages.length, 12);
  assert.equal(doc.ownership.default, 2, "observador");
  assert.ok(doc.pages.every(p => p.type === "text" && p.text.content.includes("<h1>")));
  assert.deepEqual(doc.pages.map(p => p.sort), [...doc.pages.keys()].map(i => (i + 1) * 10));
});

test("cada botón que nombra el tutorial existe en la interfaz (si cambia un rótulo, hay que revisar el tutorial)", () => {
  const interfaz = leerTodo("module") + leerTodo("templates");
  const rotulos = ["Creación guiada", "Generar PJ", "Generar PNJ", "Nueva sesión", "Fin de aventura", "Tutorial", "Mejorar",
    "Reparto inicial (6 puntos)", "Tirar suceso (D66)", "Rellenar con los PJ", "Superada", "Fallada",
    "Gastar proeza · repetir dados", "DJ · aplicar defecto", "Gastar proeza · +1D que explota", "Aplicar daño", "Tirar dados",
    "Crear moto", "Sugerir según el cargo", "Quemar rueda / Darlo todo", "Llegó montado en su moto", "Sin luz",
    "Mi montura", "Dones disponibles", "Evasión rival", "Recuerdo cuando", "Curar"];
  const texto = PAGINAS_TUTORIAL.map(([, html]) => html).join("\n");
  for (const r of rotulos) {
    assert.ok(texto.includes(r), `el tutorial menciona «${r}»`);
    assert.ok(interfaz.includes(r), `la interfaz tiene «${r}»`);
  }
});
