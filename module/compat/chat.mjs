/** v14 renamed both the setting and its values (publicroll -> public, etc.). */
export function createRollMessage(data, options = {}, env = globalThis) {
  const Message = env.CONFIG.ChatMessage.documentClass;
  const modern = typeof Message.applyMode === "function";
  const mode = env.game.settings.get("core", modern ? "messageMode" : "rollMode");
  const copy = { ...data, whisper: [...(data.whisper ?? [])] };
  if (modern) Message.applyMode(copy, mode);
  else Message.applyRollMode(copy, mode);
  return Message.create(copy, options);
}

/** Repeated dice must have the same audience as the existing chat card. */
export function showRepeatedRoll(roll, message, env = globalThis) {
  if (!env.game.dice3d) return;
  const recipients = Array.from(message.whisper ?? [], user => typeof user === "string" ? user : user.id);
  return env.game.dice3d.showForRoll(roll, env.game.user, true,
    recipients.length ? recipients : null, Boolean(message.blind));
}
