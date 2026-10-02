import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { CAMC } from "../module/config.mjs";
import { generateRandomCharacter, generateRandomCommunity } from "../module/generator/camc-generators.mjs";
import { repartoComunidadValido, CAPITULOS } from "../module/rules/comunidad.mjs";
import * as R from "../module/rules/reglas.mjs";

const leer = f => JSON.parse(fs.readFileSync(new URL(`../_data/${f}.json`, import.meta.url), "utf8"));
const catalogo = { armas: leer("armas/armas"), armaduras: leer("armaduras/armaduras"), objetos: leer("objetos/objetos"), talentos: leer("talentos/talentos"), dones: leer("dones/dones") };

test("cada cargo genera un PJ con las favorecidas, el talento y el equipo que dice el manual (pp. 43-55)", () => {
  for (const [cargo, def] of Object.entries(CAMC.cargos)) {
    if (cargo === "full_patch") continue;
    for (const semilla of ["a", "b", "c"]) {
      const pj = generateRandomCharacter({ seed: `${cargo}-${semilla}`, cargo, deidad: "freya", catalogo });
      const fav = pj.system.habilidades_favorecidas;
      assert.equal(new Set(fav).size, 4, `${cargo}: cuatro favorecidas distintas`);
      for (const f of def.habilidades) assert.ok(fav.includes(f), `${cargo}: incluye ${f}`);
      const talentos = pj.items.filter(i => i.type === "talento");
      assert.equal(talentos.length, 1);
      assert.ok(def.talentos.includes(talentos[0].name), `${cargo}: talento ${talentos[0].name}`);
      assert.equal(pj.items.filter(i => i.type === "don").length, 1);
      assert.equal(pj.items.find(i => i.type === "don").system.deidad, "Freya");
      const mochila = pj.items.filter(i => i.system?.carga?.ubicacion === "mochila")
        .reduce((n, i) => n + (R.ESPACIOS[i.system.tamano] ?? 1) * (i.system.cantidad ?? 1), 0);
      assert.ok(mochila <= 6, `${cargo}: la mochila no pasa de 6 líneas (${mochila})`);
      assert.ok(pj.items.some(i => i.type === "arma"), `${cargo}: lleva un arma`);
    }
  }
});

test("equipo inicial por cargo (pp. 49-55): Sargento de armas, Tesorero y Capitán de rutas", () => {
  const sargento = generateRandomCharacter({ seed: "s", cargo: "sargento_armas", catalogo });
  assert.ok(sargento.items.some(i => i.type === "escudo" && i.system.nivel === 2), "escudo mediano");
  assert.equal(sargento.items.find(i => i.type === "armadura").system.nivel, 5);
  assert.ok(sargento.items.some(i => ["fuego_cortas", "fuego_largas"].includes(i.system.categoria)), "arma de fuego");
  const tesorero = generateRandomCharacter({ seed: "t", cargo: "tesorero", catalogo });
  assert.ok(tesorero.items.some(i => i.name === "Llave del botiquín"));
  assert.equal(tesorero.items.some(i => i.type === "armadura"), false, "el Tesorero no lleva armadura");
  const capitan = generateRandomCharacter({ seed: "c", cargo: "capitan_rutas", catalogo });
  assert.ok(capitan.items.some(i => i.name === "Prismáticos"));
  assert.equal(capitan.items.find(i => i.name === "Raciones de comida").system.cantidad, 2, "siete días de raciones");
});

test("Líder nato suma 2 a las proezas iniciales y la Salud sale de FUE x 2 + 10 + 1D", () => {
  const base = generateRandomCharacter({ seed: "p", cargo: "presidente", talento: "Interponerse", saludRoll: 4, catalogo });
  const lider = generateRandomCharacter({ seed: "p", cargo: "presidente", talento: "Líder nato", saludRoll: 4, catalogo });
  assert.equal(lider.system.combate.proezas.max, base.system.combate.proezas.max + 2);
  const fue = base.system.atributos.fue.value;
  assert.equal(base.system.combate.salud.max, fue * 2 + 10 + 4);
  assert.equal(base.system.combate.salud.roll_inicial, 4);
});

test("los atributos y habilidades generados cumplen el reparto de creación (pp. 45-46)", () => {
  const pj = generateRandomCharacter({ seed: "r", cargo: "mecanico_jefe", catalogo });
  assert.ok(R.repartoAtributosValido(Object.values(pj.system.atributos).map(a => a.value)));
  assert.ok(R.repartoHabilidadesValido(Object.values(pj.system.habilidades).map(h => h.value)));
});

test("la comunidad generada sigue el reparto de 6 puntos y la capacidad de su capítulo (p. 126)", () => {
  for (const capitulo of Object.keys(CAPITULOS)) {
    const c = generateRandomCommunity({ seed: capitulo, capitulo });
    const p = c.system.puntos;
    assert.equal(c.system.capitulo_clave, capitulo);
    assert.ok(p.moral >= 1 && p.poblacion >= 1 && p.recursos >= 1);
    // El total es 6 más el punto gratuito del capítulo (salvo que el tope lo recorte).
    assert.ok(p.moral + p.poblacion + p.recursos >= 6 && p.moral + p.poblacion + p.recursos <= 7, capitulo);
    assert.ok(p.moral <= 3 && p.poblacion <= 4 && p.recursos <= (capitulo === "oeste" ? 4 : 3));
  }
  assert.ok(repartoComunidadValido({ moral: 2, poblacion: 2, recursos: 2 }));
});
