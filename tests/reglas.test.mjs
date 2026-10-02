import test from "node:test";
import assert from "node:assert/strict";
import * as R from "../module/rules/reglas.mjs";
import * as C from "../module/rules/comunidad.mjs";

test("crítico = dos seises; pifia = todo unos (p. 75)", () => {
  assert.deepEqual(R.evaluarDados([6, 6, 2]), { critico: true, pifia: false });
  assert.equal(R.evaluarDados([6, 3, 2]).critico, false);
  assert.equal(R.evaluarDados([6, 3], { umbralCritico: 1 }).critico, true, "Leer el terreno / Urbanita");
  assert.equal(R.evaluarDados([6, 6], { permitirCritico: false }).critico, false, "tras gastar proeza");
  assert.equal(R.evaluarDados([1]).pifia, true);
  assert.equal(R.evaluarDados([1, 2]).pifia, false);
  assert.equal(R.evaluarDados([]).pifia, false, "sin dados no hay pifia");
});

test("valores derivados del ejemplo de Sarah Connor (pp. 46-48)", () => {
  assert.equal(R.agilidad(2, 4), 10);
  assert.equal(R.evasion(2, 4), 10);
  assert.equal(R.proezasIniciales(2, 1), 4);
  assert.equal(R.saludMaxima(2, 6), 20);
  assert.equal(R.resistenciaFisica(2), 10);
  assert.equal(R.iniciativa(4, 1), 5);
  assert.equal(R.aplomo(6, 1), 12);
  assert.equal(R.perspicacia(1, 0), 6);
  assert.equal(R.proezasIniciales(6, 4), 8, "máximo del manual: 8");
  assert.equal(R.proezasIniciales(0, 0), 3, "mínimo del manual: 3");
  assert.equal(R.proezasIniciales(2, 1, 2), 6, "Líder nato");
});

test("reparto inicial de atributos y habilidades (p. 45-46)", () => {
  assert.ok(R.repartoAtributosValido([6, 4, 2, 1, 0]));
  assert.ok(!R.repartoAtributosValido([6, 6, 2, 1, 0]));
  const ok = [...Array(4).fill(3), ...Array(8).fill(2), ...Array(12).fill(1)];
  assert.ok(R.repartoHabilidadesValido(ok));
  assert.ok(!R.repartoHabilidadesValido(ok.slice(1)));
});

test("penalizadores de Salud y umbrales de Resistencia Física (p. 88)", () => {
  assert.equal(R.dadosPorSalud(7), 0);
  assert.equal(R.dadosPorSalud(6), -1);
  assert.equal(R.dadosPorSalud(4), -1);
  assert.equal(R.dadosPorSalud(3), -2);
  assert.deepEqual(R.umbralesCruzados(12, 10), [11]);
  assert.deepEqual(R.umbralesCruzados(12, 3), [11, 7, 4]);
  assert.deepEqual(R.umbralesCruzados(12, 3, [11]), [7, 4]);
  assert.deepEqual(R.umbralesCruzados(11, 11), []);
  assert.deepEqual(R.umbralesCruzados(5, 1), [4, 2]);
});

test("protecciones: ejemplo armadura 5 + escudo 3 = −5 (p. 89)", () => {
  assert.equal(R.penalizadorProtecciones(5, 3), 5);
  assert.equal(R.penalizadorProtecciones(1, 0), 0);
  assert.equal(R.penalizadorProtecciones(4, 0, { sinPenalizacion: true }), 0, "chaleco de kevlar");
  assert.equal(R.danoTrasArmadura(7, 2), 5);
  assert.equal(R.danoTrasArmadura(1, 3), 0);
  assert.equal(R.danoTrasArmadura(20, 5, { ignorar: true }), 20, "Furia de la tormenta");
});

test("daño: proezas, apuntar, explosivos, crítico y noqueo (pp. 79-83)", () => {
  assert.equal(R.maxProezasDano("cuerpo_a_cuerpo"), 2);
  assert.equal(R.maxProezasDano("fuego_cortas"), 3);
  assert.equal(R.dadosPorApuntar(1, false), 1);
  assert.equal(R.dadosPorApuntar(1, true), 2);
  const seq = [4, 6, 5];
  const r = R.tirarExplosivos(2, () => seq.shift());
  assert.equal(r.total, 15, "ejemplo de Dolo: 4 + 6 + 5");
  assert.equal(R.aplicarCriticoDano(7, true), 14);
  assert.equal(R.danoNoqueo(5), 2);
  assert.equal(R.dificultadRafaga(9, 4), 17, "ejemplo de Strike");
  assert.equal(R.dificultadRafaga(9, 3), 15);
  assert.equal(R.dificultadRafaga(9, 9), 19, "máximo cinco blancos");
});

test("curación con Auxilio (p. 89) y talento Curandero", () => {
  assert.equal(R.curacionAuxilio({ exito: true }), 2);
  assert.equal(R.curacionAuxilio({ exito: true, critico: true }), 4);
  assert.equal(R.curacionAuxilio({ pifia: true }), -1);
  assert.equal(R.curacionAuxilio({ exito: true }, { curandero: true }), 3);
  assert.equal(R.curacionAuxilio({ exito: true, critico: true }, { curandero: true }), 6);
  assert.equal(R.curacionAuxilio({ exito: false }), 0);
});

test("experiencia: ejemplo de Joana, PER de 0 a +2 cuesta 9 (p. 64)", () => {
  assert.equal(R.costeAtributo(1) + R.costeAtributo(2), 9);
  assert.equal(R.costeHabilidad(1), 5);
  assert.equal(R.costeHabilidad(2), 10);
  assert.equal(R.costeHabilidad(3), null);
});

test("caducidad de objetos reciclados (p. 102)", () => {
  for (const d of [4, 5, 6]) assert.equal(R.caducidad(d).estado, "funciona");
  assert.equal(R.caducidad(3).dificultad, 12);
  assert.equal(R.caducidad(2).dificultad, 18);
  assert.equal(R.caducidad(1).estado, "roto");
});

test("Reputación: rangos, medios puntos y efecto en la Moral (pp. 118-120)", () => {
  assert.equal(R.rangoReputacion(6), "Respetado");
  assert.equal(R.rangoReputacion(6.5), "Respetado");
  assert.equal(R.rangoReputacion(1), "Repudiado");
  assert.equal(R.rangoReputacion(10), "Reverenciado");
  assert.equal(R.limitarReputacion(11), 10);
  assert.equal(R.limitarReputacion(0), 1);
  assert.equal(R.limitarReputacion(6.3), 6.5);
  assert.equal(R.efectoMoralReputacion(3), -1);
  assert.equal(R.efectoMoralReputacion(4), 0);
  assert.equal(R.efectoMoralReputacion(8), 1);
});

test("persecuciones: ejemplo de la p. 94 (terreno 13 + visibilidad 2 + Quemar rueda 4 = 19)", () => {
  assert.equal(R.dificultadMovimiento(13, 2, 0), 15);
  assert.equal(R.dificultadMovimiento(13, 2, 4), 19);
  assert.equal(R.dificultadMovimiento(13, 2, null), 15);
  assert.deepEqual(R.estadoVehiculo(7, 15), { inutilizado: false, penalizador: 3 });
  assert.deepEqual(R.estadoVehiculo(8, 15), { inutilizado: false, penalizador: 0 });
  assert.equal(R.estadoVehiculo(0, 15).inutilizado, true);
  assert.equal(R.MANIOBRAS.find(m => m.key === "sacar").mod, 2);
  assert.equal(R.MANIOBRAS.length, 8);
});

test("iniciativa: el desempate prefiere DES, luego INT, PER y Agilidad (p. 81)", () => {
  const a = R.desempateIniciativa({ des: 6, int: 0 });
  const b = R.desempateIniciativa({ des: 4, int: 6 });
  assert.ok(a > b);
  assert.ok(R.desempateIniciativa({ des: 4, int: 2 }) > R.desempateIniciativa({ des: 4, int: 1 }));
  assert.ok(R.desempateIniciativa({ des: 4, int: 2, per: 2 }) > R.desempateIniciativa({ des: 4, int: 2, per: 1 }));
  assert.ok(R.desempateIniciativa({ des: 9, int: 9, per: 9, agilidad: 99 }) < 0.5, "nunca cambia el número redondeado");
});

test("comunidad: reparto de 6 puntos y capacidad especial (p. 126)", () => {
  assert.ok(C.repartoComunidadValido({ moral: 1, poblacion: 2, recursos: 3 }));
  assert.ok(C.repartoComunidadValido({ moral: 2, poblacion: 2, recursos: 2 }));
  assert.ok(C.repartoComunidadValido({ moral: 1, poblacion: 4, recursos: 1 }));
  assert.ok(!C.repartoComunidadValido({ moral: 1, poblacion: 1, recursos: 4 }), "4 Recursos solo en el Capítulo Oeste");
  assert.ok(C.repartoComunidadValido({ moral: 1, poblacion: 1, recursos: 4 }, "oeste"));
  assert.ok(!C.repartoComunidadValido({ moral: 0, poblacion: 3, recursos: 3 }));
  assert.equal(C.maximo("recursos", "oeste"), 4);
  assert.equal(C.maximo("recursos", "norte"), 3);
  assert.equal(C.maximo("poblacion", "norte"), 4);
});

test("comunidad: efectos en cascada de Moral y Recursos (pp. 124-126)", () => {
  let r = C.cambiarAtributo({ moral: 3, poblacion: 2, recursos: 2 }, "moral", +1, "norte");
  assert.equal(r.estado.moral, 3);
  assert.equal(r.efectos.xpParaTodos, 1);
  r = C.cambiarAtributo({ moral: 1, poblacion: 2, recursos: 2 }, "moral", -1, "norte");
  assert.equal(r.estado.moral, 0);
  assert.equal(r.estado.poblacion, 1, "Moral a 0 → −1 Población");
  r = C.cambiarAtributo({ moral: 0, poblacion: 2, recursos: 2 }, "moral", -1, "norte");
  assert.equal(r.estado.poblacion, 1, "una sola pérdida de Población");
  assert.equal(r.efectos.proezasPJ, -1);
  r = C.cambiarAtributo({ moral: 2, poblacion: 1, recursos: 1 }, "recursos", -1, "norte");
  assert.equal(r.estado.recursos, 0);
  assert.equal(r.estado.poblacion, 0);
  assert.ok(r.efectos.notas.some(n => /extingue/.test(n)));
  r = C.cambiarAtributo({ moral: 1, poblacion: 4, recursos: 1 }, "poblacion", +1, "norte");
  assert.equal(r.efectos.xpParaTodos, 1);
  assert.equal(r.estado.castigoMoral, undefined);
  r = C.cambiarAtributo({ moral: 0, poblacion: 3, recursos: 2 }, "moral", -1, "norte");
  assert.equal(r.estado.castigoMoral, true);
  assert.equal(C.proezasPorMoral({ moral: 3 }), 1);
  assert.equal(C.proezasPorMoral({ moral: 0 }), 0, "estar en 0 no basta: hace falta perder otro punto");
  assert.equal(C.proezasPorMoral({ moral: 0, castigoMoral: true }), -1);
  assert.equal(C.proezasPorMoral({ moral: 2 }), 0);
  assert.equal(C.cambiarAtributo({ moral: 0, poblacion: 3, recursos: 2, castigoMoral: true }, "moral", +1, "norte").estado.castigoMoral, false);
});

test("tabla de sucesos D66: completa y coherente con el manual (pp. 129-131)", () => {
  const claves = Object.keys(C.SUCESOS).map(Number);
  assert.equal(claves.length, 36);
  const esperado = [11,12,13,14,15,16,21,22,23,24,25,26,31,32,33,34,35,36,41,42,43,44,45,46,51,52,53,54,55,56,61,62,63,64,65,66];
  assert.deepEqual(claves.sort((a, b) => a - b), esperado);
  for (const [k, s] of Object.entries(C.SUCESOS)) {
    const unidad = Number(k) % 10;
    assert.equal(Boolean(s.favorable), unidad === 6, `${k}: los acabados en 6 son favorables`);
    if (!s.favorable) { assert.ok(s.riesgo[0] > s.riesgo[1]); assert.ok(s.habilidad); }
    const decena = Math.floor(Number(k) / 10);
    assert.equal(s.atributo, decena <= 2 ? "moral" : decena <= 4 ? "poblacion" : "recursos");
  }
  assert.deepEqual(C.resolverSuceso(11, false).delta, -2);
  assert.deepEqual(C.resolverSuceso(11, true).delta, -1);
  assert.deepEqual(C.resolverSuceso(12, true).delta, 0);
  assert.deepEqual(C.resolverSuceso(66, false).delta, 1);
  assert.equal(C.dificultadSalvacion(true), 14);
  assert.equal(C.dificultadSalvacion(false), 18);
  assert.equal(C.d66(3, 5), 35);
});

test("modificaciones de moto: efectos numéricos del manual (pp. 108-109)", async () => {
  const { efectosDeMods } = await import("../module/rules/vehicle-mods.mjs");
  const e = efectosDeMods([{ name: "Chasis reforzado" }, { name: "Chasis ultrarreforzado" }]);
  assert.equal(e.estructura, 10);
  assert.equal(e.maniobrabilidad, -1);
  const f = efectosDeMods([{ name: "Manillar adaptado" }, { name: "Ruedas reforzadas" }, { name: "Suspensión mejorada" }, { name: "Sidecar" }]);
  assert.equal(f.maniobrabilidad, 1 + 1 + 1 - 1, "Manillar, Ruedas y Suspensión suman +1 cada una; el sidecar resta 1");
  assert.equal(f.iniciativa, 1);
  assert.equal(f.estructura, 1);
  assert.equal(f.ocupantes, 1);
  assert.equal(f.sidecar, true);
  assert.equal(efectosDeMods([{ name: "Acelerador trucado" }]).iniciativa, 5);
  assert.equal(efectosDeMods([{ name: "Configuración ofensiva" }]).dadosDano, 1);
  assert.equal(efectosDeMods([{ name: "Alforjas extra" }]).alforjasMax, 8);
  assert.deepEqual(efectosDeMods([{ name: "Pintura de llamas" }]).labels, [], "las estéticas no tienen efecto");
});

test("protecciones apiladas: la hoja de Munin del manual (cota 3 + casco 2 + escudo mediano 2 = −4) y el kevlar", () => {
  const p = R.proteccionDeArmaduras([
    { nivel: 3, penalizacion: 1, compatible: false, soloFuego: false },
    { nivel: 2, penalizacion: 1, compatible: true, soloFuego: false }
  ]);
  assert.deepEqual(p, { nivel: 5, penalizacion: 2, soloFuego: 0 });
  assert.equal(R.penalizadorProtecciones(0, 2) + p.penalizacion, 4, "dos penalizaciones de armadura más el escudo (2)");
  const sola = R.proteccionDeArmaduras([{ nivel: 3, penalizacion: 1 }, { nivel: 4, penalizacion: 2 }]);
  assert.equal(sola.nivel, 4, "dos armaduras normales: cuenta solo la mejor");
  const kevlar = R.proteccionDeArmaduras([{ nivel: 4, penalizacion: 0, soloFuego: true }, { nivel: 2, penalizacion: 1 }]);
  assert.deepEqual(kevlar, { nivel: 2, penalizacion: 1, soloFuego: 4 });
  assert.equal(R.nivelContraAtaque({ armadura_nivel: 2, armadura_solo_fuego: 4 }, "fuego_cortas"), 6);
  assert.equal(R.nivelContraAtaque({ armadura_nivel: 2, armadura_solo_fuego: 4 }, "cuerpo_a_cuerpo"), 2);
});

test("accesibilidad: clases de <body> según los ajustes", async () => {
  const { clasesDe } = await import("../module/ui/clases.mjs");
  assert.deepEqual(clasesDe({ tamano: 100 }), []);
  assert.deepEqual(clasesDe({ tamano: 130, contraste: true }), ["camc-acc-t130", "camc-acc-contraste"]);
  assert.deepEqual(clasesDe({ tamano: 999, facil: true, quieto: true }), ["camc-acc-facil", "camc-acc-quieto"], "un tamaño desconocido vuelve al 100 %");
});
