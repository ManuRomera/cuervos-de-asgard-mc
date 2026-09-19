import test from "node:test";
import assert from "node:assert/strict";
import { createRollMessage, showRepeatedRoll } from "../module/compat/chat.mjs";
import { versionInfo, diagnostic, normalizeHookElement } from "../module/compat/runtime.mjs";

for (const generation of [13, 14]) {
  for (const visibility of ["public", "gm", "blind", "self"]) {
    test(`V${generation}: ${visibility} uses the correct setting and API without mutating input`, async () => {
      const modern = generation === 14;
      const mode = modern ? visibility : `${visibility}roll`;
      const data = { content: "tirada", rolls: [{ total: 9 }], whisper: [] };
      const options = { custom: true };
      const Message = {
        [modern ? "applyMode" : "applyRollMode"](copy, received) {
          assert.equal(this, Message);
          assert.equal(received, mode);
          copy.whisper.push("sentinel");
          copy.blind = visibility === "blind";
        },
        async create(copy, passedOptions) {
          assert.equal(this, Message);
          assert.equal(passedOptions, options);
          return copy;
        }
      };
      const env = { CONFIG: { ChatMessage: { documentClass: Message } }, game: {
        settings: { get(scope, key) {
          assert.equal(scope, "core");
          assert.equal(key, modern ? "messageMode" : "rollMode");
          return mode;
        } }
      } };
      const result = await createRollMessage(data, options, env);
      assert.deepEqual(data.whisper, []);
      assert.deepEqual(result.whisper, ["sentinel"]);
      assert.equal(result.blind, visibility === "blind");
      assert.equal(result.rolls, data.rolls);
    });
  }
}

test("a visibility API error prevents publication", () => {
  const env = { CONFIG: { ChatMessage: { documentClass: {
    applyMode() { throw new Error("privacy error"); },
    create() { assert.fail("must not publish"); }
  } } }, game: { settings: { get: () => "blind" } } };
  assert.throws(() => createRollMessage({}, {}, env), /privacy error/);
});

for (const [whisper, blind, expected] of [
  [[], false, null], [["gm"], true, ["gm"]], [[{ id: "self" }], false, ["self"]]
]) {
  test(`repeated dice preserve recipients ${JSON.stringify(expected)} and blind=${blind}`, async () => {
    const roll = {}, user = {};
    const env = { game: { user, dice3d: { showForRoll(...args) {
      assert.deepEqual(args, [roll, user, true, expected, blind]);
    } } } };
    await showRepeatedRoll(roll, { whisper, blind }, env);
  });
}
test("repeated dice work without Dice So Nice", () => {
  assert.equal(showRepeatedRoll({}, {}, { game: {} }), undefined);
});
test("generation detection and diagnostics work before ready without private data", () => {
  assert.equal(versionInfo({}).generation, null);
  assert.equal(versionInfo({ game: { version: "14.368" } }).generation, 14);
  assert.equal(versionInfo({ game: { version: "13.351", release: { generation: 14 } } }).generation, 14);
  assert.equal(versionInfo({ game: { version: "15.1" } }).supported, false);
  const result = diagnostic({ game: { version: "13.351", actors: ["SECRET"], user: { name: "SECRET" } } });
  assert.equal(result.foundry.supported, true);
  assert.ok(!JSON.stringify(result).includes("SECRET"));
});
test("HTML hooks accept native elements and jQuery wrappers; reject invalid input", () => {
  const element = { nodeType: 1, querySelector() {} };
  assert.equal(normalizeHookElement(element), element);
  assert.equal(normalizeHookElement({ 0: element }), element);
  for (const invalid of [null, {}, [], { nodeType: 3 }, { 0: {} }]) assert.equal(normalizeHookElement(invalid), null);
});
