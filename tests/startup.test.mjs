import test from "node:test";
import assert from "node:assert/strict";

test("entry point loads without removed globals and registers all five sheets through DocumentSheetConfig", async () => {
  const hooks = new Map(), registrations = [], unregistrations = [];
  globalThis.Actor = class {};
  globalThis.Item = class {};
  globalThis.CONFIG = { Actor: {}, Item: {} };
  globalThis.Hooks = { once: (key, fn) => hooks.set(key, fn), on() {} };
  globalThis.Handlebars = { registerHelper() {} };
  globalThis.foundry = {
    appv1: { sheets: { ActorSheet: class {}, ItemSheet: class {} }, api: { Dialog: class {} } },
    applications: {
      apps: { FilePicker: class {}, DocumentSheetConfig: {
        registerSheet: (...args) => registrations.push(args),
        unregisterSheet: (...args) => unregistrations.push(args)
      } },
      ux: { TextEditor: class {} },
      handlebars: { async loadTemplates(paths) { assert.equal(paths.length, 6); } }
    },
    utils: { getProperty() {} }
  };
  // Intentionally no global Dialog, FilePicker, TextEditor or collection sheet shims.
  await import("../module/cuervos-de-asgard.mjs");
  for (const generation of [13, 14]) {
    registrations.length = unregistrations.length = 0;
    globalThis.game = { version: `${generation}.351`, release: { generation } };
    await hooks.get("init")();
    assert.equal(registrations.length, 5);
    assert.equal(unregistrations.length, 2);
    assert.deepEqual(registrations.slice(0, 4).flatMap(r => r[3].types), ["personaje", "pnj", "comunidad", "moto"]);
    assert.ok(registrations.every(r => r[1] === "cuervos-de-asgard-mc" && r[3].makeDefault));
    assert.ok(registrations.slice(0, 4).every(r => r[0] === Actor));
    assert.equal(registrations[4][0], Item);
  }
});
